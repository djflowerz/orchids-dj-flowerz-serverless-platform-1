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
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Use Better Auth hook
  const { data: sessionData, isPending, error } = authClient.useSession()

  useEffect(() => {
    if (!isPending) {
      if (sessionData?.user) {
        // Map session user to our User interface
        // Note: Better Auth session user might not have all fields if not configured in adapter
        // But we can fetch profile if needed.
        // For now, use what's in session + default role
        const u = sessionData.user
        setUser({
          id: u.id,
          name: u.name,
          email: u.email,
          image: u.image || null,
          role: (u as any).role || 'user', // Need role in session!
          emailVerified: u.emailVerified,
          createdAt: u.createdAt,
          subscription_status: (u as any).subscription_status || 'none'
        })
      } else {
        setUser(null)
      }
      setLoading(false)
    }
  }, [sessionData, isPending])

  async function handleSignIn(email: string, password: string) {
    try {
      setLoading(true)
      const res = await signIn.email({
        email,
        password,
        callbackURL: '/' // Redirect handled by client or manual
      }, {
        onSuccess: () => {
          toast.success('Signed in successfully')
          router.push('/')
        },
        onError: (ctx) => {
          toast.error(ctx.error.message)
        }
      })
      // If error, better-auth throws or proper handling?
      if (res.error) {
        return { error: res.error.message }
      }
      return { error: null }

    } catch (err: any) {
      return { error: err.message || 'Login failed' }
    } finally {
      setLoading(false)
    }
  }

  async function handleSignUp(email: string, password: string, name: string) {
    try {
      setLoading(true)
      const res = await signUp.email({
        email,
        password,
        name,
        callbackURL: '/login'
      }, {
        onSuccess: () => {
          toast.success('Account created! Please verify your email.')
        },
        onError: (ctx) => {
          toast.error(ctx.error.message)
        }
      })
      if (res.error) return { error: res.error.message }
      return { error: null }
    } catch (err: any) {
      return { error: err.message || 'Signup failed' }
    } finally {
      setLoading(false)
    }
  }

  async function handleSignOut() {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          setUser(null)
          router.push('/login')
          toast.success('Signed out')
        }
      }
    })
  }

  async function signInWithGoogle() {
    // Check if configured? Assume yes via Neon Service
    const res = await signIn.social({
      provider: 'google',
      callbackURL: '/'
    })
    if (res.error) return { error: res.error.message }
    return { error: null }
  }

  // Tier logic (simplified for now, assumes role/status is in user object)
  const tierHierarchy: Record<string, number> = {
    'free': 0,
    'basic': 1,
    'pro': 2,
    'unlimited': 3
  }

  function checkTierAccess(requiredTier: string): boolean {
    if (!user) return requiredTier === 'free'
    if (user.role === 'admin') return true

    // Check Status
    if (user.subscription_status !== 'active') return requiredTier === 'free'

    const userTierLevel = tierHierarchy[user.subscription_tier || 'free'] || 0
    const requiredLevel = tierHierarchy[requiredTier] || 0
    return userTierLevel >= requiredLevel
  }

  const isAdmin = user?.email === 'ianmuriithiflowerz@gmail.com'

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signIn: handleSignIn,
      signUp: handleSignUp,
      signOut: handleSignOut,
      signInWithGoogle, // Implement others as needed
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
