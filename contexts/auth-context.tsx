'use client'

import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { User as SupabaseUser, Session, AuthChangeEvent } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { sessionManager } from '@/lib/session-manager'
import { AuthTokenManager } from '@/lib/auth-token-manager'

interface CustomUser {
  type: "guest" | "authenticated"
  name?: string
  email?: string
  customCount: number
  pro: boolean
  id?: string
  provider?: string
}

interface AuthContextType {
  user: CustomUser
  supabaseUser: SupabaseUser | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
  signIn: (userData: CustomUser) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CustomUser>({ type: "guest", customCount: 0, pro: false })
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  
  // ✅ 关键修复：添加 isMountedRef 来防止组件卸载后设置状态
  const isMountedRef = useRef(true)

  useEffect(() => {
    // Initialize session manager
    sessionManager.initialize()

    // Get initial session
    const getInitialSession = async () => {
      try {
        // ✅ 检查国内用户 JWT Token 会话
        const jwtToken = localStorage.getItem('user_token')
        const userInfoStr = localStorage.getItem('user_info')
        
        if (jwtToken && userInfoStr) {
          try {
            const userInfo = JSON.parse(userInfoStr)
            console.log("✅ [Session Restore]: Found JWT session, restoring user:", userInfo.email)

            // ✅ 检查并刷新Token（多端持久化优化）
            await AuthTokenManager.checkAndRefreshToken()

            // 重新检查订阅状态（确保会员状态是最新的）
            let isPro = userInfo.pro || false
            try {
              if (userInfo.id) {
                const response = await fetch('/api/user/refresh-status', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ userId: userInfo.id })
                })
                const statusData = await response.json()
                if (statusData.success) {
                  isPro = statusData.pro
                  console.log("✅ [Session Restore]: Updated pro status from subscription check")
                }
              }
            } catch (statusError) {
              console.warn("⚠️ [Session Restore]: Failed to check subscription status:", statusError)
            }

            // 创建国内用户对象
            const customUser: CustomUser = {
              type: "authenticated",
              name: userInfo.name || userInfo.email?.split('@')[0] || 'User',
              email: userInfo.email || '',
              customCount: 0,
              pro: isPro,
              id: userInfo.id,
              provider: 'email'
            }
            setUser(customUser)
            localStorage.setItem("sitehub-user", JSON.stringify(customUser))
            // ✅ 恢复会话成功，清除访客计时
            localStorage.removeItem("guest-start-time")
            setLoading(false)
            return
          } catch (error) {
            console.error("Failed to parse JWT user info:", error)
          }
        } else {
          console.log("ℹ️ [Session Restore]: No JWT session found")
        }
        
        // Supabase session check
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error("Error getting session:", error)
          setUser({ type: "guest", customCount: 0, pro: false })
          setLoading(false)
          return
        }

        setSession(session)
        setSupabaseUser(session?.user ?? null)
        
        if (session?.user) {
          // Convert Supabase user to custom user format
          const customUser: CustomUser = {
            type: "authenticated",
            name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
            email: session.user.email || '',
            customCount: 0,
            pro: false,
            id: session.user.id,
            provider: session.user.app_metadata?.provider
          }
          setUser(customUser)
          localStorage.setItem("sitehub-user", JSON.stringify(customUser))
        } else {
          // Check for guest data in localStorage
          const savedUser = localStorage.getItem("sitehub-user")
          if (savedUser) {
            try {
              const userData = JSON.parse(savedUser)
              setUser(userData)
            } catch (error) {
              console.error("Failed to parse saved user data:", error)
              setUser({ type: "guest", customCount: 0, pro: false })
            }
          }
        }
      } catch (error) {
        console.error("Error getting initial session:", error)
        setUser({ type: "guest", customCount: 0, pro: false })
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        console.log("Auth state change:", event, session?.user?.email)
        
        // ✅ 关键修复：只在组件仍挂载时处理状态更新
        if (!isMountedRef.current) return
        
        try {
          // ✅ 修复回路：只在值真正变化时才更新
          setSession(prev => {
            if (prev?.user?.id === session?.user?.id) return prev
            return session
          })
          
          setSupabaseUser(prev => {
            if (prev?.id === session?.user?.id) return prev
            return session?.user ?? null
          })
          
          if (event === 'SIGNED_IN' && session?.user) {
            const customUser: CustomUser = {
              type: "authenticated",
              name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
              email: session.user.email || '',
              customCount: 0,
              pro: false,
              id: session.user.id,
              provider: session.user.app_metadata?.provider
            }
            // ✅ 只在用户ID变化时才更新
            setUser(prev => {
              if (prev.id === customUser.id) return prev
              return customUser
            })
            localStorage.setItem("sitehub-user", JSON.stringify(customUser))
            // ✅ 登录成功，清除访客计时
            localStorage.removeItem("guest-start-time")
          } else if (event === 'SIGNED_OUT') {
            setUser(prev => {
              if (prev.type === "guest") return prev
              return { type: "guest", customCount: 0, pro: false }
            })
            localStorage.removeItem("sitehub-user")
          } else if (event === 'TOKEN_REFRESHED' && session?.user) {
            // Handle token refresh
            const customUser: CustomUser = {
              type: "authenticated",
              name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
              email: session.user.email || '',
              customCount: 0,
              pro: false,
              id: session.user.id,
              provider: session.user.app_metadata?.provider
            }
            // ✅ 只在用户ID变化时才更新
            setUser(prev => {
              if (prev.id === customUser.id) return prev
              return customUser
            })
            localStorage.setItem("sitehub-user", JSON.stringify(customUser))
          }
        } catch (error) {
          console.error("Error in auth state change:", error)
        } finally {
          // ✅ 关键修复：只在组件仍挂载时设置 loading
          if (isMountedRef.current) {
            setLoading(false)
          }
        }
      }
    )

    return () => {
      isMountedRef.current = false
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    try {
      sessionManager.clearSession()
      
      // ✅ 1. 清除所有持久化存储
      localStorage.removeItem('user_token')
      localStorage.removeItem('user_info')
      localStorage.removeItem('sitehub-user')
      
      // ✅ 2. 立即更新本地状态，不依赖监听器
      setUser({ type: "guest", customCount: 0, pro: false })
      setSupabaseUser(null)
      setSession(null)
      
      console.log('✅ [Logout]: All auth data cleared')
      
      // ✅ 3. 调用 Supabase 退出（如果是 Supabase 用户）
      await supabase.auth.signOut()
    } catch (error) {
      console.error("Error during sign out:", error)
      // 即使报错也强制重置状态
      setUser({ type: "guest", customCount: 0, pro: false })
    }
  }

  const signIn = (userData: CustomUser) => {
    setUser(userData)
    localStorage.setItem("sitehub-user", JSON.stringify(userData))
    // ✅ 登录成功，清除访客计时
    localStorage.removeItem("guest-start-time")
  }

  const value = {
    user,
    supabaseUser,
    session,
    loading,
    signOut,
    signIn
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 