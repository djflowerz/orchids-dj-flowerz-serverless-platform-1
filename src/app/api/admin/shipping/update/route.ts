import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, getServerSupabase } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
    const { shippingId, courier, tracking_number, shipping_status } = await request.json()

    if (!shippingId) {
      return NextResponse.json({ error: 'Missing shipping ID' }, { status: 400 })
    }

    const supabase = getServerSupabase()

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
    
    if (courier !== undefined) updateData.courier = courier
    if (tracking_number !== undefined) updateData.tracking_number = tracking_number
    if (shipping_status !== undefined) {
      updateData.shipping_status = shipping_status
      if (shipping_status === 'shipped') {
        updateData.shipped_at = new Date().toISOString()
      } else if (shipping_status === 'delivered') {
        updateData.delivered_at = new Date().toISOString()
      }
    }

    const { error } = await supabase
      .from('shipping')
      .update(updateData)
      .eq('id', shippingId)

    if (error) {
      return NextResponse.json({ error: 'Failed to update shipping' }, { status: 500 })
    }

    if (shipping_status === 'shipped' || shipping_status === 'delivered') {
      const { data: ship } = await supabase
        .from('shipping')
        .select('order_id')
        .eq('id', shippingId)
        .single()

      if (ship?.order_id) {
        await supabase
          .from('orders')
          .update({ status: shipping_status })
          .eq('id', ship.order_id)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
