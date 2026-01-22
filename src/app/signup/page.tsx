"use client"

import { useState, useMemo } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock, ArrowRight, User, Eye, EyeOff, Check, X } from 'lucide-react'
import { toast } from 'sonner'

export default function SignupPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { signUp } = useAuth()
  const router = useRouter()

  const passwordChecks = useMemo(() => ({
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  }), [password])

  const passwordStrength = useMemo(() => {
    const passed = Object.values(passwordChecks).filter(Boolean).length
    if (passed <= 1) return { level: 'weak', color: 'bg-red-500', width: '20%' }
    if (passed <= 2) return { level: 'fair', color: 'bg-orange-500', width: '40%' }
    if (passed <= 3) return { level: 'good', color: 'bg-yellow-500', width: '60%' }
    if (passed <= 4) return { level: 'strong', color: 'bg-green-500', width: '80%' }
    return { level: 'excellent', color: 'bg-emerald-500', width: '100%' }
  }, [passwordChecks])

  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0

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

    toast.info('Account created! Please check your email to verify your account before logging in.', {
      duration: 5000,
    })
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-fuchsia-500 to-cyan-500 flex items-center justify-center">
              <span className="text-white font-black text-lg">DJ</span>
            </div>
          </Link>
          <h1 className="font-display text-4xl text-white mb-2">JOIN THE MOVEMENT</h1>
          <p className="text-white/60">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="on">
          <div>
            <label className="block text-white/70 text-sm mb-2">Name</label>
            <div className="relative">
              <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
                autoComplete="name"
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-fuchsia-500/50"
              />
            </div>
          </div>

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
                name="newPassword"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="new-password"
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

            {password && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${passwordStrength.color} transition-all duration-300`}
                      style={{ width: passwordStrength.width }}
                    />
                  </div>
                  <span className={`text-xs capitalize ${passwordStrength.level === 'weak' ? 'text-red-400' :
                    passwordStrength.level === 'fair' ? 'text-orange-400' :
                      passwordStrength.level === 'good' ? 'text-yellow-400' :
                        'text-green-400'
                    }`}>
                    {passwordStrength.level}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  <div className={`flex items-center gap-1 ${passwordChecks.minLength ? 'text-green-400' : 'text-white/40'}`}>
                    {passwordChecks.minLength ? <Check size={12} /> : <X size={12} />}
                    8+ characters
                  </div>
                  <div className={`flex items-center gap-1 ${passwordChecks.hasUppercase ? 'text-green-400' : 'text-white/40'}`}>
                    {passwordChecks.hasUppercase ? <Check size={12} /> : <X size={12} />}
                    Uppercase
                  </div>
                  <div className={`flex items-center gap-1 ${passwordChecks.hasLowercase ? 'text-green-400' : 'text-white/40'}`}>
                    {passwordChecks.hasLowercase ? <Check size={12} /> : <X size={12} />}
                    Lowercase
                  </div>
                  <div className={`flex items-center gap-1 ${passwordChecks.hasNumber ? 'text-green-400' : 'text-white/40'}`}>
                    {passwordChecks.hasNumber ? <Check size={12} /> : <X size={12} />}
                    Number
                  </div>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-white/70 text-sm mb-2">Confirm Password</label>
            <div className="relative">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                className={`w-full pl-11 pr-12 py-3 rounded-xl bg-white/5 border text-white placeholder:text-white/40 focus:outline-none transition-colors ${confirmPassword
                  ? passwordsMatch
                    ? 'border-green-500/50'
                    : 'border-red-500/50'
                  : 'border-white/10 focus:border-fuchsia-500/50'
                  }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {confirmPassword && !passwordsMatch && (
              <p className="text-red-400 text-xs mt-2 flex items-center gap-1">
                <X size={12} /> Passwords do not match
              </p>
            )}
            {confirmPassword && passwordsMatch && (
              <p className="text-green-400 text-xs mt-2 flex items-center gap-1">
                <Check size={12} /> Passwords match
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !passwordsMatch || !passwordChecks.minLength}
            className="w-full py-4 rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                Create Account
                <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-white/50 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-fuchsia-400 hover:text-fuchsia-300">
            Sign in
          </Link>
        </p>

        <p className="text-center text-white/30 text-xs mt-4">
          By signing up, you agree to our{' '}
          <Link href="/terms" className="text-white/50 hover:text-white/70">Terms</Link>
          {' '}and{' '}
          <Link href="/privacy" className="text-white/50 hover:text-white/70">Privacy Policy</Link>
        </p>
      </div>
    </div>
  )
}
