import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware'
import { getServerSupabase } from '@/lib/auth'

export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    const supabase = getServerSupabase()

    const { data: downloads, error } = await supabase
      .from('download_logs')
      .select('*, products(title, image_url), music_pool(title, artist, cover_image)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Error fetching downloads:', error)
      return NextResponse.json({ error: 'Failed to fetch downloads' }, { status: 500 })
    }

    return NextResponse.json({ downloads })
  })
}
