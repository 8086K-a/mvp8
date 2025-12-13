const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://xqjqfljqjqjqjqjqjqjq.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxanFmbGpxanFqcWpxanFqcWpxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDY5NzI5NywiZXhwIjoyMDUwMjc0ODk3fQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runSQL(sql) {
  try {
    // Since Supabase API doesn't support DDL commands directly,
    // we'll use the REST API to execute SQL via the service role
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({ sql_query: sql })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('HTTP Error:', response.status, errorText);
      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }
    
    const data = await response.json();
    return { success: true, data };
  } catch (err) {
    console.error('Execution Error:', err);
    return { success: false, error: err };
  }
}

async function checkDatabaseState() {
  console.log('🔍 Checking current database state...');
  
  try {
    // Check triggers
    const { data: triggers, error: triggersError } = await supabase
      .from('information_schema.triggers')
      .select('trigger_name, event_manipulation, action_statement')
      .in('trigger_name', [
        'on_auth_user_created_profile',
        'on_auth_user_created_settings', 
        'on_auth_user_created_subscription'
      ]);
    
    if (triggersError) {
      console.error('❌ Error checking triggers:', triggersError);
      return false;
    }
    
    console.log('📊 Current triggers:', triggers?.length || 0);
    if (triggers && triggers.length > 0) {
      triggers.forEach(t => console.log(`  - ${t.trigger_name}`));
    }
    
    // Check functions
    const { data: functions, error: functionsError } = await supabase
      .from('information_schema.routines')
      .select('routine_name, routine_type')
      .in('routine_name', [
        'handle_new_user_profile',
        'handle_new_user_settings',
        'handle_new_user_subscription'
      ]);
    
    if (functionsError) {
      console.error('❌ Error checking functions:', functionsError);
      return false;
    }
    
    console.log('📊 Current functions:', functions?.length || 0);
    if (functions && functions.length > 0) {
      functions.forEach(f => console.log(`  - ${f.routine_name}`));
    }
    
    return true;
  } catch (err) {
    console.error('❌ Error checking database state:', err);
    return false;
  }
}

async function testUserRegistration() {
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'testpassword123';
  
  console.log(`🧪 Testing user registration with: ${testEmail}`);
  
  try {
    // Create test user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true
    });
    
    if (authError) {
      console.error('❌ Auth Error:', authError);
      return { success: false, error: authError };
    }
    
    const userId = authData.user.id;
    console.log(`✅ Test user created: ${userId}`);
    
    // Wait a moment for triggers to execute
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check if profile was created
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (profileError || !profileData) {
      console.error('❌ Profile not created:', profileError);
      return { success: false, error: profileError };
    }
    console.log('✅ Profile created successfully');
    
    // Check if user_settings was created
    const { data: settingsData, error: settingsError } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (settingsError || !settingsData) {
      console.error('❌ User settings not created:', settingsError);
      return { success: false, error: settingsError };
    }
    console.log('✅ User settings created successfully');
    
    // Check if subscription was created
    const { data: subscriptionData, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (subscriptionError || !subscriptionData) {
      console.error('❌ Subscription not created:', subscriptionError);
      return { success: false, error: subscriptionError };
    }
    console.log('✅ Subscription created successfully');
    
    // Clean up test user
    await supabase.auth.admin.deleteUser(userId);
    console.log('🧹 Test user cleaned up');
    
    return { success: true };
    
  } catch (err) {
    console.error('❌ Test Error:', err);
    return { success: false, error: err };
  }
}

async function autoRunUntilFix() {
  let attempt = 1;
  const maxAttempts = 5;
  
  console.log('🚀 Starting auto-run until fix...');
  console.log('⚠️  Note: This script will provide SQL commands for manual execution');
  console.log('   since Supabase API doesn\'t support DDL commands directly.\n');
  
  while (attempt <= maxAttempts) {
    console.log(`\n📋 Attempt ${attempt}/${maxAttempts}`);
    console.log('=' .repeat(50));
    
    // Step 1: Check current state
    const stateOk = await checkDatabaseState();
    
    // Step 2: Test user registration
    console.log('\n🧪 Testing user registration...');
    const testResult = await testUserRegistration();
    
    if (testResult.success) {
      console.log('\n🎉 SUCCESS! All tests passed!');
      console.log('✅ User registration works correctly');
      console.log('✅ All triggers are functioning');
      console.log('✅ Database is properly configured');
      return true;
    } else {
      console.error('❌ Test failed:', testResult.error);
      
      // Provide SQL fix for manual execution
      console.log('\n🔧 SQL FIX REQUIRED - Please run this in Supabase SQL Editor:');
      console.log('=' .repeat(60));
      console.log(`
-- Complete cleanup and fix SQL
-- Drop all existing triggers and functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_settings ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_subscription ON auth.users;

DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.handle_new_user_profile();
DROP FUNCTION IF EXISTS public.handle_new_user_settings();
DROP FUNCTION IF EXISTS public.handle_new_user_subscription();

-- Create the correct trigger function for profiles
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
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

-- Create the correct trigger function for user_settings
CREATE OR REPLACE FUNCTION public.handle_new_user_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_settings (user_id, theme, language, notifications_enabled, created_at, updated_at)
  VALUES (
    NEW.id,
    'light',
    'en',
    true,
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the correct trigger function for subscriptions
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.subscriptions (user_id, plan_type, status, current_period_start, current_period_end, created_at, updated_at)
  VALUES (
    NEW.id,
    'free',
    'active',
    NOW(),
    NOW() + INTERVAL '30 days',
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();

CREATE TRIGGER on_auth_user_created_settings
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_settings();

CREATE TRIGGER on_auth_user_created_subscription
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_subscription();
`);
      console.log('=' .repeat(60));
      console.log('📝 Copy the SQL above and run it in your Supabase SQL Editor');
      console.log('🔗 Go to: https://supabase.com/dashboard/project/xqjqfljqjqjqjqjqjqjq/sql');
    }
    
    attempt++;
    
    if (attempt <= maxAttempts) {
      console.log(`\n⏳ Waiting 5 seconds before next attempt...`);
      console.log('💡 Please run the SQL fix above, then press Enter to continue...');
      
      // Wait for user input
      await new Promise(resolve => {
        process.stdin.once('data', () => {
          resolve();
        });
      });
    }
  }
  
  console.log('\n💥 FAILED: Maximum attempts reached');
  console.log('❌ Could not fix the database issues after', maxAttempts, 'attempts');
  return false;
}

// Run the automated fix
autoRunUntilFix()
  .then(success => {
    if (success) {
      console.log('\n🎯 MISSION ACCOMPLISHED!');
      process.exit(0);
    } else {
      console.log('\n💔 MISSION FAILED!');
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('💥 Fatal error:', err);
    process.exit(1);
  }); 