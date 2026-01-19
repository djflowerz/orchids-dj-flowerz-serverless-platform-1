import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, getServerSupabase } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    await requireAdmin()

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const severity = searchParams.get('severity')
    const resolved = searchParams.get('resolved')

    const supabase = getServerSupabase()

    let query = supabase
      .from('security_alerts')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    if (severity) {
      query = query.eq('severity', severity)
    }
    if (resolved !== null && resolved !== undefined) {
      query = query.eq('resolved', resolved === 'true')
    }

    const { data: alerts, error, count } = await query

    if (error) throw error

    return NextResponse.json({
      alerts: alerts || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }
    console.error('Security alerts error:', error)
    return NextResponse.json({ error: 'Failed to fetch security alerts' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireAdmin()

    const { alertId, resolved } = await request.json()

    if (!alertId) {
      return NextResponse.json({ error: 'Alert ID is required' }, { status: 400 })
    }

    const supabase = getServerSupabase()

    const { error } = await supabase
      .from('security_alerts')
      .update({ resolved: resolved ?? true })
      .eq('id', alertId)

    if (error) throw error

    return NextResponse.json({ message: 'Alert updated successfully' })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }
    console.error('Security alert update error:', error)
    return NextResponse.json({ error: 'Failed to update alert' }, { status: 500 })
  }
}
