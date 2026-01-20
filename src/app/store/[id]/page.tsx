import { adminDb } from '@/lib/firebase-admin'
import { Product } from '@/lib/types'
import { notFound } from 'next/navigation'
import { ProductDetail } from '@/components/store/ProductDetail'

async function getProduct(id: string): Promise<Product | null> {
  try {
    const doc = await adminDb.collection('products').doc(id).get()
    if (!doc.exists) return null

    const data = doc.data()
    return {
      id: doc.id,
      ...data,
      created_at: data?.created_at?.toDate?.().toISOString() || new Date().toISOString()
    } as Product
  } catch (error) {
    console.error('Error fetching product:', error)
    return null
  }
}

export const revalidate = 60

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const product = await getProduct(id)

  if (!product) {
    notFound()
  }

  return <ProductDetail product={product} />
}
