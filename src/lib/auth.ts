import bcrypt from 'bcrypt'
import { cookies } from 'next/headers'

let adminDb: FirebaseFirestore.Firestore | null = null

async function getAdminDb() {
  if (adminDb) return adminDb
  
  try {
    const { adminDb: db } = await import('./firebase-admin')
    adminDb = db
    return adminDb
  } catch (error) {
    console.error('Firebase Admin init error:', error)
    return null
  }
}

export async function getServerFirestore() {
  return await getAdminDb()
}

export function getServerSupabase() {
  // This is a placeholder to fix build errors. 
  // In this project, Firebase is used as the primary database.
  // We return the adminDb but note that it uses Firestore syntax, not Supabase.
  return adminDb
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let token = ''
  for (let i = 0; i < 64; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return token
}

export function generateVerificationToken(): string {
  return generateToken()
}

export async function createSession(userId: string, ipAddress?: string, userAgent?: string) {
  const db = await getServerFirestore()
  if (!db) throw new Error('Database not available')
  
  const token = generateToken()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  const sessionRef = db.collection('sessions').doc()
  await sessionRef.set({
    user_id: userId,
    token,
    ip_address: ipAddress || null,
    user_agent: userAgent || null,
    expires_at: expiresAt.toISOString(),
    created_at: new Date().toISOString()
  })

  return { token, expiresAt }
}

export async function validateSession(token: string) {
  const db = await getServerFirestore()
  if (!db) return null
  
  const sessionsSnapshot = await db.collection('sessions')
    .where('token', '==', token)
    .limit(1)
    .get()

  if (sessionsSnapshot.empty) return null

  const sessionDoc = sessionsSnapshot.docs[0]
  const session = { id: sessionDoc.id, ...sessionDoc.data() }
  
  if (new Date(session.expires_at as string) < new Date()) {
    await sessionDoc.ref.delete()
    return null
  }

  const userDoc = await db.collection('users').doc(session.user_id as string).get()
  if (!userDoc.exists) return null

  return {
    ...session,
    users: { id: userDoc.id, ...userDoc.data() }
  }
}

export async function invalidateSession(token: string) {
  const db = await getServerFirestore()
  if (!db) return
  
  const sessionsSnapshot = await db.collection('sessions')
    .where('token', '==', token)
    .get()
  
  const batch = db.batch()
  sessionsSnapshot.docs.forEach(doc => batch.delete(doc.ref))
  await batch.commit()
}

export async function invalidateAllUserSessions(userId: string) {
  const db = await getServerFirestore()
  if (!db) return
  
  const sessionsSnapshot = await db.collection('sessions')
    .where('user_id', '==', userId)
    .get()
  
  const batch = db.batch()
  sessionsSnapshot.docs.forEach(doc => batch.delete(doc.ref))
  await batch.commit()
}

export async function getCurrentUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get('session_token')?.value
  
  if (!token) return null
  
  const session = await validateSession(token)
  if (!session) return null
  
  return session.users
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}

export async function requireAdmin() {
  const user = await requireAuth()
  if ((user as { role?: string }).role !== 'admin') {
    throw new Error('Admin access required')
  }
  return user
}

export async function requireSubscriber() {
  const user = await requireAuth() as { role?: string; subscription_status?: string }
  if (!['subscriber', 'admin'].includes(user.role || '')) {
    throw new Error('Subscription required')
  }
  if (user.subscription_status !== 'active') {
    throw new Error('Active subscription required')
  }
  return user
}

export function isAdmin(user: { role?: string; email?: string } | null): boolean {
  if (!user) return false
  return user.role === 'admin' || user.email === 'ianmuriithiflowerz@gmail.com'
}

export function validatePassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters' }
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' }
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' }
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' }
  }
  return { valid: true }
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}
