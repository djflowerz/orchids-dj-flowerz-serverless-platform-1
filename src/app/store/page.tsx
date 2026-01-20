import { adminDb } from '@/lib/firebase-admin'
import { Product } from '@/lib/types'
import { ProductsList } from '@/components/store/ProductsList'

async function getProducts(): Promise<Product[]> {
  try {
    const snapshot = await adminDb
      .collection('products')
      .orderBy('created_at', 'desc')
      .get()

    return snapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        created_at: data.created_at?.toDate?.().toISOString() || new Date().toISOString()
      } as Product
    })
  } catch (error) {
    console.error('Error fetching products:', error)
    return []
  }
}

export const revalidate = 60

export default async function StorePage() {
  const products = await getProducts()

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="mb-12">
          <h1 className="font-display text-5xl sm:text-7xl text-white mb-4">STORE</h1>
          <p className="text-white/50 text-lg max-w-2xl">
            Official merchandise, sample packs, and exclusive digital content from DJ FLOWERZ.
          </p>
        </div>
        <ProductsList initialProducts={products} />
      </div>
    </div>
  )
}
