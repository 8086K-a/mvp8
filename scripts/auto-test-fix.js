const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

console.log('🧪 AUTOMATED TEST CLEANUP FIX')
console.log('=============================\n')

// Check environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? '✅' : '❌');
  console.error('\n📝 Please check your .env.local file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCleanupFix() {
  try {
    console.log('🔍 Step 1: Checking current trigger functions...');
    
    // Check trigger functions
    const { data: functions, error: funcError } = await supabase
      .from('information_schema.routines')
      .select('routine_name, routine_type')
      .or('routine_name.like.%user%,routine_name.like.%profile%,routine_name.like.%subscription%')
      .order('routine_name');

    if (funcError) {
      console.log('⚠️  Could not check trigger functions (this is normal for Supabase):', funcError.message);
    } else {
      console.log('📋 Current trigger functions:');
      functions?.forEach(func => console.log(`   - ${func.routine_name} (${func.routine_type})`));
    }

    console.log('\n🔍 Step 2: Testing user creation...');
    
    // Test user creation
    const testUserId = '123e4567-e89b-12d3-a456-426614174000';
    const testEmail = 'test@example.com';
    
    // First, try to create a user (this should trigger the profile creation)
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: 'password123',
      user_metadata: { id: testUserId }
    });

    if (userError) {
      console.log('⚠️  Could not create test user via auth (this is normal):', userError.message);
      console.log('   Trying direct insert...');
      
      // Try direct insert into auth.users
      const { error: directError } = await supabase
        .rpc('exec_sql', {
          sql: `
            INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
            VALUES ('${testUserId}', '${testEmail}', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW())
            ON CONFLICT (id) DO NOTHING;
          `
        });

      if (directError) {
        console.log('❌ Could not create test user:', directError.message);
        return false;
      }
    } else {
      console.log('✅ Test user created successfully');
    }

    // Wait a moment for triggers to execute
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('\n🔍 Step 3: Checking if data was created correctly...');
    
    // Check profiles
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, created_at')
      .eq('id', testUserId);

    if (profileError) {
      console.log('❌ Error checking profiles:', profileError.message);
    } else {
      console.log('📋 Profiles created:', profiles?.length || 0);
      profiles?.forEach(profile => console.log(`   - ${profile.id}: ${profile.email}`));
    }

    // Check user_settings
    const { data: settings, error: settingsError } = await supabase
      .from('user_settings')
      .select('user_id, theme, layout, show_favorites_first, auto_sync, notifications_enabled')
      .eq('user_id', testUserId);

    if (settingsError) {
      console.log('❌ Error checking user_settings:', settingsError.message);
    } else {
      console.log('📋 User settings created:', settings?.length || 0);
      settings?.forEach(setting => console.log(`   - ${setting.user_id}: theme=${setting.theme}, layout=${setting.layout}`));
    }

    // Check subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select('user_id, plan_type, status, created_at')
      .eq('user_id', testUserId);

    if (subError) {
      console.log('❌ Error checking subscriptions:', subError.message);
    } else {
      console.log('📋 Subscriptions created:', subscriptions?.length || 0);
      subscriptions?.forEach(sub => console.log(`   - ${sub.user_id}: ${sub.plan_type} (${sub.status})`));
    }

    console.log('\n🧹 Step 4: Cleaning up test data...');
    
    // Clean up test data
    const { error: cleanupError } = await supabase
      .rpc('exec_sql', {
        sql: `
          DELETE FROM subscriptions WHERE user_id = '${testUserId}';
          DELETE FROM user_settings WHERE user_id = '${testUserId}';
          DELETE FROM profiles WHERE id = '${testUserId}';
          DELETE FROM auth.users WHERE id = '${testUserId}';
        `
      });

    if (cleanupError) {
      console.log('⚠️  Could not clean up test data:', cleanupError.message);
    } else {
      console.log('✅ Test data cleaned up');
    }

    // Determine success
    const profileSuccess = profiles && profiles.length > 0;
    const settingsSuccess = settings && settings.length > 0;
    const subscriptionSuccess = subscriptions && subscriptions.length > 0;

    console.log('\n📊 TEST RESULTS:');
    console.log('================');
    console.log(`✅ Profile creation: ${profileSuccess ? 'SUCCESS' : 'FAILED'}`);
    console.log(`✅ User settings creation: ${settingsSuccess ? 'SUCCESS' : 'FAILED'}`);
    console.log(`✅ Subscription creation: ${subscriptionSuccess ? 'SUCCESS' : 'FAILED'}`);

    const allSuccess = profileSuccess && settingsSuccess && subscriptionSuccess;
    
    if (allSuccess) {
      console.log('\n🎉 ALL TESTS PASSED! The cleanup fix worked successfully!');
      return true;
    } else {
      console.log('\n❌ SOME TESTS FAILED. The cleanup fix may need manual verification.');
      return false;
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    return false;
  }
}

// Run the test
testCleanupFix().then(success => {
  if (success) {
    console.log('\n✅ AUTOMATED TEST COMPLETED SUCCESSFULLY');
    process.exit(0);
  } else {
    console.log('\n❌ AUTOMATED TEST FAILED - Manual verification needed');
    process.exit(1);
  }
}); 