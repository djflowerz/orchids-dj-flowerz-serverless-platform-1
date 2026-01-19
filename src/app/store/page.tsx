import { supabase } from '@/lib/supabase'
import { Product } from '@/lib/types'
import { ProductsList } from '@/components/store/ProductsList'

async function getProducts(): Promise<Product[]> {
  const { data } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })
  return data || []
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
