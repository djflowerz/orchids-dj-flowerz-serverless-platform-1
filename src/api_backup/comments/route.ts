import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, getServerSupabase } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const supabase = getServerSupabase()
  const entityType = request.nextUrl.searchParams.get('entityType')
  const entityId = request.nextUrl.searchParams.get('entityId')

  if (!entityType || !entityId) {
    return NextResponse.json({ error: 'Missing entityType or entityId' }, { status: 400 })
  }

  const { data: comments, error } = await supabase
    .from('comments')
    .select(`
      *,
      users:user_id (id, name, avatar_url)
    `)
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .eq('is_approved', true)
    .is('parent_id', null)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const commentsWithReplies = await Promise.all(
    (comments || []).map(async (comment) => {
      const { data: replies } = await supabase
        .from('comments')
        .select(`*, users:user_id (id, name, avatar_url)`)
        .eq('parent_id', comment.id)
        .eq('is_approved', true)
        .order('created_at', { ascending: true })

      return { ...comment, replies: replies || [] }
    })
  )

  return NextResponse.json({ comments: commentsWithReplies })
}

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Please login to comment' }, { status: 401 })
  }

  const supabase = getServerSupabase()
  const { entityType, entityId, content, parentId } = await request.json()

  if (!entityType || !entityId || !content?.trim()) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { data: comment, error } = await supabase
    .from('comments')
    .insert({
      user_id: user.id,
      entity_type: entityType,
      entity_id: entityId,
      parent_id: parentId || null,
      content: content.trim(),
      is_approved: true
    })
    .select(`*, users:user_id (id, name, avatar_url)`)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await supabase.rpc('increment_leaderboard', { 
    p_user_id: user.id, 
    p_field: 'comments_count' 
  }).catch(() => {})

  return NextResponse.json({ comment })
}

export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const commentId = request.nextUrl.searchParams.get('id')
  if (!commentId) {
    return NextResponse.json({ error: 'Missing comment ID' }, { status: 400 })
  }

  const supabase = getServerSupabase()

  const { data: comment } = await supabase
    .from('comments')
    .select('user_id')
    .eq('id', commentId)
    .single()

  if (!comment || (comment.user_id !== user.id && user.role !== 'admin')) {
    return NextResponse.json({ error: 'Not authorized to delete this comment' }, { status: 403 })
  }

  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
