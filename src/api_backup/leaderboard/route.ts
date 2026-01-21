import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const supabase = getServerSupabase()
  const limit = parseInt(request.nextUrl.searchParams.get('limit') || '10')
  const category = request.nextUrl.searchParams.get('category') || 'overall'

  let orderColumn = 'activity_score'
  if (category === 'downloads') orderColumn = 'downloads_count'
  if (category === 'referrals') orderColumn = 'referrals_count'
  if (category === 'tips') orderColumn = 'tips_total'
  if (category === 'comments') orderColumn = 'comments_count'

  const { data: leaderboard, error } = await supabase
    .from('leaderboard_scores')
    .select(`
      *,
      users:user_id (id, name, avatar_url)
    `)
    .order(orderColumn, { ascending: false })
    .limit(limit)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const ranked = (leaderboard || []).map((entry, index) => ({
    rank: index + 1,
    ...entry
  }))

  return NextResponse.json({ leaderboard: ranked, category })
}

export async function POST(request: Request) {
  const supabase = getServerSupabase()
  const { userId, field, amount = 1 } = await request.json()

  if (!userId || !field) {
    return NextResponse.json({ error: 'Missing userId or field' }, { status: 400 })
  }

  const validFields = ['downloads_count', 'referrals_count', 'tips_total', 'comments_count']
  if (!validFields.includes(field)) {
    return NextResponse.json({ error: 'Invalid field' }, { status: 400 })
  }

  const { data: existing } = await supabase
    .from('leaderboard_scores')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (existing) {
    const newValue = (existing[field] || 0) + amount
    const activityScore = 
      (field === 'downloads_count' ? newValue : existing.downloads_count || 0) * 1 +
      (field === 'referrals_count' ? newValue : existing.referrals_count || 0) * 10 +
      (field === 'tips_total' ? newValue : existing.tips_total || 0) * 0.1 +
      (field === 'comments_count' ? newValue : existing.comments_count || 0) * 2

    await supabase
      .from('leaderboard_scores')
      .update({
        [field]: newValue,
        activity_score: Math.round(activityScore),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
  } else {
    const initialScore = field === 'downloads_count' ? amount :
      field === 'referrals_count' ? amount * 10 :
      field === 'tips_total' ? amount * 0.1 :
      field === 'comments_count' ? amount * 2 : 0

    await supabase
      .from('leaderboard_scores')
      .insert({
        user_id: userId,
        [field]: amount,
        activity_score: Math.round(initialScore)
      })
  }

  return NextResponse.json({ success: true })
}
