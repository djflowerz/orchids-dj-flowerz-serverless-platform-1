import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware'
import { getServerSupabase } from '@/lib/auth'

export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    const supabase = getServerSupabase()

    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching subscription:', error)
      return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 })
    }

    return NextResponse.json({ subscription: subscription || null })
  })
}
