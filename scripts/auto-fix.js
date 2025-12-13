const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runFix() {
  console.log('🔧 Running database fix...');
  
  try {
    // Test user creation
    const { data: user, error: userError } = await supabase.auth.admin.createUser({
      email: 'test@example.com',
      password: 'password123'
    });
    
    if (userError) {
      console.log('❌ User creation failed:', userError.message);
      return false;
    }
    
    console.log('✅ User created:', user.user.id);
    
    // Check if related data was created
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
    await supabase.auth.admin.deleteUser(user.user.id);
    
    return true;
  } catch (error) {
    console.log('❌ Error:', error.message);
    return false;
  }
}

async function main() {
  let attempt = 1;
  const maxAttempts = 3;
  
  while (attempt <= maxAttempts) {
    console.log(`\n🔄 Attempt ${attempt}/${maxAttempts}`);
    
    const success = await runFix();
    
    if (success) {
      console.log('\n🎉 SUCCESS! Database is working correctly!');
      break;
    }
    
    attempt++;
    if (attempt <= maxAttempts) {
      console.log('⏳ Waiting 2 seconds...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  if (attempt > maxAttempts) {
    console.log('\n💥 FAILED: Please run the SQL fix manually');
  }
}

main(); 