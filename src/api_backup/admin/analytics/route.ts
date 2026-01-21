import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { getDashboardStats, getDownloadStats, getUserRetentionStats, getTipJarStats, getTopContent, getRevenueStats } from '@/lib/analytics'

export async function GET(request: NextRequest) {
  try {
    await requireAdmin()

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'dashboard'
    const days = parseInt(searchParams.get('days') || '30', 10)

    let data

    switch (type) {
      case 'downloads':
        data = await getDownloadStats(days)
        break
      case 'retention':
        data = await getUserRetentionStats(days)
        break
      case 'tips':
        data = await getTipJarStats(days)
        break
      case 'content':
        data = await getTopContent(days)
        break
      case 'revenue':
        data = await getRevenueStats(days)
        break
      case 'dashboard':
      default:
        data = await getDashboardStats()
        break
    }

    return NextResponse.json(data)
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }
    console.error('Analytics error:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
