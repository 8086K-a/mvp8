import { useState } from 'react'

export function useWeChatAuth() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const signInWithWeChat = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Redirect to WeChat OAuth
      window.location.href = '/api/auth/wechat'
    } catch (err) {
      setError('Failed to initiate WeChat authentication')
      setLoading(false)
    }
  }
  
  return {
    signInWithWeChat,
    loading,
    error
  }
} 