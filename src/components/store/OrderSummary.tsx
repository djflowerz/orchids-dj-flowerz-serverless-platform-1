'use client'
import { PlusIcon, SquarePenIcon, XIcon } from 'lucide-react'
import { useState } from 'react'
import AddressModal from './AddressModal'
import { useAppSelector } from '@/lib/hooks'
import { Address } from '@/lib/features/address/addressSlice'
import { Product } from '@/lib/features/product/productSlice'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { collection, addDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

interface OrderSummaryProps {
    totalPrice: number
    items: (Product & { quantity: number })[]
}

interface Coupon {
    code: string
    description: string
    discount: number
}

export default function OrderSummary({ totalPrice, items }: OrderSummaryProps) {
    const currency = 'KES '
    const router = useRouter()
    const { user } = useAuth()

    const addressList = useAppSelector(state => state.address.list)

    const [paymentMethod, setPaymentMethod] = useState<'PAYSTACK' | 'COD'>('PAYSTACK')
    const [selectedAddress, setSelectedAddress] = useState<Address | null>(null)
    const [showAddressModal, setShowAddressModal] = useState(false)
    const [couponCodeInput, setCouponCodeInput] = useState('')
    const [coupon, setCoupon] = useState<Coupon | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)

    const handleCouponCode = async (event: React.FormEvent) => {
        event.preventDefault()

        if (!couponCodeInput.trim()) {
            toast.error('Please enter a coupon code')
            return
        }

        try {
            const response = await fetch('/api/coupons/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: couponCodeInput }),
            })

            const data = await response.json()

            if (response.ok && data.valid) {
                setCoupon(data.coupon)
                toast.success('Coupon applied successfully!')
            } else {
                toast.error(data.message || 'Invalid coupon code')
            }
        } catch (error) {
            console.error('Error validating coupon:', error)
            toast.error('Failed to validate coupon')
        }
    }

    const handlePlaceOrder = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!user) {
            toast.error('Please login to place an order')
            router.push('/login')
            return
        }

        if (!selectedAddress) {
            toast.error('Please select a shipping address')
            return
        }

        if (items.length === 0) {
            toast.error('Your cart is empty')
            return
        }

        setIsProcessing(true)

        try {
            const finalTotal = coupon
                ? totalPrice - (coupon.discount / 100 * totalPrice)
                : totalPrice

            const orderData = {
                user_id: user.uid,
                user_email: user.email || '',
                items: items.map(item => ({
                    product_id: item.id,
                    title: item.title,
                    quantity: item.quantity,
                    price: item.price,
                })),
                total: finalTotal,
                status: 'pending',
                payment_method: paymentMethod.toLowerCase(),
                address_id: selectedAddress.id,
                shipping_address: `${selectedAddress.street}, ${selectedAddress.city}, ${selectedAddress.state} ${selectedAddress.zip}, ${selectedAddress.country}`,
                coupon_code: coupon?.code || null,
                coupon_discount: coupon ? (coupon.discount / 100 * totalPrice) : 0,
                created_at: new Date().toISOString(),
            }

            // Create order in Firestore
            const docRef = await addDoc(collection(db, 'orders'), orderData)

            if (paymentMethod === 'PAYSTACK') {
                // Redirect to payment page with order ID
                router.push(`/payment?orderId=${docRef.id}&amount=${finalTotal}`)
            } else {
                // COD - redirect to success page
                toast.success('Order placed successfully!')
                router.push('/orders')
            }
        } catch (error) {
            console.error('Error placing order:', error)
            toast.error('Failed to place order. Please try again.')
        } finally {
            setIsProcessing(false)
        }
    }

    const subtotal = totalPrice
    const discount = coupon ? (coupon.discount / 100 * totalPrice) : 0
    const finalTotal = subtotal - discount

    return (
        <div className="w-full max-w-lg lg:max-w-[380px] bg-slate-50/50 border border-slate-200 text-slate-600 text-sm rounded-xl p-6 sticky top-20">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">Order Summary</h2>

            {/* Payment Method */}
            <div className="mb-4">
                <p className="text-slate-500 text-xs mb-2">Payment Method</p>
                <div className="flex gap-4">
                    <div className="flex gap-2 items-center">
                        <input
                            type="radio"
                            id="PAYSTACK"
                            onChange={() => setPaymentMethod('PAYSTACK')}
                            checked={paymentMethod === 'PAYSTACK'}
                            className="accent-fuchsia-600"
                        />
                        <label htmlFor="PAYSTACK" className="cursor-pointer">Paystack</label>
                    </div>
                    <div className="flex gap-2 items-center">
                        <input
                            type="radio"
                            id="COD"
                            onChange={() => setPaymentMethod('COD')}
                            checked={paymentMethod === 'COD'}
                            className="accent-fuchsia-600"
                        />
                        <label htmlFor="COD" className="cursor-pointer">Cash on Delivery</label>
                    </div>
                </div>
            </div>

            {/* Address */}
            <div className="my-4 py-4 border-y border-slate-200">
                <p className="text-slate-500 text-xs mb-2">Shipping Address</p>
                {selectedAddress ? (
                    <div className="flex gap-2 items-start">
                        <div className="flex-1">
                            <p className="font-medium text-slate-800">{selectedAddress.name}</p>
                            <p className="text-xs">{selectedAddress.street}</p>
                            <p className="text-xs">{selectedAddress.city}, {selectedAddress.state} {selectedAddress.zip}</p>
                            <p className="text-xs">{selectedAddress.country}</p>
                            <p className="text-xs">{selectedAddress.phone}</p>
                        </div>
                        <button
                            onClick={() => setSelectedAddress(null)}
                            className="p-1 hover:bg-slate-100 rounded"
                        >
                            <SquarePenIcon size={16} />
                        </button>
                    </div>
                ) : (
                    <div>
                        {addressList.length > 0 && (
                            <select
                                className="border border-slate-300 p-2 w-full my-2 outline-none rounded-md text-sm"
                                onChange={(e) => setSelectedAddress(addressList[parseInt(e.target.value)])}
                            >
                                <option value="">Select Address</option>
                                {addressList.map((address, index) => (
                                    <option key={address.id} value={index}>
                                        {address.name}, {address.city}, {address.state}
                                    </option>
                                ))}
                            </select>
                        )}
                        <button
                            className="flex items-center gap-1 text-fuchsia-600 hover:text-fuchsia-700 mt-2 text-sm font-medium"
                            onClick={() => setShowAddressModal(true)}
                        >
                            <PlusIcon size={16} /> Add New Address
                        </button>
                    </div>
                )}
            </div>

            {/* Price Breakdown */}
            <div className="pb-4 border-b border-slate-200">
                <div className="flex justify-between mb-2">
                    <span className="text-slate-500">Subtotal:</span>
                    <span className="font-medium">{currency}{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between mb-2">
                    <span className="text-slate-500">Shipping:</span>
                    <span className="font-medium text-green-600">Free</span>
                </div>
                {coupon && (
                    <div className="flex justify-between mb-2">
                        <span className="text-slate-500">Discount ({coupon.discount}%):</span>
                        <span className="font-medium text-green-600">-{currency}{discount.toFixed(2)}</span>
                    </div>
                )}

                {/* Coupon Input */}
                {!coupon ? (
                    <form onSubmit={(e) => toast.promise(handleCouponCode(e), { loading: 'Checking coupon...' })} className="flex gap-2 mt-3">
                        <input
                            onChange={(e) => setCouponCodeInput(e.target.value)}
                            value={couponCodeInput}
                            type="text"
                            placeholder="Coupon Code"
                            className="border border-slate-300 p-2 rounded-md w-full outline-none text-sm focus:ring-2 focus:ring-fuchsia-500"
                        />
                        <button className="bg-slate-700 text-white px-4 rounded-md hover:bg-slate-800 active:scale-95 transition-all text-sm">
                            Apply
                        </button>
                    </form>
                ) : (
                    <div className="w-full flex items-center justify-between bg-green-50 border border-green-200 rounded-md p-2 mt-2">
                        <div className="text-xs">
                            <p className="font-semibold text-green-700">{coupon.code.toUpperCase()}</p>
                            <p className="text-green-600">{coupon.description}</p>
                        </div>
                        <button onClick={() => setCoupon(null)} className="text-red-500 hover:text-red-700">
                            <XIcon size={16} />
                        </button>
                    </div>
                )}
            </div>

            {/* Total */}
            <div className="flex justify-between py-4 text-lg font-semibold">
                <span>Total:</span>
                <span className="text-fuchsia-600">{currency}{finalTotal.toLocaleString()}</span>
            </div>

            {/* Place Order Button */}
            <button
                onClick={(e) => toast.promise(handlePlaceOrder(e), {
                    loading: 'Placing order...',
                    success: 'Order placed!',
                    error: 'Failed to place order'
                })}
                disabled={isProcessing || !selectedAddress}
                className="w-full bg-fuchsia-600 text-white py-3 rounded-md hover:bg-fuchsia-700 active:scale-95 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isProcessing ? 'Processing...' : 'Place Order'}
            </button>

            {showAddressModal && <AddressModal setShowAddressModal={setShowAddressModal} />}
        </div>
    )
}
