'use client'
import { useRef } from 'react'
import { Provider } from 'react-redux'
import { makeStore, AppStore } from '@/lib/store'
import { setCart } from '@/lib/features/cart/cartSlice'

export default function StoreProvider({
    children,
}: {
    children: React.ReactNode
}) {
    const storeRef = useRef<AppStore | undefined>(undefined)
    if (!storeRef.current) {
        // Create the store instance the first time this renders
        storeRef.current = makeStore()

        // Load cart from localStorage on initialization
        if (typeof window !== 'undefined') {
            const savedCart = localStorage.getItem('cart')
            if (savedCart) {
                try {
                    const cartData = JSON.parse(savedCart)
                    storeRef.current.dispatch(setCart(cartData))
                } catch (error) {
                    console.error('Failed to load cart from localStorage:', error)
                }
            }
        }
    }

    // Subscribe to cart changes and save to localStorage
    if (typeof window !== 'undefined' && storeRef.current) {
        storeRef.current.subscribe(() => {
            const state = storeRef.current!.getState()
            localStorage.setItem('cart', JSON.stringify(state.cart.cartItems))
        })
    }

    return <Provider store={storeRef.current}>{children}</Provider>
}
