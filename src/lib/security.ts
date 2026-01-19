import { getServerSupabase } from './auth'
import crypto from 'crypto'

const RATE_LIMIT_WINDOW = 15 * 60 * 1000 // 15 minutes
const MAX_LOGIN_ATTEMPTS = 5
const MAX_API_REQUESTS = 100
const LOCKOUT_DURATION = 30 * 60 * 1000 // 30 minutes

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: Date
}

export async function checkRateLimit(
  identifier: string,
  endpoint: string,
  maxRequests: number = MAX_API_REQUESTS
): Promise<RateLimitResult> {
  const supabase = getServerSupabase()
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW)

  const { data: existing } = await supabase
    .from('rate_limits')
    .select('*')
    .eq('identifier', identifier)
    .eq('endpoint', endpoint)
    .gte('window_start', windowStart.toISOString())
    .single()

  if (existing) {
    if (existing.count >= maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(new Date(existing.window_start).getTime() + RATE_LIMIT_WINDOW)
      }
    }

    await supabase
      .from('rate_limits')
      .update({ count: existing.count + 1 })
      .eq('id', existing.id)

    return {
      allowed: true,
      remaining: maxRequests - existing.count - 1,
      resetAt: new Date(new Date(existing.window_start).getTime() + RATE_LIMIT_WINDOW)
    }
  }

  await supabase.from('rate_limits').insert({
    identifier,
    endpoint,
    count: 1,
    window_start: new Date().toISOString()
  })

  return {
    allowed: true,
    remaining: maxRequests - 1,
    resetAt: new Date(Date.now() + RATE_LIMIT_WINDOW)
  }
}

export async function recordLoginAttempt(
  email: string,
  ipAddress: string,
  userAgent: string,
  success: boolean
): Promise<void> {
  const supabase = getServerSupabase()

  await supabase.from('login_attempts').insert({
    email: email.toLowerCase(),
    ip_address: ipAddress,
    user_agent: userAgent,
    success
  })

  if (!success) {
    const recentFailures = await getRecentFailedAttempts(email, ipAddress)
    if (recentFailures >= MAX_LOGIN_ATTEMPTS) {
      await createSecurityAlert(
        'brute_force_attempt',
        'high',
        `Multiple failed login attempts detected for ${email} from IP ${ipAddress}`,
        { email, ipAddress, attempts: recentFailures }
      )
    }
  }
}

export async function getRecentFailedAttempts(email: string, ipAddress: string): Promise<number> {
  const supabase = getServerSupabase()
  const windowStart = new Date(Date.now() - LOCKOUT_DURATION)

  const { count } = await supabase
    .from('login_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('email', email.toLowerCase())
    .eq('success', false)
    .gte('created_at', windowStart.toISOString())

  const { count: ipCount } = await supabase
    .from('login_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('ip_address', ipAddress)
    .eq('success', false)
    .gte('created_at', windowStart.toISOString())

  return Math.max(count || 0, ipCount || 0)
}

export async function isAccountLocked(email: string, ipAddress: string): Promise<boolean> {
  const failures = await getRecentFailedAttempts(email, ipAddress)
  return failures >= MAX_LOGIN_ATTEMPTS
}

export async function createSecurityAlert(
  alertType: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  message: string,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  const supabase = getServerSupabase()

  await supabase.from('security_alerts').insert({
    alert_type: alertType,
    severity,
    message,
    metadata
  })

  if (severity === 'high' || severity === 'critical') {
    await sendTelegramAlert(alertType, message, metadata)
  }
}

async function sendTelegramAlert(
  alertType: string,
  message: string,
  metadata: Record<string, unknown>
): Promise<void> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID

  if (!botToken || !chatId) return

  try {
    const text = `🚨 *Security Alert*\n\n*Type:* ${alertType}\n*Message:* ${message}\n*Details:* ${JSON.stringify(metadata, null, 2)}`
    
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'Markdown'
      })
    })
  } catch (error) {
    console.error('Failed to send Telegram alert:', error)
  }
}

export function generateSignedUrl(
  filePath: string,
  expiresInSeconds: number = 3600
): { url: string; signature: string; expires: number } {
  const expires = Math.floor(Date.now() / 1000) + expiresInSeconds
  const secret = process.env.DOWNLOAD_SECRET || 'default-secret-change-me'
  const data = `${filePath}:${expires}`
  const signature = crypto.createHmac('sha256', secret).update(data).digest('hex')

  return {
    url: `/api/downloads/secure?path=${encodeURIComponent(filePath)}&expires=${expires}&sig=${signature}`,
    signature,
    expires
  }
}

export function verifySignedUrl(
  filePath: string,
  expires: number,
  signature: string
): boolean {
  if (expires < Math.floor(Date.now() / 1000)) {
    return false
  }

  const secret = process.env.DOWNLOAD_SECRET || 'default-secret-change-me'
  const data = `${filePath}:${expires}`
  const expectedSignature = crypto.createHmac('sha256', secret).update(data).digest('hex')

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}

export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim()
}

export function sanitizeHtml(html: string): string {
  const allowedTags = ['p', 'br', 'b', 'i', 'u', 'strong', 'em', 'ul', 'ol', 'li', 'a']
  const tagRegex = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi

  return html.replace(tagRegex, (match, tag) => {
    if (allowedTags.includes(tag.toLowerCase())) {
      if (tag.toLowerCase() === 'a') {
        return match.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, '')
      }
      return match
    }
    return ''
  })
}

export function validateFileType(filename: string, allowedTypes: string[]): boolean {
  const ext = filename.split('.').pop()?.toLowerCase()
  return ext ? allowedTypes.includes(ext) : false
}

export function validateFileSize(sizeInBytes: number, maxSizeMB: number): boolean {
  return sizeInBytes <= maxSizeMB * 1024 * 1024
}

export async function logAdminAction(
  adminId: string,
  action: string,
  entityType: string,
  entityId: string | null,
  details: Record<string, unknown>,
  ipAddress?: string
): Promise<void> {
  const supabase = getServerSupabase()

  await supabase.from('admin_logs').insert({
    admin_id: adminId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    details,
    ip_address: ipAddress
  })
}

export async function cleanupExpiredRateLimits(): Promise<void> {
  const supabase = getServerSupabase()
  const cutoff = new Date(Date.now() - RATE_LIMIT_WINDOW * 2)

  await supabase
    .from('rate_limits')
    .delete()
    .lt('window_start', cutoff.toISOString())
}

export async function cleanupOldLoginAttempts(): Promise<void> {
  const supabase = getServerSupabase()
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days

  await supabase
    .from('login_attempts')
    .delete()
    .lt('created_at', cutoff.toISOString())
}
