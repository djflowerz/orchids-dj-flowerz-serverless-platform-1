"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { authClient, signIn, signOut, signUp } from '@/lib/auth-client'
import { toast } from 'react-hot-toast'

interface User {
  id: string
  name: string
  email: string
  image: string | null
  role: string | null
  emailVerified: boolean
  createdAt: Date
  // Custom fields might need to be fetched separately if not in session object
  subscription_status?: string
  subscription_tier?: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null; redirectTo?: string }>
  signUp: (email: string, password: string, name: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  signInWithGoogle: () => Promise<{ error: string | null }>
  isAdmin: boolean
  checkTierAccess: (requiredTier: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()

  // Use Better Auth hook directly
  const { data: sessionData, isPending, error } = authClient.useSession()

  // Derived state from session
  const user = sessionData?.user ? {
    id: sessionData.user.id,
    name: sessionData.user.name,
    email: sessionData.user.email,
    image: sessionData.user.image || null,
    role: (sessionData.user as any).role || 'user',
    emailVerified: sessionData.user.emailVerified,
    createdAt: sessionData.user.createdAt,
    subscription_status: (sessionData.user as any).subscription_status || 'none',
    subscription_tier: (sessionData.user as any).subscription_tier
  } as User : null

  const isLoading = isPending

  async function handleSignIn(email: string, password: string) {
    try {
      const res = await signIn.email({
        email,
        password,
        callbackURL: '/'
      }, {
        onSuccess: () => {
          toast.success('Signed in successfully')
          router.push('/')
        },
        onError: (ctx) => {
          toast.error(ctx.error.message)
        }
      })
      if (res.error) return { error: res.error.message }
      return { error: null }
    } catch (err: any) {
      return { error: err.message || 'Login failed' }
    }
  }

  async function handleSignUp(email: string, password: string, name: string) {
    try {
      const res = await signUp.email({
        email,
        password,
        name,
        callbackURL: '/login' // We hijack this flow below
      }, {
        onSuccess: async () => {
          // Immediately trigger OTP send
          try {
            await fetch('/api/auth/send-otp', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email }),
            });
            toast.success('Account created! Code sent.');
            router.push(`/verify-email?email=${encodeURIComponent(email)}`)
          } catch (e) {
            console.error("Failed to send initial OTP", e)
            toast.error('Account created, but failed to send OTP. Please login and request new code.')
            router.push('/login')
          }
        },
        onError: (ctx) => {
          toast.error(ctx.error.message)
        }
      })
      if (res.error) return { error: res.error.message }
      return { error: null }
    } catch (err: any) {
      return { error: err.message || 'Signup failed' }
    }
  }

  async function handleSignOut() {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push('/login')
          toast.success('Signed out')
        }
      }
    })
  }

  async function signInWithGoogle() {
    const res = await signIn.social({
      provider: 'google',
      callbackURL: '/'
    })
    if (res.error) return { error: res.error.message || 'Unknown error' }
    return { error: null }
  }

  // Tier logic
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

  const isAdmin = user?.email === 'ianmuriithiflowerz@gmail.com'

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      signIn: handleSignIn,
      signUp: handleSignUp,
      signOut: handleSignOut,
      signInWithGoogle,
      isAdmin,
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
