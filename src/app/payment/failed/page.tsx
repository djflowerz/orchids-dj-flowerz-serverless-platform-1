"use client"

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { XCircle, RefreshCw, ArrowLeft, HelpCircle } from 'lucide-react'
import { Suspense } from 'react'

function FailedContent() {
  const searchParams = useSearchParams()
  const reference = searchParams.get('reference')
  const error = searchParams.get('error')

  const getErrorMessage = (errorCode: string | null) => {
    switch (errorCode) {
      case 'verification_error':
        return 'We could not verify your payment. Please contact support if you were charged.'
      case 'Payment verification failed':
        return 'The payment was not completed successfully. Please try again.'
      default:
        return errorCode || 'Something went wrong with your payment.'
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="relative mb-8">
          <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center">
            <XCircle size={48} className="text-white" />
          </div>
        </div>

        <h1 className="font-display text-4xl sm:text-5xl text-white mb-4">
          PAYMENT FAILED
        </h1>
        
        <p className="text-white/60 text-lg mb-2">
          {getErrorMessage(error)}
        </p>
        
        {reference && (
          <p className="text-white/40 text-sm mb-8">
            Reference: {reference}
          </p>
        )}

        <div className="bg-white/5 rounded-2xl p-6 border border-white/10 mb-8">
          <div className="flex items-center justify-center gap-3 text-white/70 mb-4">
            <HelpCircle size={20} />
            <span>Need help?</span>
          </div>
          <p className="text-white/50 text-sm">
            If you were charged and still see this error, please contact us with your reference number.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/cart"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-fuchsia-500 to-cyan-500 rounded-full text-white font-semibold hover:opacity-90 transition-all"
          >
            <RefreshCw size={20} />
            Try Again
          </Link>
          <Link
            href="/mixtapes"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white/10 rounded-full text-white font-semibold hover:bg-white/20 transition-all"
          >
            <ArrowLeft size={20} />
            Back to Mixtapes
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function PaymentFailedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <FailedContent />
    </Suspense>
  )
}
