"use client"

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { CheckCircle, Download, Copy, Key, Package, ArrowRight, Send, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface OrderItem {
  product_id: string | null
  mixtape_id: string | null
  title: string
  type: 'product' | 'mixtape'
  quantity: number
  // These fields fetched from product/mixtape doc
  download_url?: string
  download_password?: string
  is_subscription?: boolean
  product_type?: 'digital' | 'physical'
}

interface OrderDetails {
  id: string
  currency: string
  total_amount: number
  status: string
  items: OrderItem[]
}

function SuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [order, setOrder] = useState<OrderDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState<string | null>(null)

  const orderId = searchParams.get('orderId')

  useEffect(() => {
    async function fetchOrder() {
      if (!orderId) {
        setError('No order ID provided')
        setLoading(false)
        return
      }

      try {
        // Call Secure Backend API
        const response = await fetch(`/api/order-delivery?orderId=${orderId}`)

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to verify order')
        }

        const data = await response.json()
        setOrder(data)

      } catch (err: any) {
        console.error('Error fetching order:', err)
        setError(err.message || 'Failed to load order details')
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [orderId, router])

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    toast.success('Copied!')
    setTimeout(() => setCopied(null), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-fuchsia-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="text-center p-8 rounded-2xl bg-white/5 border border-red-500/20 max-w-md w-full">
          <AlertTriangle size={40} className="mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-white/60 mb-6">{error}</p>
          <Link href="/store" className="inline-block px-8 py-3 rounded-full bg-white text-black font-semibold hover:bg-white/90 transition-colors">
            Return to Store
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-12">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
            <CheckCircle size={40} className="text-white" />
          </div>
          <h1 className="font-display text-4xl text-white mb-2">PAYMENT SUCCESSFUL</h1>
          <p className="text-white/60">Thank you for your purchase! Order #{order?.id.slice(0, 8)}</p>
        </div>

        <div className="space-y-6">
          {order?.items.map((item, index) => (
            <div key={index} className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-3 mb-4">
                <Package size={24} className="text-fuchsia-400" />
                <h2 className="text-white font-semibold text-lg">{item.title}</h2>
                {item.quantity > 1 && <span className="text-xs bg-white/10 px-2 py-0.5 rounded text-white/60">x{item.quantity}</span>}
              </div>

              {/* Digital Download */}
              {item.product_type === 'digital' && item.download_url && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <a
                      href={item.download_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white font-semibold hover:opacity-90 transition-all"
                    >
                      <Download size={20} />
                      Download File
                    </a>
                  </div>

                  {item.download_password && (
                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Key size={16} className="text-amber-400" />
                        <span className="text-amber-400 text-sm font-semibold">Password</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 px-3 py-2 rounded bg-black/50 text-white font-mono text-sm tracking-wide break-all">
                          {item.download_password}
                        </code>
                        <button
                          onClick={() => copyToClipboard(item.download_password!, index.toString())}
                          className="p-2 rounded bg-white/10 text-white hover:bg-white/20 transition-all"
                        >
                          <Copy size={16} className={copied === index.toString() ? 'text-green-400' : ''} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Physical Product */}
              {item.product_type === 'physical' && (
                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
                  <p className="text-blue-400 font-semibold mb-1 text-sm">Physical Item</p>
                  <p className="text-white/60 text-xs">
                    We&apos;ll create a shipping label and update you via email.
                  </p>
                </div>
              )}

              {/* Fallback if no type or url */}
              {item.product_type === 'digital' && !item.download_url && (
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-white/50 text-sm">Download link not available directly. Please check your email.</p>
                </div>
              )}

            </div>
          ))}

          <div className="flex flex-col sm:flex-row gap-3 pt-6">
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
              View All Orders
            </Link>
          </div>
        </div>
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
