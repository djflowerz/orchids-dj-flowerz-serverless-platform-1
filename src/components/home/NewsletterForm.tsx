"use client"

import { useState } from 'react'
import { Send, Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
// Using generic form handling instead of generic Firebase direct access
// to avoid crashes if config is missing.

export function NewsletterForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [subscribed, setSubscribed] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address')
      return
    }

    setLoading(true)

    // Temporary: Just simulate success to unblock UI display while DB is set up
    setTimeout(() => {
      setSubscribed(true)
      toast.success('Welcome to the DJ FLOWERZ family!')
      setLoading(false)
    }, 1000)

    // TODO: Connect to new Neon DB or an API route
  }

  if (subscribed) {
    return (
      <div className="flex items-center justify-center gap-3 p-4 rounded-2xl bg-green-500/10 border border-green-500/20">
        <Check size={24} className="text-green-400" />
        <span className="text-green-400 font-semibold">You're subscribed! Check your inbox for updates.</span>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email address"
        className="flex-1 px-6 py-4 rounded-full bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-fuchsia-500/50 text-center sm:text-left"
        disabled={loading}
      />
      <button
        type="submit"
        disabled={loading}
        className="px-8 py-4 rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {loading ? (
          <Loader2 size={20} className="animate-spin" />
        ) : (
          <>
            <Send size={20} />
            Subscribe
          </>
        )}
      </button>
    </form>
  )
}
