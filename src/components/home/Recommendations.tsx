'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Sparkles, ArrowRight } from 'lucide-react'

interface Product {
  id: string
  title: string
  price: number
  cover_image: string
  category: string
  product_type: string
  is_paid: boolean
}

export function Recommendations() {
  const [recommendations, setRecommendations] = useState<Product[]>([])
  const [basedOn, setBasedOn] = useState<string>('popular')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRecommendations()
  }, [])

  const fetchRecommendations = async () => {
    try {
      const res = await fetch('/api/recommendations?limit=4')
      if (res.ok) {
        const data = await res.json()
        setRecommendations(data.recommendations || [])
        setBasedOn(data.basedOn || 'popular')
      }
    } catch (err) {
      console.error('Failed to fetch recommendations:', err)
    }
    setLoading(false)
  }

  if (loading || recommendations.length === 0) return null

  return (
    <section className="py-12 px-6 bg-zinc-950/50">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-fuchsia-500/20 to-cyan-500/20">
              <Sparkles size={24} className="text-fuchsia-400" />
            </div>
            <div>
              <h2 className="text-white text-xl font-bold">Recommended For You</h2>
              <p className="text-white/50 text-sm">
                {basedOn === 'activity' ? 'Based on your activity' : 'Popular picks'}
              </p>
            </div>
          </div>
          <Link
            href="/store"
            className="text-fuchsia-400 hover:text-fuchsia-300 flex items-center gap-1 text-sm font-medium"
          >
            View All <ArrowRight size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {recommendations.map(product => (
            <Link
              key={product.id}
              href={`/store/${product.id}`}
              className="group relative rounded-2xl overflow-hidden bg-white/5 border border-white/10 hover:border-fuchsia-500/30 transition-all"
            >
              <div className="aspect-square relative">
                {product.cover_image ? (
                  <Image
                    src={product.cover_image}
                    alt={product.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-fuchsia-500/20 to-cyan-500/20 flex items-center justify-center">
                    <Sparkles size={32} className="text-white/30" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              <div className="p-4">
                <p className="text-white/50 text-xs uppercase tracking-wider mb-1">{product.category}</p>
                <h3 className="text-white font-semibold text-sm truncate">{product.title}</h3>
                <p className="text-fuchsia-400 font-bold mt-2">
                  {product.is_paid ? `KES ${product.price?.toLocaleString()}` : 'Free'}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
