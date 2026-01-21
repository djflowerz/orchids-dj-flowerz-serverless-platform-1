import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, getServerSupabase } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'Missing user ID' }, { status: 400 })
    }

    const supabase = getServerSupabase()

    const { data: user } = await supabase
      .from('users')
      .select('telegram_user_id, subscription_status, subscription_tier')
      .eq('id', userId)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('end_date', { ascending: false })
      .limit(1)
      .single()

    const { data: channel } = await supabase
      .from('telegram_channels')
      .select('*')
      .eq('plan_tier', subscription?.tier || 'basic')
      .eq('is_active', true)
      .single()

    if (!channel) {
      return NextResponse.json({ error: 'No channel configured for this tier' }, { status: 400 })
    }

    const shouldHaveAccess = subscription && 
                             subscription.status === 'active' && 
                             new Date(subscription.end_date) > new Date()

    const { data: existingAccess } = await supabase
      .from('telegram_access')
      .select('*')
      .eq('user_id', userId)
      .eq('channel_id', channel.id)
      .single()

    if (existingAccess) {
      await supabase
        .from('telegram_access')
        .update({
          access_granted: shouldHaveAccess,
          last_sync: new Date().toISOString()
        })
        .eq('id', existingAccess.id)
    } else {
      await supabase
        .from('telegram_access')
        .insert({
          user_id: userId,
          channel_id: channel.id,
          access_granted: shouldHaveAccess,
          last_sync: new Date().toISOString()
        })
    }

    return NextResponse.json({ 
      success: true,
      accessGranted: shouldHaveAccess
    })
  } catch (error) {
    console.error('Telegram sync error:', error)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
