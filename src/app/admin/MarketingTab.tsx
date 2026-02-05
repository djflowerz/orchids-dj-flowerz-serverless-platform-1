import { useState, useEffect } from 'react'
import { Tag, Mail, Plus, Search, Edit, Trash2, Send, Copy, CheckCircle, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'

interface Coupon {
    id: string
    code: string
    discount: number
    type: 'percentage' | 'fixed'
    usageCount: number
    maxUsage: number
    expiresAt: string
    status: 'active' | 'expired'
}

interface EmailTemplate {
    id: string
    name: string
    subject: string
    type: 'newsletter' | 'transactional' | 'marketing'
    lastSent: string
    openRate: string
}

export default function MarketingTab() {
    const [activeSection, setActiveSection] = useState<'coupons' | 'templates'>('coupons')
    const [loading, setLoading] = useState(false)
    const [coupons, setCoupons] = useState<Coupon[]>([])
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [newCoupon, setNewCoupon] = useState({
        code: '',
        discount: 0,
        type: 'percentage',
        maxUsage: 100,
        expiresAt: '',
        status: 'active'
    })

    const [templates, setTemplates] = useState<EmailTemplate[]>([
        { id: '1', name: 'Welcome Email', subject: 'Welcome to the Family! 🌸', type: 'transactional', lastSent: '2024-02-01', openRate: '68%' },
        { id: '2', name: 'Monthly Newsletter', subject: 'This Month in Music', type: 'newsletter', lastSent: '2024-01-28', openRate: '42%' },
    ])

    useEffect(() => {
        if (activeSection === 'coupons') fetchCoupons()
    }, [activeSection])

    const fetchCoupons = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/admin/coupons')
            if (res.ok) {
                const data = await res.json()
                setCoupons(data)
            }
        } catch (e) {
            toast.error('Failed to load coupons')
        } finally {
            setLoading(false)
        }
    }

    const handleCreateCoupon = async () => {
        if (!newCoupon.code || !newCoupon.expiresAt) return toast.error('Code and Expiry required')
        try {
            const res = await fetch('/api/admin/coupons', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newCoupon)
            })
            if (res.ok) {
                toast.success('Coupon created')
                setIsCreateOpen(false)
                fetchCoupons()
            }
        } catch (e) {
            toast.error('Failed to create coupon')
        }
    }

    const handleDeleteCoupon = async (id: string) => {
        if (!confirm('Are you sure?')) return
        try {
            const res = await fetch(`/api/admin/coupons?id=${id}`, { method: 'DELETE' })
            if (res.ok) {
                toast.success('Coupon deleted')
                fetchCoupons()
            }
        } catch (e) {
            toast.error('Failed to delete')
        }
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        toast.success('Copied to clipboard')
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                    <button
                        onClick={() => setActiveSection('coupons')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeSection === 'coupons' ? 'bg-violet-500 text-white shadow-lg' : 'text-white/60 hover:text-white'}`}
                    >
                        <div className="flex items-center gap-2">
                            <Tag size={16} />
                            <span>Coupons</span>
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveSection('templates')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeSection === 'templates' ? 'bg-violet-500 text-white shadow-lg' : 'text-white/60 hover:text-white'}`}
                    >
                        <div className="flex items-center gap-2">
                            <Mail size={16} />
                            <span>Templates</span>
                        </div>
                    </button>
                </div>

                {activeSection === 'coupons' && !isCreateOpen && (
                    <button onClick={() => setIsCreateOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl transition-all">
                        <Plus size={18} />
                        <span>Create New</span>
                    </button>
                )}
            </div>

            {isCreateOpen && activeSection === 'coupons' && (
                <div className="bg-white/5 border border-white/10 rounded-xl p-5 mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">New Coupon</h3>
                        <button onClick={() => setIsCreateOpen(false)}><X size={20} className="text-white/50 hover:text-white" /></button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <input className="bg-black/20 border border-white/10 rounded-lg p-2 text-white" placeholder="Code (e.g. SALE50)" value={newCoupon.code} onChange={e => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })} />
                        <input className="bg-black/20 border border-white/10 rounded-lg p-2 text-white" type="number" placeholder="Discount Value" value={newCoupon.discount} onChange={e => setNewCoupon({ ...newCoupon, discount: Number(e.target.value) })} />
                        <select className="bg-black/20 border border-white/10 rounded-lg p-2 text-white" value={newCoupon.type} onChange={e => setNewCoupon({ ...newCoupon, type: e.target.value as any })}>
                            <option value="percentage">Percentage (%)</option>
                            <option value="fixed">Fixed Amount (KES)</option>
                        </select>
                        <input className="bg-black/20 border border-white/10 rounded-lg p-2 text-white" type="date" value={newCoupon.expiresAt} onChange={e => setNewCoupon({ ...newCoupon, expiresAt: e.target.value })} />
                    </div>
                    <button onClick={handleCreateCoupon} className="mt-4 px-4 py-2 bg-green-600 rounded-lg text-white font-medium hover:bg-green-500">Save Coupon</button>
                </div>
            )}

            {activeSection === 'coupons' && (
                <div className="grid gap-4">
                    {loading ? (
                        <div className="flex justify-center p-8"><Loader2 className="animate-spin text-white/50" /></div>
                    ) : coupons.length === 0 ? (
                        <p className="text-white/50 text-center py-8">No coupons found.</p>
                    ) : (
                        coupons.map((coupon) => (
                            <div key={coupon.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between hover:border-violet-500/30 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-lg bg-green-500/20 text-green-400 flex items-center justify-center">
                                        <Tag size={24} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-lg tracking-wide font-mono">{coupon.code}</h3>
                                            <button onClick={() => copyToClipboard(coupon.code)} className="text-white/30 hover:text-white transition-colors">
                                                <Copy size={14} />
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-white/50">
                                            <span>{coupon.type === 'percentage' ? `${coupon.discount}% OFF` : `KES ${coupon.discount} OFF`}</span>
                                            <span>•</span>
                                            <span>{coupon.usageCount} / {coupon.maxUsage} used</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="text-right">
                                        <p className={`text-sm font-medium ${coupon.status === 'active' ? 'text-green-400' : 'text-red-400'}`}>
                                            {coupon.status ? coupon.status.toUpperCase() : 'ACTIVE'}
                                        </p>
                                        <p className="text-xs text-white/30">Expires: {coupon.expiresAt}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => handleDeleteCoupon(coupon.id)} className="p-2 hover:bg-red-500/20 rounded-lg text-white/60 hover:text-red-400 transition-colors">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {activeSection === 'templates' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {templates.map((template) => (
                        <div key={template.id} className="bg-white/5 border border-white/10 rounded-xl p-5 hover:border-violet-500/30 transition-all group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center">
                                    <Mail size={20} />
                                </div>
                                <span className="px-2 py-1 rounded-md bg-white/5 text-xs font-medium text-white/50 uppercase">
                                    {template.type}
                                </span>
                            </div>
                            <h3 className="font-semibold text-lg mb-1">{template.name}</h3>
                            <p className="text-sm text-white/50 mb-4">Subject: "{template.subject}"</p>
                            <div className="flex items-center justify-between pt-4 border-t border-white/10">
                                <div className="text-xs text-white/40">
                                    <p>Open Rate: <span className="text-green-400 font-bold">{template.openRate}</span></p>
                                    <p>Sent: {template.lastSent}</p>
                                </div>
                                <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium transition-all group-hover:bg-violet-500 group-hover:text-white">
                                    <span>Edit</span>
                                    <Edit size={12} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
