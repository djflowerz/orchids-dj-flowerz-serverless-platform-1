import { NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/auth'

export async function GET() {
  const supabase = getServerSupabase()

  const { data: bundles, error } = await supabase
    .from('bundles')
    .select(`
      *,
      bundle_items (
        id,
        item_type,
        product_id,
        products (id, title, price, cover_image)
      )
    `)
    .eq('is_active', true)
    .or('valid_until.is.null,valid_until.gte.' + new Date().toISOString())
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ bundles })
}

export async function POST(request: Request) {
  const supabase = getServerSupabase()
  const body = await request.json()

  const { title, description, discount_percentage, original_price, bundle_price, cover_image, valid_from, valid_until, items } = body

  const { data: bundle, error } = await supabase
    .from('bundles')
    .insert({
      title,
      description,
      discount_percentage,
      original_price,
      bundle_price,
      cover_image,
      valid_from,
      valid_until,
      is_active: true
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (items && items.length > 0) {
    const bundleItems = items.map((item: { product_id: string; item_type: string }) => ({
      bundle_id: bundle.id,
      product_id: item.product_id,
      item_type: item.item_type || 'product'
    }))

    await supabase.from('bundle_items').insert(bundleItems)
  }

  return NextResponse.json({ bundle })
}
