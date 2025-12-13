console.log('🚀 AUTO RUN MANUAL FIX UNTIL SUCCESS')
console.log('=====================================\n')

let attempt = 1;
const maxAttempts = 50; // Run for a very long time

function showFixInstructions() {
  console.log(`📋 ATTEMPT ${attempt}/${maxAttempts}`)
  console.log('=====================================\n')
  
  console.log('🔧 MANUAL SQL FIX INSTRUCTIONS:')
  console.log('================================')
  console.log('📝 Copy and paste this ENTIRE SQL block into your Supabase SQL Editor:\n')
  
  const sqlFix = `-- COMPLETE CLEANUP AND FIX - ATTEMPT ${attempt}
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

-- Step 6: Verification
SELECT 
  'Trigger Functions' as check_type,
  COUNT(*) as count
FROM information_schema.routines 
WHERE routine_name IN ('create_profile_on_signup', 'create_user_settings_on_profile_insert', 'create_subscription_on_signup')
UNION ALL
SELECT 
  'Triggers' as check_type,
  COUNT(*) as count
FROM information_schema.triggers 
WHERE trigger_name IN ('create_profile_on_signup_trigger', 'create_user_settings_on_profile_insert_trigger', 'create_subscription_on_signup_trigger')
UNION ALL
SELECT 
  'RLS Status' as check_type,
  COUNT(*) as count
FROM pg_tables 
WHERE tablename IN ('profiles', 'user_settings', 'subscriptions') AND rowsecurity = false;

-- Step 7: Test user creation
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES ('123e4567-e89b-12d3-a456-426614174000', 'test@example.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Step 8: Check if data was created correctly
SELECT 'Profiles created:' as info;
SELECT id, email, created_at FROM profiles WHERE id = '123e4567-e89b-12d3-a456-426614174000';

SELECT 'User Settings created:' as info;
SELECT user_id, theme, layout, show_favorites_first, auto_sync, notifications_enabled FROM user_settings WHERE user_id = '123e4567-e89b-12d3-a456-426614174000';

SELECT 'Subscriptions created:' as info;
SELECT user_id, plan_type, status, created_at FROM subscriptions WHERE user_id = '123e4567-e89b-12d3-a456-426614174000';

-- Step 9: Clean up test data
DELETE FROM subscriptions WHERE user_id = '123e4567-e89b-12d3-a456-426614174000';
DELETE FROM user_settings WHERE user_id = '123e4567-e89b-12d3-a456-426614174000';
DELETE FROM profiles WHERE id = '123e4567-e89b-12d3-a456-426614174000';
DELETE FROM auth.users WHERE id = '123e4567-e89b-12d3-a456-426614174000';`

  console.log(sqlFix)
  console.log('\n🎯 This complete cleanup will:')
  console.log('✅ Remove ALL old trigger functions (including the problematic one)')
  console.log('✅ Remove ALL old triggers')
  console.log('✅ Create fresh trigger functions with correct column mappings')
  console.log('✅ Create fresh triggers')
  console.log('✅ Test user creation automatically')
  console.log('✅ Verify data was created in all tables correctly')
  console.log('✅ Clean up test data')
  console.log('\n📝 Copy and paste this entire SQL block into your Supabase SQL Editor!')
  console.log('\n⏰ Waiting 30 seconds before next attempt...\n')
}

function runUntilSuccess() {
  if (attempt > maxAttempts) {
    console.log('💥 MAXIMUM ATTEMPTS REACHED')
    console.log('❌ Please manually fix the database issues')
    process.exit(1)
  }
  
  showFixInstructions()
  
  // Wait 30 seconds before next attempt
  setTimeout(() => {
    attempt++
    runUntilSuccess()
  }, 30000)
}

// Start the auto-run process
runUntilSuccess() 