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
  const { user, hasPurchased } = useAuth()
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

  useEffect(() => {
    if (product) {
      setActiveImage(product.cover_images?.[0] || product.image_url || 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800')
    }
  }, [product])

  useEffect(() => {
    async function checkPurchase() {
      if (user && (product.is_paid || Number(product.price) > 0) && product.product_type === 'digital') {
        const result = await hasPurchased(product.id)
        setPurchased(result)
      }
      setLoading(false)
    }
    checkPurchase()
  }, [user, product.id, product.is_paid, product.product_type, hasPurchased])

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
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <Link href="/store" className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-8">
          <ArrowLeft size={20} />
          Back to Store
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
          <div className="space-y-4">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-white/5">
              <Image
                src={activeImage}
                alt={product.title}
                fill
                className="object-cover"
              />
              <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white text-sm font-medium flex items-center gap-2">
                {product.product_type === 'digital' ? (
                  <>
                    <Download size={14} />
                    Digital Product
                  </>
                ) : (
                  <>
                    <Package size={14} />
                    Physical Product
                  </>
                )}
              </div>
            </div>
            {product.cover_images && product.cover_images.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {product.cover_images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(img)}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${activeImage === img ? 'border-cyan-500 opacity-100' : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                  >
                    <Image src={img} alt={`View ${i + 1}`} fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-white/5 text-white/70 text-sm">{product.category}</span>
              {(product.is_free || Number(product.price) === 0) && (
                <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm font-medium">
                  Free
                </span>
              )}
              {(!product.is_free && Number(product.price) > 0) && (
                <span className="px-3 py-1 rounded-full bg-violet-500/20 text-violet-400 text-sm font-medium">
                  Paid
                </span>
              )}
              {product.product_type === 'digital' && purchased && (
                <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm font-medium flex items-center gap-1">
                  <Check size={14} />
                  Purchased
                </span>
              )}
              {product.version_number && (
                <span className="px-3 py-1 rounded-full bg-fuchsia-500/20 text-fuchsia-400 text-sm">
                  v{product.version_number}
                </span>
              )}
            </div>

            <h1 className="font-display text-4xl sm:text-5xl text-white mb-4">{product.title}</h1>

            {reviews.length > 0 && (
              <div className="flex items-center gap-3 mb-4">
                {renderStars(Math.round(averageRating))}
                <span className="text-white/50">({reviews.length} reviews)</span>
              </div>
            )}

            {product.description && (
              <p className="text-white/60 text-lg mb-6">{product.description}</p>
            )}

            {product.supported_os && product.supported_os.length > 0 && (
              <div className="flex items-center gap-3 mb-6">
                <span className="text-white/50 text-sm">Available for:</span>
                {product.supported_os.map((os) => (
                  <span key={os} className="flex items-center gap-1 px-3 py-1 rounded-full bg-white/5 text-white/70 text-sm">
                    {getOsIcon(os)}
                    {os}
                  </span>
                ))}
              </div>
            )}

            <div className="text-3xl font-bold text-cyan-400 mb-6">
              {product.is_free || Number(product.price) === 0 ? 'Free' : formatCurrency(product.price)}
            </div>

            {product.variants && product.variants.length > 0 && (
              <div className="mb-8 space-y-4">
                {product.variants.map((variant) => (
                  <div key={variant.name}>
                    <span className="block text-white/70 text-sm mb-2">{variant.name}:</span>
                    <div className="flex flex-wrap gap-2">
                      {variant.options.map((opt) => (
                        <button
                          key={opt}
                          onClick={() => setSelectedOptions({ ...selectedOptions, [variant.name]: opt })}
                          className={`px-4 py-2 rounded-lg border text-sm transition-all ${selectedOptions[variant.name] === opt
                            ? 'bg-white text-black border-white'
                            : 'bg-white/5 text-white/70 border-white/10 hover:border-white/30'
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

            {product.product_type === 'physical' && (
              <div className={`mb-6 ${isOutOfStock ? 'text-red-400' : 'text-white/50'}`}>
                {isOutOfStock ? 'Out of stock' : `${product.stock_quantity} items in stock`}
              </div>
            )}

            {product.product_type === 'physical' && !isOutOfStock && Number(product.price) > 0 && (
              <div className="flex items-center gap-4 mb-6">
                <span className="text-white/70">Quantity:</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 rounded-lg bg-white/5 text-white hover:bg-white/10 transition-colors"
                  >
                    <Minus size={18} />
                  </button>
                  <span className="text-white font-semibold w-12 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                    className="p-2 rounded-lg bg-white/5 text-white hover:bg-white/10 transition-colors"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-3 mb-8">
              {canAccess ? (
                <a
                  href={product.download_file_path || '#'}
                  download
                  className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-cyan-500 to-fuchsia-500 rounded-full text-white font-semibold hover:opacity-90 transition-all"
                >
                  <Download size={20} />
                  {(product.is_free || Number(product.price) === 0) ? 'Download Free' : 'Download Now'}
                </a>
              ) : (
                <button
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  className={`flex items-center gap-2 px-8 py-4 rounded-full font-semibold transition-all ${isOutOfStock
                    ? 'bg-white/10 text-white/50 cursor-not-allowed'
                    : 'bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white hover:opacity-90'
                    }`}
                >
                  <ShoppingCart size={20} />
                  {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                </button>
              )}
              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-4 bg-white/5 border border-white/10 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-all"
              >
                <Share2 size={20} />
              </button>
            </div>

            {showShippingForm && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 rounded-xl bg-white/5 border border-white/10 mb-6"
              >
                <h3 className="text-white font-semibold mb-4">Shipping Details</h3>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={shippingDetails.full_name}
                    onChange={(e) => setShippingDetails({ ...shippingDetails, full_name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-cyan-500/50"
                  />
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    value={shippingDetails.phone}
                    onChange={(e) => setShippingDetails({ ...shippingDetails, phone: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-cyan-500/50"
                  />
                  <input
                    type="text"
                    placeholder="Address"
                    value={shippingDetails.address}
                    onChange={(e) => setShippingDetails({ ...shippingDetails, address: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-cyan-500/50"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="City"
                      value={shippingDetails.city}
                      onChange={(e) => setShippingDetails({ ...shippingDetails, city: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-cyan-500/50"
                    />
                    <input
                      type="text"
                      placeholder="Country"
                      value={shippingDetails.country}
                      onChange={(e) => setShippingDetails({ ...shippingDetails, country: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-cyan-500/50"
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setShowShippingForm(false)}
                      className="flex-1 py-3 rounded-full bg-white/5 text-white font-semibold hover:bg-white/10 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddToCartWithShipping}
                      className="flex-1 py-3 rounded-full bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white font-semibold hover:opacity-90 transition-all"
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowReviewForm(!showReviewForm)}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 text-white/70 hover:bg-white/10 transition-all"
              >
                <Star size={16} />
                Write Review
              </button>
              <button
                onClick={() => setShowUpdateRequestForm(!showUpdateRequestForm)}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 text-white/70 hover:bg-white/10 transition-all"
              >
                <MessageSquare size={16} />
                Request Update
              </button>
            </div>
          </div>
        </div>

        {showReviewForm && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-xl bg-white/5 border border-white/10 mb-8"
          >
            <h3 className="text-white font-semibold mb-4">Write a Review</h3>
            <div className="mb-4">
              <span className="text-white/50 text-sm mb-2 block">Rating</span>
              {renderStars(reviewRating, true, setReviewRating)}
            </div>
            <textarea
              placeholder="Share your experience with this product..."
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-cyan-500/50 mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowReviewForm(false)}
                className="px-6 py-2 rounded-full bg-white/5 text-white font-semibold hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReview}
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-2 rounded-full bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white font-semibold hover:opacity-90 transition-all disabled:opacity-50"
              >
                <Send size={16} />
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </motion.div>
        )}

        {showUpdateRequestForm && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-xl bg-white/5 border border-white/10 mb-8"
          >
            <h3 className="text-white font-semibold mb-4">Request an Update</h3>
            <textarea
              placeholder="Describe what update or feature you'd like to see..."
              value={updateMessage}
              onChange={(e) => setUpdateMessage(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-cyan-500/50 mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowUpdateRequestForm(false)}
                className="px-6 py-2 rounded-full bg-white/5 text-white font-semibold hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitUpdateRequest}
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-2 rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white font-semibold hover:opacity-90 transition-all disabled:opacity-50"
              >
                <Send size={16} />
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </motion.div>
        )}

        {reviews.length > 0 && (
          <div className="mt-12">
            <h2 className="font-display text-2xl text-white mb-6">Customer Reviews ({reviews.length})</h2>
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="p-6 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center justify-between mb-3">
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
                  {review.comment && <p className="text-white/70">{review.comment}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
