"use client"

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { auth, db } from '@/lib/firebase'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult
} from 'firebase/auth'
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { toast } from 'sonner'

const INACTIVITY_TIMEOUT = 15 * 60 * 1000 // 15 minutes

const ADMIN_EMAIL = 'ianmuriithiflowerz@gmail.com'

interface User {
  id: string
  name: string
  email: string
  role: 'guest' | 'user' | 'subscriber' | 'admin' | 'staff'
  email_verified: boolean
  subscription_status: 'none' | 'active' | 'expired' | 'cancelled'
  subscription_tier: 'basic' | 'pro' | 'unlimited' | null
  subscription_expires_at: string | null
  account_status: 'unverified' | 'active' | 'suspended'
  telegram_user_id: string | null
  telegram_username: string | null
  created_at: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null; redirectTo?: string }>
  signUp: (email: string, password: string, name: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  signInWithGoogle: () => Promise<{ error: string | null; redirectTo?: string }>
  signInWithApple: () => Promise<{ error: string | null; redirectTo?: string }>
  sendPhoneCode: (phoneNumber: string, recaptchaContainerId: string) => Promise<{ error: string | null; confirmationResult?: ConfirmationResult }>
  verifyPhoneCode: (confirmationResult: ConfirmationResult, code: string) => Promise<{ error: string | null; redirectTo?: string }>
  refreshUser: () => Promise<void>
  isAdmin: boolean
  hasActiveSubscription: boolean
  canAccessMusicPool: boolean
  checkTierAccess: (requiredTier: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

async function getUserProfile(firebaseUser: FirebaseUser): Promise<User | null> {
  try {
    const userDocRef = doc(db, 'users', firebaseUser.uid)
    const userDoc = await getDoc(userDocRef)

    if (userDoc.exists()) {
      const userData = userDoc.data()
      return {
        id: firebaseUser.uid,
        name: userData.name || firebaseUser.displayName || '',
        email: firebaseUser.email || '',
        role: userData.role || 'user',
        email_verified: firebaseUser.emailVerified,
        subscription_status: userData.subscription_status || 'none',
        subscription_tier: userData.subscription_tier || null,
        subscription_expires_at: userData.subscription_expires_at || null,
        account_status: userData.account_status || 'active',
        telegram_user_id: userData.telegram_user_id || null,
        telegram_username: userData.telegram_username || null,
        created_at: userData.created_at || new Date().toISOString()
      }
    }

    const newUser: Omit<User, 'id'> = {
      name: firebaseUser.displayName || '',
      email: firebaseUser.email || '',
      role: firebaseUser.email === ADMIN_EMAIL ? 'admin' : 'user',
      email_verified: firebaseUser.emailVerified,
      subscription_status: 'none',
      subscription_tier: null,
      subscription_expires_at: null,
      account_status: 'active',
      telegram_user_id: null,
      telegram_username: null,
      created_at: new Date().toISOString()
    }

    await setDoc(userDocRef, newUser)
    return { id: firebaseUser.uid, ...newUser }
  } catch (error) {
    console.error('Error getting user profile:', error)
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth)
        if (result) {
          const userProfile = await getUserProfile(result.user)
          if (userProfile) {
            setUser(userProfile)
            const userDocRef = doc(db, 'users', result.user.uid)
            await updateDoc(userDocRef, { last_login: new Date().toISOString() })
            router.push(userProfile.role === 'admin' ? '/admin' : '/dashboard')
          }
        }
      } catch (error) {
        console.error('Redirect result error:', error)
      }
    }

    handleRedirectResult()

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userProfile = await getUserProfile(firebaseUser)
        setUser(userProfile)
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [router])

  async function signIn(email: string, password: string) {
    try {
      setLoading(true)
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const userProfile = await getUserProfile(userCredential.user)

      if (userProfile) {
        setUser(userProfile)

        const userDocRef = doc(db, 'users', userCredential.user.uid)
        await updateDoc(userDocRef, { last_login: new Date().toISOString() })

        setLoading(false)
        return {
          error: null,
          redirectTo: userProfile.role === 'admin' ? '/admin' : '/dashboard'
        }
      }

      setLoading(false)
      return { error: 'Failed to get user profile' }
    } catch (err: unknown) {
      setLoading(false)
      const error = err as { code?: string; message?: string }
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        return { error: 'Invalid email or password' }
      }
      if (error.code === 'auth/too-many-requests') {
        return { error: 'Too many login attempts. Please try again later.' }
      }
      return { error: error.message || 'An unexpected error occurred' }
    }
  }

  async function signUp(email: string, password: string, name: string) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)

      const userDocRef = doc(db, 'users', userCredential.user.uid)
      await setDoc(userDocRef, {
        name,
        email,
        role: email === ADMIN_EMAIL ? 'admin' : 'user',
        email_verified: false,
        subscription_status: 'none',
        subscription_tier: null,
        subscription_expires_at: null,
        account_status: 'active',
        telegram_user_id: null,
        telegram_username: null,
        created_at: new Date().toISOString()
      })

      return { error: null }
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string }
      if (error.code === 'auth/email-already-in-use') {
        return { error: 'Email already registered' }
      }
      if (error.code === 'auth/weak-password') {
        return { error: 'Password is too weak' }
      }
      return { error: error.message || 'An unexpected error occurred' }
    }
  }

  async function signOut() {
    try {
      await firebaseSignOut(auth)
      setUser(null)
      router.push('/')
      toast.info('Signed out successfully')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  useEffect(() => {
    if (!user) return

    let inactivityTimer: NodeJS.Timeout

    const logoutUser = async () => {
      await firebaseSignOut(auth)
      setUser(null)
      router.push('/login')
      toast.warning('Session timed out due to inactivity')
    }

    const resetTimer = () => {
      if (inactivityTimer) clearTimeout(inactivityTimer)
      inactivityTimer = setTimeout(logoutUser, INACTIVITY_TIMEOUT)
    }

    resetTimer()

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart']
    const handleActivity = () => resetTimer()

    events.forEach(event => window.addEventListener(event, handleActivity))

    return () => {
      if (inactivityTimer) clearTimeout(inactivityTimer)
      events.forEach(event => window.removeEventListener(event, handleActivity))
    }
  }, [user, router])

  async function refreshUser() {
    const firebaseUser = auth.currentUser
    if (firebaseUser) {
      const userProfile = await getUserProfile(firebaseUser)
      setUser(userProfile)
    }
  }

  async function signInWithGoogle() {
    try {
      setLoading(true)
      const provider = new GoogleAuthProvider()
      await signInWithRedirect(auth, provider)
      return { error: null }
    } catch (err: unknown) {
      setLoading(false)
      const error = err as { code?: string; message?: string }
      return { error: error.message || 'An unexpected error occurred' }
    }
  }

  async function signInWithApple() {
    try {
      setLoading(true)
      const provider = new OAuthProvider('apple.com')
      provider.addScope('email')
      provider.addScope('name')
      await signInWithRedirect(auth, provider)
      return { error: null }
    } catch (err: unknown) {
      setLoading(false)
      const error = err as { code?: string; message?: string }
      return { error: error.message || 'An unexpected error occurred' }
    }
  }

  async function sendPhoneCode(phoneNumber: string, recaptchaContainerId: string) {
    try {
      const recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaContainerId, {
        size: 'invisible'
      })
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier)
      return { error: null, confirmationResult }
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string }
      if (error.code === 'auth/invalid-phone-number') {
        return { error: 'Invalid phone number format' }
      }
      if (error.code === 'auth/too-many-requests') {
        return { error: 'Too many requests. Please try again later.' }
      }
      return { error: error.message || 'Failed to send verification code' }
    }
  }

  async function verifyPhoneCode(confirmationResult: ConfirmationResult, code: string) {
    try {
      setLoading(true)
      const userCredential = await confirmationResult.confirm(code)
      const userProfile = await getUserProfile(userCredential.user)

      if (userProfile) {
        setUser(userProfile)
        const userDocRef = doc(db, 'users', userCredential.user.uid)
        await updateDoc(userDocRef, { last_login: new Date().toISOString() })
        setLoading(false)
        return {
          error: null,
          redirectTo: userProfile.role === 'admin' ? '/admin' : '/dashboard'
        }
      }

      setLoading(false)
      return { error: 'Failed to get user profile' }
    } catch (err: unknown) {
      setLoading(false)
      const error = err as { code?: string; message?: string }
      if (error.code === 'auth/invalid-verification-code') {
        return { error: 'Invalid verification code' }
      }
      return { error: error.message || 'Verification failed' }
    }
  }

  const tierHierarchy: Record<string, number> = {
    'free': 0,
    'basic': 1,
    'pro': 2,
    'unlimited': 3
  }

  function checkTierAccess(requiredTier: string): boolean {
    if (!user) return requiredTier === 'free'
    if (user.role === 'admin') return true
    if (user.subscription_status !== 'active') return requiredTier === 'free'

    const userTierLevel = tierHierarchy[user.subscription_tier || 'free'] || 0
    const requiredLevel = tierHierarchy[requiredTier] || 0

    return userTierLevel >= requiredLevel
  }

  const isAdmin = user?.role === 'admin' || user?.email === ADMIN_EMAIL
  const hasActiveSubscription = user?.subscription_status === 'active'
  const canAccessMusicPool = hasActiveSubscription && user?.email_verified && user?.account_status === 'active'

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signIn,
      signUp,
      signOut,
      signInWithGoogle,
      signInWithApple,
      sendPhoneCode,
      verifyPhoneCode,
      refreshUser,
      isAdmin,
      hasActiveSubscription,
      canAccessMusicPool,
      checkTierAccess
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
