"use client"

import { useCart } from '@/context/CartContext'
import { useAuth } from '@/context/AuthContext'
import { formatCurrency } from '@/lib/utils'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Tag, X, Check, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

declare global {
  interface Window {
    PaystackPop: {
      setup: (config: {
        key: string
        email: string
        amount: number
        currency: string
        ref: string
        metadata?: Record<string, unknown>
        callback: (response: { reference: string }) => void
        onClose: () => void
      }) => { openIframe: () => void }
    }
  }
}

interface AppliedPromo {
  code: string
  type: 'percentage' | 'fixed'
  discount: number
}

export default function CartPage() {
  const { items, removeFromCart, updateQuantity, clearCart, total } = useCart()
  const { user } = useAuth()
  const router = useRouter()
  const [processing, setProcessing] = useState(false)
  const [promoCode, setPromoCode] = useState('')
  const [promoLoading, setPromoLoading] = useState(false)
  const [appliedPromo, setAppliedPromo] = useState<AppliedPromo | null>(null)

  const discountAmount = appliedPromo
    ? appliedPromo.type === 'percentage'
      ? Math.round(total * (appliedPromo.discount / 100))
      : appliedPromo.discount * 100
    : 0

  const finalTotal = Math.max(0, total - discountAmount)

  const applyPromoCode = async () => {
    if (!promoCode.trim()) {
      toast.error('Please enter a promo code')
      return
    }

    setPromoLoading(true)
    try {
      const response = await fetch('/api/promo-codes/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoCode, amount: total })
      })

      const data = await response.json()

      if (data.valid) {
        setAppliedPromo({
          code: promoCode,
          type: data.type,
          discount: data.discount
        })
        toast.success(`Promo code applied! ${data.type === 'percentage' ? `${data.discount}% off` : `KSh ${data.discount} off`}`)
      } else {
        toast.error(data.error || 'Invalid promo code')
      }
    } catch {
      toast.error('Failed to validate promo code')
    } finally {
      setPromoLoading(false)
    }
  }

  const removePromoCode = () => {
    setAppliedPromo(null)
    setPromoCode('')
    toast.success('Promo code removed')
  }

  const handleCheckout = () => {
    if (items.length === 0) {
      toast.error('Your cart is empty')
      return
    }

    // Navigate to shared checkout page (handles shipping + payment)
    router.push('/checkout')
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="text-center">
          <ShoppingBag size={64} className="text-white/20 mx-auto mb-6" />
          <h1 className="font-display text-4xl text-white mb-4">YOUR CART IS EMPTY</h1>
          <p className="text-white/50 mb-8">Add some items to get started</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/mixtapes"
              className="px-6 py-3 rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white font-semibold hover:opacity-90 transition-all"
            >
              Browse Mixtapes
            </Link>
            <Link
              href="/store"
              className="px-6 py-3 rounded-full bg-white/10 text-white font-semibold hover:bg-white/20 transition-all"
            >
              Visit Store
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <h1 className="font-display text-4xl sm:text-5xl text-white mb-8">YOUR CART</h1>

        <div className="space-y-4 mb-8">
          {items.map((item) => {
            const isProduct = item.type === 'product'
            const title = 'title' in item.item ? item.item.title : ''
            const image =
              ('image_url' in item.item && item.item.image_url) ? item.item.image_url :
                ('cover_image' in item.item && item.item.cover_image) ? item.item.cover_image :
                  ('cover_images' in item.item && item.item.cover_images?.[0]) ? item.item.cover_images[0] : null
            const price = 'price' in item.item ? item.item.price : 0
            const productType = isProduct && 'product_type' in item.item ? item.item.product_type : null

            const uniqueKey = (item as any).uniqueKey || item.id
            const options = (item as any).selectedOptions

            return (
              <div
                key={uniqueKey}
                className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10"
              >
                <div className="relative w-20 h-20 rounded-lg overflow-hidden shrink-0">
                  <Image
                    src={image || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200'}
                    alt={title}
                    fill
                    className="object-cover"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold truncate">{title}</h3>
                  <p className="text-white/50 text-sm">
                    {item.type === 'mixtape' ? 'Mixtape' : productType === 'digital' ? 'Digital Product' : 'Physical Product'}
                  </p>
                  {options && (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {Object.entries(options).map(([key, val]) => (
                        <span key={key} className="text-xs text-white/40 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                          {key}: {val as string}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {productType === 'physical' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(uniqueKey, item.quantity - 1)}
                      className="p-1 rounded bg-white/5 text-white/70 hover:bg-white/10"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="text-white w-8 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(uniqueKey, item.quantity + 1)}
                      className="p-1 rounded bg-white/5 text-white/70 hover:bg-white/10"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                )}

                <div className="text-right">
                  <div className="text-white font-semibold">
                    {formatCurrency(price * item.quantity)}
                  </div>
                  <button
                    onClick={() => removeFromCart(uniqueKey)}
                    className="text-red-400 hover:text-red-300 text-sm flex items-center gap-1 mt-1"
                  >
                    <Trash2 size={14} />
                    Remove
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        <div className="p-6 rounded-xl bg-white/5 border border-white/10">
          {!appliedPromo ? (
            <div className="mb-6 pb-6 border-b border-white/10">
              <label className="block text-white/70 text-sm mb-2">Promo Code</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    placeholder="Enter code"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-fuchsia-500/50 uppercase"
                  />
                </div>
                <button
                  onClick={applyPromoCode}
                  disabled={promoLoading}
                  className="px-4 py-2.5 rounded-lg bg-white/10 text-white font-medium hover:bg-white/20 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {promoLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Check size={16} />
                  )}
                  Apply
                </button>
              </div>
            </div>
          ) : (
            <div className="mb-6 pb-6 border-b border-white/10">
              <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                <div className="flex items-center gap-2">
                  <Tag size={16} className="text-green-400" />
                  <span className="text-green-400 font-semibold">{appliedPromo.code}</span>
                  <span className="text-green-400/70 text-sm">
                    ({appliedPromo.type === 'percentage' ? `${appliedPromo.discount}% off` : `KSh ${appliedPromo.discount} off`})
                  </span>
                </div>
                <button
                  onClick={removePromoCode}
                  className="p-1 text-green-400 hover:text-red-400 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mb-4">
            <span className="text-white/70">Subtotal</span>
            <span className="text-white font-semibold">{formatCurrency(total)}</span>
          </div>
          {appliedPromo && (
            <div className="flex items-center justify-between mb-4 text-green-400">
              <span>Discount</span>
              <span>-{formatCurrency(discountAmount)}</span>
            </div>
          )}
          <div className="flex items-center justify-between mb-6 pb-6 border-b border-white/10">
            <span className="text-white font-semibold">Total</span>
            <span className="text-2xl font-bold bg-gradient-to-r from-fuchsia-500 to-cyan-500 bg-clip-text text-transparent">
              {formatCurrency(finalTotal)}
            </span>
          </div>

          {user ? (
            <button
              onClick={handleCheckout}
              disabled={processing}
              className="w-full py-4 rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white font-semibold hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {processing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Checkout
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          ) : (
            <Link
              href="/login"
              className="block w-full py-4 rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white font-semibold hover:opacity-90 transition-all text-center"
            >
              Sign In to Checkout
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
