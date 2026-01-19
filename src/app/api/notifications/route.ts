import { NextResponse } from 'next/server'
import { getCurrentUser, getServerSupabase } from '@/lib/auth'

export async function GET(request: Request) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const unreadOnly = searchParams.get('unread') === 'true'
  const limit = parseInt(searchParams.get('limit') || '20')

  const supabase = getServerSupabase()
  let query = supabase
    .from('user_notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (unreadOnly) {
    query = query.eq('is_read', false)
  }

  const { data: notifications, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { count: unreadCount } = await supabase
    .from('user_notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  return NextResponse.json({ notifications, unreadCount: unreadCount || 0 })
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { notificationId, markAllRead } = await request.json()

  const supabase = getServerSupabase()

  if (markAllRead) {
    await supabase
      .from('user_notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false)

    return NextResponse.json({ success: true })
  }

  if (notificationId) {
    await supabase
      .from('user_notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('user_id', user.id)

    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
}

export async function DELETE(request: Request) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const notificationId = searchParams.get('id')
  const clearAll = searchParams.get('clearAll') === 'true'

  const supabase = getServerSupabase()

  if (clearAll) {
    await supabase
      .from('user_notifications')
      .delete()
      .eq('user_id', user.id)

    return NextResponse.json({ success: true })
  }

  if (notificationId) {
    await supabase
      .from('user_notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', user.id)

    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
}
