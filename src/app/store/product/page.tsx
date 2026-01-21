"use client"

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Product } from '@/lib/types'
import { ProductDetail } from '@/components/store/ProductDetail'

function ProductContent() {
  const searchParams = useSearchParams()
  const id = searchParams.get('id')

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    async function fetchProduct() {
      if (!id) return

      try {
        const docRef = doc(db, 'products', id)
        const snap = await getDoc(docRef)

        if (snap.exists()) {
          const data = snap.data()
          setProduct({
            id: snap.id,
            ...data,
            created_at: data?.created_at?.toDate?.().toISOString() || new Date().toISOString()
          } as Product)
        } else {
          setError(true)
        }
      } catch (e) {
        console.error('Error fetching product:', e)
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-white">
        <h2 className="text-2xl font-bold mb-4">Product Not Found</h2>
        <p className="text-white/60 mb-8">The product you are looking for does not exist.</p>
        <a href="/store" className="px-6 py-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
          Back to Store
        </a>
      </div>
    )
  }

  return <ProductDetail product={product} />
}

export default function ProductPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[50vh]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div></div>}>
      <ProductContent />
    </Suspense>
  )
}
