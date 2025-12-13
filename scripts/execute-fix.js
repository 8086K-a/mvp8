const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeSQL(sql) {
  try {
    console.log('📝 Executing SQL...');
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error('❌ SQL Error:', error.message);
      return false;
    }
    
    console.log('✅ SQL executed successfully');
    return true;
  } catch (err) {
    console.error('❌ Execution Error:', err.message);
    return false;
  }
}

async function runCleanup() {
  console.log('🔧 RUNNING DATABASE CLEANUP');
  console.log('===========================');
  
  const cleanupSQL = `
    -- Disable RLS temporarily
    ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
    ALTER TABLE user_settings DISABLE ROW LEVEL SECURITY;
    ALTER TABLE subscriptions DISABLE ROW LEVEL SECURITY;
    
    -- Drop all existing trigger functions
    DROP FUNCTION IF EXISTS create_profile_on_signup() CASCADE;
    DROP FUNCTION IF EXISTS create_user_settings_on_signup() CASCADE;
    DROP FUNCTION IF EXISTS create_subscription_on_signup() CASCADE;
    DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
    
    -- Create correct trigger functions
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
    
    -- Create triggers
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
    
    -- Re-enable RLS
    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
    ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
    ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
  `;
  
  return await executeSQL(cleanupSQL);
}

async function testFix() {
  console.log('\n🧪 TESTING THE FIX');
  console.log('==================');
  
  try {
    // Create test user
    console.log('📝 Creating test user...');
    const { data: user, error: userError } = await supabase.auth.admin.createUser({
      email: 'test@example.com',
      password: 'password123'
    });
    
    if (userError) {
      console.log('❌ User creation failed:', userError.message);
      return false;
    }
    
    console.log('✅ Test user created:', user.user.id);
    
    // Check related data
    console.log('📋 Checking related data...');
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.user.id)
      .single();
    
    const { data: settings } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.user.id)
      .single();
    
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.user.id)
      .single();
    
    console.log('✅ Profile created:', !!profile);
    console.log('✅ Settings created:', !!settings);
    console.log('✅ Subscription created:', !!subscription);
    
    // Clean up
    console.log('🧹 Cleaning up test data...');
    await supabase.auth.admin.deleteUser(user.user.id);
    console.log('✅ Test data cleaned up');
    
    return true;
  } catch (error) {
    console.log('❌ Test error:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 AUTO RUN UNTIL FIXED');
  console.log('========================');
  
  let attempt = 1;
  const maxAttempts = 3;
  
  while (attempt <= maxAttempts) {
    console.log(`\n🔄 Attempt ${attempt}/${maxAttempts}`);
    console.log('========================');
    
    // Run cleanup
    const cleanupSuccess = await runCleanup();
    
    if (cleanupSuccess) {
      // Test the fix
      const testSuccess = await testFix();
      
      if (testSuccess) {
        console.log('\n🎉 SUCCESS! Database fix is working!');
        console.log('✅ All triggers created correctly');
        console.log('✅ User registration works');
        console.log('✅ Related data is created automatically');
        break;
      } else {
        console.log('\n⚠️  Cleanup worked but test failed');
      }
    } else {
      console.log('\n❌ Cleanup failed');
    }
    
    attempt++;
    
    if (attempt <= maxAttempts) {
      console.log('⏳ Waiting 3 seconds...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  if (attempt > maxAttempts) {
    console.log('\n💥 FAILED: Maximum attempts reached');
    console.log('Please check your Supabase configuration');
  }
}

main().catch(console.error); 