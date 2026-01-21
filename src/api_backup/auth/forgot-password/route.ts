import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase, generateToken, validateEmail } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    if (!validateEmail(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    const supabase = getServerSupabase()

    const { data: user, error } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email.toLowerCase())
      .single()

    if (!user) {
      return NextResponse.json({ 
        message: 'If an account exists with this email, you will receive a password reset link.' 
      })
    }

    const resetToken = generateToken()
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    await supabase
      .from('users')
      .update({
        password_reset_token: resetToken,
        password_reset_expires: resetExpires.toISOString()
      })
      .eq('id', user.id)

    return NextResponse.json({ 
      message: 'If an account exists with this email, you will receive a password reset link.',
      resetToken
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
