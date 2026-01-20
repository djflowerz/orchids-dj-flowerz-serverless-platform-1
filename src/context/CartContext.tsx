"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Product, Mixtape } from '@/lib/types'

interface CartItemData {
  id: string
  uniqueKey: string // New unique key to distinguish variants
  type: 'product' | 'mixtape'
  item: Product | Mixtape
  quantity: number
  selectedOptions?: Record<string, string>
}

interface CartContextType {
  items: CartItemData[]
  addToCart: (item: Product | Mixtape, type: 'product' | 'mixtape', options?: Record<string, string>) => void
  removeFromCart: (uniqueKey: string) => void
  updateQuantity: (uniqueKey: string, quantity: number) => void
  clearCart: () => void
  itemCount: number
  total: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItemData[]>([])

  useEffect(() => {
    const stored = localStorage.getItem('dj_flowerz_cart')
    if (stored) {
      setItems(JSON.parse(stored))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('dj_flowerz_cart', JSON.stringify(items))
  }, [items])

  function addToCart(item: Product | Mixtape, type: 'product' | 'mixtape', options?: Record<string, string>) {
    const uniqueKey = options
      ? `${item.id}-${JSON.stringify(options)}`
      : item.id

    setItems(prev => {
      const existing = prev.find(i => i.uniqueKey === uniqueKey)
      if (existing) {
        if (type === 'product' && (item as Product).product_type === 'physical') {
          return prev.map(i =>
            i.uniqueKey === uniqueKey
              ? { ...i, quantity: i.quantity + 1 }
              : i
          )
        }
        return prev
      }
      return [...prev, {
        id: item.id,
        uniqueKey,
        type,
        item,
        quantity: 1,
        selectedOptions: options
      }]
    })
  }

  function removeFromCart(uniqueKey: string) {
    setItems(prev => prev.filter(i => i.uniqueKey !== uniqueKey))
  }

  function updateQuantity(uniqueKey: string, quantity: number) {
    setItems(prev =>
      prev.map(i =>
        i.uniqueKey === uniqueKey ? { ...i, quantity } : i
      )
    )
  }

  function clearCart() {
    setItems([])
  }

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0)
  const total = items.reduce((sum, i) => {
    const price = 'price' in i.item ? i.item.price : 0
    return sum + price * i.quantity
  }, 0)

  return (
    <CartContext.Provider value={{
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      itemCount,
      total
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within CartProvider')
  }
  return context
}
