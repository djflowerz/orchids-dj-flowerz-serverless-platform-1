import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, getServerSupabase } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
    const { userId, status } = await request.json()

    if (!userId || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = getServerSupabase()

    const { error } = await supabase
      .from('users')
      .update({ account_status: status })
      .eq('id', userId)

    if (error) {
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
