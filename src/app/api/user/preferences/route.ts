import { NextResponse } from 'next/server'
import { getCurrentUser, getServerSupabase } from '@/lib/auth'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getServerSupabase()
  const { data, error } = await supabase
    .from('users')
    .select('low_data_mode, two_factor_enabled')
    .eq('id', user.id)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ preferences: data })
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const updates = await request.json()
  const allowedFields = ['low_data_mode']
  
  const sanitizedUpdates: Record<string, unknown> = {}
  for (const key of allowedFields) {
    if (updates[key] !== undefined) {
      sanitizedUpdates[key] = updates[key]
    }
  }

  if (Object.keys(sanitizedUpdates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const supabase = getServerSupabase()
  const { data, error } = await supabase
    .from('users')
    .update(sanitizedUpdates)
    .eq('id', user.id)
    .select('low_data_mode, two_factor_enabled')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ preferences: data })
}
