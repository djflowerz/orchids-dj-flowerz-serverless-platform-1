import { createSessionClient } from '@/lib/appwrite'
import { cache } from 'react'

export const getCurrentUser = cache(async () => {
  try {
    const { account } = await createSessionClient()
    const user = await account.get()
    return user
  } catch (error) {
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

export async function requireAdmin() {
  const user = await requireAuth()
  if (user.email !== 'ianmuriithiflowerz@gmail.com') {
    // Optionally check user.prefs.role === 'admin'
    throw new Error('Admin access required')
  }
  return user
}

export async function isAdmin(user: { email?: string } | null): Promise<boolean> {
  if (!user) return false
  return user.email === 'ianmuriithiflowerz@gmail.com'
}
