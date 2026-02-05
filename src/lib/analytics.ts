import { runQueryOnEdge, createDocumentOnEdge } from './firestore-edge'

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
  await createDocumentOnEdge('analytics_events', {
    event_type: event.eventType,
    user_id: event.userId || null,
    entity_type: event.entityType || null,
    entity_id: event.entityId || null,
    metadata: event.metadata || {},
    ip_address: event.ipAddress || null,
    user_agent: event.userAgent || null,
    created_at: new Date().toISOString()
  })
}

export async function getDownloadStats(days: number = 30) {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  const query = {
    from: [{ collectionId: 'analytics_events' }],
    where: {
      compositeFilter: {
        op: 'AND',
        filters: [
          {
            fieldFilter: {
              field: { fieldPath: 'event_type' },
              op: 'IN',
              value: {
                arrayValue: {
                  values: [
                    { stringValue: 'download_mixtape' },
                    { stringValue: 'download_product' },
                    { stringValue: 'download_music_pool' }
                  ]
                }
              }
            }
          },
          {
            fieldFilter: {
              field: { fieldPath: 'created_at' },
              op: 'GREATER_THAN_OR_EQUAL',
              value: { stringValue: startDate.toISOString() }
            }
          }
        ]
      }
    }
  }

  const downloads = await runQueryOnEdge('analytics_events', query)

  const byType: Record<string, number> = {}
  const byDay: Record<string, number> = {}
  const topDownloads: Record<string, { count: number; type: string }> = {}

  downloads.forEach(d => {
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
    total: downloads.length,
    byType,
    byDay,
    topDownloads: Object.entries(topDownloads)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
  }
}

export async function getUserRetentionStats(days: number = 30) {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  // Get new users
  const usersQuery = {
    from: [{ collectionId: 'users' }],
    where: {
      fieldFilter: {
        field: { fieldPath: 'created_at' },
        op: 'GREATER_THAN_OR_EQUAL',
        value: { stringValue: startDate.toISOString() }
      }
    }
  }

  const users = await runQueryOnEdge('users', usersQuery)

  // Get active users from analytics events
  const activeUsersQuery = {
    from: [{ collectionId: 'analytics_events' }],
    where: {
      fieldFilter: {
        field: { fieldPath: 'created_at' },
        op: 'GREATER_THAN_OR_EQUAL',
        value: { stringValue: startDate.toISOString() }
      }
    }
  }

  const activeEvents = await runQueryOnEdge('analytics_events', activeUsersQuery)
  const uniqueActiveUsers = new Set(activeEvents.filter(e => e.user_id).map(e => e.user_id))

  const newUsers = users.length
  const activeCount = uniqueActiveUsers.size

  // Get subscriptions
  const subscriptionsQuery = {
    from: [{ collectionId: 'subscriptions' }]
  }

  const subscriptions = await runQueryOnEdge('subscriptions', subscriptionsQuery)

  const activeSubscriptions = subscriptions.filter(s =>
    s.status === 'active' && new Date(s.end_date) > new Date()
  ).length

  const churnedSubscriptions = subscriptions.filter(s =>
    s.status === 'cancelled' || (s.status === 'active' && new Date(s.end_date) < new Date())
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
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  const query = {
    from: [{ collectionId: 'transactions' }],
    where: {
      compositeFilter: {
        op: 'AND',
        filters: [
          {
            fieldFilter: {
              field: { fieldPath: 'type' },
              op: 'EQUAL',
              value: { stringValue: 'tip' }
            }
          },
          {
            fieldFilter: {
              field: { fieldPath: 'status' },
              op: 'EQUAL',
              value: { stringValue: 'completed' }
            }
          },
          {
            fieldFilter: {
              field: { fieldPath: 'created_at' },
              op: 'GREATER_THAN_OR_EQUAL',
              value: { stringValue: startDate.toISOString() }
            }
          }
        ]
      }
    }
  }

  const tips = await runQueryOnEdge('transactions', query)

  const totalAmount = tips.reduce((sum, t) => sum + (t.amount || 0), 0)
  const uniqueTippers = new Set(tips.map(t => t.user_id)).size

  const byDay: Record<string, number> = {}
  tips.forEach(t => {
    const day = t.created_at.split('T')[0]
    byDay[day] = (byDay[day] || 0) + (t.amount || 0)
  })

  const amounts = tips.map(t => t.amount || 0).filter(a => a > 0)
  const averageTip = amounts.length > 0
    ? amounts.reduce((a, b) => a + b, 0) / amounts.length
    : 0

  return {
    totalAmount,
    totalTips: tips.length,
    uniqueTippers,
    averageTip: Math.round(averageTip),
    byDay
  }
}

export async function getTopContent(days: number = 30) {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  const query = {
    from: [{ collectionId: 'download_logs' }],
    where: {
      fieldFilter: {
        field: { fieldPath: 'created_at' },
        op: 'GREATER_THAN_OR_EQUAL',
        value: { stringValue: startDate.toISOString() }
      }
    }
  }

  const downloads = await runQueryOnEdge('download_logs', query)

  const productDownloads: Record<string, number> = {}
  const musicPoolDownloads: Record<string, number> = {}

  downloads.forEach(d => {
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

  // Fetch product and track details
  const productIds = topProducts.map(p => p[0])
  const trackIds = topMusicPool.map(t => t[0])

  const products = await Promise.all(
    productIds.map(async id => {
      const query = {
        from: [{ collectionId: 'products' }],
        where: {
          fieldFilter: {
            field: { fieldPath: 'id' },
            op: 'EQUAL',
            value: { stringValue: id }
          }
        },
        limit: 1
      }
      const results = await runQueryOnEdge('products', query)
      return results[0] || null
    })
  )

  const tracks = await Promise.all(
    trackIds.map(async id => {
      const query = {
        from: [{ collectionId: 'music_pool' }],
        where: {
          fieldFilter: {
            field: { fieldPath: 'id' },
            op: 'EQUAL',
            value: { stringValue: id }
          }
        },
        limit: 1
      }
      const results = await runQueryOnEdge('music_pool', query)
      return results[0] || null
    })
  )

  const productMap = new Map(products.filter(p => p).map(p => [p.id, p.title || p.name]))
  const trackMap = new Map(tracks.filter(t => t).map(t => [t.id, t.title]))

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
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  const query = {
    from: [{ collectionId: 'transactions' }],
    where: {
      compositeFilter: {
        op: 'AND',
        filters: [
          {
            fieldFilter: {
              field: { fieldPath: 'status' },
              op: 'EQUAL',
              value: { stringValue: 'completed' }
            }
          },
          {
            fieldFilter: {
              field: { fieldPath: 'created_at' },
              op: 'GREATER_THAN_OR_EQUAL',
              value: { stringValue: startDate.toISOString() }
            }
          }
        ]
      }
    }
  }

  const transactions = await runQueryOnEdge('transactions', query)

  const byType: Record<string, number> = {}
  const byDay: Record<string, number> = {}
  let total = 0

  transactions.forEach(t => {
    byType[t.type] = (byType[t.type] || 0) + (t.amount || 0)
    total += t.amount || 0

    const day = t.created_at.split('T')[0]
    byDay[day] = (byDay[day] || 0) + (t.amount || 0)
  })

  return {
    total,
    byType,
    byDay,
    transactionCount: transactions.length
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
