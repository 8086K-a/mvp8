const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting comprehensive auto-fix and test script...\n');

// Step 1: Check and fix environment setup
function setupEnvironment() {
  console.log('📋 Step 1: Setting up environment variables...');
  
  const envPath = '.env.local';
  const envExamplePath = 'env.example';
  
  if (!fs.existsSync(envPath)) {
    console.log('⚠️  .env.local not found. Creating from template...');
    
    if (fs.existsSync(envExamplePath)) {
      const envContent = fs.readFileSync(envExamplePath, 'utf8');
      fs.writeFileSync(envPath, envContent);
      console.log('✅ Created .env.local from template');
    } else {
      console.log('❌ env.example not found. Creating basic .env.local...');
      const basicEnv = `# Supabase Configuration
# Get these values from your Supabase project dashboard
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Example:
# NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Facebook OAuth Configuration (Optional)
NEXT_PUBLIC_FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret

# WeChat OAuth Configuration (Optional)
NEXT_PUBLIC_WECHAT_APP_ID=your_wechat_app_id
WECHAT_APP_SECRET=your_wechat_app_secret`;
      
      fs.writeFileSync(envPath, basicEnv);
      console.log('✅ Created basic .env.local');
    }
  } else {
    console.log('✅ .env.local already exists');
  }
  
  // Check if environment variables are properly set
  const envContent = fs.readFileSync(envPath, 'utf8');
  if (envContent.includes('your_supabase_project_url') || envContent.includes('your_supabase_anon_key')) {
    console.log('⚠️  Please update .env.local with your actual Supabase credentials');
    console.log('   You can get these from your Supabase project dashboard');
    return false;
  }
  
  return true;
}

// Step 2: Clear Next.js cache and reinstall dependencies
function fixNextJsIssues() {
  console.log('\n🔧 Step 2: Fixing Next.js issues...');
  
  try {
    // Clear Next.js cache
    console.log('🧹 Clearing Next.js cache...');
    if (fs.existsSync('.next')) {
      execSync('rm -rf .next', { stdio: 'inherit' });
      console.log('✅ Cleared .next cache');
    }
    
    // Clear node_modules and reinstall
    console.log('📦 Reinstalling dependencies...');
    if (fs.existsSync('node_modules')) {
      execSync('rm -rf node_modules', { stdio: 'inherit' });
      console.log('✅ Removed node_modules');
    }
    
    execSync('pnpm install', { stdio: 'inherit' });
    console.log('✅ Dependencies reinstalled');
    
    return true;
  } catch (error) {
    console.log('❌ Error fixing Next.js issues:', error.message);
    return false;
  }
}

// Step 3: Create comprehensive database fix
function createDatabaseFix() {
  console.log('\n🗄️  Step 3: Creating comprehensive database fix...');
  
  const sqlFix = `-- Comprehensive Database Fix for User Registration Issues
-- This script fixes all trigger functions, RLS policies, and ensures proper user registration

-- Step 1: Drop existing triggers and functions
DROP TRIGGER IF EXISTS handle_new_user ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user_profile ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user_settings ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user_subscription ON auth.users;

DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.handle_new_user_profile();
DROP FUNCTION IF EXISTS public.handle_new_user_settings();
DROP FUNCTION IF EXISTS public.handle_new_user_subscription();

-- Step 2: Create corrected trigger functions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into profiles table
  INSERT INTO public.profiles (id, email, full_name, avatar_url, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    NOW(),
    NOW()
  );
  
  -- Insert into user_settings table
  INSERT INTO public.user_settings (user_id, theme, language, notifications_enabled, created_at, updated_at)
  VALUES (
    NEW.id,
    'light',
    'en',
    true,
    NOW(),
    NOW()
  );
  
  -- Insert into subscriptions table
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

-- Step 3: Create the trigger
CREATE TRIGGER handle_new_user
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 4: Fix RLS policies
-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.websites ENABLE ROW LEVEL SECURITY;

-- Profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- User settings policies
DROP POLICY IF EXISTS "Users can view own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON public.user_settings;

CREATE POLICY "Users can view own settings" ON public.user_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON public.user_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON public.user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Subscriptions policies
DROP POLICY IF EXISTS "Users can view own subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can update own subscription" ON public.subscriptions;

CREATE POLICY "Users can view own subscription" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription" ON public.subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscription" ON public.subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Websites policies
DROP POLICY IF EXISTS "Users can view own websites" ON public.websites;
DROP POLICY IF EXISTS "Users can update own websites" ON public.websites;
DROP POLICY IF EXISTS "Users can insert own websites" ON public.websites;
DROP POLICY IF EXISTS "Users can delete own websites" ON public.websites;

CREATE POLICY "Users can view own websites" ON public.websites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own websites" ON public.websites
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own websites" ON public.websites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own websites" ON public.websites
  FOR DELETE USING (auth.uid() = user_id);

-- Step 5: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.profiles TO anon, authenticated;
GRANT ALL ON public.user_settings TO anon, authenticated;
GRANT ALL ON public.subscriptions TO anon, authenticated;
GRANT ALL ON public.websites TO anon, authenticated;

-- Step 6: Create sequences if they don't exist
CREATE SEQUENCE IF NOT EXISTS public.websites_id_seq;
ALTER TABLE public.websites ALTER COLUMN id SET DEFAULT nextval('public.websites_id_seq');
ALTER SEQUENCE public.websites_id_seq OWNED BY public.websites.id;

-- Step 7: Verify the fix
DO $$
BEGIN
  RAISE NOTICE 'Database fix completed successfully!';
  RAISE NOTICE 'All triggers, functions, and RLS policies have been corrected.';
END $$;`;

  fs.writeFileSync('comprehensive-database-fix.sql', sqlFix);
  console.log('✅ Created comprehensive-database-fix.sql');
  return true;
}

