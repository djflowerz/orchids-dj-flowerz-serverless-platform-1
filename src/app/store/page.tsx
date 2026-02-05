import { Product } from '@/lib/types'
import { ProductsList } from '@/components/store/ProductsList'
import { TechDealsGrid } from '@/components/store/TechDealsGrid'

import { runQueryOnEdge } from '@/lib/firestore-edge'

async function getProducts(): Promise<Product[]> {
  try {
    const structuredQuery = {
      from: [{ collectionId: 'products' }],
      limit: 50,
      orderBy: [{ field: { fieldPath: 'createdAt' }, direction: 'DESCENDING' }]
    }

    const rawProducts = await runQueryOnEdge('products', structuredQuery)

    return rawProducts.map((p: any) => {
      // Handle Denormalized store or fallback
      const store = p.store || { name: 'DJ Flowerz', username: 'djflowerz' }

      // Calculate fields
      const stockCount = typeof p.inStock === 'number' ? p.inStock : 100
      const ratings = p.ratings || []
      const avgRating = ratings.length ? ratings.reduce((a: number, b: any) => a + b.rating, 0) / ratings.length : 0

      return {
        id: p.id,
        title: p.name || p.title || 'Untitled',
        description: p.description || '',
        price: Number(p.price) || 0,
        category: p.category || 'Uncategorized',
        cover_images: Array.isArray(p.images) ? p.images : [],
        image_url: Array.isArray(p.images) ? p.images[0] : null,
        is_trending: !!p.isTrending,
        is_free: p.price === 0,
        in_stock: stockCount > 0,
        created_at: p.createdAt || new Date().toISOString(),
        store: store,
        average_rating: avgRating,
        review_count: ratings.length,
        popularity_score: stockCount
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
  // Filter for hot/trending products for the top section (mock logic if API doesn't support 'hot' yet)
  const hotProducts = products.slice(0, 4)

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="mb-8">
          <h1 className="font-display text-5xl sm:text-7xl text-white mb-4">STORE</h1>
          <p className="text-white/50 text-lg max-w-2xl">
            Official merchandise, laptops, and exclusive tech deals.
          </p>
        </div>

        {/* Hot Deals Grid */}
        <TechDealsGrid products={hotProducts} />

        <div className="mt-16 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6 border-l-4 border-cyan-500 pl-3">All Products</h2>
          <ProductsList initialProducts={products} />
        </div>
      </div>
    </div>
  )
}
