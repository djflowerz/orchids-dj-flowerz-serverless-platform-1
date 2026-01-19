"use client"

import Link from 'next/link'
import Image from 'next/image'
import { Product } from '@/lib/types'
import { ShoppingBag, ArrowRight, Package } from 'lucide-react'

interface StoreSectionProps {
  products: Product[]
}

export function StoreSection({ products }: StoreSectionProps) {
  return (
    <section className="py-24 px-6 relative bg-gradient-to-b from-transparent via-black/50 to-transparent">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-12">
          <div>
            <span className="text-cyan-400 text-sm font-semibold tracking-wider uppercase mb-2 block">
              Official Merch
            </span>
            <h2 className="font-display text-4xl sm:text-5xl text-white">
              Store
            </h2>
          </div>
          <Link
            href="/store"
            className="group hidden sm:flex items-center gap-2 text-white/60 hover:text-white transition-colors"
          >
            Shop All
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
        
        {products.length === 0 ? (
          <div className="text-center py-20 glass rounded-2xl">
            <Package className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <p className="text-white/60 text-lg">Store coming soon</p>
            <p className="text-white/40 text-sm mt-2">Check back for official merchandise!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product, index) => (
              <Link
                key={product.id}
                href={`/store/${product.id}`}
                className="group"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="relative aspect-square rounded-2xl overflow-hidden bg-white/5">
                  {product.image_url ? (
                    <Image
                      src={product.image_url}
                      alt={product.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/30 to-fuchsia-500/30 flex items-center justify-center">
                      <ShoppingBag className="w-16 h-16 text-white/30" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-bold text-lg">
                        ${(product.price / 100).toFixed(2)}
                      </span>
                      {product.product_type === 'physical' && product.stock_quantity > 0 && (
                        <span className="text-green-400 text-xs">In Stock</span>
                      )}
                      {product.product_type === 'digital' && (
                        <span className="text-cyan-400 text-xs">Digital</span>
                      )}
                    </div>
                  </div>
                  <div className="absolute top-3 left-3">
                    {product.category && (
                      <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-white text-xs">
                        {product.category}
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="text-white font-semibold text-lg truncate group-hover:text-cyan-400 transition-colors">
                    {product.title}
                  </h3>
                  {product.description && (
                    <p className="text-white/50 text-sm mt-1 line-clamp-2">
                      {product.description}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
        
        <div className="mt-8 text-center sm:hidden">
          <Link
            href="/store"
            className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            View All Products
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
