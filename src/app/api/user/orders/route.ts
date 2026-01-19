import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware'
import { getServerSupabase } from '@/lib/auth'

export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    const supabase = getServerSupabase()

    const { data: orders, error } = await supabase
      .from('orders')
      .select('*, products(title, image_url)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching orders:', error)
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
    }

    return NextResponse.json({ orders })
  })
}
