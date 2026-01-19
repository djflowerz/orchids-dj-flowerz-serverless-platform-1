import { NextResponse } from 'next/server'
import { getCurrentUser, getServerSupabase } from '@/lib/auth'

const BADGE_DEFINITIONS = {
  first_download: { name: 'First Download', icon: 'download', target: 1 },
  super_downloader: { name: 'Super Downloader', icon: 'zap', target: 50 },
  subscriber: { name: 'Subscriber', icon: 'crown', target: 1 },
  pro_subscriber: { name: 'Pro Subscriber', icon: 'star', target: 1 },
  early_adopter: { name: 'Early Adopter', icon: 'award', target: 1 },
  referrer: { name: 'Referrer', icon: 'users', target: 5 },
  top_tipper: { name: 'Top Tipper', icon: 'heart', target: 10 },
  loyal_member: { name: 'Loyal Member', icon: 'trophy', target: 365 }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  const supabase = getServerSupabase()
  let targetUserId = userId

  if (!targetUserId) {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    targetUserId = user.id
  }

  const { data: badges, error } = await supabase
    .from('user_badges')
    .select('*')
    .eq('user_id', targetUserId)
    .order('earned_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ badges })
}

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { badgeType } = await request.json()

  if (!badgeType || !BADGE_DEFINITIONS[badgeType as keyof typeof BADGE_DEFINITIONS]) {
    return NextResponse.json({ error: 'Invalid badge type' }, { status: 400 })
  }

  const definition = BADGE_DEFINITIONS[badgeType as keyof typeof BADGE_DEFINITIONS]
  const supabase = getServerSupabase()

  const { data: existing } = await supabase
    .from('user_badges')
    .select('id')
    .eq('user_id', user.id)
    .eq('badge_type', badgeType)
    .single()

  if (existing) {
    return NextResponse.json({ error: 'Badge already earned' }, { status: 409 })
  }

  const { data, error } = await supabase
    .from('user_badges')
    .insert({
      user_id: user.id,
      badge_type: badgeType,
      badge_name: definition.name,
      badge_icon: definition.icon
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await supabase.from('user_notifications').insert({
    user_id: user.id,
    type: 'badge_earned',
    title: 'New Badge Earned!',
    message: `Congratulations! You've earned the "${definition.name}" badge.`,
    link: '/dashboard?tab=badges'
  })

  return NextResponse.json({ badge: data })
}
