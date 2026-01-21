import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, getServerSupabase } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
    const { productId, table } = await request.json()

    if (!productId || !table) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const validTables = ['products', 'music_pool', 'mixtapes']
    if (!validTables.includes(table)) {
      return NextResponse.json({ error: 'Invalid table' }, { status: 400 })
    }

    const supabase = getServerSupabase()

    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', productId)

    if (error) {
      return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
