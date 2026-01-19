"use client"

import { useState } from 'react'
import { Crown, Check, Zap, Music, Heart } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'
import Link from 'next/link'

declare global {
  interface Window {
    PaystackPop: {
      setup: (config: {
        key: string
        email: string
        amount: number
        currency: string
        ref: string
        callback: (response: { reference: string }) => void
        onClose: () => void
      }) => { openIframe: () => void }
    }
  }
}

const subscriptionTiers = [
  { id: '1_week', name: '1 Week', price: 200, duration: 7, popular: false },
  { id: '1_month', name: '1 Month', price: 700, duration: 30, popular: true },
  { id: '3_months', name: '3 Months', price: 1800, duration: 90, popular: false },
  { id: '6_months', name: '6 Months', price: 3500, duration: 180, popular: false },
  { id: '12_months', name: '12 Months', price: 6000, duration: 365, popular: false },
]

const benefits = [
  'Unlimited access to Music Pool',
  'Early access to new releases',
  'Exclusive DJ-only tracks',
  'High-quality downloads (320kbps)',
  'Members-only Discord channel',
  'Priority booking requests',
]

export default function SubscribePage() {
  const { user } = useAuth()
  const [selectedTier, setSelectedTier] = useState(subscriptionTiers[1])
  const [processing, setProcessing] = useState(false)
  const [email, setEmail] = useState('')

  const handleSubscribe = async () => {
    const subscribeEmail = user?.email || email
    if (!subscribeEmail) {
      toast.error('Please enter your email')
      return
    }

    setProcessing(true)

    try {
      const response = await fetch('/api/subscriptions/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: subscribeEmail,
          tier: selectedTier.id,
          amount: selectedTier.price * 100,
          duration: selectedTier.duration
        })
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to initialize subscription')
      }

      const handler = window.PaystackPop.setup({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '',
        email: subscribeEmail,
        amount: selectedTier.price * 100,
        currency: 'KES',
        ref: data.reference,
        callback: async (response) => {
          const verifyResponse = await fetch('/api/subscriptions/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reference: response.reference })
          })
          
          const verifyData = await verifyResponse.json()
          
          if (verifyData.success) {
            toast.success('Welcome to the crew! Subscription activated.')
            window.location.href = '/music-pool'
          } else {
            toast.error('Verification failed. Please contact support.')
          }
          setProcessing(false)
        },
        onClose: () => {
          setProcessing(false)
        }
      })

      handler.openIframe()
    } catch {
      toast.error('Failed to process subscription')
      setProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-black py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-400 text-sm font-medium mb-6">
            <Crown size={16} />
            <span>DJ FLOWERZ Premium</span>
          </div>
          
          <h1 className="font-display text-5xl sm:text-6xl text-white mb-4">
            UNLOCK THE <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">VAULT</span>
          </h1>
          
          <p className="text-white/60 text-lg max-w-xl mx-auto">
            Get unlimited access to the Music Pool, exclusive tracks, and premium features. Join the elite DJs worldwide.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
          {subscriptionTiers.map((tier) => (
            <button
              key={tier.id}
              onClick={() => setSelectedTier(tier)}
              className={`relative p-4 rounded-xl transition-all ${
                selectedTier.id === tier.id
                  ? 'bg-gradient-to-br from-amber-500/30 to-orange-500/30 border-2 border-amber-400 shadow-lg shadow-amber-500/20'
                  : 'bg-white/5 border border-white/10 hover:border-white/20'
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full text-[10px] font-bold text-black">
                  POPULAR
                </div>
              )}
              <div className="text-white/70 text-xs mb-1">{tier.name}</div>
              <div className="text-white font-bold text-lg">
                KSh {tier.price.toLocaleString()}
              </div>
            </button>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20">
            <h3 className="text-white font-bold text-xl mb-4 flex items-center gap-2">
              <Zap size={20} className="text-amber-400" />
              What You Get
            </h3>
            <ul className="space-y-3">
              {benefits.map((benefit, i) => (
                <li key={i} className="flex items-start gap-3 text-white/80">
                  <Check size={18} className="text-amber-400 mt-0.5 flex-shrink-0" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
            <h3 className="text-white font-bold text-xl mb-4 flex items-center gap-2">
              <Music size={20} className="text-fuchsia-400" />
              Selected Plan
            </h3>
            
            <div className="mb-6">
              <div className="text-white/60 text-sm">Duration</div>
              <div className="text-white text-2xl font-bold">{selectedTier.name}</div>
            </div>
            
            <div className="mb-6">
              <div className="text-white/60 text-sm">Total</div>
              <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
                KSh {selectedTier.price.toLocaleString()}
              </div>
            </div>

            {!user && (
              <div className="mb-6">
                <label className="block text-white/70 text-sm mb-2">Your Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-amber-500/50"
                />
              </div>
            )}

            <button
              onClick={handleSubscribe}
              disabled={processing}
              className="w-full py-4 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold text-lg hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {processing ? (
                <>
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Crown size={20} />
                  Subscribe Now
                </>
              )}
            </button>
          </div>
        </div>

        <div className="text-center">
          <Link 
            href="/tip-jar" 
            className="inline-flex items-center gap-2 text-white/50 hover:text-pink-400 transition-colors"
          >
            <Heart size={16} />
            Just want to show support? Send a tip instead
          </Link>
        </div>
      </div>
    </div>
  )
}
