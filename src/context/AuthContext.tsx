"use client"

import { createContext, useContext, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useUser, useClerk } from '@clerk/nextjs'
import { toast } from 'sonner'

interface User {
  id: string
  name: string
  email: string
  image: string | null
  role: string | null
  emailVerified: boolean
  createdAt: string
  subscription_status?: string
  subscription_tier?: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  loading: boolean
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
  const { user: clerkUser, isLoaded } = useUser()
  const { signOut: clerkSignOut, openSignIn } = useClerk()

  // Map Clerk user to our User interface
  const user: User | null = clerkUser ? {
    id: clerkUser.id,
    name: clerkUser.fullName || clerkUser.firstName || 'User',
    email: clerkUser.emailAddresses?.[0]?.emailAddress || '',
    image: clerkUser.imageUrl || null,
    role: (clerkUser.publicMetadata?.role as string) || 'user',
    emailVerified: clerkUser.emailAddresses?.[0]?.verification?.status === 'verified',
    createdAt: clerkUser.createdAt?.toString() || new Date().toISOString(),
    subscription_status: (clerkUser.publicMetadata?.subscription_status as string) || 'none',
    subscription_tier: (clerkUser.publicMetadata?.subscription_tier as string) || undefined
  } : null

  const isAdmin = user?.email === 'ianmuriithiflowerz@gmail.com' || user?.role === 'admin'

  async function handleSignIn(email: string, password: string) {
    try {
      // Clerk handles sign-in via components, redirect to sign-in page
      openSignIn({ redirectUrl: '/' })
      return { error: null, redirectTo: '/sign-in' }
    } catch (err: any) {
      return { error: err.message || 'Login failed' }
    }
  }

  async function handleSignUp(email: string, password: string, name: string) {
    try {
      // Clerk handles sign-up via components, redirect to sign-up page
      router.push('/sign-up')
      return { error: null }
    } catch (err: any) {
      return { error: err.message || 'Signup failed' }
    }
  }

  async function handleSignOut() {
    try {
      await clerkSignOut()
      toast.success('Signed out successfully')
      router.push('/')
    } catch (err: any) {
      toast.error('Failed to sign out')
    }
  }

  async function handleSignInWithGoogle() {
    try {
      // Clerk handles OAuth via components
      openSignIn({ redirectUrl: '/' })
      return { error: null }
    } catch (err: any) {
      return { error: err.message || 'Google sign-in failed' }
    }
  }

  function checkTierAccess(requiredTier: string): boolean {
    if (!user) return false
    if (isAdmin) return true

    const tierHierarchy: Record<string, number> = {
      'basic': 1,
      'pro': 2,
      'unlimited': 3
    }

    const userTierLevel = tierHierarchy[user.subscription_tier || 'basic'] || 0
    const requiredTierLevel = tierHierarchy[requiredTier] || 0

    return userTierLevel >= requiredTierLevel
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading: !isLoaded,
        loading: !isLoaded,
        signIn: handleSignIn,
        signUp: handleSignUp,
        signOut: handleSignOut,
        signInWithGoogle: handleSignInWithGoogle,
        isAdmin,
        checkTierAccess
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
