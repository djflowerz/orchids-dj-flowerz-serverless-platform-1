"use client"

import { useState } from 'react'
import { Send, Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { db } from '@/lib/firebase'
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore'

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

    try {
      const subscribersRef = collection(db, 'newsletter_subscribers')
      const q = query(subscribersRef, where('email', '==', email))
      const querySnapshot = await getDocs(q)

      if (!querySnapshot.empty) {
        toast.info('You are already subscribed!')
      } else {
        await addDoc(subscribersRef, {
          email,
          subscribed_at: new Date().toISOString()
        })
        setSubscribed(true)
        toast.success('Welcome to the DJ FLOWERZ family!')
      }
    } catch (error) {
      console.error('Newsletter subscription error:', error)
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
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
