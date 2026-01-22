"use client"

import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock, ArrowRight, Eye, EyeOff, Phone, X } from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmationResult } from 'firebase/auth'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [socialLoading, setSocialLoading] = useState<string | null>(null)
  const [showPhoneModal, setShowPhoneModal] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null)
  const [phoneStep, setPhoneStep] = useState<'phone' | 'code'>('phone')
  const { signIn, signInWithGoogle, signInWithApple, sendPhoneCode, verifyPhoneCode } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (rememberMe) {
      localStorage.setItem('rememberedEmail', email)
    } else {
      localStorage.removeItem('rememberedEmail')
    }

    const result = await signIn(email, password)

    if (result.error) {
      toast.error(result.error)
      setLoading(false)
      return
    }

    toast.success('Welcome back!')
    router.push(result.redirectTo || '/')
  }

  const handleGoogleSignIn = async () => {
    setSocialLoading('google')
    const result = await signInWithGoogle()

    if (result.error) {
      toast.error(result.error)
      setSocialLoading(null)
    }
    // Redirect is handled automatically by Firebase
  }

  const handleAppleSignIn = async () => {
    setSocialLoading('apple')
    const result = await signInWithApple()

    if (result.error) {
      toast.error(result.error)
      setSocialLoading(null)
    }
    // Redirect is handled automatically by Firebase
  }

  const handleSendPhoneCode = async () => {
    if (!phoneNumber) {
      toast.error('Please enter a phone number')
      return
    }

    setSocialLoading('phone')
    const result = await sendPhoneCode(phoneNumber, 'recaptcha-container')

    if (result.error) {
      toast.error(result.error)
      setSocialLoading(null)
      return
    }

    if (result.confirmationResult) {
      setConfirmationResult(result.confirmationResult)
      setPhoneStep('code')
      toast.success('Verification code sent!')
    }
    setSocialLoading(null)
  }

  const handleVerifyPhoneCode = async () => {
    if (!confirmationResult || !verificationCode) {
      toast.error('Please enter the verification code')
      return
    }

    setSocialLoading('phone')
    const result = await verifyPhoneCode(confirmationResult, verificationCode)

    if (result.error) {
      toast.error(result.error)
      setSocialLoading(null)
      return
    }

    toast.success('Welcome back!')
    setShowPhoneModal(false)
    router.push(result.redirectTo || '/')
  }

  const openPhoneModal = () => {
    setShowPhoneModal(true)
    setPhoneStep('phone')
    setPhoneNumber('')
    setVerificationCode('')
    setConfirmationResult(null)
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 py-12">
      <div id="recaptcha-container"></div>

      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-fuchsia-500 to-cyan-500 flex items-center justify-center">
              <span className="text-white font-black text-lg">DJ</span>
            </div>
          </Link>
          <h1 className="font-display text-4xl text-white mb-2">WELCOME BACK</h1>
          <p className="text-white/60">Sign in to your account</p>
        </div>

        <div className="space-y-3 mb-6">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={socialLoading !== null}
            className="w-full py-3 px-4 rounded-xl bg-white text-gray-900 font-medium hover:bg-gray-100 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {socialLoading === 'google' ? (
              <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleAppleSignIn}
            disabled={socialLoading !== null}
            className="w-full py-3 px-4 rounded-xl bg-white text-gray-900 font-medium hover:bg-gray-100 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {socialLoading === 'apple' ? (
              <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                </svg>
                Continue with Apple
              </>
            )}
          </button>

          <button
            type="button"
            onClick={openPhoneModal}
            disabled={socialLoading !== null}
            className="w-full py-3 px-4 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 transition-all disabled:opacity-50 flex items-center justify-center gap-3 border border-white/20"
          >
            <Phone size={20} />
            Continue with Phone
          </button>
        </div>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-black text-white/40">or continue with email</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          <input type="hidden" name="formType" value="login" />
          <div>
            <label className="block text-white/70 text-sm mb-2">Email</label>
            <div className="relative">
              <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                autoComplete="username"
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-fuchsia-500/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-white/70 text-sm mb-2">Password</label>
            <div className="relative">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="w-full pl-11 pr-12 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-fuchsia-500/50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-white/5 text-fuchsia-500 focus:ring-fuchsia-500/50 focus:ring-offset-0 cursor-pointer"
              />
              <span className="text-white/60 text-sm">Remember me</span>
            </label>
            <Link
              href="/forgot-password"
              className="text-fuchsia-400 hover:text-fuchsia-300 text-sm transition-colors"
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white font-semibold hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                Sign In
                <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-white/50 mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-fuchsia-400 hover:text-fuchsia-300">
            Sign up
          </Link>
        </p>
      </div>

      {showPhoneModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4">
          <div className="bg-zinc-900 rounded-2xl p-6 max-w-sm w-full border border-white/10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">
                {phoneStep === 'phone' ? 'Enter Phone Number' : 'Enter Code'}
              </h2>
              <button
                onClick={() => setShowPhoneModal(false)}
                className="text-white/40 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            {phoneStep === 'phone' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-white/70 text-sm mb-2">Phone Number</label>
                  <div className="relative">
                    <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+1 234 567 8900"
                      className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-fuchsia-500/50"
                    />
                  </div>
                  <p className="text-white/40 text-xs mt-2">Include country code (e.g., +1 for US)</p>
                </div>
                <button
                  onClick={handleSendPhoneCode}
                  disabled={socialLoading === 'phone'}
                  className="w-full py-3 rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white font-semibold hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {socialLoading === 'phone' ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Send Code'
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-white/70 text-sm mb-2">Verification Code</label>
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="123456"
                    maxLength={6}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-center text-2xl tracking-widest placeholder:text-white/40 focus:outline-none focus:border-fuchsia-500/50"
                  />
                  <p className="text-white/40 text-xs mt-2">Enter the 6-digit code sent to {phoneNumber}</p>
                </div>
                <button
                  onClick={handleVerifyPhoneCode}
                  disabled={socialLoading === 'phone'}
                  className="w-full py-3 rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white font-semibold hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {socialLoading === 'phone' ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Verify & Sign In'
                  )}
                </button>
                <button
                  onClick={() => setPhoneStep('phone')}
                  className="w-full py-2 text-white/50 hover:text-white text-sm"
                >
                  Use a different phone number
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
