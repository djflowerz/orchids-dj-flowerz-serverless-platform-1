import { useState, useEffect } from 'react'
import { Wrench, CheckCircle, AlertTriangle, XCircle, Plus, Search, Calendar, PenTool, Loader2, X, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface Equipment {
    id: string
    name: string
    type: string
    serialNumber: string
    purchaseDate: string
    status: 'operational' | 'maintenance' | 'repair'
    lastService: string
    nextService: string
    notes: string
}

export default function EquipmentTab() {
    const [filterStatus, setFilterStatus] = useState<string>('all')
    const [equipment, setEquipment] = useState<Equipment[]>([])
    const [loading, setLoading] = useState(false)
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [newItem, setNewItem] = useState<Partial<Equipment>>({ status: 'operational' })

    useEffect(() => {
        fetchEquipment()
    }, [])

    const fetchEquipment = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/admin/equipment')
            if (res.ok) {
                const data = await res.json()
                setEquipment(data)
            }
        } catch (e) { toast.error('Failed to load equipment') }
        finally { setLoading(false) }
    }

    const handleCreate = async () => {
        if (!newItem.name || !newItem.serialNumber) return toast.error('Name & Serial required')
        try {
            const res = await fetch('/api/admin/equipment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newItem)
            })
            if (res.ok) {
                toast.success('Added')
                setIsCreateOpen(false)
                setNewItem({ status: 'operational' }) // reset
                fetchEquipment()
            }
        } catch (e) { toast.error('Error adding equipment') }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure?')) return
        try {
            await fetch(`/api/admin/equipment?id=${id}`, { method: 'DELETE' })
            fetchEquipment()
            toast.success('Deleted')
        } catch (e) { toast.error('Error deleting') }
    }

    const filteredEquipment = equipment.filter(item =>
        filterStatus === 'all' ? true : item.status === filterStatus
    )

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'operational': return 'text-green-400 bg-green-500/10 border-green-500/20'
            case 'maintenance': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
            case 'repair': return 'text-red-400 bg-red-500/10 border-red-500/20'
            default: return 'text-white/60 bg-white/5 border-white/10'
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex gap-2">
                    {['all', 'operational', 'maintenance', 'repair'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${filterStatus === status ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white hover:bg-white/10'
                                }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
                {!isCreateOpen && (
                    <button onClick={() => setIsCreateOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl transition-all">
                        <Plus size={18} />
                        <span>Add Equipment</span>
                    </button>
                )}
            </div>

            {isCreateOpen && (
                <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                    <div className="flex justify-between mb-4">
                        <h3 className="font-medium">Add Equipment</h3>
                        <button onClick={() => setIsCreateOpen(false)}><X size={18} /></button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <input className="bg-black/20 p-2 rounded border border-white/10" placeholder="Name" onChange={e => setNewItem({ ...newItem, name: e.target.value })} />
                        <input className="bg-black/20 p-2 rounded border border-white/10" placeholder="Serial Number" onChange={e => setNewItem({ ...newItem, serialNumber: e.target.value })} />
                        <input className="bg-black/20 p-2 rounded border border-white/10" placeholder="Type (e.g. Mixer)" onChange={e => setNewItem({ ...newItem, type: e.target.value })} />
                        <select className="bg-black/20 p-2 rounded border border-white/10" onChange={e => setNewItem({ ...newItem, status: e.target.value as any })}>
                            <option value="operational">Operational</option>
                            <option value="maintenance">Maintenance</option>
                            <option value="repair">Repair</option>
                        </select>
                    </div>
                    <button onClick={handleCreate} className="mt-4 px-4 py-2 bg-green-600 rounded">Save</button>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? <Loader2 className="animate-spin" /> : filteredEquipment.map((item) => (
                    <div key={item.id} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition-all group">
                        <div className="p-4 border-b border-white/10 flex justify-between items-start">
                            <div>
                                <h3 className="font-semibold text-lg">{item.name}</h3>
                                <p className="text-sm text-white/50">{item.type} • {item.serialNumber}</p>
                            </div>
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${getStatusColor(item.status)}`}>
                                {item.status.toUpperCase()}
                            </span>
                        </div>
                        <div className="p-4 space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-white/40">Next Service</span>
                                <span className="text-white/80">{item.nextService ? format(new Date(item.nextService), 'MMM d, yyyy') : 'N/A'}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-white/40">Last Service</span>
                                <span className="text-white/80">{item.lastService ? format(new Date(item.lastService), 'MMM d, yyyy') : 'N/A'}</span>
                            </div>
                            <div className="pt-3 border-t border-white/10 flex justify-end gap-2">
                                <button onClick={() => handleDelete(item.id)} className="p-2 hover:bg-red-500/20 text-red-400 rounded transition-colors"><Trash2 size={16} /></button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            {!loading && filteredEquipment.length === 0 && <p className="text-center text-white/50">No Data</p>}
        </div>
    )
}
