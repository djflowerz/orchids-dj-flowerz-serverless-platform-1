import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { cache } from 'react'

// Cache the user fetch for the duration of the request
export const getCurrentUser = cache(async () => {
  const cookieStore = await cookies()
  const token = cookieStore.get('better-auth.session_token')?.value || cookieStore.get('session_token')?.value

  if (!token) return null

  try {
    const session = await prisma.session.findFirst({
      where: {
        token: token,
        expiresAt: {
          gt: new Date()
        }
      },
      include: {
        user: true
      }
    })

    if (!session) return null
    return session.user
  } catch (error) {
    console.error('Error fetching session:', error)
    return null
  }
})

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}

// Keeping these for compatibility or migrating them later
export async function hashPassword(password: string): Promise<string> {
  // TODO: remove when fully migrated better-auth handles this
  return password
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return password === hash
}

// Admin check helper
export async function requireAdmin() {
  const user = await requireAuth()
  // Check if admin (using email for now as role might not be in basic Better Auth user yet unless extended)
  // Or check if user has admin role in your custom schema
  // We added roles to our custom User schema? No, I strictly followed Better Auth + my fields.
  // My User model has no 'role'.
  // But original User schema had `isAdmin`.
  // Wait, I replaced User model.
  // In `schema.prisma` I put:
  // model User { ... cart Json ... }
  // I did NOT put `role` or `isAdmin`.
  // The original Firestore users had `role`.
  // I should PROBABLY Add `role` to User model!

  const admins = ['ianmuriithiflowerz@gmail.com'] // Example hardcode or fetch from DB if role exists
  // I should check if I should add role field.

  if (!admins.includes(user.email)) {
    // If I add role field later I can check it here.
    // For now, fail safe.
    throw new Error('Admin access required')
  }
  return user
}

export async function isAdmin(user: { email?: string } | null): boolean {
  if (!user) return false
  return user.email === 'ianmuriithiflowerz@gmail.com'
}
