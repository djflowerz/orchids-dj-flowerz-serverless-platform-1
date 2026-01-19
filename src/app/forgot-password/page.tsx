"use client"

import { useState } from 'react'
import Link from 'next/link'
import { Mail, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
            <CheckCircle size={40} className="text-green-400" />
          </div>
          <h1 className="font-display text-4xl text-white mb-4">CHECK YOUR EMAIL</h1>
          <p className="text-white/60 mb-8">
            We&apos;ve sent a password reset link to <span className="text-white font-medium">{email}</span>. 
            Click the link in the email to reset your password.
          </p>
          <p className="text-white/40 text-sm mb-8">
            Didn&apos;t receive the email? Check your spam folder or try again.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setSent(false)}
              className="px-6 py-3 rounded-full bg-white/10 text-white font-semibold hover:bg-white/20 transition-all"
            >
              Try Again
            </button>
            <Link
              href="/login"
              className="px-6 py-3 rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white font-semibold hover:opacity-90 transition-all"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    )
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
          <h1 className="font-display text-4xl text-white mb-2">FORGOT PASSWORD?</h1>
          <p className="text-white/60">Enter your email to reset your password</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white/70 text-sm mb-2">Email Address</label>
            <div className="relative">
              <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-fuchsia-500/50"
              />
            </div>
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
                Send Reset Link
                <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>

        <Link 
          href="/login" 
          className="flex items-center justify-center gap-2 text-white/50 hover:text-white/70 mt-6 transition-colors"
        >
          <ArrowLeft size={18} />
          Back to Login
        </Link>
      </div>
    </div>
  )
}
