import { useState, useEffect } from 'react'
import { Truck, MapPin, Plus, Edit, Trash2, Globe, Clock, DollarSign, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'

interface ShippingRate {
    id: string
    name: string
    minDays: number
    maxDays: number
    price: number
    description: string
}

interface ShippingZone {
    id: string
    name: string
    regions: string[]
    rates: ShippingRate[]
}

export default function ShippingTab() {
    const [loading, setLoading] = useState(false)
    const [zones, setZones] = useState<ShippingZone[]>([])
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [openRateModal, setOpenRateModal] = useState<string | null>(null)

    // New Zone Form State
    const [newZoneName, setNewZoneName] = useState('')
    const [newRegion, setNewRegion] = useState('')

    useEffect(() => {
        fetchZones()
    }, [])

    const fetchZones = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/admin/shipping')
            if (res.ok) {
                const data = await res.json()
                setZones(data)
            }
        } catch (e) {
            toast.error('Failed to load shipping zones')
        } finally {
            setLoading(false)
        }
    }

    const handleCreateZone = async () => {
        if (!newZoneName) return toast.error('Name required')
        try {
            const res = await fetch('/api/admin/shipping', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newZoneName,
                    regions: newRegion ? [newRegion] : [],
                    rates: []
                })
            })
            if (res.ok) {
                toast.success('Zone created')
                setIsCreateOpen(false)
                setNewZoneName('')
                fetchZones()
            }
        } catch (e) {
            toast.error('Failed to create zone')
        }
    }

    const handleDeleteZone = async (id: string) => {
        if (!confirm('Are you sure?')) return
        try {
            await fetch(`/api/admin/shipping?id=${id}`, { method: 'DELETE' })
            toast.success('Zone deleted')
            fetchZones()
        } catch (e) {
            toast.error('Delete failed')
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Truck className="text-violet-400" />
                    Shipping Management
                </h2>
                {!isCreateOpen && (
                    <button onClick={() => setIsCreateOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl transition-all">
                        <Plus size={18} />
                        <span>Add New Zone</span>
                    </button>
                )}
            </div>

            {isCreateOpen && (
                <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                    <div className="flex justify-between mb-4">
                        <h3 className="font-medium">Create Zone</h3>
                        <button onClick={() => setIsCreateOpen(false)}><X size={18} /></button>
                    </div>
                    <div className="flex gap-4">
                        <input className="bg-black/20 border border-white/10 rounded-lg p-2 text-white flex-1" placeholder="Zone Name (e.g. North America)" value={newZoneName} onChange={e => setNewZoneName(e.target.value)} />
                        <input className="bg-black/20 border border-white/10 rounded-lg p-2 text-white flex-1" placeholder="Region (e.g. US, CA)" value={newRegion} onChange={e => setNewRegion(e.target.value)} />
                        <button onClick={handleCreateZone} className="px-4 py-2 bg-green-600 rounded-lg">Save</button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {loading ? <Loader2 className="animate-spin" /> : zones.map((zone) => (
                    <div key={zone.id} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                        <div className="p-5 border-b border-white/10 flex justify-between items-start bg-white/5">
                            <div>
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <Globe size={18} className="text-blue-400" />
                                    {zone.name}
                                </h3>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {zone.regions?.map((region, idx) => (
                                        <span key={idx} className="px-2 py-0.5 rounded bg-white/10 text-xs text-white/60">
                                            {region}
                                        </span>
                                    ))}
                                    <button className="px-2 py-0.5 rounded bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 text-xs font-medium transition-colors">
                                        + Region
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="p-2 hover:bg-white/10 rounded-lg text-white/50 hover:text-white transition-colors">
                                    <Edit size={16} />
                                </button>
                                <button onClick={() => handleDeleteZone(zone.id)} className="p-2 hover:bg-red-500/20 rounded-lg text-white/50 hover:text-red-400 transition-colors">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="p-5 space-y-4">
                            <h4 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Shipping Rates</h4>
                            {zone.rates?.length > 0 ? zone.rates.map((rate) => (
                                <div key={rate.id} className="flex items-center justify-between p-3 rounded-lg bg-black/20 hover:bg-black/30 transition-colors border border-transparent hover:border-white/5 cursor-pointer">
                                    <div>
                                        <p className="font-medium text-sm">{rate.name}</p>
                                        <div className="flex items-center gap-3 mt-1 text-xs text-white/40">
                                            <span className="flex items-center gap-1">
                                                <Clock size={12} />
                                                {rate.minDays}-{rate.maxDays} days
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Truck size={12} />
                                                {rate.description || 'Standard Delivery'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="font-bold text-emerald-400">
                                        KES {rate.price}
                                    </div>
                                </div>
                            )) : <p className="text-sm text-white/30 italic">No rates configured</p>}

                            <button className="w-full py-2 flex items-center justify-center gap-2 border border-dashed border-white/20 rounded-lg text-sm text-white/50 hover:text-white hover:border-white/40 hover:bg-white/5 transition-all">
                                <Plus size={14} />
                                <span>Add Shipping Rate</span>
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            {!loading && zones.length === 0 && <p className="text-center text-white/50">No Data</p>}
        </div>
    )
}
