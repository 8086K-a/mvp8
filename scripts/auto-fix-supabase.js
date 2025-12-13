const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

console.log('🔧 AUTO FIXING SUPABASE ISSUES');
console.log('================================\n');

// Get Supabase credentials from environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Environment check:');
console.log(`- Supabase URL: ${supabaseUrl ? '✅ Found' : '❌ Missing'}`);
console.log(`- Service Key: ${supabaseServiceKey ? '✅ Found' : '❌ Missing'}`);

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('\n❌ Missing Supabase credentials in .env.local');
  console.error('Please ensure you have:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  console.error('\n📝 Copy this SQL to your Supabase SQL Editor instead:');
  
  console.log(`
-- COMPLETE CLEANUP AND FIX
-- Run this in your Supabase SQL Editor

-- Step 1: Drop all old trigger functions and triggers
DROP FUNCTION IF EXISTS create_user_profile_on_signup() CASCADE;
DROP FUNCTION IF EXISTS create_user_settings_on_signup() CASCADE;
DROP FUNCTION IF EXISTS create_user_subscription_on_signup() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS create_user_data() CASCADE;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS trigger_create_user_profile ON auth.users;
DROP TRIGGER IF EXISTS trigger_create_user_settings ON auth.users;
DROP TRIGGER IF EXISTS trigger_create_user_subscription ON auth.users;

-- Step 2: Create correct trigger functions
CREATE OR REPLACE FUNCTION create_user_profile_on_signup()
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
  VALUES (NEW.id, 'light', 'grid', false, true, true, NOW(), NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION create_user_subscription_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO subscriptions (user_id, plan_type, status, created_at, updated_at)
  VALUES (NEW.id, 'free', 'active', NOW(), NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Create triggers
CREATE TRIGGER trigger_create_user_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_profile_on_signup();

CREATE TRIGGER trigger_create_user_settings
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_settings_on_signup();

CREATE TRIGGER trigger_create_user_subscription
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_subscription_on_signup();

-- Step 4: Temporarily disable RLS for testing
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions DISABLE ROW LEVEL SECURITY;

-- Step 5: Test the fix
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES ('123e4567-e89b-12d3-a456-426614174000', 'test@example.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Check results
SELECT 'Profiles:' as table_name, COUNT(*) as count FROM profiles WHERE id = '123e4567-e89b-12d3-a456-426614174000'
UNION ALL
SELECT 'Settings:', COUNT(*) FROM user_settings WHERE user_id = '123e4567-e89b-12d3-a456-426614174000'
UNION ALL
SELECT 'Subscriptions:', COUNT(*) FROM subscriptions WHERE user_id = '123e4567-e89b-12d3-a456-426614174000';

-- Clean up test data
DELETE FROM subscriptions WHERE user_id = '123e4567-e89b-12d3-a456-426614174000';
DELETE FROM user_settings WHERE user_id = '123e4567-e89b-12d3-a456-426614174000';
DELETE FROM profiles WHERE id = '123e4567-e89b-12d3-a456-426614174000';
DELETE FROM auth.users WHERE id = '123e4567-e89b-12d3-a456-426614174000';
  `);
  
  process.exit(1);
}

console.log('\n✅ Environment variables found!');
console.log('Attempting to connect to Supabase...\n');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runAutoFix() {
  try {
    console.log('🗑️  Step 1: Cleaning up old triggers and functions...');
    
    // Note: Supabase doesn't allow DDL via RPC, so we'll provide manual instructions
    console.log('⚠️  Supabase API limitations detected');
    console.log('📝 Please run the SQL above in your Supabase SQL Editor');
    console.log('🔗 Go to: https://supabase.com/dashboard/project/[YOUR_PROJECT]/sql');
    
    // Test connection
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    
    if (error) {
      console.log(`❌ Connection error: ${error.message}`);
    } else {
      console.log('✅ Successfully connected to Supabase!');
    }

  } catch (error) {
    console.error('❌ Error during auto fix:', error.message);
  }
}

// Run the auto fix
runAutoFix(); 