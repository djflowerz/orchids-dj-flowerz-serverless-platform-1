import { auth, currentUser } from '@clerk/nextjs/server'
import { cache } from 'react'

export const getCurrentUser = cache(async () => {
  try {
    const user = await currentUser()
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
  const email = user.emailAddresses?.[0]?.emailAddress

  if (email !== 'ianmuriithiflowerz@gmail.com') {
    // Optionally check user.publicMetadata.role === 'admin'
    throw new Error('Admin access required')
  }
  return user
}

export async function isAdmin(user: { emailAddresses?: Array<{ emailAddress: string }> } | null): Promise<boolean> {
  if (!user) return false
  const email = user.emailAddresses?.[0]?.emailAddress
  return email === 'ianmuriithiflowerz@gmail.com'
}

