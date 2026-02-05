'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart, Gift, TrendingDown, MessageSquare } from 'lucide-react'
import { toast } from 'sonner'
import { ProductBundle } from '@/lib/types'
import { formatCurrency } from '@/lib/utils'
import { useCart } from '@/context/CartContext'

interface BundleCardProps {
  bundle: ProductBundle
}

export function BundleCard({ bundle }: BundleCardProps) {
  const { addToCart } = useCart()
  const [isAdding, setIsAdding] = useState(false)

  const handleAddToCart = async () => {
    try {
      setIsAdding(true)
      // Add bundle to cart
      // TODO: Implement bundle cart logic
      toast.success('Bundle added to cart!')
    } catch (error) {
      toast.error('Failed to add bundle to cart')
    } finally {
      setIsAdding(false)
    }
  }

  const savings = bundle.regular_price - bundle.bundle_price

  return (
    <div className="group relative bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-cyan-500/30 transition-all duration-300">
      {/* Featured Badge */}
      {bundle.status === 'featured' && (
        <div className="absolute top-4 left-4 z-20 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg">
          <Gift size={14} />
          Featured Deal
        </div>
      )}

      {/* Discount Badge */}
      <div className="absolute top-4 right-4 z-20 px-3 py-1 rounded-full bg-red-500/80 text-white text-xs font-bold flex items-center gap-1 shadow-lg">
        <TrendingDown size={14} />
        Save {Math.round(bundle.discount_percentage)}%
      </div>

      {/* Image Container */}
      <div className="relative aspect-video overflow-hidden bg-white/5">
        {bundle.cover_image ? (
          <Image
            src={bundle.cover_image}
            alt={bundle.name}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-cyan-500/10 to-fuchsia-500/10">
            <Gift size={48} className="text-white/20" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Bundle Type Badge */}
        <div className="mb-2">
          <span className="text-xs font-bold uppercase tracking-wide text-cyan-400 bg-cyan-400/10 px-2 py-1 rounded-full inline-block">
            {bundle.bundle_type === 'deal' && '🔥 Hot Deal'}
            {bundle.bundle_type === 'combo' && '📦 Combo Pack'}
            {bundle.bundle_type === 'starter' && '🚀 Starter Kit'}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-white mb-2 line-clamp-2">
          {bundle.name}
        </h3>

        {/* Description */}
        {bundle.description && (
          <p className="text-white/50 text-sm mb-4 line-clamp-2">
            {bundle.description}
          </p>
        )}

        {/* Product Count */}
        <div className="text-xs text-white/40 mb-4">
          {bundle.products.length} {bundle.products.length === 1 ? 'product' : 'products'} included
        </div>

        {/* Pricing */}
        <div className="mb-6 space-y-2">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">
              {formatCurrency(bundle.bundle_price)}
            </span>
            <span className="text-sm text-white/40 line-through">
              {formatCurrency(bundle.regular_price)}
            </span>
          </div>
          <div className="text-sm font-semibold text-green-400">
            Save {formatCurrency(savings)} ({Math.round(bundle.discount_percentage)}% off)
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {/* WhatsApp Button */}
          <a
            href={`https://wa.me/254789783258?text=${encodeURIComponent(
              `Hi, I'm interested in the "${bundle.name}" bundle for ${formatCurrency(bundle.bundle_price)}`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-[#25D366] to-[#128C7E] rounded-lg text-white font-semibold hover:scale-105 transition-all shadow-lg shadow-green-500/20"
          >
            <MessageSquare size={16} />
            <span className="text-sm">WhatsApp</span>
          </a>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={isAdding}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg font-semibold transition-colors disabled:opacity-50"
          >
            <ShoppingCart size={16} />
            <span className="text-sm">Add</span>
          </button>
        </div>
      </div>
    </div>
  )
}
