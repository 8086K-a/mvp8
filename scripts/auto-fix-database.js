const { createClient } = require('@supabase/supabase-js');

// Database configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runCompleteCleanupFix() {
    console.log('🔧 Running complete database cleanup fix...');
    
    try {
        // Step 1: Drop all existing triggers and functions
        console.log('📋 Step 1: Dropping all existing triggers and functions...');
        
        const dropTriggers = `
            DROP TRIGGER IF EXISTS create_user_profile_on_signup ON auth.users;
            DROP TRIGGER IF EXISTS create_user_settings_on_signup ON auth.users;
            DROP TRIGGER IF EXISTS create_user_subscription_on_signup ON auth.users;
        `;
        
        const dropFunctions = `
            DROP FUNCTION IF EXISTS create_user_profile_on_signup();
            DROP FUNCTION IF EXISTS create_user_settings_on_signup();
            DROP FUNCTION IF EXISTS create_user_subscription_on_signup();
        `;
        
        await supabase.rpc('exec_sql', { sql: dropTriggers });
        await supabase.rpc('exec_sql', { sql: dropFunctions });
        
        console.log('✅ Dropped all old triggers and functions');
        
        // Step 2: Create correct trigger functions
        console.log('📋 Step 2: Creating correct trigger functions...');
        
        const createProfileFunction = `
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
        `;
        
        const createSettingsFunction = `
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
        `;
        
        const createSubscriptionFunction = `
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
        `;
        
        await supabase.rpc('exec_sql', { sql: createProfileFunction });
        await supabase.rpc('exec_sql', { sql: createSettingsFunction });
        await supabase.rpc('exec_sql', { sql: createSubscriptionFunction });
        
        console.log('✅ Created correct trigger functions');
        
        // Step 3: Create triggers
        console.log('📋 Step 3: Creating triggers...');
        
        const createTriggers = `
            CREATE TRIGGER create_user_profile_on_signup
                AFTER INSERT ON auth.users
                FOR EACH ROW EXECUTE FUNCTION create_user_profile_on_signup();
                
            CREATE TRIGGER create_user_settings_on_signup
                AFTER INSERT ON auth.users
                FOR EACH ROW EXECUTE FUNCTION create_user_settings_on_signup();
                
            CREATE TRIGGER create_user_subscription_on_signup
                AFTER INSERT ON auth.users
                FOR EACH ROW EXECUTE FUNCTION create_user_subscription_on_signup();
        `;
        
        await supabase.rpc('exec_sql', { sql: createTriggers });
        
        console.log('✅ Created all triggers');
        
        return true;
        
    } catch (error) {
        console.error('❌ Error in cleanup fix:', error);
        return false;
    }
}

async function testDatabaseSetup() {
    console.log('🧪 Testing database setup...');
    
    try {
        // Test 1: Check if triggers exist
        const checkTriggers = `
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
        `;
        
        const { data: triggers, error: triggersError } = await supabase.rpc('exec_sql', { sql: checkTriggers });
        
        if (triggersError) {
            console.error('❌ Error checking triggers:', triggersError);
            return false;
        }
        
        console.log('📋 Found triggers:', triggers?.length || 0);
        
        // Test 2: Check if functions exist
        const checkFunctions = `
            SELECT 
                routine_name,
                routine_type
            FROM information_schema.routines 
            WHERE routine_name IN (
                'create_user_profile_on_signup',
                'create_user_settings_on_signup',
                'create_user_subscription_on_signup'
            );
        `;
        
        const { data: functions, error: functionsError } = await supabase.rpc('exec_sql', { sql: checkFunctions });
        
        if (functionsError) {
            console.error('❌ Error checking functions:', functionsError);
            return false;
        }
        
        console.log('📋 Found functions:', functions?.length || 0);
        
        // Test 3: Try to create a test user (this will trigger the functions)
        console.log('🧪 Testing user creation...');
        
        const testUser = {
            email: `test-${Date.now()}@example.com`,
            password: 'testpassword123',
            user_metadata: {
                full_name: 'Test User',
                avatar_url: 'https://example.com/avatar.jpg'
            }
        };
        
        const { data: user, error: userError } = await supabase.auth.admin.createUser(testUser);
        
        if (userError) {
            console.error('❌ Error creating test user:', userError);
            return false;
        }
        
        console.log('✅ Test user created successfully:', user.user.id);
        
        // Test 4: Check if related data was created
        const checkProfile = `SELECT * FROM public.profiles WHERE id = '${user.user.id}';`;
        const checkSettings = `SELECT * FROM public.user_settings WHERE user_id = '${user.user.id}';`;
        const checkSubscription = `SELECT * FROM public.subscriptions WHERE user_id = '${user.user.id}';`;
        
        const { data: profile } = await supabase.rpc('exec_sql', { sql: checkProfile });
        const { data: settings } = await supabase.rpc('exec_sql', { sql: checkSettings });
        const { data: subscription } = await supabase.rpc('exec_sql', { sql: checkSubscription });
        
        console.log('📋 Profile created:', profile?.length > 0);
        console.log('📋 Settings created:', settings?.length > 0);
        console.log('📋 Subscription created:', subscription?.length > 0);
        
        // Clean up test user
        await supabase.auth.admin.deleteUser(user.user.id);
        console.log('🧹 Cleaned up test user');
        
        return profile?.length > 0 && settings?.length > 0 && subscription?.length > 0;
        
    } catch (error) {
        console.error('❌ Error in test:', error);
        return false;
    }
}

