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
        metadata?: Record<string, unknown>
        callback: (response: { reference: string }) => void
        onClose: () => void
      }) => { openIframe: () => void }
    }
  }
}

import { db } from '@/lib/firebase'
import { collection, query, where, getDocs, orderBy, doc, getDoc, addDoc, updateDoc } from 'firebase/firestore'
import { useEffect } from 'react'

export interface Plan {
  id: string
  name: string
  price: number
  duration: string
  features: string[]
  tier: string
}

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
  const [plans, setPlans] = useState<Plan[]>([])
  const [selectedTier, setSelectedTier] = useState<Plan | null>(null)
  const [processing, setProcessing] = useState(false)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [paystackKey, setPaystackKey] = useState('')

  useEffect(() => {
    async function init() {
      try {
        // Fetch Plans
        const q = query(collection(db, 'plans'), orderBy('price', 'asc'))
        const snap = await getDocs(q)
        const fetchedPlans = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Plan[]
        setPlans(fetchedPlans)
        if (fetchedPlans.length > 0) setSelectedTier(fetchedPlans[1] || fetchedPlans[0])

        // Fetch Settings
        const settingsSnap = await getDoc(doc(db, 'settings', 'site'))
        if (settingsSnap.exists()) {
          setPaystackKey(settingsSnap.data().paystackPublicKey)
        }
      } catch (err) {
        console.error('Error initializing:', err)
        toast.error('Failed to load data')
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  const getDurationDays = (duration: string) => {
    switch (duration) {
      case 'week': return 7
      case 'month': return 30
      case 'year': return 365
      default: return 30
    }
  }

  const handleSubscribe = async () => {
    const subscribeEmail = user?.email || email
    if (!subscribeEmail) {
      toast.error('Please enter your email')
      return
    }

    setProcessing(true)

    if (!selectedTier) return

    try {
      const activeKey = paystackKey || process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY

      if (!activeKey) {
        toast.error('Payment system not configured (Missing Public Key)')
        setProcessing(false)
        return
      }

      // 1. Create PENDING Subscription Record
      console.log('[Subscribe] Creating pending subscription...')
      const startDate = new Date()
      const endDate = new Date()
      endDate.setDate(startDate.getDate() + getDurationDays(selectedTier.duration))

      const subData = {
        user_id: user?.id || 'guest',
        user_email: subscribeEmail,
        tier: selectedTier.id,
        plan_name: selectedTier.name,
        status: 'pending', // PENDING initially
        amount: selectedTier.price,
        currency: 'KES',
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const subRef = await addDoc(collection(db, 'subscriptions'), subData)
      const subId = subRef.id // Use this as reference for Paystack

      console.log('Initializing Paystack for subscription:', subId)

      const handler = window.PaystackPop.setup({
        key: activeKey,
        email: subscribeEmail,
        amount: selectedTier.price, // Cents
        currency: 'KES',
        ref: subId, // Reference is Firestore Doc ID
        callback: async function (response: { reference: string }) {
          console.log('[Subscribe] Paystack callback triggered:', response)
          toast.loading('Verifying subscription payment...')

          try {
            // 2. Verify Payment via Backend API
            const verifyRes = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                reference: response.reference,
                orderId: subId,
                collection: 'subscriptions' // Tell API to update 'subscriptions' collection
              })
            })

            const verifyData = await verifyRes.json()

            if (!verifyRes.ok || !verifyData.verified) {
              throw new Error(verifyData.error || 'Payment verification failed')
            }

            console.log('[Subscribe] Payment verified. Updating user profile...')

            // 3. Update User Profile Client-Side (if logged in)
            // Note: Ideally this should be server-side, but keeping consistent with existing architecture for now.
            if (user && user.id) {
              const userRef = doc(db, 'users', user.id)
              try {
                await updateDoc(userRef, {
                  subscription_status: 'active',
                  subscription_tier: selectedTier.id,
                  subscription_end_date: endDate.toISOString()
                })
                console.log('[Subscribe] User profile updated successfully')
              } catch (uErr) {
                console.warn('[Subscribe] Could not update user profile directly', uErr)
                // Don't fail the whole flow if this optional step fails, backend might handle it later or admin can fix
              }
            }

            toast.dismiss()
            toast.success('🎉 Welcome to the crew! Subscription activated.', {
              duration: 3000,
            })

            // 4. Redirect
            setTimeout(() => {
              window.location.href = '/music-pool'
            }, 2000)

          } catch (error: any) {
            console.error('[Subscribe] Verification error:', error)
            toast.dismiss()
            toast.error(error.message || 'Subscription verification failed. Please contact support.')
            setProcessing(false)
          }
        },
        onClose: () => {
          setProcessing(false)
          toast.info('Payment cancelled')
        }
      })

      handler.openIframe()
    } catch (e: any) {
      console.error('Subscription init error:', e)
      toast.error('Failed to process subscription initialization')
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
          {loading ? (
            <div className="text-white/50 col-span-5 text-center">Loading plans...</div>
          ) : plans.map((tier) => (
            <button
              key={tier.id}
              onClick={() => setSelectedTier(tier)}
              className={`relative p-4 rounded-xl transition-all ${selectedTier?.id === tier.id
                ? 'bg-gradient-to-br from-amber-500/30 to-orange-500/30 border-2 border-amber-400 shadow-lg shadow-amber-500/20'
                : 'bg-white/5 border border-white/10 hover:border-white/20'
                }`}
            >
              {tier.duration === 'month' && tier.price >= 80000 && ( // Ad-hoc popularity check
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full text-[10px] font-bold text-black">
                  POPULAR
                </div>
              )}
              <div className="text-white/70 text-xs mb-1 capitalize">{tier.name}</div>
              <div className="text-white font-bold text-lg">
                KSh {(tier.price / 100).toLocaleString()}
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
              <div className="text-white text-2xl font-bold">{selectedTier?.name || 'Select a plan'}</div>
            </div>

            <div className="mb-6">
              <div className="text-white/60 text-sm">Total</div>
              <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
                KSh {selectedTier ? (selectedTier.price / 100).toLocaleString() : '0'}
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
