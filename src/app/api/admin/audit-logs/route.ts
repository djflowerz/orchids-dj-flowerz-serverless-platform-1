import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, getServerSupabase } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    await requireAdmin()

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const adminId = searchParams.get('admin_id')
    const entityType = searchParams.get('entity_type')
    const action = searchParams.get('action')

    const supabase = getServerSupabase()

    let query = supabase
      .from('admin_logs')
      .select('*, users!admin_logs_admin_id_fkey(name, email)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    if (adminId) {
      query = query.eq('admin_id', adminId)
    }
    if (entityType) {
      query = query.eq('entity_type', entityType)
    }
    if (action) {
      query = query.ilike('action', `%${action}%`)
    }

    const { data: logs, error, count } = await query

    if (error) throw error

    return NextResponse.json({
      logs: logs || [],
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
    console.error('Audit logs error:', error)
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 })
  }
}
