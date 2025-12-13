const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Read environment variables from .env.local
function loadEnv() {
  const envPath = path.join(__dirname, '.env.local')
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env.local file not found')
    return {}
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8')
  const env = {}
  
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=')
    if (key && valueParts.length > 0) {
      env[key.trim()] = valueParts.join('=').trim()
    }
  })
  
  return env
}

const env = loadEnv()

// Initialize Supabase client
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function monitorUserData(email) {
  console.log(`🔍 Monitoring user data for: ${email}\n`)

  try {
    // Check profiles table
    console.log('1️⃣ Checking profiles table...')
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
    
    if (profilesError) {
      console.log(`❌ Profiles error: ${profilesError.message}`)
    } else {
      console.log(`✅ Found ${profiles.length} profile(s)`)
      profiles.forEach(profile => {
        console.log(`   - ID: ${profile.id}`)
        console.log(`   - Email: ${profile.email}`)
        console.log(`   - Custom Count: ${profile.custom_count}`)
        console.log(`   - Created: ${profile.created_at}`)
      })
    }

    // Check user_settings table
    console.log('\n2️⃣ Checking user_settings table...')
    const { data: settings, error: settingsError } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', profiles?.[0]?.id || 'no-user')
    
    if (settingsError) {
      console.log(`❌ Settings error: ${settingsError.message}`)
    } else {
      console.log(`✅ Found ${settings.length} setting(s)`)
      settings.forEach(setting => {
        console.log(`   - User ID: ${setting.user_id}`)
        console.log(`   - Theme: ${setting.theme}`)
        console.log(`   - Language: ${setting.language}`)
      })
    }

    // Check subscriptions table
    console.log('\n3️⃣ Checking subscriptions table...')
    const { data: subscriptions, error: subsError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', profiles?.[0]?.id || 'no-user')
    
    if (subsError) {
      console.log(`❌ Subscriptions error: ${subsError.message}`)
    } else {
      console.log(`✅ Found ${subscriptions.length} subscription(s)`)
      subscriptions.forEach(sub => {
        console.log(`   - User ID: ${sub.user_id}`)
        console.log(`   - Plan: ${sub.plan_type}`)
        console.log(`   - Status: ${sub.status}`)
      })
    }

    // Check custom_websites table
    console.log('\n4️⃣ Checking custom_websites table...')
    const { data: customSites, error: sitesError } = await supabase
      .from('custom_websites')
      .select('*')
      .eq('user_id', profiles?.[0]?.id || 'no-user')
    
    if (sitesError) {
      console.log(`❌ Custom sites error: ${sitesError.message}`)
    } else {
      console.log(`✅ Found ${customSites.length} custom website(s)`)
      customSites.forEach(site => {
        console.log(`   - Name: ${site.name}`)
        console.log(`   - URL: ${site.url}`)
        console.log(`   - Category: ${site.category}`)
      })
    }

    // Check favorites table
    console.log('\n5️⃣ Checking favorites table...')
    const { data: favorites, error: favsError } = await supabase
      .from('favorites')
      .select('*')
      .eq('user_id', profiles?.[0]?.id || 'no-user')
    
    if (favsError) {
      console.log(`❌ Favorites error: ${favsError.message}`)
    } else {
      console.log(`✅ Found ${favorites.length} favorite(s)`)
      favorites.forEach(fav => {
        console.log(`   - Site Name: ${fav.site_name}`)
        console.log(`   - URL: ${fav.url}`)
        console.log(`   - Category: ${fav.category}`)
      })
    }

    console.log('\n📊 Summary:')
    console.log(`- Profiles: ${profiles?.length || 0}`)
    console.log(`- Settings: ${settings?.length || 0}`)
    console.log(`- Subscriptions: ${subscriptions?.length || 0}`)
    console.log(`- Custom Websites: ${customSites?.length || 0}`)
    console.log(`- Favorites: ${favorites?.length || 0}`)

  } catch (error) {
    console.error('❌ Error monitoring user data:', error.message)
  }
}

// Run the monitoring
const email = 'mornscience@gmail.com'
monitorUserData(email) 