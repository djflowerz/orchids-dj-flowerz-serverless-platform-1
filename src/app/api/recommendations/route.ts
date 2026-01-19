import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, getServerSupabase } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const user = await getCurrentUser()
  const limit = parseInt(request.nextUrl.searchParams.get('limit') || '10')
  const entityType = request.nextUrl.searchParams.get('type')

  const supabase = getServerSupabase()

  if (user) {
    const { data: userActivity } = await supabase
      .from('user_activity')
      .select('entity_type, entity_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    const { data: favorites } = await supabase
      .from('favorites')
      .select('entity_type, entity_id')
      .eq('user_id', user.id)

    const viewedProductIds = userActivity
      ?.filter(a => a.entity_type === 'product')
      .map(a => a.entity_id) || []

    const favoriteProductIds = favorites
      ?.filter(f => f.entity_type === 'product')
      .map(f => f.entity_id) || []

    const relatedIds = [...new Set([...viewedProductIds, ...favoriteProductIds])]

    if (relatedIds.length > 0) {
      const { data: viewedProducts } = await supabase
        .from('products')
        .select('category, genre')
        .in('id', relatedIds.slice(0, 10))

      const categories = [...new Set(viewedProducts?.map(p => p.category).filter(Boolean))]
      const genres = [...new Set(viewedProducts?.flatMap(p => p.genre || []).filter(Boolean))]

      let query = supabase
        .from('products')
        .select('id, title, price, cover_image, category, product_type, is_paid')
        .eq('is_published', true)
        .not('id', 'in', `(${relatedIds.slice(0, 20).join(',')})`)

      if (categories.length > 0) {
        query = query.in('category', categories)
      }
      if (entityType) {
        query = query.eq('product_type', entityType)
      }

      const { data: recommendations } = await query.limit(limit)

      if (recommendations && recommendations.length > 0) {
        return NextResponse.json({ 
          recommendations,
          basedOn: 'activity',
          categories,
          genres
        })
      }
    }
  }

  const { data: popular } = await supabase
    .from('products')
    .select('id, title, price, cover_image, category, product_type, is_paid')
    .eq('is_published', true)
    .order('download_count', { ascending: false })
    .limit(limit)

  return NextResponse.json({ 
    recommendations: popular || [],
    basedOn: 'popular'
  })
}

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ success: false })
  }

  const supabase = getServerSupabase()
  const { activityType, entityType, entityId, metadata } = await request.json()

  await supabase.from('user_activity').insert({
    user_id: user.id,
    activity_type: activityType,
    entity_type: entityType,
    entity_id: entityId,
    metadata: metadata || {}
  })

  return NextResponse.json({ success: true })
}
