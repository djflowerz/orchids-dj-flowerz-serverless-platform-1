"use client"

import { useState } from 'react'
import { Heart, DollarSign } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'
import Link from 'next/link'
import { db } from '@/lib/firebase'
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

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

const tipAmounts = [50, 100, 200, 500, 1000]

export default function TipJarPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [amount, setAmount] = useState(100)
  const [customAmount, setCustomAmount] = useState('')
  const [processing, setProcessing] = useState(false)
  const [email, setEmail] = useState('')
  const [paystackKey, setPaystackKey] = useState('')

  useEffect(() => {
    async function fetchKey() {
      try {
        const docRef = doc(db, 'settings', 'site')
        const snap = await getDoc(docRef)
        if (snap.exists()) {
          setPaystackKey(snap.data().paystackPublicKey)
        }
      } catch (err) {
        console.error('Error fetching settings:', err)
      }
    }
    fetchKey()
  }, [])

  const handleTip = async () => {
    const tipEmail = user?.email || email
    if (!tipEmail) {
      toast.error('Please enter your email')
      return
    }

    if (!paystackKey && !process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY) {
      toast.error('Payment system not configured')
      return
    }

    const tipAmount = customAmount ? parseInt(customAmount) * 100 : amount * 100

    if (tipAmount < 5000) {
      toast.error('Minimum tip is KSh 50')
      return
    }

    setProcessing(true)

    try {
      const activeKey = paystackKey || process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY

      if (!activeKey) {
        toast.error('Payment system not configured (Missing Public Key)')
        setProcessing(false)
        return
      }

      console.log('Initializing Paystack with key:', activeKey ? '***' + activeKey.slice(-4) : 'MISSING')

      // 1. Create Pending Tip Record
      console.log('[TipJar] Creating pending tip...')
      const tipDoc = await addDoc(collection(db, 'tips'), {
        email: tipEmail,
        amount: tipAmount,
        status: 'pending',
        createdAt: serverTimestamp(),
        userId: user?.id || 'anonymous'
      })
      const tipId = tipDoc.id

      const handler = window.PaystackPop.setup({
        key: activeKey,
        email: tipEmail,
        amount: tipAmount,
        currency: 'KES',
        ref: tipId, // Reference is Firestore Doc ID
        callback: async function (response: { reference: string }) {
          console.log('[TipJar] Paystack callback triggered:', response)
          toast.loading('Verifying tip...')

          try {
            // 2. Verify via Backend
            const verifyRes = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                reference: response.reference,
                orderId: tipId,
                collection: 'tips'
              })
            })

            const verifyData = await verifyRes.json()

            if (!verifyRes.ok || !verifyData.verified) {
              throw new Error(verifyData.error || 'Tip verification failed')
            }

            console.log('[TipJar] Tip verified successfully!')
            toast.dismiss()
            toast.success('🎉 Thank you for your support!', {
              duration: 3000,
            })

            // Redirect to generic payment success page or stay?
            // User requested confirmation message displayed.
            // Original code redirected to /payment-success?reference=...
            // We can use that.
            setTimeout(() => {
              router.push(`/payment-success?reference=${response.reference}&type=tip`)
            }, 2000)

          } catch (error: any) {
            console.error('[TipJar] Verification error:', error)
            toast.dismiss()
            toast.error(error.message || 'Tip verification failed')
            setProcessing(false)
          }
        },
        onClose: function () {
          setProcessing(false)
          toast.info('Payment cancelled')
        }
      })

      handler.openIframe()
    } catch (e: any) {
      console.error('Tip processing error:', e)
      toast.error(`Failed to process tip: ${e.message || 'Unknown error'}`)
      setProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-pink-500/20 to-red-500/20 flex items-center justify-center">
            <Heart size={40} className="text-pink-400" />
          </div>
          <h1 className="font-display text-5xl text-white mb-4">TIP JAR</h1>
          <p className="text-white/60">
            Support DJ FLOWERZ and help keep the music flowing.
            Every tip helps create more amazing content!
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
          {!user && (
            <div className="mb-6">
              <label className="block text-white/70 text-sm mb-2">Your Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-pink-500/50"
              />
            </div>
          )}

          <div className="mb-6">
            <label className="block text-white/70 text-sm mb-3">Select Amount</label>
            <div className="grid grid-cols-3 gap-3">
              {tipAmounts.map((tip) => (
                <button
                  key={tip}
                  onClick={() => {
                    setAmount(tip)
                    setCustomAmount('')
                  }}
                  className={`py-3 rounded-xl font-semibold transition-all ${amount === tip && !customAmount
                    ? 'bg-gradient-to-r from-pink-500 to-red-500 text-white'
                    : 'bg-white/5 text-white/70 hover:bg-white/10'
                    }`}
                >
                  KSh {tip.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-white/70 text-sm mb-2">Or Enter Custom Amount (KSh)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50">KSh</span>
              <input
                type="number"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-pink-500/50"
              />
            </div>
          </div>

          <button
            onClick={handleTip}
            disabled={processing}
            className="w-full py-4 rounded-full bg-gradient-to-r from-pink-500 to-red-500 text-white font-semibold hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {processing ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Heart size={20} />
                Send Tip - KSh {(customAmount ? parseInt(customAmount) || 0 : amount).toLocaleString()}
              </>
            )}
          </button>
        </div>

        <p className="text-center text-white/40 text-sm mt-6">
          100% of tips go directly to supporting DJ FLOWERZ
        </p>
      </div>
    </div>
  )
}
