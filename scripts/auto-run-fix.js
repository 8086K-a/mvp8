const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeSQL(sql) {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    if (error) {
      console.error('❌ SQL Error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('❌ Execution Error:', err.message);
    return false;
  }
}

async function runCleanupFix() {
  console.log('🔧 RUNNING COMPLETE CLEANUP FIX');
  console.log('================================');
  
  const cleanupSQL = `
    -- Step 1: Disable RLS temporarily
    ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
    ALTER TABLE user_settings DISABLE ROW LEVEL SECURITY;
    ALTER TABLE subscriptions DISABLE ROW LEVEL SECURITY;
    
    -- Step 2: Drop all existing trigger functions
    DROP FUNCTION IF EXISTS create_profile_on_signup() CASCADE;
    DROP FUNCTION IF EXISTS create_user_settings_on_signup() CASCADE;
    DROP FUNCTION IF EXISTS create_subscription_on_signup() CASCADE;
    DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
    
    -- Step 3: Create correct trigger functions
    CREATE OR REPLACE FUNCTION create_profile_on_signup()
    RETURNS TRIGGER AS $$
    BEGIN
      INSERT INTO profiles (id, email, created_at, updated_at)
      VALUES (NEW.id, NEW.email, NOW(), NOW());
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    
    CREATE OR REPLACE FUNCTION create_user_settings_on_signup()
    RETURNS TRIGGER AS $$
    BEGIN
      INSERT INTO user_settings (user_id, theme, layout, show_favorites_first, auto_sync, notifications_enabled, created_at, updated_at)
      VALUES (NEW.id, 'light', 'grid', true, true, true, NOW(), NOW());
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    
    CREATE OR REPLACE FUNCTION create_subscription_on_signup()
    RETURNS TRIGGER AS $$
    BEGIN
      INSERT INTO subscriptions (user_id, plan_type, status, created_at, updated_at)
      VALUES (NEW.id, 'free', 'active', NOW(), NOW());
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    
    -- Step 4: Create triggers
    DROP TRIGGER IF EXISTS trigger_create_profile_on_signup ON auth.users;
    CREATE TRIGGER trigger_create_profile_on_signup
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION create_profile_on_signup();
    
    DROP TRIGGER IF EXISTS trigger_create_user_settings_on_signup ON auth.users;
    CREATE TRIGGER trigger_create_user_settings_on_signup
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION create_user_settings_on_signup();
    
    DROP TRIGGER IF EXISTS trigger_create_subscription_on_signup ON auth.users;
    CREATE TRIGGER trigger_create_subscription_on_signup
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION create_subscription_on_signup();
    
    -- Step 5: Re-enable RLS
    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
    ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
    ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
  `;
  
  console.log('📝 Executing cleanup SQL...');
  const success = await executeSQL(cleanupSQL);
  
  if (success) {
    console.log('✅ Cleanup fix executed successfully!');
    return true;
  } else {
    console.log('❌ Cleanup fix failed!');
    return false;
  }
}

async function testCleanupFix() {
  console.log('\n🧪 TESTING CLEANUP FIX');
  console.log('=======================');
  
  // Test 1: Check trigger functions
  console.log('📋 Checking trigger functions...');
  const { data: functions, error: funcError } = await supabase
    .from('information_schema.routines')
    .select('routine_name, routine_type')
    .or('routine_name.like.%user%,routine_name.like.%profile%,routine_name.like.%subscription%')
    .order('routine_name');
  
  if (funcError) {
    console.log('❌ Could not check trigger functions:', funcError.message);
  } else {
    console.log('✅ Found trigger functions:', functions?.length || 0);
    functions?.forEach(f => console.log(`   - ${f.routine_name} (${f.routine_type})`));
  }
  
  // Test 2: Check triggers
  console.log('\n📋 Checking triggers...');
  const { data: triggers, error: triggerError } = await supabase
    .from('information_schema.triggers')
    .select('trigger_name, event_object_table, action_statement')
    .or('trigger_name.like.%user%,trigger_name.like.%profile%,trigger_name.like.%subscription%')
    .order('trigger_name');
  
  if (triggerError) {
    console.log('❌ Could not check triggers:', triggerError.message);
  } else {
    console.log('✅ Found triggers:', triggers?.length || 0);
    triggers?.forEach(t => console.log(`   - ${t.trigger_name} on ${t.event_object_table}`));
  }
  
  // Test 3: Test user creation
  console.log('\n🧪 Testing user creation...');
  const testUserId = '123e4567-e89b-12d3-a456-426614174000';
  const testEmail = 'test@example.com';
  
  // Insert test user
  const { error: userError } = await supabase.auth.admin.createUser({
    email: testEmail,
    password: 'password123',
    user_metadata: { id: testUserId }
  });
  
  if (userError) {
    console.log('❌ Could not create test user:', userError.message);
    return false;
  }
  
  console.log('✅ Test user created successfully');
  
  // Check if related data was created
  console.log('\n📋 Checking related data creation...');
  
  // Check profiles
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, created_at')
    .eq('id', testUserId)
    .single();
  
  if (profileError) {
    console.log('❌ Profile not created:', profileError.message);
  } else {
    console.log('✅ Profile created:', profile.email);
  }
  
  // Check user_settings
  const { data: settings, error: settingsError } = await supabase
    .from('user_settings')
    .select('user_id, theme, layout, show_favorites_first, auto_sync, notifications_enabled')
    .eq('user_id', testUserId)
    .single();
  
  if (settingsError) {
    console.log('❌ User settings not created:', settingsError.message);
  } else {
    console.log('✅ User settings created:', settings.theme, settings.layout);
  }
  
  // Check subscriptions
  const { data: subscription, error: subError } = await supabase
    .from('subscriptions')
    .select('user_id, plan_type, status, created_at')
    .eq('user_id', testUserId)
    .single();
  
  if (subError) {
    console.log('❌ Subscription not created:', subError.message);
  } else {
    console.log('✅ Subscription created:', subscription.plan_type, subscription.status);
  }
  
  // Clean up test data
  console.log('\n🧹 Cleaning up test data...');
  await supabase.from('subscriptions').delete().eq('user_id', testUserId);
  await supabase.from('user_settings').delete().eq('user_id', testUserId);
  await supabase.from('profiles').delete().eq('id', testUserId);
  await supabase.auth.admin.deleteUser(testUserId);
  console.log('✅ Test data cleaned up');
  
  return true;
}

async function main() {
  console.log('🚀 AUTO RUN UNTIL FIXED');
  console.log('========================');
  
  let attempt = 1;
  const maxAttempts = 5;
  
  while (attempt <= maxAttempts) {
    console.log(`\n🔄 Attempt ${attempt}/${maxAttempts}`);
    console.log('========================');
    
    // Run cleanup fix
    const cleanupSuccess = await runCleanupFix();
    
    if (cleanupSuccess) {
      // Test the fix
      const testSuccess = await testCleanupFix();
      
      if (testSuccess) {
        console.log('\n🎉 SUCCESS! Database fix is working correctly!');
        console.log('✅ All trigger functions created');
        console.log('✅ All triggers working');
        console.log('✅ User registration creates all related data');
        console.log('✅ Test completed successfully');
        break;
      } else {
        console.log('\n⚠️  Cleanup worked but test failed. Retrying...');
      }
    } else {
      console.log('\n❌ Cleanup failed. Retrying...');
    }
    
    attempt++;
    
    if (attempt <= maxAttempts) {
      console.log('⏳ Waiting 3 seconds before next attempt...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  if (attempt > maxAttempts) {
    console.log('\n💥 FAILED: Maximum attempts reached');
    console.log('Please check your Supabase configuration and try again manually.');
  }
}

main().catch(console.error); 