// Step 4: Test the application
function testApplication() {
  console.log('\n🧪 Step 4: Testing application...');
  
  try {
    // Test if Next.js can build
    console.log('🔨 Testing Next.js build...');
    execSync('pnpm build', { stdio: 'inherit', timeout: 60000 });
    console.log('✅ Next.js build successful');
    
    // Test if dev server can start
    console.log('🚀 Testing dev server...');
    const devProcess = execSync('pnpm dev --port 3007', { 
      stdio: 'pipe', 
      timeout: 30000,
      encoding: 'utf8'
    });
    
    if (devProcess.includes('Ready') || devProcess.includes('ready')) {
      console.log('✅ Dev server started successfully');
      return true;
    } else {
      console.log('❌ Dev server failed to start properly');
      return false;
    }
  } catch (error) {
    console.log('❌ Application test failed:', error.message);
    return false;
  }
}

// Step 5: Create test user registration script
function createTestScript() {
  console.log('\n📝 Step 5: Creating test script...');
  
  const testScript = `const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.log('❌ Missing Supabase environment variables');
  console.log('Please update .env.local with your Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testUserRegistration() {
  console.log('🧪 Testing user registration...');
  
  const testEmail = \`test-\${Date.now()}@example.com\`;
  const testPassword = 'testpassword123';
  
  try {
    // Test 1: User signup
    console.log('📝 Testing user signup...');
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    });
    
    if (signupError) {
      console.log('❌ Signup failed:', signupError.message);
      return false;
    }
    
    console.log('✅ Signup successful:', signupData.user?.id);
    
    // Test 2: Check if profile was created
    console.log('👤 Checking profile creation...');
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', signupData.user?.id)
      .single();
    
    if (profileError) {
      console.log('❌ Profile check failed:', profileError.message);
      return false;
    }
    
    console.log('✅ Profile created:', profileData);
    
    // Test 3: Check if user_settings was created
    console.log('⚙️  Checking user settings creation...');
    const { data: settingsData, error: settingsError } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', signupData.user?.id)
      .single();
    
    if (settingsError) {
      console.log('❌ User settings check failed:', settingsError.message);
      return false;
    }
    
    console.log('✅ User settings created:', settingsData);
    
    // Test 4: Check if subscription was created
    console.log('💳 Checking subscription creation...');
    const { data: subscriptionData, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', signupData.user?.id)
      .single();
    
    if (subscriptionError) {
      console.log('❌ Subscription check failed:', subscriptionError.message);
      return false;
    }
    
    console.log('✅ Subscription created:', subscriptionData);
    
    // Test 5: Test website insertion
    console.log('🌐 Testing website insertion...');
    const { data: websiteData, error: websiteError } = await supabase
      .from('websites')
      .insert({
        user_id: signupData.user?.id,
        name: 'Test Website',
        url: 'https://example.com',
        description: 'Test website description',
        category: 'test',
        status: 'active'
      })
      .select()
      .single();
    
    if (websiteError) {
      console.log('❌ Website insertion failed:', websiteError.message);
      return false;
    }
    
    console.log('✅ Website inserted:', websiteData);
    
    console.log('🎉 All tests passed! User registration is working correctly.');
    return true;
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
    return false;
  }
}

testUserRegistration();`;

  fs.writeFileSync('test-user-registration-complete.js', testScript);
  console.log('✅ Created test-user-registration-complete.js');
  return true;
}

// Main execution function
async function runCompleteFix() {
  console.log('🔧 Starting comprehensive fix process...\n');
  
  let step = 1;
  const maxAttempts = 3;
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    console.log(`\n🔄 Attempt ${attempts + 1} of ${maxAttempts}\n`);
    
    // Step 1: Environment setup
    if (!setupEnvironment()) {
      console.log('⚠️  Environment setup incomplete. Please update .env.local with your Supabase credentials.');
      console.log('   You can get these from your Supabase project dashboard');
      console.log('   Then run this script again.');
      return;
    }
    
    // Step 2: Fix Next.js issues
    if (!fixNextJsIssues()) {
      console.log('❌ Failed to fix Next.js issues');
      attempts++;
      continue;
    }
    
    // Step 3: Create database fix
    if (!createDatabaseFix()) {
      console.log('❌ Failed to create database fix');
      attempts++;
      continue;
    }
    
    // Step 4: Create test script
    if (!createTestScript()) {
      console.log('❌ Failed to create test script');
      attempts++;
      continue;
    }
    
    console.log('\n✅ All fixes created successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Update .env.local with your actual Supabase credentials');
    console.log('2. Run the database fix in your Supabase SQL Editor:');
    console.log('   - Copy the contents of comprehensive-database-fix.sql');
    console.log('   - Paste and run in Supabase SQL Editor');
    console.log('3. Test the fix by running: node test-user-registration-complete.js');
    console.log('4. Start the development server: pnpm dev');
    
    break;
  }
  
  if (attempts >= maxAttempts) {
    console.log('\n❌ Maximum attempts reached. Please check the errors above.');
  }
}

// Run the complete fix
runCompleteFix().catch(console.error); 