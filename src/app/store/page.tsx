import { Product } from '@/lib/types'
import { ProductsList } from '@/components/store/ProductsList'

async function getProducts(): Promise<Product[]> {
  try {
    // Fetch from our new API instead of Firebase
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/products`, {
      next: { revalidate: 60 } // Revalidate every 60 seconds
    })

    if (!res.ok) {
      console.error('Failed to fetch products:', res.statusText)
      return []
    }

    const products = await res.json()
    return products
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
