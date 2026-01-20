"use client"

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { db } from '@/lib/firebase'
import { collection, query, where, getDocs, doc, getDoc, limit } from 'firebase/firestore'
import { CheckCircle, Download, Copy, Key, Package, ArrowRight, Send } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner' // Ensure this imports correctly if it's used
// Note: toast was imported but unused in original file for copy action, used here for consistency

interface PurchaseDetails {
  product_title: string
  product_type: 'digital' | 'physical'
  download_url: string | null
  download_password: string | null
  payment_amount: number
  is_subscription: boolean
}

function SuccessContent() {
  const searchParams = useSearchParams()
  const [details, setDetails] = useState<PurchaseDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  const reference = searchParams.get('reference')
  const type = searchParams.get('type')

  useEffect(() => {
    async function fetchPurchaseDetails() {
      if (!reference) {
        setLoading(false)
        return
      }

      if (type === 'subscription') {
        setDetails({
          product_title: 'Music Pool Subscription',
          product_type: 'digital',
          download_url: null,
          download_password: null,
          payment_amount: 0,
          is_subscription: true
        })
        setLoading(false)
        return
      }

      try {
        const q = query(
          collection(db, 'payments'),
          where('paystack_reference', '==', reference),
          limit(1)
        )
        const snapshot = await getDocs(q)

        if (!snapshot.empty) {
          const payment = snapshot.docs[0].data()

          if (payment && payment.item_id) {
            const productDoc = await getDoc(doc(db, 'products', payment.item_id))

            if (productDoc.exists()) {
              const product = productDoc.data()
              setDetails({
                product_title: product.title,
                product_type: product.product_type,
                download_url: product.download_file_path,
                download_password: product.download_password,
                payment_amount: payment.amount || 0,
                is_subscription: false
              })
            }
          }
        }
      } catch (error) {
        console.error('Error fetching purchase details:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPurchaseDetails()
  }, [reference, type])

  const copyPassword = () => {
    if (details?.download_password) {
      navigator.clipboard.writeText(details.download_password)
      setCopied(true)
      toast.success('Password copied!')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-fuchsia-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
            <CheckCircle size={40} className="text-white" />
          </div>
          <h1 className="font-display text-4xl text-white mb-2">PAYMENT SUCCESSFUL</h1>
          <p className="text-white/60">Thank you for your purchase!</p>
        </div>

        {details ? (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-3 mb-4">
                <Package size={24} className="text-fuchsia-400" />
                <h2 className="text-white font-semibold text-lg">{details.product_title}</h2>
              </div>

              {details.payment_amount > 0 && (
                <p className="text-white/50 text-sm mb-4">
                  Amount paid: <span className="text-white font-semibold">KSh {(details.payment_amount / 100).toLocaleString()}</span>
                </p>
              )}

              {details.is_subscription && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Send size={18} className="text-cyan-400" />
                      <span className="text-cyan-400 font-semibold">Telegram Access</span>
                    </div>
                    <p className="text-white/60 text-sm">
                      Go to your profile and link your Telegram username to get added to our exclusive Music Pool channels.
                    </p>
                  </div>
                  <Link
                    href="/profile"
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white font-semibold hover:opacity-90 transition-all"
                  >
                    Link Telegram
                    <ArrowRight size={18} />
                  </Link>
                </div>
              )}

              {details.product_type === 'digital' && details.download_url && (
                <div className="space-y-4">
                  <a
                    href={details.download_url}
                    download
                    className="flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white font-semibold hover:opacity-90 transition-all"
                  >
                    <Download size={20} />
                    Download Now
                  </a>

                  {details.download_password && (
                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                      <div className="flex items-center gap-2 mb-3">
                        <Key size={18} className="text-amber-400" />
                        <span className="text-amber-400 font-semibold">Download Password</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 px-4 py-3 rounded-lg bg-black/50 text-white font-mono text-lg tracking-wider">
                          {details.download_password}
                        </code>
                        <button
                          onClick={copyPassword}
                          className="p-3 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-all"
                        >
                          <Copy size={18} className={copied ? 'text-green-400' : ''} />
                        </button>
                      </div>
                      <p className="text-white/50 text-xs mt-3">
                        Use this password to extract/open the downloaded file.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {details.product_type === 'physical' && (
                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
                  <p className="text-blue-400 font-semibold mb-2">Physical Product</p>
                  <p className="text-white/60 text-sm">
                    Your order has been confirmed. We&apos;ll process and ship it within 2-3 business days.
                    You&apos;ll receive tracking information via email.
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="text-white/50 text-sm text-center">
                Reference: <span className="text-white font-mono">{reference}</span>
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/store"
                className="flex-1 py-3 rounded-full bg-white/5 text-white font-semibold hover:bg-white/10 transition-all text-center"
              >
                Continue Shopping
              </Link>
              <Link
                href="/profile"
                className="flex-1 py-3 rounded-full bg-white/5 text-white font-semibold hover:bg-white/10 transition-all text-center"
              >
                View Orders
              </Link>
            </div>
          </div>
        ) : (
          <div className="text-center p-8 rounded-2xl bg-white/5 border border-white/10">
            <p className="text-white/60 mb-4">Your payment was successful!</p>
            <Link
              href="/store"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white font-semibold hover:opacity-90 transition-all"
            >
              Continue Shopping
              <ArrowRight size={18} />
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-fuchsia-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}
