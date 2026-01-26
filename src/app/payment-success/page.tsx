'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, Download, Package, AlertTriangle, Loader2 } from 'lucide-react'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

function PaymentSuccessContent() {
  const searchParams = useSearchParams()
  const reference = searchParams.get('reference') || searchParams.get('trxref')
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    if (!reference) {
      setStatus('error')
      return
    }

    async function verify() {
      try {
        // Use the API route to verify, which is Edge-compatible
        const res = await fetch('/api/verify-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reference })
        })

        if (!res.ok) throw new Error('Verification failed')

        const result = await res.json()
        if (result.verified) {
          setData(result.data)
          setStatus('success')
        } else {
          setStatus('error')
        }
      } catch (e) {
        console.error(e)
        setStatus('error')
      }
    }

    verify()
  }, [reference])

  if (!reference) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="text-center p-8 rounded-2xl bg-white/5 border border-red-500/20 max-w-md w-full">
          <AlertTriangle size={40} className="mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Invalid Request</h2>
          <p className="text-white/60 mb-6">No transaction reference found.</p>
          <Link href="/" className="inline-block px-8 py-3 rounded-full bg-white text-black font-semibold hover:bg-white/90">
            Return Home
          </Link>
        </div>
      </div>
    )
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-fuchsia-500 animate-spin mx-auto mb-4" />
          <h1 className="text-white font-medium">Verifying Payment...</h1>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="text-center p-8 rounded-2xl bg-white/5 border border-red-500/20 max-w-md w-full">
          <AlertTriangle size={40} className="mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Verification Failed</h2>
          <p className="text-white/60 mb-6">We could not verify your payment. Please contact support.</p>
          <Link href="/contact" className="inline-block px-8 py-3 rounded-full bg-white/10 text-white font-semibold hover:bg-white/20">
            Contact Support
          </Link>
        </div>
      </div>
    )
  }

  const metadata = data?.metadata || {}
  const productType = metadata.type || 'product'
  // Note: We might not have full product title here unless we fetch it, 
  // but metadata usually contains product_id. 
  // For now, we show generic success or use metadata if available.

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-12">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center animate-in zoom-in duration-500">
            <CheckCircle size={40} className="text-white" />
          </div>
          <h1 className="font-display text-4xl text-white mb-2">PAYMENT SUCCESSFUL</h1>
          <p className="text-white/60 font-mono">Ref: {reference}</p>
        </div>

        <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl">
          <div className="flex items-center gap-4 mb-8 pb-8 border-b border-white/10">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-fuchsia-500/20 to-cyan-500/20 flex items-center justify-center border border-white/10">
              <Package className="text-white/80" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{metadata.custom_fields?.[0]?.value || 'Product Purchased'}</h2>
              <p className="text-white/50 text-sm capitalize">{productType}</p>
            </div>
            <div className="ml-auto text-right">
              {data && (
                <p className="text-lg font-bold text-white">{(data.amount / 100).toLocaleString()} {data.currency}</p>
              )}
              <p className="text-green-400 text-xs font-mono uppercase">PAID</p>
            </div>
          </div>

          <div className="text-center space-y-4">
            <p className="text-white/80">
              Your purchase is confirmed. You can verify your unique transaction ID below or download your file securely.
            </p>

            {productType === 'subscription' ? (
              <Link
                href="/music-pool"
                className="block w-full py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-green-500/20 flex items-center justify-center gap-2"
              >
                <Package size={20} />
                Go to Music Pool
              </Link>
            ) : (
              <a
                href={`/api/download?reference=${reference}`}
                className="block w-full py-4 rounded-xl bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-fuchsia-500/20 flex items-center justify-center gap-2"
              >
                <Download size={20} />
                Download Your Product
              </a>
            )}

            <p className="text-xs text-white/30 pt-4">
              Secure download link generated for Ref: {reference}
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link href="/" className="text-white/40 hover:text-white transition-colors text-sm">
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>}>
      <PaymentSuccessContent />
    </Suspense>
  )
}
