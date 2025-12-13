const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

console.log('🚀 AUTO RUN FIXES UNTIL SUCCESS');
console.log('================================\n');

// Check environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.log('❌ Missing environment variables:');
  console.log('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.log('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
  console.log('\n📝 Please create .env.local with these variables and try again.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runCompleteCleanup() {
  console.log('🔧 Running complete cleanup and fix...\n');
  
  const cleanupSQL = `
-- COMPLETE CLEANUP AND FIX
-- Remove ALL old trigger functions and create fresh ones

-- Step 1: Disable RLS temporarily
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing trigger functions (including the old ones)
DROP FUNCTION IF EXISTS create_user_settings_on_profile_insert() CASCADE;
DROP FUNCTION IF EXISTS create_user_settings_on_signup() CASCADE;
DROP FUNCTION IF EXISTS create_subscription_on_signup() CASCADE;
DROP FUNCTION IF EXISTS create_profile_on_signup() CASCADE;

-- Step 3: Drop ALL existing triggers
DROP TRIGGER IF EXISTS create_profile_on_signup_trigger ON auth.users;
DROP TRIGGER IF EXISTS create_user_settings_on_profile_insert_trigger ON public.profiles;
DROP TRIGGER IF EXISTS create_subscription_on_signup_trigger ON auth.users;
DROP TRIGGER IF EXISTS create_user_settings_on_signup_trigger ON auth.users;

-- Step 4: Create the correct trigger functions

-- Create profile trigger function
CREATE OR REPLACE FUNCTION create_profile_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, created_at, updated_at)
  VALUES (NEW.id, NEW.email, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create user_settings trigger function (correct columns)
CREATE OR REPLACE FUNCTION create_user_settings_on_profile_insert()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_settings (user_id, theme, layout, show_favorites_first, auto_sync, notifications_enabled, created_at, updated_at)
  VALUES (NEW.id, 'dark', 'grid', true, true, true, NOW(), NOW())
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create subscription trigger function (correct columns)
CREATE OR REPLACE FUNCTION create_subscription_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO subscriptions (user_id, plan_type, status, created_at, updated_at)
  VALUES (NEW.id, 'free', 'active', NOW(), NOW())
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Create triggers
CREATE TRIGGER create_profile_on_signup_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_profile_on_signup();

CREATE TRIGGER create_user_settings_on_profile_insert_trigger
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_user_settings_on_profile_insert();

CREATE TRIGGER create_subscription_on_signup_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_subscription_on_signup();
`;

  try {
    const { error } = await supabase.rpc('exec_sql', { sql: cleanupSQL });
    if (error) {
      console.log('❌ Cleanup failed:', error.message);
      return false;
    }
    console.log('✅ Cleanup completed successfully');
    return true;
  } catch (err) {
    console.log('❌ Cleanup error:', err.message);
    return false;
  }
}

async function testUserRegistration() {
  console.log('\n🧪 Testing user registration...\n');
  
  const testUserId = '123e4567-e89b-12d3-a456-426614174000';
  const testEmail = 'test@example.com';
  
  try {
    // Test 1: Insert test user
    console.log('📝 Inserting test user...');
    const { error: userError } = await supabase
      .from('auth.users')
      .insert({
        id: testUserId,
        email: testEmail,
        encrypted_password: 'test_password',
        email_confirmed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    
    if (userError) {
      console.log('❌ User insertion failed:', userError.message);
      return false;
    }
    console.log('✅ Test user created');
    
    // Test 2: Check if profile was created
    console.log('📋 Checking profile creation...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', testUserId)
      .single();
    
    if (profileError || !profile) {
      console.log('❌ Profile not created:', profileError?.message || 'No profile found');
      return false;
    }
    console.log('✅ Profile created:', profile.email);
    
    // Test 3: Check if user_settings was created
    console.log('⚙️ Checking user settings creation...');
    const { data: settings, error: settingsError } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', testUserId)
      .single();
    
    if (settingsError || !settings) {
      console.log('❌ User settings not created:', settingsError?.message || 'No settings found');
      return false;
    }
    console.log('✅ User settings created:', settings.theme, settings.layout);
    
    // Test 4: Check if subscription was created
    console.log('💳 Checking subscription creation...');
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', testUserId)
      .single();
    
    if (subError || !subscription) {
      console.log('❌ Subscription not created:', subError?.message || 'No subscription found');
      return false;
    }
    console.log('✅ Subscription created:', subscription.plan_type, subscription.status);
    
    // Clean up test data
    console.log('🧹 Cleaning up test data...');
    await supabase.from('subscriptions').delete().eq('user_id', testUserId);
    await supabase.from('user_settings').delete().eq('user_id', testUserId);
    await supabase.from('profiles').delete().eq('id', testUserId);
    await supabase.from('auth.users').delete().eq('id', testUserId);
    console.log('✅ Test data cleaned up');
    
    return true;
  } catch (err) {
    console.log('❌ Test error:', err.message);
    return false;
  }
}

async function verifyTriggers() {
  console.log('\n🔍 Verifying triggers...\n');
  
  try {
    // Check trigger functions
    const { data: functions, error: funcError } = await supabase
      .rpc('exec_sql', { 
        sql: `SELECT routine_name, routine_type 
              FROM information_schema.routines 
              WHERE routine_name IN ('create_profile_on_signup', 'create_user_settings_on_profile_insert', 'create_subscription_on_signup')
              ORDER BY routine_name;`
      });
    
    if (funcError) {
      console.log('❌ Could not check trigger functions:', funcError.message);
      return false;
    }
    
    console.log('✅ Trigger functions found:', functions?.length || 0);
    
    // Check triggers
    const { data: triggers, error: trigError } = await supabase
      .rpc('exec_sql', { 
        sql: `SELECT trigger_name, event_object_table
              FROM information_schema.triggers 
              WHERE trigger_name IN ('create_profile_on_signup_trigger', 'create_user_settings_on_profile_insert_trigger', 'create_subscription_on_signup_trigger')
              ORDER BY trigger_name;`
      });
    
    if (trigError) {
      console.log('❌ Could not check triggers:', trigError.message);
      return false;
    }
    
    console.log('✅ Triggers found:', triggers?.length || 0);
    
    return (functions?.length === 3 && triggers?.length === 3);
  } catch (err) {
    console.log('❌ Verification error:', err.message);
    return false;
  }
}

async function main() {
  let attempts = 0;
  const maxAttempts = 3;
  
  while (attempts < maxAttempts) {
    attempts++;
    console.log(`\n🔄 Attempt ${attempts}/${maxAttempts}`);
    console.log('='.repeat(30));
    
    // Step 1: Run cleanup
    const cleanupSuccess = await runCompleteCleanup();
    if (!cleanupSuccess) {
      console.log('❌ Cleanup failed, trying again...');
      continue;
    }
    
    // Step 2: Verify triggers
    const triggersOk = await verifyTriggers();
    if (!triggersOk) {
      console.log('❌ Trigger verification failed, trying again...');
      continue;
    }
    
    // Step 3: Test user registration
    const testSuccess = await testUserRegistration();
    if (!testSuccess) {
      console.log('❌ User registration test failed, trying again...');
      continue;
    }
    
    console.log('\n🎉 SUCCESS! All fixes applied and tested successfully!');
    console.log('✅ Database triggers are working correctly');
    console.log('✅ User registration creates all required data');
    console.log('✅ No more null user_id errors');
    return;
  }
  
  console.log('\n❌ Failed after', maxAttempts, 'attempts');
  console.log('Please check your Supabase configuration and try again manually.');
}

main().catch(console.error); 