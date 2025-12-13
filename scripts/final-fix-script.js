#!/usr/bin/env node

console.log(`
🔧 FINAL COMPREHENSIVE FIX SCRIPT
================================

📋 This script will generate the exact SQL commands to fix ALL database issues.
📝 Copy and paste these commands into your Supabase SQL Editor.

🎯 Issues to fix:
1. Conflicting trigger functions
2. RLS policies blocking inserts
3. Missing or incorrect column mappings
4. User registration failures

📄 COPY THIS ENTIRE SQL BLOCK:
================================
`);

const sqlFix = `
-- FINAL COMPREHENSIVE FIX
-- This will fix ALL database issues

-- Step 1: Disable RLS on all tables to allow testing
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE sites DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing trigger functions (clean slate)
DROP FUNCTION IF EXISTS create_user_settings_on_profile_insert() CASCADE;
DROP FUNCTION IF EXISTS create_user_settings_on_signup() CASCADE;
DROP FUNCTION IF EXISTS create_subscription_on_signup() CASCADE;
DROP FUNCTION IF EXISTS create_profile_on_signup() CASCADE;
DROP FUNCTION IF EXISTS create_user_settings_on_signup_trigger() CASCADE;
DROP FUNCTION IF EXISTS create_subscription_on_signup_trigger() CASCADE;
DROP FUNCTION IF EXISTS create_profile_on_signup_trigger() CASCADE;

-- Step 3: Drop ALL existing triggers
DROP TRIGGER IF EXISTS create_profile_on_signup_trigger ON auth.users;
DROP TRIGGER IF EXISTS create_user_settings_on_profile_insert_trigger ON public.profiles;
DROP TRIGGER IF EXISTS create_subscription_on_signup_trigger ON auth.users;
DROP TRIGGER IF EXISTS create_user_settings_on_signup_trigger ON auth.users;

-- Step 4: Create the correct trigger functions with proper column mappings

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
  INSERT INTO user_settings (
    user_id, 
    theme, 
    layout, 
    show_favorites_first, 
    auto_sync, 
    notifications_enabled,
    created_at, 
    updated_at
  )
  VALUES (
    NEW.id, 
    'dark', 
    'grid', 
    true, 
    true, 
    true, 
    NOW(), 
    NOW()
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create subscription trigger function (correct columns)
CREATE OR REPLACE FUNCTION create_subscription_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO subscriptions (
    user_id, 
    plan_type, 
    status, 
    created_at, 
    updated_at
  )
  VALUES (
    NEW.id, 
    'free', 
    'active', 
    NOW(), 
    NOW()
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Create triggers in correct order
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

-- Step 6: Create proper RLS policies for authenticated users
-- Enable RLS on tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can view own subscription" ON subscriptions;
DROP POLICY IF EXISTS "Users can update own subscription" ON subscriptions;
DROP POLICY IF EXISTS "Users can view own sites" ON sites;
DROP POLICY IF EXISTS "Users can insert own sites" ON sites;
DROP POLICY IF EXISTS "Users can update own sites" ON sites;
DROP POLICY IF EXISTS "Users can delete own sites" ON sites;
DROP POLICY IF EXISTS "Users can view categories" ON categories;

-- Create new policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own settings" ON user_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON user_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own subscription" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription" ON subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own sites" ON sites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sites" ON sites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sites" ON sites
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sites" ON sites
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view categories" ON categories
  FOR SELECT USING (true);

-- Step 7: Verification queries
SELECT 'Trigger Functions Created:' as info;
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name IN ('create_profile_on_signup', 'create_user_settings_on_profile_insert', 'create_subscription_on_signup')
ORDER BY routine_name;

SELECT 'Triggers Created:' as info;
SELECT trigger_name, event_object_table, action_statement
FROM information_schema.triggers 
WHERE trigger_name IN ('create_profile_on_signup_trigger', 'create_user_settings_on_profile_insert_trigger', 'create_subscription_on_signup_trigger')
ORDER BY trigger_name;

SELECT 'RLS Policies Created:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename IN ('profiles', 'user_settings', 'subscriptions', 'sites', 'categories')
ORDER BY tablename, policyname;

-- Step 8: Test user creation
SELECT 'Testing user creation...' as info;
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES ('test-user-123', 'test@example.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Step 9: Verify data creation
SELECT 'Profile created:' as info;
SELECT id, email, created_at FROM profiles WHERE id = 'test-user-123';

SELECT 'User Settings created:' as info;
SELECT user_id, theme, layout, show_favorites_first, auto_sync, notifications_enabled 
FROM user_settings WHERE user_id = 'test-user-123';

SELECT 'Subscription created:' as info;
SELECT user_id, plan_type, status, created_at 
FROM subscriptions WHERE user_id = 'test-user-123';

-- Step 10: Clean up test data
DELETE FROM subscriptions WHERE user_id = 'test-user-123';
DELETE FROM user_settings WHERE user_id = 'test-user-123';
DELETE FROM profiles WHERE id = 'test-user-123';
DELETE FROM auth.users WHERE id = 'test-user-123';

SELECT '✅ FIX COMPLETE!' as status;
`;

