'use client'

import { useState } from 'react'
import { Tag, Check, X, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface PromoCodeInputProps {
  onApply: (promo: { code: string; discount_type: string; discount_value: number }) => void
  onRemove: () => void
  appliedCode?: string | null
  subtotal: number
}

export function PromoCodeInput({ onApply, onRemove, appliedCode, subtotal }: PromoCodeInputProps) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const applyCode = async () => {
    if (!code.trim()) return

    setLoading(true)
    setError('')

    try {
      const res = await fetch(`/api/promo-codes?code=${encodeURIComponent(code.trim())}`)
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Invalid code')
        toast.error(data.error || 'Invalid promo code')
      } else {
        if (data.promo.min_purchase && subtotal < data.promo.min_purchase) {
          setError(`Minimum purchase of KES ${data.promo.min_purchase} required`)
          toast.error(`Minimum purchase of KES ${data.promo.min_purchase} required`)
        } else {
          onApply(data.promo)
          toast.success('Promo code applied!')
          setCode('')
        }
      }
    } catch {
      setError('Failed to verify code')
      toast.error('Failed to verify promo code')
    }

    setLoading(false)
  }

  if (appliedCode) {
    return (
      <div className="flex items-center justify-between p-3 rounded-xl bg-green-500/10 border border-green-500/30">
        <div className="flex items-center gap-2">
          <Check size={18} className="text-green-400" />
          <span className="text-green-400 font-medium">{appliedCode}</span>
          <span className="text-green-400/70 text-sm">applied</span>
        </div>
        <button
          onClick={onRemove}
          className="p-1 rounded-full hover:bg-white/10 text-white/70 hover:text-red-400 transition-colors"
        >
          <X size={18} />
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            value={code}
            onChange={(e) => { setCode(e.target.value.toUpperCase()); setError('') }}
            placeholder="Promo code"
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-fuchsia-500/50"
          />
        </div>
        <button
          onClick={applyCode}
          disabled={loading || !code.trim()}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white font-semibold hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : 'Apply'}
        </button>
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
    </div>
  )
}
