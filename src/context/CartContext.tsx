"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Product, Mixtape } from '@/lib/types'

interface CartItemData {
  id: string
  type: 'product' | 'mixtape'
  item: Product | Mixtape
  quantity: number
}

interface CartContextType {
  items: CartItemData[]
  addToCart: (item: Product | Mixtape, type: 'product' | 'mixtape') => void
  removeFromCart: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
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

  function addToCart(item: Product | Mixtape, type: 'product' | 'mixtape') {
    setItems(prev => {
      const existing = prev.find(i => i.id === item.id && i.type === type)
      if (existing) {
        if (type === 'product' && (item as Product).product_type === 'physical') {
          return prev.map(i =>
            i.id === item.id && i.type === type
              ? { ...i, quantity: i.quantity + 1 }
              : i
          )
        }
        return prev
      }
      return [...prev, { id: item.id, type, item, quantity: 1 }]
    })
  }

  function removeFromCart(id: string) {
    setItems(prev => prev.filter(i => i.id !== id))
  }

  function updateQuantity(id: string, quantity: number) {
    if (quantity < 1) {
      removeFromCart(id)
      return
    }
    setItems(prev =>
      prev.map(i => (i.id === id ? { ...i, quantity } : i))
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