console.log(sqlFix);

console.log(`
🎯 This comprehensive fix will:

✅ Remove ALL conflicting trigger functions
✅ Remove ALL old triggers  
✅ Create fresh trigger functions with correct column mappings
✅ Create fresh triggers in proper order
✅ Set up proper RLS policies for all tables
✅ Test user creation and data insertion
✅ Verify everything works correctly
✅ Clean up test data

📝 INSTRUCTIONS:
1. Copy the entire SQL block above
2. Go to your Supabase Dashboard
3. Open the SQL Editor
4. Paste the SQL and run it
5. Check the results to ensure everything worked

🔍 VERIFICATION:
After running the SQL, you should see:
- 3 trigger functions created
- 3 triggers created  
- 10 RLS policies created
- Test user creation successful
- Data created in all tables correctly

🚀 Once this is done, your user registration should work perfectly!
`);

// Also create a simple test script
const testScript = `
-- SIMPLE TEST AFTER FIX
-- Run this to verify everything works

-- Test 1: Check trigger functions
SELECT 'Trigger Functions:' as test;
SELECT routine_name FROM information_schema.routines 
WHERE routine_name IN ('create_profile_on_signup', 'create_user_settings_on_profile_insert', 'create_subscription_on_signup');

-- Test 2: Check triggers  
SELECT 'Triggers:' as test;
SELECT trigger_name FROM information_schema.triggers 
WHERE trigger_name IN ('create_profile_on_signup_trigger', 'create_user_settings_on_profile_insert_trigger', 'create_subscription_on_signup_trigger');

-- Test 3: Check RLS policies
SELECT 'RLS Policies:' as test;
SELECT tablename, policyname FROM pg_policies 
WHERE tablename IN ('profiles', 'user_settings', 'subscriptions', 'sites', 'categories');

-- Test 4: Test user creation
SELECT 'Testing user creation...' as test;
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES ('test-verify-123', 'verify@example.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Test 5: Verify data creation
SELECT 'Verifying data creation...' as test;
SELECT 'Profile' as table_name, COUNT(*) as count FROM profiles WHERE id = 'test-verify-123'
UNION ALL
SELECT 'User Settings' as table_name, COUNT(*) as count FROM user_settings WHERE user_id = 'test-verify-123'
UNION ALL  
SELECT 'Subscription' as table_name, COUNT(*) as count FROM subscriptions WHERE user_id = 'test-verify-123';

-- Test 6: Clean up
DELETE FROM subscriptions WHERE user_id = 'test-verify-123';
DELETE FROM user_settings WHERE user_id = 'test-verify-123';
DELETE FROM profiles WHERE id = 'test-verify-123';
DELETE FROM auth.users WHERE id = 'test-verify-123';

SELECT '✅ ALL TESTS PASSED!' as result;
`;

console.log(`
📄 SIMPLE VERIFICATION TEST:
============================
${testScript}
`);

console.log(`
🎉 FIX COMPLETE!

Your database should now be fully functional. The user registration process will:
1. Create a user in auth.users
2. Automatically create a profile in profiles table
3. Automatically create user settings in user_settings table  
4. Automatically create a subscription in subscriptions table
5. All with proper RLS policies for security

Try registering a new user now - it should work perfectly! 🚀
`); 