'use client'

import { useState } from 'react'
import { Heart } from 'lucide-react'
import toast from 'react-hot-toast'

interface FavoriteButtonProps {
  entityType: 'mixtape' | 'music_pool' | 'product'
  entityId: string
  initialFavorited?: boolean
  size?: number
  className?: string
}

export function FavoriteButton({
  entityType,
  entityId,
  initialFavorited = false,
  size = 20,
  className = ''
}: FavoriteButtonProps) {
  const [isFavorited, setIsFavorited] = useState(initialFavorited)
  const [isLoading, setIsLoading] = useState(false)

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    setIsLoading(true)
    try {
      if (isFavorited) {
        const res = await fetch(`/api/favorites?entityType=${entityType}&entityId=${entityId}`, {
          method: 'DELETE'
        })
        if (res.ok) {
          setIsFavorited(false)
          toast.success('Removed from favorites')
        } else {
          const data = await res.json()
          if (res.status === 401) {
            toast.error('Please login to add favorites')
          } else {
            toast.error(data.error || 'Failed to remove')
          }
        }
      } else {
        const res = await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ entityType, entityId })
        })
        if (res.ok) {
          setIsFavorited(true)
          toast.success('Added to favorites')
        } else {
          const data = await res.json()
          if (res.status === 401) {
            toast.error('Please login to add favorites')
          } else if (res.status === 409) {
            setIsFavorited(true)
          } else {
            toast.error(data.error || 'Failed to add')
          }
        }
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={toggleFavorite}
      disabled={isLoading}
      className={`p-2 rounded-full transition-all ${
        isFavorited 
          ? 'bg-pink-500/20 text-pink-500' 
          : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-pink-400'
      } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
    >
      <Heart size={size} className={isFavorited ? 'fill-current' : ''} />
    </button>
  )
}
