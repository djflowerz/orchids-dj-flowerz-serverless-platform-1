"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Search, Download, Package, ShoppingCart, Star, Monitor, Apple, Smartphone, Filter } from 'lucide-react'
import { toast } from 'sonner'
import { useCart } from '@/context/CartContext'
import { Product } from '@/lib/types'
import { formatCurrency } from '@/lib/utils'
import { supabase } from '@/lib/supabase'

const categories = ['All', 'Apparel', 'Samples', 'Software', 'Accessories']
const types = ['all', 'digital', 'physical']
const osFilters = ['All', 'macOS', 'Windows', 'Android']
const priceFilters = ['All', 'Free', 'Paid']
const ratingFilters = ['All', '4+ Stars', '3+ Stars']
const sortOptions = ['Newest', 'Popular', 'Price: Low', 'Price: High', 'Rating']

interface ProductWithRating extends Product {
  average_rating: number
  review_count: number
  popularity_score?: number
}

export function ProductsList({ initialProducts }: { initialProducts: Product[] }) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [productType, setProductType] = useState<'all' | 'digital' | 'physical'>('all')
  const [osFilter, setOsFilter] = useState('All')
  const [priceFilter, setPriceFilter] = useState('All')
  const [ratingFilter, setRatingFilter] = useState('All')
  const [sortBy, setSortBy] = useState('Newest')
  const [products, setProducts] = useState<ProductWithRating[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const { addToCart } = useCart()

  useEffect(() => {
    async function fetchProductsWithRatings() {
      const productIds = initialProducts.map(p => p.id)
      
      const { data: allReviews } = await supabase
        .from('product_reviews')
        .select('product_id, rating')
        .in('product_id', productIds)
      
      const reviewsByProduct: Record<string, number[]> = {}
      ;(allReviews || []).forEach(r => {
        if (!reviewsByProduct[r.product_id]) {
          reviewsByProduct[r.product_id] = []
        }
        reviewsByProduct[r.product_id].push(r.rating)
      })
      
      const productsWithRatings = initialProducts.map(product => {
        const ratings = reviewsByProduct[product.id] || []
        const average = ratings.length > 0 
          ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length 
          : 0
        
        return {
          ...product,
          average_rating: average,
          review_count: ratings.length
        }
      })
      
      setProducts(productsWithRatings)
    }
    
    if (initialProducts.length > 0) {
      fetchProductsWithRatings()
    } else {
      setProducts([])
    }
  }, [initialProducts])

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = category === 'All' || p.category === category
    const matchesType = productType === 'all' || p.product_type === productType
    const matchesOs = osFilter === 'All' || (p.supported_os && p.supported_os.includes(osFilter))
    const matchesPrice = priceFilter === 'All' || 
      (priceFilter === 'Free' && (p.is_free || !p.is_paid)) ||
      (priceFilter === 'Paid' && p.is_paid && !p.is_free)
    const matchesRating = ratingFilter === 'All' ||
      (ratingFilter === '4+ Stars' && p.average_rating >= 4) ||
      (ratingFilter === '3+ Stars' && p.average_rating >= 3)
    return matchesSearch && matchesCategory && matchesType && matchesOs && matchesPrice && matchesRating
  }).sort((a, b) => {
    switch (sortBy) {
      case 'Popular':
        return (b.popularity_score || 0) - (a.popularity_score || 0)
      case 'Price: Low':
        return (a.price || 0) - (b.price || 0)
      case 'Price: High':
        return (b.price || 0) - (a.price || 0)
      case 'Rating':
        return b.average_rating - a.average_rating
      case 'Newest':
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }
  })

  const handleQuickAdd = (e: React.MouseEvent, product: Product) => {
    e.preventDefault()
    e.stopPropagation()
    addToCart(product, 'product')
    toast.success('Added to cart!')
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={12}
            className={star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-white/20'}
          />
        ))}
      </div>
    )
  }

  const getOsIcon = (os: string) => {
    switch (os) {
      case 'macOS': return <Apple size={12} />
      case 'Windows': return <Monitor size={12} />
      case 'Android': return <Smartphone size={12} />
      default: return null
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-cyan-500/50"
          />
        </div>
        
<button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all ${
              showFilters ? 'bg-cyan-500 text-white' : 'bg-white/5 text-white/70 hover:bg-white/10'
            }`}
          >
            <Filter size={18} />
            Filters
          </button>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-cyan-500/50"
          >
            {sortOptions.map((opt) => (
              <option key={opt} value={opt} className="bg-zinc-900">{opt}</option>
            ))}
          </select>
        </div>

      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="p-4 rounded-xl bg-white/5 border border-white/10 mb-6 space-y-4"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-white/50 text-sm w-16">Type:</span>
            {types.map((t) => (
              <button
                key={t}
                onClick={() => setProductType(t as typeof productType)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1 ${
                  productType === t
                    ? 'bg-cyan-500 text-white'
                    : 'bg-white/5 text-white/70 hover:bg-white/10'
                }`}
              >
                {t === 'digital' ? <Download size={12} /> : t === 'physical' ? <Package size={12} /> : null}
                {t === 'all' ? 'All' : t === 'digital' ? 'Digital' : 'Physical'}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-white/50 text-sm w-16">OS:</span>
            {osFilters.map((os) => (
              <button
                key={os}
                onClick={() => setOsFilter(os)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1 ${
                  osFilter === os
                    ? 'bg-fuchsia-500 text-white'
                    : 'bg-white/5 text-white/70 hover:bg-white/10'
                }`}
              >
                {os !== 'All' && getOsIcon(os)}
                {os}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-white/50 text-sm w-16">Price:</span>
            {priceFilters.map((p) => (
              <button
                key={p}
                onClick={() => setPriceFilter(p)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  priceFilter === p
                    ? 'bg-green-500 text-white'
                    : 'bg-white/5 text-white/70 hover:bg-white/10'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-white/50 text-sm w-16">Rating:</span>
            {ratingFilters.map((r) => (
              <button
                key={r}
                onClick={() => setRatingFilter(r)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1 ${
                  ratingFilter === r
                    ? 'bg-yellow-500 text-black'
                    : 'bg-white/5 text-white/70 hover:bg-white/10'
                }`}
              >
                {r !== 'All' && <Star size={12} />}
                {r}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      <div className="flex gap-2 overflow-x-auto pb-4 mb-8">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              category === c
                ? 'bg-white text-black'
                : 'bg-white/5 text-white/70 hover:bg-white/10'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {filteredProducts.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-white/50">No products found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product, i) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link href={`/store/${product.id}`} className="group block">
                <div className="relative aspect-square rounded-2xl overflow-hidden mb-4 bg-white/5">
                  <Image
                    src={product.image_url || 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500'}
                    alt={product.title}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div className="absolute top-3 left-3 flex flex-col gap-2">
                    <div className="px-3 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white text-xs font-medium flex items-center gap-1">
                      {product.product_type === 'digital' ? (
                        <>
                          <Download size={12} />
                          Digital
                        </>
                      ) : (
                        <>
                          <Package size={12} />
                          Physical
                        </>
                      )}
                    </div>
                    {product.supported_os && product.supported_os.length > 0 && (
                      <div className="flex gap-1">
                        {product.supported_os.map((os) => (
                          <span key={os} className="px-2 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white text-xs">
                            {getOsIcon(os)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {(product.is_free || !product.is_paid) && (
                    <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-green-500/80 text-white text-xs font-semibold">
                      Free
                    </div>
                  )}

                  {product.is_paid && !product.is_free && (
                    <button
                      onClick={(e) => handleQuickAdd(e, product)}
                      className="absolute bottom-3 right-3 p-3 rounded-full bg-cyan-500 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-cyan-600"
                    >
                      <ShoppingCart size={18} />
                    </button>
                  )}
                </div>

                <h3 className="text-white font-semibold text-lg mb-1 group-hover:text-cyan-400 transition-colors">
                  {product.title}
                </h3>
                
                <div className="flex items-center gap-2 mb-2">
                  {product.average_rating > 0 ? (
                    <>
                      {renderStars(Math.round(product.average_rating))}
                      <span className="text-white/40 text-xs">({product.review_count})</span>
                    </>
                  ) : (
                    <span className="text-white/30 text-xs">No reviews yet</span>
                  )}
                </div>

                <p className="text-white/50 text-sm mb-2 line-clamp-1">
                  {product.category}
                  {product.version_number && ` • v${product.version_number}`}
                </p>

                <div className="flex items-center justify-between">
                  <span className="text-cyan-400 font-semibold">
                    {product.is_free || !product.is_paid ? 'Free' : formatCurrency(product.price)}
                  </span>

                  {product.product_type === 'physical' && (
                    <span className={`text-xs ${product.stock_quantity > 0 ? 'text-white/40' : 'text-red-400'}`}>
                      {product.stock_quantity > 0 ? `${product.stock_quantity} in stock` : 'Out of stock'}
                    </span>
                  )}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
