import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { 
  getFavorites, 
  addToFavorites, 
  removeFromFavorites, 
  isFavorited,
  Favorite,
  CreateFavoriteData
} from '@/lib/favorites'

export function useFavorites() {
  const { user } = useAuth()
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      loadFavorites()
    } else {
      setFavorites([])
      setLoading(false)
    }
  }, [user])

  const loadFavorites = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      setError(null)
      const data = await getFavorites(user.id)
      setFavorites(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load favorites')
    } finally {
      setLoading(false)
    }
  }

  const addFavorite = async (site: CreateFavoriteData): Promise<Favorite> => {
    if (!user) throw new Error('User not authenticated')
    
    try {
      setError(null)
      const newFavorite = await addToFavorites(user.id, site)
      setFavorites(prev => [...prev, newFavorite])
      return newFavorite
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add to favorites'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const removeFavorite = async (siteId: string): Promise<void> => {
    if (!user) throw new Error('User not authenticated')
    
    try {
      setError(null)
      await removeFromFavorites(user.id, siteId)
      setFavorites(prev => prev.filter(f => f.site_id !== siteId))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove from favorites'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const checkFavorite = async (siteId: string): Promise<boolean> => {
    if (!user) return false
    
    try {
      return await isFavorited(user.id, siteId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check favorite status')
      return false
    }
  }

  const toggleFavorite = async (site: CreateFavoriteData): Promise<void> => {
    if (!user) throw new Error('User not authenticated')
    
    try {
      setError(null)
      const isFav = await isFavorited(user.id, site.site_id)
      
      if (isFav) {
        await removeFavorite(site.site_id)
      } else {
        await addFavorite(site)
      }
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
    favorites,
    loading,
    error,
    addFavorite,
    removeFavorite,
    checkFavorite,
    toggleFavorite,
    refresh: loadFavorites,
    clearError
  }
} 