import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, getServerSupabase } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { orderId } = await params
    const supabase = getServerSupabase()

    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        products (
          id,
          title,
          files
        )
      `)
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single()

    if (error || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.status !== 'completed') {
      return NextResponse.json({ error: 'Order not completed' }, { status: 400 })
    }

    if (order.type !== 'digital') {
      return NextResponse.json({ error: 'Not a digital product' }, { status: 400 })
    }

    if (order.download_count >= order.max_downloads) {
      return NextResponse.json({ error: 'Download limit reached' }, { status: 400 })
    }

    if (order.download_expires && new Date(order.download_expires) < new Date()) {
      return NextResponse.json({ error: 'Download link expired' }, { status: 400 })
    }

    await supabase
      .from('orders')
      .update({ download_count: order.download_count + 1 })
      .eq('id', orderId)

    const ipAddress = request.headers.get('x-forwarded-for') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    await supabase.from('download_logs').insert({
      user_id: user.id,
      product_id: order.product_id,
      order_id: orderId,
      download_type: 'product',
      ip_address: ipAddress,
      user_agent: userAgent
    })

    const downloadUrl = order.download_link || order.products?.files?.[0] || ''

    return NextResponse.json({ 
      downloadUrl,
      remainingDownloads: order.max_downloads - order.download_count - 1
    })
  } catch (error) {
    console.error('Download error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
