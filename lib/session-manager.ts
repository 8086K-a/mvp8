import { supabase } from './supabase'

export class SessionManager {
  private static instance: SessionManager
  private refreshTimer: NodeJS.Timeout | null = null

  private constructor() {}

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager()
    }
    return SessionManager.instance
  }

  // Initialize session management
  async initialize() {
    try {
      // Get current session
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Session initialization error:', error)
        return false
      }

      if (session) {
        this.setupTokenRefresh(session)
        return true
      }

      return false
    } catch (error) {
      console.error('Session initialization failed:', error)
      return false
    }
  }

  // Setup automatic token refresh
  private setupTokenRefresh(session: any) {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer)
    }

    // Calculate time until token expires (with 5 minute buffer)
    const expiresAt = session.expires_at
    const now = Math.floor(Date.now() / 1000)
    const timeUntilExpiry = (expiresAt - now - 300) * 1000 // 5 minutes buffer

    if (timeUntilExpiry > 0) {
      this.refreshTimer = setTimeout(async () => {
        await this.refreshToken()
      }, timeUntilExpiry)
    }
  }

  // Refresh token manually
  async refreshToken() {
    try {
      const { data, error } = await supabase.auth.refreshSession()
      
      if (error) {
        console.error('Token refresh error:', error)
        return false
      }

      if (data.session) {
        this.setupTokenRefresh(data.session)
        return true
      }

      return false
    } catch (error) {
      console.error('Token refresh failed:', error)
      return false
    }
  }

  // Clear session
  clearSession() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer)
      this.refreshTimer = null
    }
  }

  // Get session info
  async getSessionInfo() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        return null
      }

      if (session && session.expires_at) {
        const now = Math.floor(Date.now() / 1000)
        const expiresAt = session.expires_at
        const timeUntilExpiry = expiresAt - now

        return {
          user: session.user,
          expiresAt,
          timeUntilExpiry,
          isExpired: timeUntilExpiry <= 0
        }
      }

      return null
    } catch (error) {
      console.error('Get session info failed:', error)
      return null
    }
  }
}

// Export singleton instance
export const sessionManager = SessionManager.getInstance() 