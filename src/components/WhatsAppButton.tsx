'use client'

import { MessageSquare } from 'lucide-react'
import { Product, ProductBundle } from '@/lib/types'
import { formatCurrency } from '@/lib/utils'

interface WhatsAppButtonProps {
  product?: Product
  bundle?: ProductBundle
  quantity?: number
  selectedOptions?: Record<string, string>
  className?: string
  variant?: 'large' | 'small' | 'icon'
  phoneNumber?: string
}

export function WhatsAppButton({
  product,
  bundle,
  quantity = 1,
  selectedOptions = {},
  className = '',
  variant = 'large',
  phoneNumber = '254789783258'
}: WhatsAppButtonProps) {
  const createMessage = () => {
    if (product) {
      let message = `Hi, I want to buy ${quantity}x ${product.title}`

      if (Object.keys(selectedOptions).length > 0) {
        const options = Object.entries(selectedOptions)
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ')
        message += ` (${options})`
      }

      message += ` - ${formatCurrency(product.price)}`
      return message
    }

    if (bundle) {
      const message = `Hi, I'm interested in the "${bundle.name}" bundle for ${formatCurrency(bundle.bundle_price)}`
      return message
    }

    return 'Hi, I am interested in your products'
  }

  const message = createMessage()
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`

  if (variant === 'icon') {
    return (
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        title="Buy on WhatsApp"
        className={`flex items-center justify-center p-2 rounded-lg bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] transition-all ${className}`}
      >
        <MessageSquare size={20} />
      </a>
    )
  }

  if (variant === 'small') {
    return (
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-[#25D366] to-[#128C7E] rounded-lg text-white font-semibold hover:scale-105 transition-all shadow-lg shadow-green-500/20 ${className}`}
      >
        <MessageSquare size={16} />
        WhatsApp
      </a>
    )
  }

  // Large variant (default)
  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`w-full flex items-center justify-center gap-3 px-8 py-6 bg-gradient-to-r from-[#25D366] to-[#128C7E] rounded-2xl text-white font-bold text-xl hover:scale-[1.02] transition-all shadow-2xl shadow-green-500/30 border-2 border-green-400/20 ${className}`}
    >
      <MessageSquare size={28} className="animate-pulse" />
      <span>Buy Now on WhatsApp</span>
    </a>
  )
}

// Hook for WhatsApp integration
export function useWhatsApp(phoneNumber: string = '254789783258') {
  const sendMessage = (message: string) => {
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`
    window.open(url, '_blank')
  }

  return { sendMessage }
}
