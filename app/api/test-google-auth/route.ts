import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'sitehub-auth-token',
    flowType: 'pkce'
  }
})

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Testing Google OAuth configuration...')
    console.log(`Supabase URL: ${supabaseUrl}`)
    console.log(`Site URL: ${siteUrl}`)
    console.log(`Redirect URL: ${siteUrl}/auth/callback`)

    // Test Google OAuth sign-in
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${siteUrl}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    })

    if (error) {
      console.error('❌ Google OAuth error:', error)
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 400 })
    }

    console.log('✅ Google OAuth initiated successfully!')
    console.log('📋 OAuth URL:', data.url)

    return NextResponse.json({
      success: true,
      oauthUrl: data.url,
      message: 'Google OAuth configured correctly'
    })

  } catch (error) {
    console.error('❌ Test failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 