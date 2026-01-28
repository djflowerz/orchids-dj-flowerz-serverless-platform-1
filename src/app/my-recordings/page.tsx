'use client';

import { Suspense, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Clock, MapPin, Mic2, FileText, AlertCircle, Loader2, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

function MyRecordingsContent() {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const isNew = searchParams.get('new') === 'true';

    const [bookings, setBookings] = useState<any[]>([]);
    const [loadingBookings, setLoadingBookings] = useState(true);

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/login');
            return;
        }

        if (user) {
            fetchBookings();
        }
    }, [user, isLoading]);

    useEffect(() => {
        if (isNew) {
            toast.success('Booking created successfully!');
        }
    }, [isNew]);

    const fetchBookings = async () => {
        try {
            const res = await fetch('/api/bookings');
            if (res.ok) {
                const data = await res.json();
                setBookings(data || []);
            }
        } catch (error) {
            console.error('Error fetching bookings:', error);
            toast.error('Failed to load bookings');
        } finally {
            setLoadingBookings(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'CONFIRMED': return 'bg-green-100 text-green-700 border-green-200';
            case 'PENDING': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'COMPLETED': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'CANCELLED': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    if (isLoading || (loadingBookings && user)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">My Recordings</h1>
                        <p className="text-gray-600 mt-1">Manage your studio sessions and bookings</p>
                    </div>
                    <Link
                        href="/recording-sessions"
                        className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg bg-black text-white font-medium hover:bg-gray-800 transition-colors shadow-sm"
                    >
                        <Mic2 className="w-4 h-4 mr-2" />
                        Book New Session
                    </Link>
                </div>

                {bookings.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                        <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Mic2 className="w-8 h-8 text-purple-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No Bookings Yet</h3>
                        <p className="text-gray-500 mb-8 max-w-md mx-auto">
                            You haven't booked any recording sessions yet. Check out our available packages to get started.
                        </p>
                        <Link
                            href="/recording-sessions"
                            className="inline-flex items-center text-purple-600 font-semibold hover:text-purple-700"
                        >
                            Browse Sessions →
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {bookings.map((booking) => (
                            <div
                                key={booking.id}
                                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
                            >
                                <div className="p-6">
                                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">

                                        {/* Status & ID (Mobile) */}
                                        <div className="lg:hidden flex justify-between items-start mb-2">
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(booking.status)}`}>
                                                {booking.status}
                                            </span>
                                            <span className="text-xs text-gray-400 font-mono">#{booking.id.slice(-6)}</span>
                                        </div>

                                        {/* Main Info */}
                                        <div className="flex-1">
                                            <div className="flex items-start justify-between mb-2">
                                                <div>
                                                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                                                        {booking.session.name}
                                                    </h3>
                                                    <div className="flex items-center gap-4 text-sm text-gray-500">
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="w-4 h-4" />
                                                            {format(new Date(booking.scheduledDate), 'MMM d, yyyy')}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="w-4 h-4" />
                                                            {booking.scheduledTime} ({booking.duration} mins)
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Status (Desktop) */}
                                                <div className="hidden lg:flex flex-col items-end gap-2">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(booking.status)}`}>
                                                        {booking.status}
                                                    </span>
                                                    <span className="text-xs text-gray-400 font-mono">#{booking.id.slice(-6)}</span>
                                                </div>
                                            </div>

                                            {/* Details Grid */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-50">
                                                <div>
                                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Location</p>
                                                    <div className="flex items-center gap-2 text-gray-700">
                                                        <MapPin className="w-4 h-4 text-gray-400" />
                                                        {booking.session.locationType === 'IN_STUDIO' ? 'Main Studio' : (booking.location || 'Remote/On-Location')}
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Payment</p>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-gray-900">KES {booking.totalPrice.toLocaleString()}</span>
                                                        <span className="text-gray-400">•</span>
                                                        <span className={`text-sm ${booking.isPaid ? 'text-green-600 font-medium' : 'text-orange-500'}`}>
                                                            {booking.isPaid ? 'Paid' : 'Payment Pending'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Notes / Equipment */}
                                            {(booking.notes || booking.equipmentNeeds) && (
                                                <div className="mt-4 pt-4 border-t border-gray-50">
                                                    <div className="flex items-start gap-2 text-sm text-gray-600">
                                                        <FileText className="w-4 h-4 mt-0.5 text-gray-400" />
                                                        <p className="line-clamp-1">{booking.notes || 'No additional notes'}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex lg:flex-col gap-3 justify-end lg:justify-start lg:border-l lg:border-gray-50 lg:pl-6">
                                            {!booking.isPaid && booking.status !== 'CANCELLED' && (
                                                <button
                                                    onClick={async () => {
                                                        const toastId = toast.loading('Initializing Payment...')
                                                        try {
                                                            const res = await fetch('/api/payments/paystack/initialize', {
                                                                method: 'POST',
                                                                headers: { 'Content-Type': 'application/json' },
                                                                body: JSON.stringify({
                                                                    bookingId: booking.id,
                                                                    // Email is inferred on server or matches current user
                                                                })
                                                            })
                                                            const data = await res.json()
                                                            if (!res.ok) throw new Error(data.error || 'Payment failed')

                                                            window.location.href = data.authorization_url
                                                        } catch (e: any) {
                                                            toast.error(e.message, { id: toastId })
                                                        }
                                                    }}
                                                    className="px-4 py-2 rounded-lg bg-black text-white text-sm font-semibold hover:bg-gray-800 transition-colors whitespace-nowrap flex items-center gap-2"
                                                >
                                                    <CreditCard className="w-4 h-4" />
                                                    Pay Now
                                                </button>
                                            )}
                                            {booking.status === 'PENDING' && (
                                                <button
                                                    className="px-4 py-2 rounded-lg border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors whitespace-nowrap"
                                                    onClick={async () => {
                                                        if (!confirm('Are you sure you want to cancel this booking?')) return;
                                                        try {
                                                            await fetch(`/api/bookings/${booking.id}`, {
                                                                method: 'PATCH',
                                                                body: JSON.stringify({ status: 'CANCELLED' })
                                                            });
                                                            fetchBookings();
                                                            toast.success('Booking cancelled');
                                                        } catch (e) {
                                                            toast.error('Failed to cancel');
                                                        }
                                                    }}
                                                >
                                                    Cancel
                                                </button>
                                            )}
                                        </div>

                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function MyRecordingsPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
            </div>
        }>
            <MyRecordingsContent />
        </Suspense>
    );
}
