import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ error: 'Verification token is required' }, { status: 400 })
    }

    const supabase = getServerSupabase()

    const { data: user, error } = await supabase
      .from('users')
      .select('id, email_verification_expires')
      .eq('email_verification_token', token)
      .single()

    if (error || !user) {
      return NextResponse.json({ error: 'Invalid or expired verification token' }, { status: 400 })
    }

    if (new Date(user.email_verification_expires) < new Date()) {
      return NextResponse.json({ error: 'Verification token has expired. Please request a new one.' }, { status: 400 })
    }

    const { error: updateError } = await supabase
      .from('users')
      .update({
        email_verified: true,
        account_status: 'active',
        email_verification_token: null,
        email_verification_expires: null
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Verification update error:', updateError)
      return NextResponse.json({ error: 'Failed to verify email' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Email verified successfully. You can now log in.' })
  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
