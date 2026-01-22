"use client"

import { useState, useEffect } from 'react'
import { useCart } from '@/context/CartContext'
import { useAuth } from '@/context/AuthContext'
import { formatCurrency } from '@/lib/utils'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Trash2, Plus, Minus, ArrowLeft, CreditCard, ShoppingBag, Loader2, Truck, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { db } from '@/lib/firebase'
import { collection, query, where, getDocs, doc, getDoc, addDoc, onSnapshot } from 'firebase/firestore'

declare global {
    interface Window {
        PaystackPop: {
            setup: (config: {
                key: string
                email: string
                amount: number
                currency: string
                ref: string
                metadata?: Record<string, unknown>
                callback: (response: { reference: string }) => void
                onClose: () => void
            }) => { openIframe: () => void }
        }
    }
}

export default function CheckoutPage() {
    const { items, removeFromCart, updateQuantity, clearCart, total } = useCart()
    const { user } = useAuth()
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [paystackKey, setPaystackKey] = useState('')

    const [shippingDetails, setShippingDetails] = useState({
        fullName: user?.name || '',
        email: user?.email || '',
        phone: '',
        address: '',
        city: '',
        country: 'Kenya',
        notes: ''
    })

    // Fetch Paystack Key
    useEffect(() => {
        async function fetchSettings() {
            try {
                const docRef = doc(db, 'settings', 'site')
                const snap = await getDoc(docRef)
                if (snap.exists()) {
                    setPaystackKey(snap.data().paystackPublicKey)
                }
            } catch (err) {
                console.error('Error fetching settings:', err)
            }
        }
        fetchSettings()
    }, [])

    // If cart empty, redirect
    useEffect(() => {
        if (items.length === 0 && !success) {
            router.push('/cart')
        }
    }, [items, success, router])

    const hasPhysicalItems = items.some(i =>
        i.type === 'product' && (i.item as any).product_type === 'physical'
    )

    const [pendingOrderId, setPendingOrderId] = useState<string | null>(null)

    // Listen for order status changes
    useEffect(() => {
        if (!pendingOrderId) return

        const unsubscribe = onSnapshot(doc(db, 'orders', pendingOrderId), (doc) => {
            if (doc.exists()) {
                const data = doc.data()
                if (data.status === 'paid') {
                    // Redirect to locked page immediately
                    router.push(`/payment-success?orderId=${pendingOrderId}`)
                }
            }
        })

        return () => unsubscribe()
    }, [pendingOrderId, router])

    const handlePayment = async () => {
        const activeKey = paystackKey || process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY

        if (!activeKey) {
            toast.error('Payment configuration missing')
            return
        }

        if (hasPhysicalItems && (!shippingDetails.fullName || !shippingDetails.email || !shippingDetails.address)) {
            toast.error('Please fill in shipping details')
            return
        }
        if (!hasPhysicalItems && !shippingDetails.email) {
            toast.error('Email is required')
            return
        }

        setLoading(true)

        try {
            // STEP 1: CREATE PENDING ORDER
            const orderData = {
                userId: user?.id || 'guest',
                email: shippingDetails.email,
                items: items.map(i => ({
                    product_id: i.type === 'product' ? i.item.id : null,
                    mixtape_id: i.type === 'mixtape' ? i.item.id : null,
                    amount: ('price' in i.item ? i.item.price : 0) * i.quantity,
                    quantity: i.quantity,
                    title: i.item.title,
                    type: i.type
                })),
                total_amount: total,
                currency: 'KES',
                status: 'pending', // 👈 PENDING initiates the flow
                payment_status: 'pending',
                shipping_details: hasPhysicalItems ? shippingDetails : null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }

            const orderRef = await addDoc(collection(db, 'orders'), orderData)
            const orderId = orderRef.id
            setPendingOrderId(orderId)

            // STEP 2: INITIALIZE PAYSTACK WITH ORDER ID
            const handler = window.PaystackPop.setup({
                key: activeKey,
                email: shippingDetails.email,
                amount: total,
                currency: 'KES',
                ref: orderId, // 👈 REFERENCE IS ORDER ID
                metadata: {
                    order_id: orderId,
                    cart_items: items.map(i => i.item.title).join(', ')
                },
                callback: async (response) => {
                    console.log('[Checkout] Paystack callback:', response)
                    toast.loading('Verifying payment... Please wait.')

                    try {
                        const verifyRes = await fetch('/api/verify-payment', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                reference: response.reference,
                                orderId: orderId
                            })
                        })

                        const verifyData = await verifyRes.json()

                        if (verifyRes.ok && verifyData.verified) {
                            setSuccess(true)
                            clearCart()
                            // Redirect to success page
                            router.push(`/payment-success?orderId=${orderId}`)
                        } else {
                            toast.error(verifyData.error || 'Payment verification failed')
                            setLoading(false)
                        }
                    } catch (err) {
                        console.error('Verification call error:', err)
                        toast.error('Failed to verify payment. Please contact support.')
                        setLoading(false)
                    }
                },
                onClose: () => {
                    setLoading(false)
                    toast('Payment cancelled')
                }
            })
            handler.openIframe()

        } catch (error) {
            console.error('Payment init error:', error)
            toast.error('Failed to initialize payment')
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-black py-12">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/cart" className="p-2 rounded-lg bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-colors">
                        <ArrowLeft size={20} />
                    </Link>
                    <h1 className="font-display text-4xl text-white">CHECKOUT</h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Left Column: Shipping / Details */}
                    <div className="space-y-8">
                        {hasPhysicalItems && (
                            <div className="space-y-4">
                                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                                    <Truck className="text-fuchsia-500" /> Shipping Details
                                </h2>
                                <div className="grid grid-cols-1 gap-4">
                                    <input type="text" placeholder="Full Name" value={shippingDetails.fullName} onChange={e => setShippingDetails({ ...shippingDetails, fullName: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-fuchsia-500/50 outline-none" />
                                    <div className="grid grid-cols-2 gap-4">
                                        <input type="email" placeholder="Email" value={shippingDetails.email} onChange={e => setShippingDetails({ ...shippingDetails, email: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-fuchsia-500/50 outline-none" />
                                        <input type="tel" placeholder="Phone" value={shippingDetails.phone} onChange={e => setShippingDetails({ ...shippingDetails, phone: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-fuchsia-500/50 outline-none" />
                                    </div>
                                    <input type="text" placeholder="Address" value={shippingDetails.address} onChange={e => setShippingDetails({ ...shippingDetails, address: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-fuchsia-500/50 outline-none" />
                                    <div className="grid grid-cols-2 gap-4">
                                        <input type="text" placeholder="City" value={shippingDetails.city} onChange={e => setShippingDetails({ ...shippingDetails, city: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-fuchsia-500/50 outline-none" />
                                        <input type="text" placeholder="Country" value={shippingDetails.country} disabled className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white/50 cursor-not-allowed" />
                                    </div>
                                    <textarea placeholder="Delivery Instructions (Optional)" value={shippingDetails.notes} onChange={e => setShippingDetails({ ...shippingDetails, notes: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-fuchsia-500/50 outline-none h-24 resize-none" />
                                </div>
                            </div>
                        )}

                        {!hasPhysicalItems && (
                            <div className="space-y-4">
                                <h2 className="text-xl font-semibold text-white">Contact Info</h2>
                                <input type="email" placeholder="Email for receipt" value={shippingDetails.email} onChange={e => setShippingDetails({ ...shippingDetails, email: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-fuchsia-500/50 outline-none" />
                            </div>
                        )}
                    </div>

                    {/* Right Column: Order Summary */}
                    <div>
                        <div className="bg-white/5 rounded-2xl border border-white/10 p-6 sticky top-24">
                            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                                <ShoppingBag className="text-cyan-500" /> Order Summary
                            </h2>

                            <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto pr-2">
                                {items.map((item) => {
                                    const price = 'price' in item.item ? item.item.price : 0
                                    const image =
                                        ('image_url' in item.item && item.item.image_url) ? item.item.image_url :
                                            ('cover_image' in item.item && item.item.cover_image) ? item.item.cover_image :
                                                ('cover_images' in item.item && item.item.cover_images?.[0]) ? item.item.cover_images[0] : null

                                    return (
                                        <div key={(item as any).uniqueKey || item.id} className="flex gap-4">
                                            <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-white/5 shrink-0">
                                                {image && (
                                                    <Image
                                                        src={image}
                                                        alt={item.item.title}
                                                        fill className="object-cover"
                                                    />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-white font-medium truncate">{item.item.title}</h4>
                                                <p className="text-white/50 text-sm">Qty: {item.quantity}</p>
                                            </div>
                                            <div className="text-white font-medium">
                                                {formatCurrency(price * item.quantity)}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            <div className="border-t border-white/10 pt-4 space-y-2 mb-6">
                                <div className="flex justify-between text-white/60">
                                    <span>Subtotal</span>
                                    <span>{formatCurrency(total)}</span>
                                </div>
                                <div className="flex justify-between text-white text-xl font-bold">
                                    <span>Total</span>
                                    <span className="text-cyan-400">{formatCurrency(total)}</span>
                                </div>
                            </div>

                            <button
                                onClick={handlePayment}
                                disabled={loading}
                                className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white font-bold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 size={20} className="animate-spin" /> : <CreditCard size={20} />}
                                {loading ? 'Processing...' : `Pay ${formatCurrency(total)}`}
                            </button>

                            <p className="text-center text-white/40 text-xs mt-4 flex items-center justify-center gap-2">
                                Secured by Paystack
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
