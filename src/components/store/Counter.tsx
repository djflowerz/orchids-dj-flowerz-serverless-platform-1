'use client'
import { MinusIcon, PlusIcon } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/lib/hooks'
import { addToCart, removeFromCart } from '@/lib/features/cart/cartSlice'

interface CounterProps {
    productId: string
}

export default function Counter({ productId }: CounterProps) {
    const dispatch = useAppDispatch()
    const cartItems = useAppSelector(state => state.cart.cartItems)
    const quantity = cartItems[productId] || 0

    const handleIncrement = () => {
        dispatch(addToCart({ productId }))
    }

    const handleDecrement = () => {
        if (quantity > 0) {
            dispatch(removeFromCart({ productId }))
        }
    }

    return (
        <div className="flex items-center gap-2 border border-slate-300 rounded-md w-fit">
            <button
                onClick={handleDecrement}
                disabled={quantity === 0}
                className="p-2 hover:bg-slate-100 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Decrease quantity"
            >
                <MinusIcon size={16} />
            </button>
            <span className="min-w-[30px] text-center font-medium">{quantity}</span>
            <button
                onClick={handleIncrement}
                className="p-2 hover:bg-slate-100 active:scale-95 transition-all"
                aria-label="Increase quantity"
            >
                <PlusIcon size={16} />
            </button>
        </div>
    )
}
