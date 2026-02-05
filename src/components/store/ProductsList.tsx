"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Download, Package, ShoppingCart, Star, Monitor, Apple, Smartphone, Filter, Check, TrendingUp, ChevronDown, ChevronRight, X, Calendar, MessageSquare } from 'lucide-react'
import { toast } from 'sonner'
import { useCart } from '@/context/CartContext'
import { Product } from '@/lib/types'
import { formatCurrency } from '@/lib/utils'
const categories = ['All', 'Laptops', 'Desktops', 'Components', 'Accessories', 'Software', 'Samples', 'Apparel']
const types = ['all', 'digital', 'physical']
const osFilters = ['All', 'macOS', 'Windows', 'Android']
const priceFilters = ['All', 'Free', 'Paid', 'Under 5000', '5000-10000', '10000-50000', '50000+']
const ratingFilters = ['All', '5 Stars', '4+ Stars', '3+ Stars', '2+ Stars']
const sortOptions = ['Newest', 'Hot', 'Price: Low', 'Price: High', 'Rating', 'Most Popular']
const stockFilters = ['All', 'In Stock', 'Low Stock', 'Out of Stock']

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
  const [stockFilter, setStockFilter] = useState('All')
  const [sortBy, setSortBy] = useState('Newest')
  const [products, setProducts] = useState<ProductWithRating[]>([])

  // Mobile filter visibility
  const [showMobileFilters, setShowMobileFilters] = useState(false)

  const { addToCart } = useCart()

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/products')
        if (res.ok) {
          const data = await res.json()
          setProducts(data)
        }
      } catch (error) {
        console.error('Error fetching products:', error)
      }
    }

    fetchProducts()
    const interval = setInterval(fetchProducts, 30000)
    return () => clearInterval(interval)
  }, [])

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) || 
                         (p.description && p.description.toLowerCase().includes(search.toLowerCase()))
    const matchesCategory = category === 'All' || p.category === category
    const pType = p.product_type || (p as any).type || 'digital'
    const matchesType = productType === 'all' || pType === productType
    const matchesOs = osFilter === 'All' || (p.supported_os && p.supported_os.includes(osFilter))
    
    // Enhanced price filtering with ranges
    let matchesPrice = false
    if (priceFilter === 'All') {
      matchesPrice = true
    } else if (priceFilter === 'Free') {
      matchesPrice = p.is_free || Number(p.price) === 0
    } else if (priceFilter === 'Paid') {
      matchesPrice = p.is_paid && Number(p.price) > 0
    } else if (priceFilter === 'Under 5000') {
      matchesPrice = Number(p.price) > 0 && Number(p.price) < 5000
    } else if (priceFilter === '5000-10000') {
      matchesPrice = Number(p.price) >= 5000 && Number(p.price) <= 10000
    } else if (priceFilter === '10000-50000') {
      matchesPrice = Number(p.price) > 10000 && Number(p.price) <= 50000
    } else if (priceFilter === '50000+') {
      matchesPrice = Number(p.price) > 50000
    }
    
    // Enhanced rating filtering
    let matchesRating = false
    if (ratingFilter === 'All') {
      matchesRating = true
    } else if (ratingFilter === '5 Stars') {
      matchesRating = p.average_rating === 5
    } else if (ratingFilter === '4+ Stars') {
      matchesRating = p.average_rating >= 4
    } else if (ratingFilter === '3+ Stars') {
      matchesRating = p.average_rating >= 3
    } else if (ratingFilter === '2+ Stars') {
      matchesRating = p.average_rating >= 2
    }
    
    // Stock availability filter
    let matchesStock = true
    const stock = p.stock_quantity !== undefined ? p.stock_quantity : (p as any).stock
    if (pType === 'physical') {
      if (stockFilter === 'In Stock') {
        matchesStock = (stock || 0) > 5
      } else if (stockFilter === 'Low Stock') {
        matchesStock = (stock || 0) > 0 && (stock || 0) <= 5
      } else if (stockFilter === 'Out of Stock') {
        matchesStock = (stock || 0) === 0
      }
    } else {
      // Digital products are always in stock
      matchesStock = stockFilter !== 'Out of Stock'
    }
    
    return matchesSearch && matchesCategory && matchesType && matchesOs && matchesPrice && matchesRating && matchesStock
  }).sort((a, b) => {
    switch (sortBy) {
      case 'Hot':
      case 'Trending':
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

  const renderStars = (rating: number) => (
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

  const getOsIcon = (os: string) => {
    switch (os) {
      case 'macOS': return <Apple size={12} />
      case 'Windows': return <Monitor size={12} />
      case 'Android': return <Smartphone size={12} />
      default: return null
    }
  }

  const SidebarContent = () => (
    <div className="space-y-8">
      {/* Categories */}
      <div>
        <h3 className="font-bold text-white mb-4 flex items-center gap-2">
          <Package size={18} className="text-violet-500" />
          Categories
        </h3>
        <div className="space-y-2">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between group ${category === c ? 'bg-violet-500/20 text-violet-400' : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
            >
              {c}
              {category === c && <Check size={14} />}
            </button>
          ))}
        </div>
      </div>

      {/* Product Type */}
      <div>
        <h3 className="font-bold text-white mb-4">Type</h3>
        <div className="flex flex-wrap gap-2">
          {types.map((t) => (
            <button
              key={t}
              onClick={() => setProductType(t as any)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide transition-all ${productType === t ? 'bg-white text-black' : 'bg-white/5 text-white/50 hover:bg-white/10'
                }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Price */}
      <div>
        <h3 className="font-bold text-white mb-4">Price</h3>
        <div className="space-y-2">
          {priceFilters.map((p) => (
            <label key={p} className="flex items-center gap-3 cursor-pointer group">
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${priceFilter === p ? 'border-cyan-500' : 'border-white/20 group-hover:border-white/40'
                }`}>
                {priceFilter === p && <div className="w-2 h-2 rounded-full bg-cyan-500" />}
              </div>
              <span className={`text-sm ${priceFilter === p ? 'text-white' : 'text-white/60 group-hover:text-white/80'}`}>{p}</span>
              <input
                type="radio"
                name="price"
                className="hidden"
                checked={priceFilter === p}
                onChange={() => setPriceFilter(p)}
              />
            </label>
          ))}
        </div>
      </div>

      {/* OS Compatibility */}
      <div>
        <h3 className="font-bold text-white mb-4">OS</h3>
        <div className="space-y-2">
          {osFilters.map((os) => (
            <label key={os} className="flex items-center gap-3 cursor-pointer group">
              <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${osFilter === os ? 'border-fuchsia-500 bg-fuchsia-500/20' : 'border-white/20 group-hover:border-white/40'
                }`}>
                {osFilter === os && <Check size={10} className="text-fuchsia-500" />}
              </div>
              <span className={`text-sm ${osFilter === os ? 'text-white' : 'text-white/60 group-hover:text-white/80'}`}>{os}</span>
              <input
                type="radio"
                name="os"
                className="hidden"
                checked={osFilter === os}
                onChange={() => setOsFilter(os)}
              />
            </label>
          ))}
        </div>
      </div>

      {/* Rating */}
      <div>
        <h3 className="font-bold text-white mb-4">Rating</h3>
        <div className="space-y-2">
          {ratingFilters.map((r) => (
            <label key={r} className="flex items-center gap-3 cursor-pointer group">
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${ratingFilter === r ? 'border-yellow-400' : 'border-white/20 group-hover:border-white/40'
                }`}>
                {ratingFilter === r && <div className="w-2 h-2 rounded-full bg-yellow-400" />}
              </div>
              <span className={`text-sm ${ratingFilter === r ? 'text-white' : 'text-white/60 group-hover:text-white/80'}`}>{r}</span>
              <input
                type="radio"
                name="rating"
                className="hidden"
                checked={ratingFilter === r}
                onChange={() => setRatingFilter(r)}
              />
            </label>
          ))}
        </div>
      </div>

      {/* Stock Availability */}
      <div>
        <h3 className="font-bold text-white mb-4">Availability</h3>
        <div className="space-y-2">
          {stockFilters.map((s) => (
            <label key={s} className="flex items-center gap-3 cursor-pointer group">
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${stockFilter === s ? 'border-green-400' : 'border-white/20 group-hover:border-white/40'
                }`}>
                {stockFilter === s && <div className="w-2 h-2 rounded-full bg-green-400" />}
              </div>
              <span className={`text-sm ${stockFilter === s ? 'text-white' : 'text-white/60 group-hover:text-white/80'}`}>{s}</span>
              <input
                type="radio"
                name="stock"
                className="hidden"
                checked={stockFilter === s}
                onChange={() => setStockFilter(s)}
              />
            </label>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start">

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 bg-white/5 rounded-3xl p-6 border border-white/5 sticky top-24 h-fit">
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 w-full">
        {/* Top Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
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
            onClick={() => setShowMobileFilters(true)}
            className="lg:hidden px-4 py-2 rounded-xl flex items-center gap-2 bg-white/5 text-white/70 hover:bg-white/10"
          >
            <Filter size={18} />
            Filters
          </button>

          {/* Quick Sort Tabs - Hot Trending New etc */}
          <div className="flex items-center bg-white/5 rounded-xl p-1 overflow-x-auto no-scrollbar">
            {sortOptions.map(opt => (
              <button
                key={opt}
                onClick={() => setSortBy(opt)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2 ${sortBy === opt
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
                  }`}
              >
                {opt === 'Hot' ? <TrendingUp size={14} className={sortBy === 'Hot' ? 'text-orange-500' : ''} /> : null}
                {opt === 'Newest' ? <Calendar size={14} /> : null}
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile Filter Drawer */}
        <AnimatePresence>
          {showMobileFilters && (
            <motion.div
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-0 z-50 lg:hidden bg-[#0d0d12]"
            >
              <div className="p-6 h-full overflow-y-auto">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-display font-bold text-white">Filters</h2>
                  <button
                    onClick={() => setShowMobileFilters(false)}
                    className="p-2 rounded-full bg-white/10 text-white"
                  >
                    <X size={20} />
                  </button>
                </div>
                <SidebarContent />
                <div className="mt-8 pt-8 border-t border-white/10">
                  <button
                    onClick={() => setShowMobileFilters(false)}
                    className="w-full py-4 rounded-xl bg-violet-600 text-white font-bold text-lg"
                  >
                    Show Results
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>


        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-24 bg-white/5 rounded-3xl border border-white/5 border-dashed">
            <Package size={48} className="mx-auto text-white/20 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No products found</h3>
            <p className="text-white/50">Try adjusting your search or filters.</p>
            <button
              onClick={() => {
                setSearch('')
                setCategory('All')
                setProductType('all')
                setPriceFilter('All')
              }}
              className="mt-6 px-6 py-2 rounded-full bg-white text-black font-medium hover:opacity-90 transition-opacity"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredProducts.map((product, i) => {
              const pType = product.product_type || (product as any).type || 'digital'
              const stock = product.stock_quantity !== undefined ? product.stock_quantity : (product as any).stock
              const image = product.cover_images?.[0] || product.image_url || 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500'
              const version = product.version || (product as any).version_number

              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link href={`/store/product?id=${product.id}`} className="group block h-full flex flex-col">
                    <div className="relative aspect-square rounded-2xl overflow-hidden mb-4 bg-white/5">
                      <Image
                        src={image}
                        alt={product.title}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                      <div className="absolute top-3 left-3 flex flex-col gap-2">
                        <div className="px-3 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white text-xs font-medium flex items-center gap-1">
                          {pType === 'digital' ? (
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

                      {(product.is_free || (product.price || 0) === 0) ? (
                        <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-green-500/80 text-white text-xs font-semibold shadow-lg shadow-green-500/20">
                          Free
                        </div>
                      ) : (
                        <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-semibold">
                          Paid
                        </div>
                      )}
                    </div>

                    <div className="flex-1 flex flex-col">
                      <h3 className="text-white font-semibold text-lg mb-1 group-hover:text-cyan-400 transition-colors line-clamp-1">
                        {product.title}
                      </h3>

                      <div className="flex items-center gap-2 mb-2">
                        {product.average_rating > 0 ? (
                          <>
                            {renderStars(Math.round(product.average_rating))}
                            <span className="text-white/40 text-xs">({product.review_count})</span>
                          </>
                        ) : (
                          <span className="text-white/30 text-xs">No reviews</span>
                        )}
                      </div>

                      <p className="text-white/50 text-sm mb-2 line-clamp-1">
                        {product.category || 'Uncategorized'}
                        {version && ` • v${version}`}
                      </p>

                      <div className="mt-auto flex items-center justify-between pt-2">
                        <span className="text-cyan-400 font-bold text-lg">
                          {(product.is_free || (product.price || 0) === 0) ? 'Free' : formatCurrency(product.price)}
                        </span>

                        {(product.is_paid || (product.price || 0) > 0) && !product.is_free && (
                          <div className="flex gap-2">
                            <a
                              href={`https://wa.me/254789783258?text=${encodeURIComponent(`Hi, I want to buy ${product.title}`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="flex-1 px-3 py-2 rounded-lg bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white font-semibold hover:scale-105 transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-green-500/20"
                              title="Buy on WhatsApp"
                            >
                              <MessageSquare size={16} />
                              <span className="text-xs">WhatsApp</span>
                            </a>
                            <button
                              onClick={(e) => handleQuickAdd(e, product)}
                              className="w-9 h-9 rounded-lg bg-white/10 hover:bg-cyan-500/20 text-white/70 hover:text-cyan-400 border border-white/10 hover:border-cyan-500/30 transition-all flex items-center justify-center"
                              title="Add to Cart"
                            >
                              <ShoppingCart size={16} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
