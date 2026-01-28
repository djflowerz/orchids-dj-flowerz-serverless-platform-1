"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, Clock, MapPin, CreditCard, Loader2, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'

interface BookingFormProps {
    session: any
    user: any
}

export default function BookingForm({ session, user }: BookingFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [paymentLoading, setPaymentLoading] = useState(false)

    const [formData, setFormData] = useState({
        scheduledDate: '',
        scheduledTime: '',
        duration: session.duration || 60,
        location: '',
        equipmentNeeds: [],
        notes: '',
        paymentMethod: 'PAYSTACK' // Default to Paystack
    })

    // Calculate Total Price
    const basePrice = session.basePrice
    const hourlyRate = session.hourlyRate || 0

    let totalPrice = basePrice
    if (session.hourlyRate && !session.duration) {
        totalPrice = session.basePrice + (session.hourlyRate * (formData.duration / 60))
    } else if (session.hourlyRate && formData.duration > session.duration) {
        // Extra time
        const extraHours = (formData.duration - session.duration) / 60
        totalPrice = session.basePrice + (session.hourlyRate * extraHours)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            if (!user) {
                toast.error("Please login to book a session")
                router.push(`/login?callbackUrl=/recording-sessions/${session.id}`)
                return
            }

            // 1. Create Booking
            const res = await fetch('/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: session.id,
                    ...formData,
                    totalPrice
                })
            })

            const booking = await res.json()

            if (!res.ok) throw new Error(booking.error || 'Booking failed')

            toast.success('Booking created!')

            // 2. Initiate Paystack Payment
            setPaymentLoading(true)
            const payRes = await fetch('/api/payments/paystack/initialize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bookingId: booking.id,
                    email: user.email
                })
            })

            const payData = await payRes.json()

            if (!payRes.ok) throw new Error(payData.error || 'Payment initialization failed')

            // 3. Redirect to Paystack
            window.location.href = payData.authorization_url

        } catch (error: any) {
            console.error(error)
            toast.error(error.message)
            // If booking was created but payment failed, redirect to dashboard to retry
            if (error.message !== 'Booking failed') {
                router.push('/my-recordings')
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Book Session</h3>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Date & Time */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" /> Date
                            </div>
                        </label>
                        <input
                            type="date"
                            required
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                            value={formData.scheduledDate}
                            onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4" /> Time
                            </div>
                        </label>
                        <input
                            type="time"
                            required
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                            value={formData.scheduledTime}
                            onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                        />
                    </div>
                </div>

                {/* Duration (if flexible) */}
                {session.hourlyRate && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Duration (Minutes)</label>
                        <select
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                            value={formData.duration}
                            onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                        >
                            <option value={60}>1 Hour</option>
                            <option value={120}>2 Hours</option>
                            <option value={180}>3 Hours</option>
                            <option value={240}>4 Hours</option>
                        </select>
                    </div>
                )}

                {/* Location (if ON_LOCATION) */}
                {session.locationType === 'ON_LOCATION' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4" /> Location Details
                            </div>
                        </label>
                        <textarea
                            required
                            rows={2}
                            placeholder="Where should we meet? (Address/Venue)"
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        />
                    </div>
                )}

                {/* Notes */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes / Equipment Needs</label>
                    <textarea
                        rows={3}
                        placeholder="Any specific gear requests or session goals?"
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                </div>

                {/* Payment Info */}
                <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                    <div className="flex items-center gap-3 mb-2">
                        <CreditCard className="w-5 h-5 text-purple-600" />
                        <span className="font-semibold text-purple-900">Secure Payment via Paystack</span>
                    </div>
                    <p className="text-sm text-purple-700">
                        Supports M-Pesa, Card, and Bank Transfer.
                    </p>
                </div>

                {/* Summary & Submit */}
                <div className="pt-6 border-t border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                        <span className="text-gray-600">Total Estimate</span>
                        <span className="text-3xl font-bold text-gray-900">KES {totalPrice.toLocaleString()}</span>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || paymentLoading}
                        className="w-full py-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading || paymentLoading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                {paymentLoading ? "Redirecting to Payment..." : "Processing Booking..."}
                            </>
                        ) : (
                            <>
                                <ShieldCheck className="w-5 h-5" />
                                Book & Pay Now
                            </>
                        )}
                    </button>
                    <p className="text-center text-xs text-gray-500 mt-4">
                        Secure payment processed by Paystack.
                    </p>
                </div>
            </form>
        </div>
    )
}
