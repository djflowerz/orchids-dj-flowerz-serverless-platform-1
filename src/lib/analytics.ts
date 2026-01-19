import { getServerSupabase } from './auth'

export type EventType = 
  | 'download_mixtape'
  | 'download_product'
  | 'download_music_pool'
  | 'page_view'
  | 'subscription_started'
  | 'subscription_cancelled'
  | 'subscription_renewed'
  | 'tip_received'
  | 'booking_created'
  | 'user_registered'
  | 'user_login'
  | 'product_view'
  | 'mixtape_play'
  | 'share_content'

export interface AnalyticsEvent {
  eventType: EventType
  userId?: string
  entityType?: 'mixtape' | 'product' | 'music_pool' | 'subscription' | 'tip' | 'booking'
  entityId?: string
  metadata?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}

export async function trackEvent(event: AnalyticsEvent): Promise<void> {
  const supabase = getServerSupabase()

  await supabase.from('analytics_events').insert({
    event_type: event.eventType,
    user_id: event.userId || null,
    entity_type: event.entityType || null,
    entity_id: event.entityId || null,
    metadata: event.metadata || {},
    ip_address: event.ipAddress || null,
    user_agent: event.userAgent || null
  })
}

export async function getDownloadStats(days: number = 30) {
  const supabase = getServerSupabase()
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  const { data: downloads } = await supabase
    .from('analytics_events')
    .select('event_type, entity_type, entity_id, created_at')
    .in('event_type', ['download_mixtape', 'download_product', 'download_music_pool'])
    .gte('created_at', startDate.toISOString())

  const byType: Record<string, number> = {}
  const byDay: Record<string, number> = {}
  const topDownloads: Record<string, { count: number; type: string }> = {}

  ;(downloads || []).forEach(d => {
    byType[d.event_type] = (byType[d.event_type] || 0) + 1

    const day = d.created_at.split('T')[0]
    byDay[day] = (byDay[day] || 0) + 1

    if (d.entity_id) {
      const key = `${d.entity_type}:${d.entity_id}`
      if (!topDownloads[key]) {
        topDownloads[key] = { count: 0, type: d.entity_type || 'unknown' }
      }
      topDownloads[key].count++
    }
  })

  return {
    total: downloads?.length || 0,
    byType,
    byDay,
    topDownloads: Object.entries(topDownloads)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
  }
}

export async function getUserRetentionStats(days: number = 30) {
  const supabase = getServerSupabase()
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  const { data: users } = await supabase
    .from('users')
    .select('id, created_at, last_login')
    .gte('created_at', startDate.toISOString())

  const { data: activeUsers } = await supabase
    .from('analytics_events')
    .select('user_id')
    .gte('created_at', startDate.toISOString())
    .not('user_id', 'is', null)

  const uniqueActiveUsers = new Set((activeUsers || []).map(e => e.user_id))

  const newUsers = users?.length || 0
  const activeCount = uniqueActiveUsers.size

  const { data: subscriptions } = await supabase
    .from('subscriptions')
    .select('user_id, status, created_at, ends_at')

  const activeSubscriptions = (subscriptions || []).filter(s => 
    s.status === 'active' && new Date(s.ends_at) > new Date()
  ).length

  const churnedSubscriptions = (subscriptions || []).filter(s => 
    s.status === 'cancelled' || (s.status === 'active' && new Date(s.ends_at) < new Date())
  ).length

  return {
    newUsers,
    activeUsers: activeCount,
    retentionRate: newUsers > 0 ? ((activeCount / newUsers) * 100).toFixed(1) : 0,
    activeSubscriptions,
    churnedSubscriptions,
    churnRate: activeSubscriptions + churnedSubscriptions > 0 
      ? ((churnedSubscriptions / (activeSubscriptions + churnedSubscriptions)) * 100).toFixed(1) 
      : 0
  }
}

export async function getTipJarStats(days: number = 30) {
  const supabase = getServerSupabase()
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  const { data: tips } = await supabase
    .from('transactions')
    .select('amount, created_at, user_id')
    .eq('type', 'tip')
    .eq('status', 'completed')
    .gte('created_at', startDate.toISOString())

  const totalAmount = (tips || []).reduce((sum, t) => sum + (t.amount || 0), 0)
  const uniqueTippers = new Set((tips || []).map(t => t.user_id)).size

  const byDay: Record<string, number> = {}
  ;(tips || []).forEach(t => {
    const day = t.created_at.split('T')[0]
    byDay[day] = (byDay[day] || 0) + (t.amount || 0)
  })

  const amounts = (tips || []).map(t => t.amount || 0).filter(a => a > 0)
  const averageTip = amounts.length > 0 
    ? amounts.reduce((a, b) => a + b, 0) / amounts.length 
    : 0

  return {
    totalAmount,
    totalTips: tips?.length || 0,
    uniqueTippers,
    averageTip: Math.round(averageTip),
    byDay
  }
}

export async function getTopContent(days: number = 30) {
  const supabase = getServerSupabase()
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  const { data: downloads } = await supabase
    .from('download_logs')
    .select('product_id, music_pool_id, created_at')
    .gte('created_at', startDate.toISOString())

  const productDownloads: Record<string, number> = {}
  const musicPoolDownloads: Record<string, number> = {}

  ;(downloads || []).forEach(d => {
    if (d.product_id) {
      productDownloads[d.product_id] = (productDownloads[d.product_id] || 0) + 1
    }
    if (d.music_pool_id) {
      musicPoolDownloads[d.music_pool_id] = (musicPoolDownloads[d.music_pool_id] || 0) + 1
    }
  })

  const topProducts = Object.entries(productDownloads)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)

  const topMusicPool = Object.entries(musicPoolDownloads)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)

  const { data: products } = await supabase
    .from('products')
    .select('id, title')
    .in('id', topProducts.map(p => p[0]))

  const { data: tracks } = await supabase
    .from('music_pool')
    .select('id, title')
    .in('id', topMusicPool.map(t => t[0]))

  const productMap = new Map((products || []).map(p => [p.id, p.title]))
  const trackMap = new Map((tracks || []).map(t => [t.id, t.title]))

  return {
    topProducts: topProducts.map(([id, count]) => ({
      id,
      title: productMap.get(id) || 'Unknown',
      downloads: count
    })),
    topMusicPool: topMusicPool.map(([id, count]) => ({
      id,
      title: trackMap.get(id) || 'Unknown',
      downloads: count
    }))
  }
}

export async function getRevenueStats(days: number = 30) {
  const supabase = getServerSupabase()
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  const { data: transactions } = await supabase
    .from('transactions')
    .select('type, amount, created_at')
    .eq('status', 'completed')
    .gte('created_at', startDate.toISOString())

  const byType: Record<string, number> = {}
  const byDay: Record<string, number> = {}
  let total = 0

  ;(transactions || []).forEach(t => {
    byType[t.type] = (byType[t.type] || 0) + (t.amount || 0)
    total += t.amount || 0

    const day = t.created_at.split('T')[0]
    byDay[day] = (byDay[day] || 0) + (t.amount || 0)
  })

  return {
    total,
    byType,
    byDay,
    transactionCount: transactions?.length || 0
  }
}

export async function getDashboardStats() {
  const [downloads, retention, tips, topContent, revenue] = await Promise.all([
    getDownloadStats(30),
    getUserRetentionStats(30),
    getTipJarStats(30),
    getTopContent(30),
    getRevenueStats(30)
  ])

  return {
    downloads,
    retention,
    tips,
    topContent,
    revenue
  }
}
