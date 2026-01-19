import { NextResponse } from 'next/server'
import { getCurrentUser, getServerSupabase } from '@/lib/auth'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getServerSupabase()
  const { data: playlists, error } = await supabase
    .from('user_playlists')
    .select(`
      *,
      playlist_items(*)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ playlists })
}

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { name, description, isPublic } = await request.json()

  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  const supabase = getServerSupabase()
  const { data, error } = await supabase
    .from('user_playlists')
    .insert({
      user_id: user.id,
      name,
      description,
      is_public: isPublic || false
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ playlist: data })
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { playlistId, name, description, isPublic, addItem, removeItem } = await request.json()

  if (!playlistId) {
    return NextResponse.json({ error: 'Playlist ID is required' }, { status: 400 })
  }

  const supabase = getServerSupabase()

  const { data: playlist } = await supabase
    .from('user_playlists')
    .select('*')
    .eq('id', playlistId)
    .eq('user_id', user.id)
    .single()

  if (!playlist) {
    return NextResponse.json({ error: 'Playlist not found' }, { status: 404 })
  }

  if (addItem) {
    const { data: itemCount } = await supabase
      .from('playlist_items')
      .select('position')
      .eq('playlist_id', playlistId)
      .order('position', { ascending: false })
      .limit(1)
      .single()

    const { error: addError } = await supabase
      .from('playlist_items')
      .insert({
        playlist_id: playlistId,
        entity_type: addItem.entityType,
        entity_id: addItem.entityId,
        position: (itemCount?.position || 0) + 1
      })

    if (addError && addError.code !== '23505') {
      return NextResponse.json({ error: addError.message }, { status: 500 })
    }
  }

  if (removeItem) {
    await supabase
      .from('playlist_items')
      .delete()
      .eq('playlist_id', playlistId)
      .eq('entity_type', removeItem.entityType)
      .eq('entity_id', removeItem.entityId)
  }

  if (name || description !== undefined || isPublic !== undefined) {
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (name) updates.name = name
    if (description !== undefined) updates.description = description
    if (isPublic !== undefined) updates.is_public = isPublic

    await supabase
      .from('user_playlists')
      .update(updates)
      .eq('id', playlistId)
  }

  const { data: updatedPlaylist } = await supabase
    .from('user_playlists')
    .select(`*, playlist_items(*)`)
    .eq('id', playlistId)
    .single()

  return NextResponse.json({ playlist: updatedPlaylist })
}

export async function DELETE(request: Request) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const playlistId = searchParams.get('id')

  if (!playlistId) {
    return NextResponse.json({ error: 'Playlist ID is required' }, { status: 400 })
  }

  const supabase = getServerSupabase()
  const { error } = await supabase
    .from('user_playlists')
    .delete()
    .eq('id', playlistId)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
