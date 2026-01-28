"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { account, client } from '@/lib/appwrite'
import { ID, Models, OAuthProvider } from 'appwrite'
import { toast } from 'sonner' // switched to sonner based on login page usage

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
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkUser()
  }, [])

  async function checkUser() {
    try {
      const accountData = await account.get()
      setUser(mapAppwriteUser(accountData))
    } catch (error) {
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  function mapAppwriteUser(accountData: Models.User<Models.Preferences>): User {
    const prefs = accountData.prefs as any;
    return {
      id: accountData.$id,
      name: accountData.name,
      email: accountData.email,
      image: null, // Appwrite doesn't store user avatar URL in basic account object
      role: prefs?.role || 'user',
      emailVerified: accountData.emailVerification,
      createdAt: accountData.$createdAt,
      subscription_status: prefs?.subscription_status || 'none',
      subscription_tier: prefs?.subscription_tier
    }
  }

  async function handleSignIn(email: string, password: string) {
    try {
      // Delete existing session if any to avoid 401/409
      try {
        await account.deleteSession('current')
      } catch { }

      await account.createEmailPasswordSession(email, password)
      const user = await account.get()
      setUser(mapAppwriteUser(user))

      toast.success('Signed in successfully')
      return { error: null, redirectTo: '/' }
    } catch (err: any) {
      return { error: err.message || 'Login failed' }
    }
  }

  async function handleSignUp(email: string, password: string, name: string) {
    try {
      await account.create(ID.unique(), email, password, name)
      // Auto login after signup
      await handleSignIn(email, password)
      // Optionally trigger verification
      // await account.createVerification('http://localhost:3000/verify-email');

      return { error: null }
    } catch (err: any) {
      return { error: err.message || 'Signup failed' }
    }
  }

  async function handleSignOut() {
    try {
      await account.deleteSession('current')
      setUser(null)
      router.push('/login')
      toast.success('Signed out')
    } catch (err) {
      console.error(err)
    }
  }

  async function signInWithGoogle() {
    try {
      // OAuth2 redirects the browser, so this function might not return in the same flow
      account.createOAuth2Session(
        OAuthProvider.Google,
        `${window.location.origin}/`, // Success URL
        `${window.location.origin}/login` // Failure URL
      )
      return { error: null }
    } catch (err: any) {
      return { error: err.message || 'Google sign in failed' }
    }
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
