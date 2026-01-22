"use client"

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Download, Package, Check, Minus, Plus, ShoppingCart, Share2, Star, MessageSquare, Send, Monitor, Apple, Smartphone } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/context/AuthContext'
import { useCart } from '@/context/CartContext'
import { Product, ProductReview } from '@/lib/types'
import { formatCurrency } from '@/lib/utils'
import { db } from '@/lib/firebase'
import { collection, query, where, getDocs, addDoc, orderBy, Timestamp } from 'firebase/firestore'
import { motion } from 'framer-motion'

export function ProductDetail({ product }: { product: Product }) {
  const { user } = useAuth()
  const { addToCart } = useCart()
  const [purchased, setPurchased] = useState(false)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [reviews, setReviews] = useState<ProductReview[]>([])
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [showUpdateRequestForm, setShowUpdateRequestForm] = useState(false)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [updateMessage, setUpdateMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [shippingDetails, setShippingDetails] = useState({
    full_name: '',
    phone: '',
    address: '',
    city: '',
    country: 'Kenya'
  })
  const [showShippingForm, setShowShippingForm] = useState(false)
  const [activeImage, setActiveImage] = useState(product.cover_images?.[0] || product.image_url || 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800')
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({})
  const [similarProducts, setSimilarProducts] = useState<Product[]>([])

  useEffect(() => {
    if (product) {
      setActiveImage(product.cover_images?.[0] || product.image_url || 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800')
    }
  }, [product])

  useEffect(() => {
    async function checkPurchase() {
      // Logic to check if user purchased this product
      // For now, simple assumption: not purchased unless we query orders
      if (user && (product.is_paid || Number(product.price) > 0) && product.product_type === 'digital') {
        // TODO: Implement actual order check here
        setPurchased(false)
      }
      setLoading(false)
    }
    checkPurchase()
  }, [user, product.id, product.is_paid, product.product_type])

  useEffect(() => {
    async function fetchReviews() {
      try {
        const q = query(
          collection(db, 'product_reviews'),
          where('product_id', '==', product.id),
          orderBy('created_at', 'desc')
        )
        const snapshot = await getDocs(q)
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          created_at: doc.data().created_at?.toDate?.().toISOString() || new Date().toISOString()
        })) as ProductReview[]
        setReviews(data)
      } catch (error) {
        console.error('Error fetching reviews:', error)
        setReviews([])
      }
    }
    fetchReviews()
  }, [product.id])

  useEffect(() => {
    async function fetchSimilar() {
      if (!product.category) return
      try {
        const q = query(
          collection(db, 'products'),
          where('category', '==', product.category),
          where('status', '==', 'published'),
          orderBy('created_at', 'desc')
          // limit(5) // Get 5, filter out current one
        )
        const snapshot = await getDocs(q)
        const data = snapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
            created_at: doc.data().created_at?.toDate?.().toISOString() || new Date().toISOString()
          } as Product))
          .filter(p => p.id !== product.id)
          .slice(0, 4)

        setSimilarProducts(data)
      } catch (error) {
        console.error('Error fetching similar products:', error)
      }
    }
    fetchSimilar()
  }, [product.category, product.id])

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0

  const canAccess = product.product_type === 'digital' && (product.is_free || Number(product.price) === 0 || purchased)
  const isOutOfStock = product.product_type === 'physical' && product.stock_quantity === 0

  const handleAddToCart = () => {
    // Validate variants
    if (product.variants && product.variants.length > 0) {
      const missing = product.variants.find(v => !selectedOptions[v.name])
      if (missing) {
        toast.error(`Please select a ${missing.name}`)
        return
      }
    }

    for (let i = 0; i < quantity; i++) {
      addToCart(product, 'product', selectedOptions)
    }
    toast.success(`Added ${quantity} item(s) to cart!`)
  }

  const handleAddToCartWithShipping = async () => {
    if (!shippingDetails.full_name || !shippingDetails.phone || !shippingDetails.address || !shippingDetails.city) {
      toast.error('Please fill in all shipping details')
      return
    }

    for (let i = 0; i < quantity; i++) {
      addToCart(product, 'product')
    }

    localStorage.setItem('shippingDetails', JSON.stringify(shippingDetails))
    toast.success(`Added ${quantity} item(s) to cart with shipping details!`)
    setShowShippingForm(false)
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    toast.success('Link copied to clipboard!')
  }

  const handleSubmitReview = async () => {
    if (!user) {
      toast.error('Please sign in to leave a review')
      return
    }

    setSubmitting(true)
    try {
      await addDoc(collection(db, 'product_reviews'), {
        product_id: product.id,
        user_id: user.id,
        user_email: user.email,
        user_name: user.name || 'Anonymous',
        rating: reviewRating,
        comment: reviewComment,
        created_at: Timestamp.now()
      })

      toast.success('Review submitted!')
      setShowReviewForm(false)
      setReviewComment('')

      const q = query(
        collection(db, 'product_reviews'),
        where('product_id', '==', product.id),
        orderBy('created_at', 'desc')
      )
      const snapshot = await getDocs(q)
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        created_at: doc.data().created_at?.toDate?.().toISOString() || new Date().toISOString()
      })) as ProductReview[]
      setReviews(data)
    } catch (error) {
      console.error('Error submitting review:', error)
      toast.error('Failed to submit review')
    }
    setSubmitting(false)
  }

  const handleSubmitUpdateRequest = async () => {
    if (!user) {
      toast.error('Please sign in to request an update')
      return
    }
    if (!updateMessage.trim()) {
      toast.error('Please enter a message')
      return
    }

    setSubmitting(true)
    try {
      await addDoc(collection(db, 'update_requests'), {
        product_id: product.id,
        user_id: user.id,
        user_email: user.email,
        message: updateMessage,
        status: 'pending',
        created_at: Timestamp.now()
      })

      toast.success('Update request submitted!')
      setShowUpdateRequestForm(false)
      setUpdateMessage('')
    } catch (error) {
      console.error('Error submitting update request:', error)
      toast.error('Failed to submit request')
    }
    setSubmitting(false)
  }

  const renderStars = (rating: number, interactive = false, onSelect?: (r: number) => void) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => interactive && onSelect && onSelect(star)}
            disabled={!interactive}
            className={interactive ? 'cursor-pointer' : 'cursor-default'}
          >
            <Star
              size={interactive ? 24 : 16}
              className={star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-white/20'}
            />
          </button>
        ))}
      </div>
    )
  }

  const getOsIcon = (os: string) => {
    switch (os) {
      case 'macOS': return <Apple size={16} />
      case 'Windows': return <Monitor size={16} />
      case 'Android': return <Smartphone size={16} />
      default: return null
    }
  }

  return (
    <div className="min-h-screen bg-black py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <Link href="/store" className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-8">
          <ArrowLeft size={20} />
          Back to Store
        </Link>

        {/* Product Info Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Left Column: Images */}
          <div className="space-y-4">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-white/5 border border-white/10">
              <Image
                src={activeImage}
                alt={product.title}
                fill
                className="object-cover"
              />
              <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white text-sm font-medium flex items-center gap-2">
                {product.product_type === 'digital' ? <Download size={14} /> : <Package size={14} />}
                {product.product_type === 'digital' ? 'Digital' : 'Physical'}
              </div>
            </div>
            {product.cover_images && product.cover_images.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {product.cover_images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(img)}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${activeImage === img ? 'border-cyan-500 opacity-100' : 'border-transparent opacity-60 hover:opacity-100'}`}
                  >
                    <Image src={img} alt={`View ${i + 1}`} fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Details & Actions */}
          <div>
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <span className="text-cyan-400 font-medium tracking-wide uppercase text-sm">{product.category || 'General'}</span>
            </div>

            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl text-white mb-4 leading-tight">{product.title}</h1>

            <div className="flex items-center gap-4 mb-6">
              <div className="text-3xl font-bold text-white">
                {product.is_free || Number(product.price) === 0 ? 'Free' : formatCurrency(product.price)}
              </div>
              {reviews.length > 0 && (
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                  {renderStars(Math.round(averageRating))}
                  <span className="text-white/50 text-xs">({reviews.length})</span>
                </div>
              )}
            </div>

            {product.description && (
              <div className="prose prose-invert max-w-none mb-8 text-white/70">
                <p>{product.description}</p>
              </div>
            )}

            {/* Product Configuration (Variants) */}
            {product.variants && product.variants.length > 0 && (
              <div className="mb-8 space-y-6 p-6 rounded-xl bg-white/5 border border-white/10">
                {product.variants.map((variant) => (
                  <div key={variant.name}>
                    <span className="block text-white font-medium mb-3">{variant.name}</span>
                    <div className="flex flex-wrap gap-2">
                      {variant.options.map((opt) => (
                        <button
                          key={opt}
                          onClick={() => setSelectedOptions({ ...selectedOptions, [variant.name]: opt })}
                          className={`px-4 py-2 rounded-lg border text-sm transition-all ${selectedOptions[variant.name] === opt
                            ? 'bg-white text-black border-white font-medium'
                            : 'bg-transparent text-white/70 border-white/20 hover:border-white/40'
                            }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="space-y-6 mb-12">
              {/* Quantity Selector for Physical Items */}
              {product.product_type === 'physical' && !isOutOfStock && Number(product.price) > 0 && (
                <div className="flex items-center gap-4">
                  <span className="text-white/70 font-medium">Quantity</span>
                  <div className="flex items-center gap-2 bg-white/5 rounded-lg border border-white/10 p-1">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-2 rounded-md hover:bg-white/10 text-white transition-colors"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="text-white font-semibold w-8 text-center">{quantity}</span>
                    <button
                      onClick={() => setQuantity(Math.min(product.stock_quantity || 99, quantity + 1))}
                      className="p-2 rounded-md hover:bg-white/10 text-white transition-colors"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <span className="text-white/40 text-sm">{product.stock_quantity} available</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4">
                {canAccess ? (
                  <a
                    href={product.download_file_path || '#'}
                    download
                    className="flex-1 flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-cyan-500 to-fuchsia-500 rounded-full text-white font-bold hover:opacity-90 transition-all"
                  >
                    <Download size={20} />
                    Download Now
                  </a>
                ) : (
                  <button
                    onClick={handleAddToCart}
                    disabled={isOutOfStock}
                    className={`flex-1 flex items-center justify-center gap-2 px-8 py-4 rounded-full font-bold transition-all ${isOutOfStock
                      ? 'bg-white/10 text-white/50 cursor-not-allowed'
                      : 'bg-white text-black hover:bg-gray-200'
                      }`}
                  >
                    <ShoppingCart size={20} />
                    {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                  </button>
                )}
                <button
                  onClick={handleShare}
                  className="px-6 py-4 rounded-full border border-white/20 text-white font-semibold hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                >
                  <Share2 size={20} />
                  Share
                </button>
              </div>
            </div>

            {/* Product Details Table */}
            <div className="mb-12">
              <h3 className="text-xl font-semibold text-white mb-4 border-b border-white/10 pb-2">Product Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 text-sm">
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-white/50">Category</span>
                  <span className="text-white font-medium text-right">{product.category || 'N/A'}</span>
                </div>
                {product.product_type === 'physical' && (
                  <>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-white/50">Stock</span>
                      <span className="text-white font-medium text-right">{product.stock_quantity || 0}</span>
                    </div>
                    {product.weight && (
                      <div className="flex justify-between border-b border-white/5 pb-2">
                        <span className="text-white/50">Weight</span>
                        <span className="text-white font-medium text-right">{product.weight} kg</span>
                      </div>
                    )}
                    {product.dimensions && (
                      <div className="flex justify-between border-b border-white/5 pb-2">
                        <span className="text-white/50">Dimensions</span>
                        <span className="text-white font-medium text-right">{product.dimensions}</span>
                      </div>
                    )}
                  </>
                )}
                {product.product_type === 'digital' && (
                  <>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-white/50">Version</span>
                      <span className="text-white font-medium text-right">{product.version || '1.0'}</span>
                    </div>
                    {product.supported_os && (
                      <div className="flex justify-between border-b border-white/5 pb-2">
                        <span className="text-white/50">Supported OS</span>
                        <span className="text-white font-medium text-right">{product.supported_os.join(', ')}</span>
                      </div>
                    )}
                  </>
                )}
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-white/50">Type</span>
                  <span className="text-white font-medium text-right capitalize">{product.product_type}</span>
                </div>
              </div>
            </div>

            {/* Reviews and Update Request Buttons */}
            <div className="flex gap-4">
              <button onClick={() => setShowReviewForm(!showReviewForm)} className="text-cyan-400 hover:text-cyan-300 text-sm font-medium">Write a Review</button>
              <span className="text-white/20">|</span>
              <button onClick={() => setShowUpdateRequestForm(!showUpdateRequestForm)} className="text-fuchsia-400 hover:text-fuchsia-300 text-sm font-medium">Request Update</button>
            </div>
          </div>
        </div>

        {/* Similar Products */}
        {similarProducts.length > 0 && (
          <div className="border-t border-white/10 pt-16">
            <h2 className="font-display text-2xl text-white mb-8">Similar Products</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {similarProducts.map((p) => (
                <Link key={p.id} href={`/store/product?id=${p.id}`} className="group block">
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-white/5 mb-4">
                    <Image
                      src={p.cover_images?.[0] || p.image_url || 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500'}
                      alt={p.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    {(p.is_free || !p.price) && (
                      <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-green-500/80 text-white text-[10px] font-bold uppercase tracking-wider">Free</div>
                    )}
                  </div>
                  <h3 className="text-white font-medium truncate group-hover:text-cyan-400 transition-colors">{p.title}</h3>
                  <p className="text-white/50 text-sm">{p.is_free || !p.price ? 'Free' : formatCurrency(p.price)}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Reviews Section Forms and List (Existing logic, just ensured visibility below) */}
        {(showReviewForm || showUpdateRequestForm) && (
          <div className="mt-12 max-w-2xl">
            {showReviewForm && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6 rounded-xl bg-white/5 border border-white/10 mb-8">
                <h3 className="text-white font-semibold mb-4">Write a Review</h3>
                <div className="mb-4">
                  <span className="text-white/50 text-sm mb-2 block">Rating</span>
                  {renderStars(reviewRating, true, setReviewRating)}
                </div>
                <textarea placeholder="Share your experience..." value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} rows={4} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-cyan-500/50 mb-4" />
                <div className="flex gap-3">
                  <button onClick={() => setShowReviewForm(false)} className="px-4 py-2 rounded-full bg-white/5 text-white text-sm">Cancel</button>
                  <button onClick={handleSubmitReview} disabled={submitting} className="px-6 py-2 rounded-full bg-cyan-500 text-white text-sm font-semibold">{submitting ? 'Submitting...' : 'Submit Review'}</button>
                </div>
              </motion.div>
            )}
            {showUpdateRequestForm && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6 rounded-xl bg-white/5 border border-white/10 mb-8">
                <h3 className="text-white font-semibold mb-4">Request an Update</h3>
                <textarea placeholder="Describe the feature..." value={updateMessage} onChange={(e) => setUpdateMessage(e.target.value)} rows={4} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-cyan-500/50 mb-4" />
                <div className="flex gap-3">
                  <button onClick={() => setShowUpdateRequestForm(false)} className="px-4 py-2 rounded-full bg-white/5 text-white text-sm">Cancel</button>
                  <button onClick={handleSubmitUpdateRequest} disabled={submitting} className="px-6 py-2 rounded-full bg-fuchsia-500 text-white text-sm font-semibold">{submitting ? 'Submitting...' : 'Submit Request'}</button>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {reviews.length > 0 && (
          <div className="mt-16 border-t border-white/10 pt-16">
            <h2 className="font-display text-2xl text-white mb-8">Customer Reviews</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {reviews.map((review) => (
                <div key={review.id} className="p-6 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-fuchsia-500 to-cyan-500 flex items-center justify-center text-white font-bold">
                        {review.user_name?.charAt(0).toUpperCase() || 'A'}
                      </div>
                      <div>
                        <p className="text-white font-medium">{review.user_name}</p>
                        <p className="text-white/40 text-xs">{new Date(review.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    {renderStars(review.rating)}
                  </div>
                  {review.comment && <p className="text-white/70 text-sm leading-relaxed">{review.comment}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
