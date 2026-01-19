import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, getServerSupabase } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
    const { orderId, status } = await request.json()

    if (!orderId || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const validStatuses = ['pending', 'completed', 'shipped', 'cancelled']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const supabase = getServerSupabase()

    const updateData: Record<string, unknown> = { status, updated_at: new Date().toISOString() }

    if (status === 'completed') {
      const { data: order } = await supabase
        .from('orders')
        .select('type, product_id')
        .eq('id', orderId)
        .single()

      if (order?.type === 'digital') {
        updateData.download_expires = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
        updateData.max_downloads = 5
        updateData.download_count = 0

        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
        let licenseKey = ''
        for (let i = 0; i < 16; i++) {
          if (i > 0 && i % 4 === 0) licenseKey += '-'
          licenseKey += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        updateData.license_key = licenseKey
      }
    }

    const { error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)

    if (error) {
      return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
