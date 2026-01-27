'use client'

import Counter from '@/components/store/Counter'
import OrderSummary from '@/components/store/OrderSummary'
import { deleteItemFromCart } from '@/lib/features/cart/cartSlice'
import { Trash2Icon, ShoppingBag } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from '@/lib/hooks'
import { setProducts } from '@/lib/features/product/productSlice'
import { setAddresses } from '@/lib/features/address/addressSlice'
import { useAuth } from '@/context/AuthContext'
import { Product } from '@/lib/features/product/productSlice'

export default function CartPage() {
  const currency = 'KES '

  const { cartItems } = useAppSelector(state => state.cart)
  const products = useAppSelector(state => state.product.list)
  const { user } = useAuth()

  const dispatch = useAppDispatch()

  const [cartArray, setCartArray] = useState<(Product & { quantity: number })[]>([])
  const [totalPrice, setTotalPrice] = useState(0)
  const [loading, setLoading] = useState(true)

  // Load products from API instead of Firebase
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const res = await fetch('/api/products')
        if (res.ok) {
          const productsData = await res.json()
          dispatch(setProducts(productsData))
        }
      } catch (error) {
        console.error('Error loading products:', error)
      } finally {
        setLoading(false)
      }
    }

    if (products.length === 0) {
      loadProducts()
    } else {
      setLoading(false)
    }
  }, [dispatch, products.length])

  // Load user addresses from API
  useEffect(() => {
    const loadAddresses = async () => {
      if (!user) return

      try {
        // TODO: Create /api/addresses endpoint
        // For now, addresses will be handled in checkout
        // const res = await fetch('/api/addresses')
        // if (res.ok) {
        //   const addressesData = await res.json()
        //   dispatch(setAddresses(addressesData))
        // }
      } catch (error) {
        console.error('Error loading addresses:', error)
      }
    }

    loadAddresses()
  }, [user, dispatch])

  // Create cart array from cart items and products
  useEffect(() => {
    if (products.length > 0) {
      setTotalPrice(0)
      const cartArray: (Product & { quantity: number })[] = []

      for (const [key, value] of Object.entries(cartItems)) {
        const product = products.find(product => product.id === key)
        if (product) {
          cartArray.push({
            ...product,
            quantity: value,
          })
          setTotalPrice(prev => prev + product.price * value)
        }
      }

      setCartArray(cartArray)
    }
  }, [cartItems, products])

  const handleDeleteItemFromCart = (productId: string) => {
    dispatch(deleteItemFromCart({ productId }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (cartArray.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="text-center">
          <ShoppingBag size={64} className="text-white/20 mx-auto mb-6" />
          <h1 className="font-display text-4xl text-white mb-4">YOUR CART IS EMPTY</h1>
          <p className="text-white/50 mb-8">Add some items to get started</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/store"
              className="px-6 py-3 rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white font-semibold hover:opacity-90 transition-all"
            >
              Browse Store
            </Link>
            <Link
              href="/mixtapes"
              className="px-6 py-3 rounded-full bg-white/10 text-white font-semibold hover:bg-white/20 transition-all"
            >
              Browse Mixtapes
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="mb-8">
          <h1 className="font-display text-4xl sm:text-5xl text-white mb-2">MY CART</h1>
          <p className="text-white/50">
            {cartArray.length} {cartArray.length === 1 ? 'item' : 'items'} in your cart
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartArray.map(product => (
              <div
                key={product.id}
                className="bg-white/5 rounded-2xl border border-white/10 p-6 hover:border-white/20 transition-all"
              >
                <div className="flex gap-6">
                  <div className="relative w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-white/5">
                    <Image
                      src={product.images?.[0] || product.image_url || '/placeholder.png'}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <h3 className="text-white font-semibold text-lg mb-1 line-clamp-1">
                          {product.name}
                        </h3>
                        <p className="text-white/50 text-sm">{product.category}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteItemFromCart(product.id)}
                        className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-all flex-shrink-0"
                        aria-label="Remove item"
                      >
                        <Trash2Icon size={18} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <Counter productId={product.id} />
                      <div className="text-right">
                        <p className="text-white font-bold text-xl">
                          {currency}
                          {(product.price * product.quantity).toLocaleString()}
                        </p>
                        <p className="text-white/40 text-sm">
                          {currency}
                          {product.price.toLocaleString()} each
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <OrderSummary />
          </div>
        </div>
      </div>
    </div>
  )
}
