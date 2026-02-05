import { useState, useEffect } from 'react'
import { MessageSquare, Check, X, Filter, User, Calendar, ExternalLink, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'

interface Comment {
    id: string
    user_name: string
    user_email: string
    user_image?: string
    content: string
    entity_type: 'mixtape' | 'product' | 'post'
    entity_title: string
    entity_id: string
    created_at: string
    status: 'pending' | 'approved' | 'rejected'
}

export default function CommentsTab() {
    const [activeFilter, setActiveFilter] = useState<'pending' | 'approved' | 'rejected'>('pending')
    const [comments, setComments] = useState<Comment[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        fetchComments()
    }, [])

    const fetchComments = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/admin/comments')
            if (res.ok) {
                const data = await res.json()
                setComments(data)
            }
        } catch (e) {
            toast.error('Failed to load comments')
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateStatus = async (id: string, status: 'approved' | 'rejected') => {
        try {
            const res = await fetch('/api/admin/comments', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status })
            })
            if (res.ok) {
                toast.success(`Comment ${status}`)
                fetchComments() // Refresh list
            }
        } catch (e) {
            toast.error('Update failed')
        }
    }

    const filteredComments = comments.filter(c => c.status === activeFilter)

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                    <button onClick={() => setActiveFilter('pending')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeFilter === 'pending' ? 'bg-amber-500/20 text-amber-400' : 'text-white/60 hover:text-white'}`}>
                        Pending {comments.filter(c => c.status === 'pending').length > 0 && `(${comments.filter(c => c.status === 'pending').length})`}
                    </button>
                    <button onClick={() => setActiveFilter('approved')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeFilter === 'approved' ? 'bg-green-500/20 text-green-400' : 'text-white/60 hover:text-white'}`}>
                        Approved
                    </button>
                    <button onClick={() => setActiveFilter('rejected')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeFilter === 'rejected' ? 'bg-red-500/20 text-red-400' : 'text-white/60 hover:text-white'}`}>
                        Rejected
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                {loading ? <Loader2 className="animate-spin text-white/50 m-auto" /> : filteredComments.length === 0 ? (
                    <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
                        <MessageSquare className="mx-auto text-white/20 mb-3" size={48} />
                        <h3 className="text-lg font-medium text-white/70">No {activeFilter} comments</h3>
                        <p className="text-sm text-white/40 mt-1">Check other folders or come back later.</p>
                    </div>
                ) : (
                    filteredComments.map((comment) => (
                        <div key={comment.id} className="bg-white/5 border border-white/10 rounded-xl p-5 hover:border-white/20 transition-all">
                            <div className="flex justify-between items-start gap-4">
                                <div className="flex gap-4 w-full">
                                    <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden flex-shrink-0">
                                        {comment.user_image ? (
                                            <Image src={comment.user_image} alt={comment.user_name} width={40} height={40} />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-white/40"><User size={20} /></div>
                                        )}
                                    </div>
                                    <div className="space-y-2 w-full">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h4 className="font-semibold text-sm">{comment.user_name}</h4>
                                                <p className="text-xs text-white/40">{comment.user_email}</p>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-white/40">
                                                <Calendar size={12} />
                                                <span>{new Date(comment.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>

                                        <div className="p-3 bg-black/20 rounded-lg text-sm text-white/90 border border-white/5">
                                            {comment.content}
                                        </div>

                                        <div className="flex items-center gap-2 text-xs text-white/40">
                                            <span>On: <span className="text-violet-400 font-medium">{comment.entity_title}</span></span>
                                            <span className="bg-white/10 px-1.5 py-0.5 rounded text-[10px] uppercase">{comment.entity_type}</span>
                                            <ExternalLink size={10} className="hover:text-white cursor-pointer" />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2 pl-4 border-l border-white/10">
                                    {comment.status === 'pending' && (
                                        <>
                                            <button onClick={() => handleUpdateStatus(comment.id, 'approved')} className="p-2 bg-green-500/10 text-green-400 hover:bg-green-500/20 rounded-lg transition-colors" title="Approve">
                                                <Check size={18} />
                                            </button>
                                            <button onClick={() => handleUpdateStatus(comment.id, 'rejected')} className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors" title="Reject">
                                                <X size={18} />
                                            </button>
                                        </>
                                    )}
                                    {comment.status !== 'pending' && (
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${comment.status === 'approved' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                            {comment.status.toUpperCase()}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
