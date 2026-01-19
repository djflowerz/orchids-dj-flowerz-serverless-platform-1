import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'

export async function withAuth(
  request: NextRequest,
  handler: (request: NextRequest, user: any) => Promise<NextResponse>
) {
  const token = request.cookies.get('session_token')?.value

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const session = await validateSession(token)
  if (!session) {
    return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 })
  }

  const user = session.users
  if (user.account_status === 'suspended') {
    return NextResponse.json({ error: 'Account suspended' }, { status: 403 })
  }

  return handler(request, user)
}

export async function withAdmin(
  request: NextRequest,
  handler: (request: NextRequest, user: any) => Promise<NextResponse>
) {
  return withAuth(request, async (req, user) => {
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }
    return handler(req, user)
  })
}

export async function withStaff(
  request: NextRequest,
  handler: (request: NextRequest, user: any) => Promise<NextResponse>
) {
  return withAuth(request, async (req, user) => {
    if (!['admin', 'staff'].includes(user.role)) {
      return NextResponse.json({ error: 'Staff access required' }, { status: 403 })
    }
    return handler(req, user)
  })
}

export async function withSubscriber(
  request: NextRequest,
  handler: (request: NextRequest, user: any) => Promise<NextResponse>
) {
  return withAuth(request, async (req, user) => {
    if (!user.email_verified) {
      return NextResponse.json({ error: 'Email verification required' }, { status: 403 })
    }
    if (user.subscription_status !== 'active') {
      return NextResponse.json({ error: 'Active subscription required' }, { status: 403 })
    }
    return handler(req, user)
  })
}

export async function withVerifiedEmail(
  request: NextRequest,
  handler: (request: NextRequest, user: any) => Promise<NextResponse>
) {
  return withAuth(request, async (req, user) => {
    if (!user.email_verified) {
      return NextResponse.json({ error: 'Email verification required' }, { status: 403 })
    }
    return handler(req, user)
  })
}

export function withTierAccess(requiredTier: string) {
  const tierHierarchy: Record<string, number> = {
    'free': 0,
    'basic': 1,
    'pro': 2,
    'unlimited': 3
  }

  return async (
    request: NextRequest,
    handler: (request: NextRequest, user: any) => Promise<NextResponse>
  ) => {
    if (requiredTier === 'free') {
      const token = request.cookies.get('session_token')?.value
      if (token) {
        const session = await validateSession(token)
        if (session) {
          return handler(request, session.users)
        }
      }
      return handler(request, null)
    }

    return withSubscriber(request, async (req, user) => {
      const userTierLevel = tierHierarchy[user.subscription_tier || 'free'] || 0
      const requiredLevel = tierHierarchy[requiredTier] || 0

      if (user.role === 'admin' || userTierLevel >= requiredLevel) {
        return handler(req, user)
      }

      return NextResponse.json(
        { error: `${requiredTier} subscription required` },
        { status: 403 }
      )
    })
  }
}
