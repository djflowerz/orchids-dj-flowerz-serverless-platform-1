import { NextResponse } from 'next/server'
import { requireAdmin, getServerSupabase } from '@/lib/auth'

export async function GET() {
  try {
    await requireAdmin()
    const supabase = getServerSupabase()

    const [usersRes, ordersRes, shippingRes, subsRes, telegramRes, productsRes, poolRes, logsRes] = await Promise.all([
      supabase.from('users').select('*').order('created_at', { ascending: false }),
      supabase.from('orders').select('*, products(title, type)').order('created_at', { ascending: false }),
      supabase.from('shipping').select('*').order('created_at', { ascending: false }),
      supabase.from('subscriptions').select('*, users(name, email)').order('created_at', { ascending: false }),
      supabase.from('telegram_access').select('*, users(name, email, telegram_username), telegram_channels(channel_name, plan_tier)').order('created_at', { ascending: false }),
      supabase.from('products').select('*').order('created_at', { ascending: false }),
      supabase.from('music_pool').select('*').order('created_at', { ascending: false }),
      supabase.from('download_logs').select('id').gte('created_at', new Date(new Date().setHours(0,0,0,0)).toISOString())
    ])

    const users = usersRes.data || []
    const orders = ordersRes.data || []
    const subscriptions = subsRes.data || []

    const activeSubscribers = subscriptions.filter(s => s.status === 'active').length
    const completedOrders = orders.filter(o => o.status === 'completed')
    const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.amount || 0), 0)
    const pendingOrders = orders.filter(o => o.status === 'pending').length
    const pendingShipments = (shippingRes.data || []).filter(s => s.shipping_status === 'pending').length
    const failedPayments = orders.filter(o => o.status === 'cancelled').length

    const stats = {
      totalUsers: users.length,
      activeSubscribers,
      totalOrders: orders.length,
      pendingOrders,
      totalRevenue,
      todayDownloads: logsRes.data?.length || 0,
      pendingShipments,
      failedPayments
    }

    const formattedOrders = orders.map(o => ({
      ...o,
      product: o.products
    }))

    const formattedSubs = subscriptions.map(s => ({
      ...s,
      user: s.users
    }))

    const formattedTelegram = (telegramRes.data || []).map(t => ({
      ...t,
      user: t.users,
      channel: t.telegram_channels
    }))

    return NextResponse.json({
      stats,
      users,
      orders: formattedOrders,
      shipping: shippingRes.data || [],
      subscriptions: formattedSubs,
      telegramAccess: formattedTelegram,
      products: productsRes.data || [],
      musicPool: poolRes.data || []
    })
  } catch (error) {
    console.error('Admin data error:', error)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
