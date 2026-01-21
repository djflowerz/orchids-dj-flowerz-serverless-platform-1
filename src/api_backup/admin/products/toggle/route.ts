import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, getServerSupabase } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
    const { productId, isActive } = await request.json()

    if (!productId) {
      return NextResponse.json({ error: 'Missing product ID' }, { status: 400 })
    }

    const supabase = getServerSupabase()

    let error = null
    
    const { error: productsError } = await supabase
      .from('products')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', productId)
    
    if (productsError) {
      const { error: poolError } = await supabase
        .from('music_pool')
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq('id', productId)
      error = poolError
    }

    if (error) {
      return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
