import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, getServerSupabase } from '@/lib/auth'
import { logAdminAction } from '@/lib/security'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAdmin()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const contentType = searchParams.get('content_type')

    const supabase = getServerSupabase()

    let query = supabase
      .from('content_schedule')
      .select('*')
      .order('scheduled_at', { ascending: true })

    if (status) {
      query = query.eq('status', status)
    }
    if (contentType) {
      query = query.eq('content_type', contentType)
    }

    const { data: schedules, error } = await query

    if (error) throw error

    return NextResponse.json({ schedules: schedules || [] })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }
    console.error('Content schedule error:', error)
    return NextResponse.json({ error: 'Failed to fetch schedules' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin()
    const ipAddress = request.headers.get('x-forwarded-for') || 'unknown'

    const { contentType, contentId, scheduledAt, action } = await request.json()

    if (!contentType || !contentId || !scheduledAt) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = getServerSupabase()

    const { data: schedule, error } = await supabase
      .from('content_schedule')
      .insert({
        content_type: contentType,
        content_id: contentId,
        scheduled_at: scheduledAt,
        action: action || 'publish',
        status: 'pending'
      })
      .select()
      .single()

    if (error) throw error

    await logAdminAction(
      user.id,
      'schedule_content',
      contentType,
      contentId,
      { scheduledAt, action },
      ipAddress
    )

    return NextResponse.json({ schedule, message: 'Content scheduled successfully' })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }
    console.error('Schedule content error:', error)
    return NextResponse.json({ error: 'Failed to schedule content' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAdmin()
    const ipAddress = request.headers.get('x-forwarded-for') || 'unknown'

    const { searchParams } = new URL(request.url)
    const scheduleId = searchParams.get('id')

    if (!scheduleId) {
      return NextResponse.json({ error: 'Schedule ID is required' }, { status: 400 })
    }

    const supabase = getServerSupabase()

    const { error } = await supabase
      .from('content_schedule')
      .delete()
      .eq('id', scheduleId)

    if (error) throw error

    await logAdminAction(
      user.id,
      'cancel_schedule',
      'content_schedule',
      scheduleId,
      {},
      ipAddress
    )

    return NextResponse.json({ message: 'Schedule cancelled successfully' })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }
    console.error('Cancel schedule error:', error)
    return NextResponse.json({ error: 'Failed to cancel schedule' }, { status: 500 })
  }
}
