'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { Heart, ShoppingCart, ArrowLeft, Trash2, Package, Download } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from 'sonner'
import { Product } from '@/lib/types'
import { formatCurrency } from '@/lib/utils'
import { useCart } from '@/context/CartContext'

interface FavoriteItem {
  id: string
  user_id: string
  user_email: string
  entity_type: string
  entity_id: string
  created_at: string
}

export default function WishlistPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { addToCart } = useCart()
  const [favorites, setFavorites] = useState<FavoriteItem[]>([])
  const [products, setProducts] = useState<Record<string, Product>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      router.replace('/login')
      return
    }

    fetchFavorites()
  }, [user, authLoading])

  const fetchFavorites = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/favorites')
      if (res.ok) {
        const data = await res.json()
        setFavorites(data.favorites)

        // Fetch product details for all favorites
        const productsRes = await fetch('/api/products')
        if (productsRes.ok) {
          const allProducts = await productsRes.json()
          const productMap: Record<string, Product> = {}
          allProducts.forEach((p: Product) => {
            productMap[p.id] = p
          })
          setProducts(productMap)
        }
      }
    } catch (error) {
      console.error('Error fetching favorites:', error)
      toast.error('Failed to load wishlist')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveFavorite = async (favoriteId: string, entityId: string) => {
    try {
      const res = await fetch(`/api/favorites?entityType=product&entityId=${entityId}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        setFavorites(favorites.filter(f => f.id !== favoriteId))
        toast.success('Removed from wishlist')
      } else {
        toast.error('Failed to remove from wishlist')
      }
    } catch (error) {
      console.error('Error removing favorite:', error)
      toast.error('Failed to remove from wishlist')
    }
  }

  const handleAddToCart = (product: Product) => {
    addToCart(product, 'product')
    toast.success('Added to cart!')
  }

  const favoriteProducts = favorites
    .filter(f => f.entity_type === 'product')
    .map(f => products[f.entity_id])
    .filter(Boolean)

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <Link href="/store" className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-6">
            <ArrowLeft size={20} />
            Back to Store
          </Link>

          <div className="flex items-center gap-4 mb-2">
            <Heart size={32} className="text-pink-500 fill-pink-500" />
            <h1 className="font-display text-5xl sm:text-6xl text-white">My Wishlist</h1>
          </div>
          <p className="text-white/50 text-lg">
            {favoriteProducts.length} {favoriteProducts.length === 1 ? 'item' : 'items'} saved
          </p>
        </div>

        {/* Empty State */}
        {!loading && favoriteProducts.length === 0 && (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
            <Heart size={64} className="text-white/20 mb-6" />
            <h2 className="text-2xl font-bold text-white mb-2">Your wishlist is empty</h2>
            <p className="text-white/50 mb-8 max-w-md">
              Start adding products to your wishlist to save them for later
            </p>
            <Link
              href="/store"
              className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-fuchsia-500 rounded-xl text-white font-semibold hover:opacity-90 transition-all"
            >
              Browse Products
            </Link>
          </div>
        )}

        {/* Products Grid */}
        {!loading && favoriteProducts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favoriteProducts.map((product) => {
              const favorite = favorites.find(f => f.entity_id === product.id)
              return (
                <div
                  key={product.id}
                  className="group relative bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-cyan-500/30 transition-all duration-300"
                >
                  {/* Image Container */}
                  <Link href={`/store/product?id=${product.id}`}>
                    <div className="relative aspect-square overflow-hidden bg-white/5">
                      <Image
                        src={product.cover_images?.[0] || product.image_url || 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400'}
                        alt={product.title}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      {/* Badge */}
                      <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white text-xs font-medium flex items-center gap-2">
                        {product.product_type === 'digital' ? <Download size={12} /> : <Package size={12} />}
                        {product.product_type === 'digital' ? 'Digital' : 'Physical'}
                      </div>
                    </div>
                  </Link>

                  {/* Content */}
                  <div className="p-6">
                    <Link href={`/store/product?id=${product.id}`}>
                      <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 hover:text-cyan-400 transition-colors">
                        {product.title}
                      </h3>
                    </Link>

                    <p className="text-white/50 text-sm mb-4 line-clamp-2">
                      {product.description || 'No description available'}
                    </p>

                    {/* Category & Price */}
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-cyan-400/70 text-xs font-medium uppercase">
                        {product.category || 'General'}
                      </span>
                      <span className="text-xl font-bold text-white">
                        {product.is_free || Number(product.price) === 0 ? 'Free' : formatCurrency(product.price)}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAddToCart(product)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg font-semibold transition-colors"
                      >
                        <ShoppingCart size={18} />
                        Add to Cart
                      </button>
                      <button
                        onClick={() => favorite && handleRemoveFavorite(favorite.id, product.id)}
                        className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                        title="Remove from wishlist"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mb-4"></div>
              <p className="text-white/50">Loading your wishlist...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
