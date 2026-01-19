import { supabase } from '@/lib/supabase'
import { Product } from '@/lib/types'
import { notFound } from 'next/navigation'
import { ProductDetail } from '@/components/store/ProductDetail'

async function getProduct(id: string): Promise<Product | null> {
  const { data } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single()
  return data
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
