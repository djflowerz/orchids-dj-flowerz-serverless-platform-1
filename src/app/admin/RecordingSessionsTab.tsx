'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Mic2 } from 'lucide-react';
import { toast } from 'sonner';
import RecordingSessionModal from './RecordingSessionModal';

interface Session {
    id: string;
    name: string;
    locationType: string;
    basePrice: number;
    hourlyRate?: number;
    duration?: number;
    equipmentTier: string;
    isActive: boolean;
    bookings_count?: number;
}

export default function RecordingSessionsTab({ formatCurrency }: { formatCurrency: (amount: number) => string }) {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingSession, setEditingSession] = useState<Session | null>(null);

    useEffect(() => {
        fetchSessions();
    }, []);

    const fetchSessions = async () => {
        try {
            const res = await fetch('/api/recording-sessions');
            if (!res.ok) throw new Error('Failed to fetch sessions');
            const data = await res.json();
            setSessions(data.sessions || []);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load sessions');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (data: any) => {
        try {
            const res = await fetch('/api/recording-sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!res.ok) throw new Error('Failed to create session');

            toast.success('Session created successfully');
            fetchSessions();
            setShowModal(false);
        } catch (error) {
            console.error(error);
            toast.error('Failed to create session');
            throw error;
        }
    };

    const handleUpdate = async (data: any) => {
        if (!editingSession) return;

        try {
            const res = await fetch(`/api/recording-sessions/${editingSession.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!res.ok) throw new Error('Failed to update session');

            toast.success('Session updated successfully');
            fetchSessions();
            setShowModal(false);
            setEditingSession(null);
        } catch (error) {
            console.error(error);
            toast.error('Failed to update session');
            throw error;
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this session?')) return;

        try {
            const res = await fetch(`/api/recording-sessions/${id}`, {
                method: 'DELETE',
            });

            if (!res.ok) throw new Error('Failed to delete session');

            toast.success('Session deleted successfully');
            fetchSessions();
        } catch (error) {
            console.error(error);
            toast.error('Failed to delete session');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-white">Recording Sessions</h2>
                    <p className="text-white/50 text-sm">Manage available session types and pricing</p>
                </div>
                <button
                    onClick={() => {
                        setEditingSession(null);
                        setShowModal(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-medium transition-all"
                >
                    <Plus size={18} />
                    Add Session
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sessions.map((session) => (
                    <div
                        key={session.id}
                        className={`bg-[#12121a] rounded-2xl border ${session.isActive ? 'border-white/10' : 'border-red-500/20'
                            } p-6 hover:border-purple-500/30 transition-all`}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400">
                                    <Mic2 size={20} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white">{session.name}</h3>
                                    <span className="text-xs text-white/50 px-2 py-0.5 rounded-full bg-white/5">
                                        {session.locationType.replace('_', ' ')}
                                    </span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        setEditingSession(session);
                                        setShowModal(true);
                                    }}
                                    className="p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white"
                                >
                                    <Edit size={16} />
                                </button>
                                <button
                                    onClick={() => handleDelete(session.id)}
                                    className="p-2 rounded-lg hover:bg-red-500/10 text-white/70 hover:text-red-400"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3 mb-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-white/50">Base Price</span>
                                <span className="text-white font-medium">
                                    {/* Assuming formatCurrency handles pure numbers or KES conversion, using basePrice directly */}
                                    KES {session.basePrice.toLocaleString()}
                                </span>
                            </div>
                            {session.hourlyRate && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-white/50">Hourly Rate</span>
                                    <span className="text-white font-medium">
                                        KES {session.hourlyRate.toLocaleString()}
                                    </span>
                                </div>
                            )}
                            <div className="flex justify-between text-sm">
                                <span className="text-white/50">Equipment</span>
                                <span className="text-white">{session.equipmentTier}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-white/50">Status</span>
                                <span
                                    className={
                                        session.isActive ? 'text-green-400' : 'text-red-400'
                                    }
                                >
                                    {session.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <RecordingSessionModal
                    session={editingSession}
                    onClose={() => {
                        setShowModal(false);
                        setEditingSession(null);
                    }}
                    onSave={editingSession ? handleUpdate : handleCreate}
                />
            )}
        </div>
    );
}