async function autoRunUntilFixed() {
    console.log('🚀 Starting auto-run until fixed...');
    console.log('⚠️  Note: This requires manual SQL execution in Supabase SQL Editor');
    console.log('📋 Please run the following SQL in your Supabase SQL Editor:');
    console.log('');
    
    const completeFixSQL = `
-- COMPLETE DATABASE CLEANUP FIX
-- Run this in Supabase SQL Editor

-- Step 1: Drop all existing triggers
DROP TRIGGER IF EXISTS create_user_profile_on_signup ON auth.users;
DROP TRIGGER IF EXISTS create_user_settings_on_signup ON auth.users;
DROP TRIGGER IF EXISTS create_user_subscription_on_signup ON auth.users;

-- Step 2: Drop all existing functions
DROP FUNCTION IF EXISTS create_user_profile_on_signup();
DROP FUNCTION IF EXISTS create_user_settings_on_signup();
DROP FUNCTION IF EXISTS create_user_subscription_on_signup();

-- Step 3: Create correct profile function
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

-- Step 4: Create correct settings function
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

-- Step 5: Create correct subscription function
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

-- Step 6: Create triggers
CREATE TRIGGER create_user_profile_on_signup
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_user_profile_on_signup();
    
CREATE TRIGGER create_user_settings_on_signup
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_user_settings_on_signup();
    
CREATE TRIGGER create_user_subscription_on_signup
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_user_subscription_on_signup();

-- Step 7: Verify setup
SELECT 'Triggers:' as info;
SELECT trigger_name, event_manipulation FROM information_schema.triggers 
WHERE trigger_name IN ('create_user_profile_on_signup', 'create_user_settings_on_signup', 'create_user_subscription_on_signup');

SELECT 'Functions:' as info;
SELECT routine_name, routine_type FROM information_schema.routines 
WHERE routine_name IN ('create_user_profile_on_signup', 'create_user_settings_on_signup', 'create_user_subscription_on_signup');
    `;
    
    console.log(completeFixSQL);
    console.log('');
    console.log('🎯 After running the SQL above, test user registration in your app.');
    console.log('🔄 If issues persist, run this script again.');
    
    return true;
}

// Main execution
async function main() {
    console.log('🔧 Database Auto-Fix Script');
    console.log('==========================');
    
    // Check if we have the required environment variables
    if (!supabaseUrl || supabaseUrl === 'https://your-project.supabase.co') {
        console.log('❌ Missing Supabase configuration');
        console.log('📋 Please set up your .env.local file with:');
        console.log('   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url');
        console.log('   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
        console.log('');
        console.log('🔄 Running manual SQL fix instead...');
        await autoRunUntilFixed();
        return;
    }
    
    let attempts = 0;
    const maxAttempts = 5;
    
    while (attempts < maxAttempts) {
        attempts++;
        console.log(`\n🔄 Attempt ${attempts}/${maxAttempts}`);
        
        const cleanupSuccess = await runCompleteCleanupFix();
        if (!cleanupSuccess) {
            console.log('❌ Cleanup failed, trying manual SQL approach...');
            await autoRunUntilFixed();
            break;
        }
        
        const testSuccess = await testDatabaseSetup();
        if (testSuccess) {
            console.log('🎉 SUCCESS! Database is now working correctly!');
            console.log('✅ User registration should now work without errors');
            break;
        } else {
            console.log('❌ Test failed, retrying...');
            if (attempts >= maxAttempts) {
                console.log('🔄 Max attempts reached, providing manual SQL fix...');
                await autoRunUntilFixed();
            }
        }
    }
}

main().catch(console.error); 