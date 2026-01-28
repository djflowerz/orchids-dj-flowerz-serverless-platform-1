'use client';

import { useState } from 'react';
import { X, RefreshCw, Save } from 'lucide-react';
import { toast } from 'sonner';

interface RecordingSessionModalProps {
    session: any | null;
    onClose: () => void;
    onSave: (data: any) => Promise<void>;
}

export default function RecordingSessionModal({ session, onClose, onSave }: RecordingSessionModalProps) {
    const [formData, setFormData] = useState({
        name: session?.name || '',
        description: session?.description || '',
        locationType: session?.locationType || 'IN_STUDIO',
        basePrice: session?.basePrice ? session.basePrice.toString() : '',
        hourlyRate: session?.hourlyRate ? session.hourlyRate.toString() : '',
        duration: session?.duration ? session.duration.toString() : '',
        equipmentTier: session?.equipmentTier || 'BASIC',
        includesEditing: session?.includesEditing || false,
        includesMastering: session?.includesMastering || false,
        maxParticipants: session?.maxParticipants ? session.maxParticipants.toString() : '1',
        isActive: session?.isActive ?? true,
    });

    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await onSave({
                ...formData,
                basePrice: parseFloat(formData.basePrice),
                hourlyRate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : null,
                duration: formData.duration ? parseInt(formData.duration) : null,
                maxParticipants: parseInt(formData.maxParticipants),
            });
            onClose();
        } catch (error) {
            console.error(error);
            toast.error('Failed to save session');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#12121a] rounded-2xl border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-white/10 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">
                        {session ? 'Edit Recording Session' : 'Create Recording Session'}
                    </h3>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-white/70">
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-sm text-white/70 mb-2">Session Name</label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500/50"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm text-white/70 mb-2">Description</label>
                            <textarea
                                required
                                rows={3}
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500/50"
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-white/70 mb-2">Location Type</label>
                            <select
                                value={formData.locationType}
                                onChange={(e) => setFormData({ ...formData, locationType: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500/50"
                            >
                                <option value="IN_STUDIO" className="bg-[#12121a]">In Studio</option>
                                <option value="ON_LOCATION" className="bg-[#12121a]">On Location</option>
                                <option value="REMOTE" className="bg-[#12121a]">Remote</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm text-white/70 mb-2">Equipment Tier</label>
                            <select
                                value={formData.equipmentTier}
                                onChange={(e) => setFormData({ ...formData, equipmentTier: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500/50"
                            >
                                <option value="BASIC" className="bg-[#12121a]">Basic</option>
                                <option value="STANDARD" className="bg-[#12121a]">Standard</option>
                                <option value="PREMIUM" className="bg-[#12121a]">Premium</option>
                                <option value="CUSTOM" className="bg-[#12121a]">Custom</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm text-white/70 mb-2">Base Price (KES)</label>
                            <input
                                type="number"
                                required
                                min="0"
                                value={formData.basePrice}
                                onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500/50"
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-white/70 mb-2">Hourly Rate (KES) - Optional</label>
                            <input
                                type="number"
                                min="0"
                                value={formData.hourlyRate}
                                onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                                placeholder="Leave empty if N/A"
                                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500/50"
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-white/70 mb-2">Duration (minutes)</label>
                            <input
                                type="number"
                                min="0"
                                value={formData.duration}
                                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                placeholder="Fixed duration"
                                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500/50"
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-white/70 mb-2">Max Participants</label>
                            <input
                                type="number"
                                required
                                min="1"
                                value={formData.maxParticipants}
                                onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500/50"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="includesEditing"
                                checked={formData.includesEditing}
                                onChange={(e) => setFormData({ ...formData, includesEditing: e.target.checked })}
                                className="rounded bg-white/10 border-white/20 text-purple-600 focus:ring-purple-600"
                            />
                            <label htmlFor="includesEditing" className="text-sm text-white/90">Includes Editing</label>
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="includesMastering"
                                checked={formData.includesMastering}
                                onChange={(e) => setFormData({ ...formData, includesMastering: e.target.checked })}
                                className="rounded bg-white/10 border-white/20 text-purple-600 focus:ring-purple-600"
                            />
                            <label htmlFor="includesMastering" className="text-sm text-white/90">Includes Mastering</label>
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="isActive"
                                checked={formData.isActive}
                                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                className="rounded bg-white/10 border-white/20 text-purple-600 focus:ring-purple-600"
                            />
                            <label htmlFor="isActive" className="text-sm text-white/90">Active (Visible to users)</label>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-white/10 flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-medium flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
                            {saving ? 'Saving...' : 'Save Session'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
