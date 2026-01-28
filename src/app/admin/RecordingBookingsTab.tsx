'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Calendar, MapPin, User, Search } from 'lucide-react';
import { toast } from 'sonner';

interface RecordingBooking {
    id: string;
    user: { name: string; email: string };
    session: { name: string };
    scheduledDate: string;
    scheduledTime: string;
    duration: number;
    location?: string;
    totalPrice: number;
    status: string;
    isPaid: boolean;
    notes?: string;
}

export default function RecordingBookingsTab({ formatCurrency }: { formatCurrency: (amount: number) => string }) {
    const [bookings, setBookings] = useState<RecordingBooking[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        try {
            const res = await fetch('/api/bookings');
            if (!res.ok) throw new Error('Failed to fetch bookings');
            const data = await res.json();
            setBookings(data.bookings || []);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load bookings');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id: string, status: string) => {
        try {
            const res = await fetch(`/api/bookings/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            });

            if (!res.ok) throw new Error('Failed to update status');

            toast.success('Booking status updated');
            fetchBookings();
        } catch (error) {
            console.error(error);
            toast.error('Failed to update status');
        }
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            PENDING: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
            CONFIRMED: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
            IN_PROGRESS: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
            COMPLETED: 'bg-green-500/20 text-green-400 border-green-500/30',
            CANCELLED: 'bg-red-500/20 text-red-400 border-red-500/30',
        };
        return colors[status] || 'bg-gray-500/20 text-gray-400';
    };

    const filteredBookings = bookings.filter((booking) => {
        const matchesSearch =
            booking.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            booking.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            booking.session.name.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = filterStatus === 'all' || booking.status === filterStatus;

        return matchesSearch && matchesStatus;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-xl font-bold text-white">Recording Bookings</h2>
                    <p className="text-white/50 text-sm">Manage studio and on-location recording sessions</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                        <input
                            type="text"
                            placeholder="Search bookings..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-4 py-2 w-full sm:w-64 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500/50"
                        />
                    </div>

                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500/50"
                    >
                        <option value="all" className="bg-[#12121a]">All Status</option>
                        <option value="PENDING" className="bg-[#12121a]">Pending</option>
                        <option value="CONFIRMED" className="bg-[#12121a]">Confirmed</option>
                        <option value="IN_PROGRESS" className="bg-[#12121a]">In Progress</option>
                        <option value="COMPLETED" className="bg-[#12121a]">Completed</option>
                        <option value="CANCELLED" className="bg-[#12121a]">Cancelled</option>
                    </select>
                </div>
            </div>

            <div className="bg-[#12121a] rounded-2xl border border-white/10 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/5 border-b border-white/10">
                                <th className="p-4 text-xs font-semibold text-white/50 uppercase">Session Info</th>
                                <th className="p-4 text-xs font-semibold text-white/50 uppercase">Customer</th>
                                <th className="p-4 text-xs font-semibold text-white/50 uppercase">Date & Time</th>
                                <th className="p-4 text-xs font-semibold text-white/50 uppercase">Status</th>
                                <th className="p-4 text-xs font-semibold text-white/50 uppercase">Total</th>
                                <th className="p-4 text-xs font-semibold text-white/50 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredBookings.map((booking) => (
                                <tr key={booking.id} className="hover:bg-white/5 transition-colors">
                                    <td className="p-4">
                                        <div className="font-medium text-white">{booking.session.name}</div>
                                        {booking.location && (
                                            <div className="flex items-center gap-1 text-xs text-white/50 mt-1">
                                                <MapPin size={12} />
                                                {booking.location}
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <User size={16} className="text-white/50" />
                                            <div>
                                                <div className="text-sm text-white">{booking.user.name}</div>
                                                <div className="text-xs text-white/50">{booking.user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="text-sm text-white">
                                            {new Date(booking.scheduledDate).toLocaleDateString()}
                                        </div>
                                        <div className="flex items-center gap-1 text-xs text-white/50 mt-1">
                                            <Clock size={12} />
                                            {booking.scheduledTime} ({booking.duration} min)
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${getStatusColor(booking.status)}`}>
                                            {booking.status.replace('_', ' ')}
                                        </span>
                                        <div className="mt-1 text-xs">
                                            {booking.isPaid ? (
                                                <span className="text-green-400 flex items-center gap-1"><CheckCircle size={10} /> Paid</span>
                                            ) : (
                                                <span className="text-orange-400 flex items-center gap-1"><Clock size={10} /> Unpaid</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4 text-white font-medium">
                                        KES {booking.totalPrice.toLocaleString()}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            {booking.status === 'PENDING' && (
                                                <>
                                                    <button
                                                        onClick={() => handleUpdateStatus(booking.id, 'CONFIRMED')}
                                                        className="p-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30"
                                                        title="Confirm"
                                                    >
                                                        <CheckCircle size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleUpdateStatus(booking.id, 'CANCELLED')}
                                                        className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30"
                                                        title="Cancel"
                                                    >
                                                        <XCircle size={16} />
                                                    </button>
                                                </>
                                            )}
                                            {(booking.status === 'CONFIRMED' || booking.status === 'IN_PROGRESS') && (
                                                <button
                                                    onClick={() => handleUpdateStatus(booking.id, 'COMPLETED')}
                                                    className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30"
                                                    title="Complete"
                                                >
                                                    <CheckCircle size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredBookings.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-white/50">
                                        No bookings found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
