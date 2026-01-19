import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, getServerSupabase } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
    const { userId, tier, months } = await request.json()

    if (!userId || !tier || !months) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const validTiers = ['basic', 'pro', 'unlimited']
    if (!validTiers.includes(tier)) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })
    }

    const supabase = getServerSupabase()

    const startDate = new Date()
    const endDate = new Date()
    endDate.setMonth(endDate.getMonth() + months)

    const { error: subError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        tier,
        status: 'active',
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        auto_renew: false,
        payment_method: 'admin_grant',
        amount: 0
      })

    if (subError) {
      console.error('Subscription error:', subError)
      return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 })
    }

    const { error: userError } = await supabase
      .from('users')
      .update({
        role: 'subscriber',
        subscription_status: 'active',
        subscription_tier: tier
      })
      .eq('id', userId)

    if (userError) {
      console.error('User update error:', userError)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Grant subscription error:', error)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
