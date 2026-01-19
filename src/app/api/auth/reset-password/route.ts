import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase, hashPassword, validatePassword, invalidateAllUserSessions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { token, password, confirmPassword } = await request.json()

    if (!token || !password || !confirmPassword) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: 'Passwords do not match' }, { status: 400 })
    }

    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      return NextResponse.json({ error: passwordValidation.message }, { status: 400 })
    }

    const supabase = getServerSupabase()

    const { data: user, error } = await supabase
      .from('users')
      .select('id, password_reset_expires')
      .eq('password_reset_token', token)
      .single()

    if (error || !user) {
      return NextResponse.json({ error: 'Invalid or expired reset token' }, { status: 400 })
    }

    if (new Date(user.password_reset_expires) < new Date()) {
      return NextResponse.json({ error: 'Reset token has expired. Please request a new one.' }, { status: 400 })
    }

    const passwordHash = await hashPassword(password)

    const { error: updateError } = await supabase
      .from('users')
      .update({
        password_hash: passwordHash,
        password_reset_token: null,
        password_reset_expires: null
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Password reset error:', updateError)
      return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 })
    }

    await invalidateAllUserSessions(user.id)

    return NextResponse.json({ message: 'Password reset successfully. You can now log in with your new password.' })
  } catch (error) {
    console.error('Password reset error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
