import { NextResponse } from 'next/server'
import { getCurrentUser, getServerSupabase, isAdmin } from '@/lib/auth'
import crypto from 'crypto'

function generateSecret(): string {
  const buffer = crypto.randomBytes(20)
  const base32chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  let secret = ''
  for (let i = 0; i < buffer.length; i++) {
    secret += base32chars[buffer[i] % 32]
  }
  return secret
}

function base32Decode(secret: string): Buffer {
  const base32chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  let bits = ''
  const cleanSecret = secret.toUpperCase().replace(/[^A-Z2-7]/g, '')
  
  for (const char of cleanSecret) {
    const val = base32chars.indexOf(char)
    if (val === -1) continue
    bits += val.toString(2).padStart(5, '0')
  }
  
  const bytes: number[] = []
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.substring(i, i + 8), 2))
  }
  
  return Buffer.from(bytes)
}

function generateTOTP(secret: string, time: number = Date.now()): string {
  const counter = Math.floor(time / 1000 / 30)
  const counterBuffer = Buffer.alloc(8)
  counterBuffer.writeBigInt64BE(BigInt(counter))
  
  const key = base32Decode(secret)
  const hmac = crypto.createHmac('sha1', key)
  hmac.update(counterBuffer)
  const hash = hmac.digest()
  
  const offset = hash[hash.length - 1] & 0xf
  const code = (
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff)
  ) % 1000000
  
  return code.toString().padStart(6, '0')
}

function verifyTOTP(secret: string, code: string): boolean {
  const now = Date.now()
  for (let i = -1; i <= 1; i++) {
    const expectedCode = generateTOTP(secret, now + i * 30000)
    if (expectedCode === code) return true
  }
  return false
}

export async function GET() {
  const user = await getCurrentUser()
  if (!user || !await isAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getServerSupabase()
  const { data: userData } = await supabase
    .from('users')
    .select('two_factor_enabled')
    .eq('id', user.id)
    .single()

  return NextResponse.json({ 
    enabled: userData?.two_factor_enabled || false
  })
}

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user || !await isAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { action, code } = await request.json()
  const supabase = getServerSupabase()

  if (action === 'setup') {
    const secret = generateSecret()
    
    await supabase
      .from('users')
      .update({ two_factor_secret: secret })
      .eq('id', user.id)

    const otpauthUrl = `otpauth://totp/DJ%20FLOWERZ:${encodeURIComponent(user.email)}?secret=${secret}&issuer=DJ%20FLOWERZ&algorithm=SHA1&digits=6&period=30`

    return NextResponse.json({ 
      secret,
      otpauthUrl,
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauthUrl)}`
    })
  }

  if (action === 'verify') {
    if (!code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 })
    }

    const { data: userData } = await supabase
      .from('users')
      .select('two_factor_secret')
      .eq('id', user.id)
      .single()

    if (!userData?.two_factor_secret) {
      return NextResponse.json({ error: 'Please setup 2FA first' }, { status: 400 })
    }

    const isValid = verifyTOTP(userData.two_factor_secret, code)

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid code' }, { status: 400 })
    }

    await supabase
      .from('users')
      .update({ two_factor_enabled: true })
      .eq('id', user.id)

    await supabase.from('admin_logs').insert({
      admin_id: user.id,
      action: 'enable_2fa',
      entity_type: 'user',
      entity_id: user.id,
      details: {}
    })

    return NextResponse.json({ success: true, enabled: true })
  }

  if (action === 'disable') {
    if (!code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 })
    }

    const { data: userData } = await supabase
      .from('users')
      .select('two_factor_secret')
      .eq('id', user.id)
      .single()

    if (!userData?.two_factor_secret) {
      return NextResponse.json({ error: '2FA not enabled' }, { status: 400 })
    }

    const isValid = verifyTOTP(userData.two_factor_secret, code)

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid code' }, { status: 400 })
    }

    await supabase
      .from('users')
      .update({ 
        two_factor_enabled: false,
        two_factor_secret: null 
      })
      .eq('id', user.id)

    await supabase.from('admin_logs').insert({
      admin_id: user.id,
      action: 'disable_2fa',
      entity_type: 'user',
      entity_id: user.id,
      details: {}
    })

    return NextResponse.json({ success: true, enabled: false })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
