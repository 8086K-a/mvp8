import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { 
  getCustomWebsites, 
  addCustomWebsite, 
  updateCustomWebsite, 
  deleteCustomWebsite,
  CustomWebsite,
  CreateWebsiteData
} from '@/lib/custom-websites'

export function useCustomWebsites() {
  const { user } = useAuth()
  const [websites, setWebsites] = useState<CustomWebsite[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      loadWebsites()
    } else {
      setWebsites([])
      setLoading(false)
    }
  }, [user])

  const loadWebsites = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      setError(null)
      const data = await getCustomWebsites(user.id)
      setWebsites(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load websites')
    } finally {
      setLoading(false)
    }
  }

  const addWebsite = async (website: CreateWebsiteData): Promise<CustomWebsite> => {
    if (!user) throw new Error('User not authenticated')
    
    try {
      setError(null)
      const newWebsite = await addCustomWebsite(user.id, website)
      setWebsites(prev => [...prev, newWebsite])
      return newWebsite
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add website'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const updateWebsite = async (id: string, updates: Partial<CustomWebsite>): Promise<CustomWebsite> => {
    if (!user) throw new Error('User not authenticated')
    
    try {
      setError(null)
      const updatedWebsite = await updateCustomWebsite(id, updates)
      setWebsites(prev => prev.map(w => w.id === id ? updatedWebsite : w))
      return updatedWebsite
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update website'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const removeWebsite = async (id: string): Promise<void> => {
    if (!user) throw new Error('User not authenticated')
    
    try {
      setError(null)
      await deleteCustomWebsite(id)
      setWebsites(prev => prev.filter(w => w.id !== id))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete website'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const toggleFavorite = async (id: string): Promise<void> => {
    if (!user) throw new Error('User not authenticated')
    
    try {
      setError(null)
      const website = websites.find(w => w.id === id)
      if (!website) throw new Error('Website not found')
      
      const updatedWebsite = await updateCustomWebsite(id, { 
        is_favorite: !website.is_favorite 
      })
      setWebsites(prev => prev.map(w => w.id === id ? updatedWebsite : w))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to toggle favorite'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const clearError = () => {
    setError(null)
  }

  return {
    websites,
    loading,
    error,
    addWebsite,
    updateWebsite,
    removeWebsite,
    toggleFavorite,
    refresh: loadWebsites,
    clearError
  }
} 