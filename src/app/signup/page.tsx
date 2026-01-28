"use client"

import { useState, useMemo } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock, User, Eye, EyeOff, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { AuthInput } from '@/components/ui/AuthInput'

export default function SignupPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [socialLoading, setSocialLoading] = useState(false)
  const { signUp, signInWithGoogle } = useAuth()
  const router = useRouter()

  const passwordChecks = useMemo(() => ({
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
  }), [password])

  const passwordStrength = useMemo(() => {
    const passed = Object.values(passwordChecks).filter(Boolean).length
    if (passed <= 1) return { level: 'weak', color: 'bg-red-500', width: '25%' }
    if (passed <= 2) return { level: 'fair', color: 'bg-orange-500', width: '50%' }
    if (passed <= 3) return { level: 'good', color: 'bg-yellow-500', width: '75%' }
    return { level: 'strong', color: 'bg-green-500', width: '100%' }
  }, [passwordChecks])

  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (!passwordChecks.minLength) {
      toast.error('Password must be at least 8 characters')
      return
    }

    setLoading(true)

    const { error } = await signUp(email, password, name)

    if (error) {
      toast.error(error)
      setLoading(false)
      return
    }

    // Send OTP email
    try {
      const otpResponse = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (!otpResponse.ok) {
        const data = await otpResponse.json()
        toast.error(data.error || 'Failed to send verification email')
        setLoading(false)
        return
      }

      toast.success('Account created! Check your email for verification code.')
      router.push(`/verify-email?email=${encodeURIComponent(email)}`)
    } catch (otpError) {
      console.error('OTP send error:', otpError)
      toast.error('Account created but failed to send verification email. Please contact support.')
      setLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    setSocialLoading(true)
    const result = await signInWithGoogle()
    if (result.error) {
      toast.error(result.error)
      setSocialLoading(false)
    }
  }

  return (
    <AuthLayout title="Create Account" subtitle="Join thousands of DJs worldwide">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm text-gray-500 mb-2 ml-1">Full Name</label>
          <AuthInput
            type="text"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
            required
            autoComplete="name"
            icon={User}
          />
        </div>

        <div>
          <label className="block text-sm text-gray-500 mb-2 ml-1">Email Address</label>
          <AuthInput
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="john.doe@gmail.com"
            required
            autoComplete="username"
            icon={Mail}
            showValidation={email.length > 0}
            isValid={isEmailValid}
          />
        </div>

        <div>
          <label className="block text-sm text-gray-500 mb-2 ml-1">Password</label>
          <div className="relative">
            <AuthInput
              type={showPassword ? 'text' : 'password'}
              name="newPassword"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="new-password"
              icon={Lock}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors z-10"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {password && (
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${passwordStrength.color} transition-all duration-300`}
                    style={{ width: passwordStrength.width }}
                  />
                </div>
                <span className={`text-xs capitalize font-medium ${passwordStrength.level === 'weak' ? 'text-red-500' :
                  passwordStrength.level === 'fair' ? 'text-orange-500' :
                    passwordStrength.level === 'good' ? 'text-yellow-500' :
                      'text-green-500'
                  }`}>
                  {passwordStrength.level}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className={`flex items-center gap-1 ${passwordChecks.minLength ? 'text-green-600' : 'text-gray-400'}`}>
                  {passwordChecks.minLength ? <Check size={14} /> : <X size={14} />}
                  8+ characters
                </div>
                <div className={`flex items-center gap-1 ${passwordChecks.hasUppercase ? 'text-green-600' : 'text-gray-400'}`}>
                  {passwordChecks.hasUppercase ? <Check size={14} /> : <X size={14} />}
                  Uppercase
                </div>
                <div className={`flex items-center gap-1 ${passwordChecks.hasLowercase ? 'text-green-600' : 'text-gray-400'}`}>
                  {passwordChecks.hasLowercase ? <Check size={14} /> : <X size={14} />}
                  Lowercase
                </div>
                <div className={`flex items-center gap-1 ${passwordChecks.hasNumber ? 'text-green-600' : 'text-gray-400'}`}>
                  {passwordChecks.hasNumber ? <Check size={14} /> : <X size={14} />}
                  Number
                </div>
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm text-gray-500 mb-2 ml-1">Confirm Password</label>
          <div className="relative">
            <AuthInput
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              icon={Lock}
              showValidation={confirmPassword.length > 0}
              isValid={passwordsMatch}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-14 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors z-10"
            >
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !passwordsMatch || !passwordChecks.minLength}
          className="w-full h-14 rounded-2xl bg-black text-white font-semibold hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            'Create Account'
          )}
        </button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-500">OR</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={socialLoading}
            className="h-14 rounded-2xl bg-white border border-gray-200 hover:bg-gray-50 transition-all disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
          >
            {socialLoading ? (
              <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google
              </>
            )}
          </button>

          <button
            type="button"
            disabled
            className="h-14 rounded-2xl bg-white border border-gray-200 hover:bg-gray-50 transition-all disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
            </svg>
            Apple
          </button>
        </div>

        <p className="text-center text-gray-500 text-sm mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-black font-semibold hover:underline">
            Sign in
          </Link>
        </p>

        <p className="text-center text-gray-400 text-xs mt-4">
          By signing up, you agree to our{' '}
          <Link href="/terms" className="text-gray-600 hover:text-black">Terms</Link>
          {' '}and{' '}
          <Link href="/privacy" className="text-gray-600 hover:text-black">Privacy Policy</Link>
        </p>
      </form>
    </AuthLayout>
  )
}
