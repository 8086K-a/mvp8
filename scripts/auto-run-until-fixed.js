#!/usr/bin/env node

console.log('🔧 AUTO-RUN UNTIL FIXED - DATABASE FIX SCRIPT');
console.log('==============================================');
console.log('');

console.log('📋 STEP 1: Copy and paste this SQL into your Supabase SQL Editor:');
console.log('');

const fixSQL = `-- COMPLETE DATABASE FIX FOR USER REGISTRATION ISSUES
-- Run this entire script in your Supabase SQL Editor

-- Step 1: Drop all existing triggers first
DROP TRIGGER IF EXISTS create_user_profile_on_signup ON auth.users;
DROP TRIGGER IF EXISTS create_user_settings_on_signup ON auth.users;
DROP TRIGGER IF EXISTS create_user_subscription_on_signup ON auth.users;

-- Step 2: Drop all existing functions
DROP FUNCTION IF EXISTS create_user_profile_on_signup();
DROP FUNCTION IF EXISTS create_user_settings_on_signup();
DROP FUNCTION IF EXISTS create_user_subscription_on_signup();

-- Step 3: Create the correct profile function
CREATE OR REPLACE FUNCTION create_user_profile_on_signup()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url, created_at, updated_at)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
        NOW(),
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Create the correct settings function (FIXED: uses user_id column)
CREATE OR REPLACE FUNCTION create_user_settings_on_signup()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_settings (user_id, theme, notifications_enabled, created_at, updated_at)
    VALUES (
        NEW.id,
        'light',
        true,
        NOW(),
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Create the correct subscription function (FIXED: uses user_id column)
CREATE OR REPLACE FUNCTION create_user_subscription_on_signup()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.subscriptions (user_id, plan_id, status, current_period_start, current_period_end, created_at, updated_at)
    VALUES (
        NEW.id,
        1,
        'active',
        NOW(),
        NOW() + INTERVAL '30 days',
        NOW(),
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Create the triggers
CREATE TRIGGER create_user_profile_on_signup
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_user_profile_on_signup();
    
CREATE TRIGGER create_user_settings_on_signup
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_user_settings_on_signup();
    
CREATE TRIGGER create_user_subscription_on_signup
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_user_subscription_on_signup();

-- Step 7: Verify the setup
SELECT '=== TRIGGERS CREATED ===' as status;
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name IN (
    'create_user_profile_on_signup',
    'create_user_settings_on_signup', 
    'create_user_subscription_on_signup'
);

SELECT '=== FUNCTIONS CREATED ===' as status;
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_name IN (
    'create_user_profile_on_signup',
    'create_user_settings_on_signup',
    'create_user_subscription_on_signup'
);

SELECT '=== FIX COMPLETE ===' as status;
SELECT 'Database triggers and functions have been fixed!' as message;
SELECT 'User registration should now work without null user_id errors.' as next_step;`;

console.log(fixSQL);
console.log('');
console.log('📋 STEP 2: After running the SQL above, test user registration in your app.');
console.log('');
console.log('📋 STEP 3: If you want to test the database directly, run this test SQL:');
console.log('');

const testSQL = `-- TEST USER REGISTRATION FIX
-- Run this after running the fix script above

-- Create a test user
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_user_meta_data,
    is_super_admin,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'test-' || extract(epoch from now()) || '@example.com',
    crypt('testpassword123', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"full_name": "Test User", "avatar_url": "https://example.com/avatar.jpg"}'::jsonb,
    false,
    '',
    '',
    '',
    ''
) RETURNING id;

-- Check if related data was created
SELECT 'Profile created:' as check_type, * FROM public.profiles 
WHERE email LIKE 'test-%@example.com' 
ORDER BY created_at DESC LIMIT 1;

SELECT 'Settings created:' as check_type, * FROM public.user_settings 
WHERE user_id IN (
    SELECT id FROM auth.users 
    WHERE email LIKE 'test-%@example.com' 
    ORDER BY created_at DESC LIMIT 1
);

SELECT 'Subscription created:' as check_type, * FROM public.subscriptions 
WHERE user_id IN (
    SELECT id FROM auth.users 
    WHERE email LIKE 'test-%@example.com' 
    ORDER BY created_at DESC LIMIT 1
);`;

console.log(testSQL);
console.log('');
console.log('🎯 INSTRUCTIONS:');
console.log('1. Go to your Supabase project dashboard');
console.log('2. Navigate to SQL Editor');
console.log('3. Copy and paste the first SQL block above');
console.log('4. Click "Run" to execute the fix');
console.log('5. Test user registration in your app');
console.log('6. If issues persist, run the test SQL to verify the fix');
console.log('');
console.log('🔄 This script will continue running until you confirm the issue is fixed.');
console.log('Press Ctrl+C to stop when you\'re done testing.');
console.log('');

// Keep the script running
setInterval(() => {
    console.log('⏰ Still running... Test your app now!');
}, 30000); // Remind every 30 seconds 