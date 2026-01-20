"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { db } from '@/lib/firebase'
import { collection, query, where, getDocs, orderBy, addDoc, Timestamp } from 'firebase/firestore'
import { Music, Send, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface TrackRequest {
  id: string
  track_title: string
  artist: string
  notes: string
  status: string
  admin_response: string | null
  created_at: string
}

export function TrackRequestForm() {
  const { user } = useAuth()
  const [trackTitle, setTrackTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [requests, setRequests] = useState<TrackRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchRequests()
    } else {
      setLoading(false)
    }
  }, [user])

  async function fetchRequests() {
    try {
      const q = query(
        collection(db, 'track_requests'),
        where('user_id', '==', user?.id),
        orderBy('created_at', 'desc')
      )
      const snapshot = await getDocs(q)
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        created_at: doc.data().created_at?.toDate?.().toISOString() || new Date().toISOString()
      })) as TrackRequest[]
      setRequests(data)
    } catch (error) {
      console.error('Error fetching requests:', error)
      setRequests([])
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!user) {
      toast.error('Please sign in to request tracks')
      return
    }

    if (!trackTitle.trim()) {
      toast.error('Please enter a track title')
      return
    }

    setSubmitting(true)

    try {
      await addDoc(collection(db, 'track_requests'), {
        user_id: user.id,
        user_email: user.email,
        track_title: trackTitle,
        artist: artist,
        notes: notes,
        status: 'pending',
        created_at: Timestamp.now()
      })

      toast.success('Track request submitted!')
      setTrackTitle('')
      setArtist('')
      setNotes('')
      fetchRequests()
    } catch (error) {
      console.error('Error submitting track request:', error)
      toast.error('Failed to submit request')
    }

    setSubmitting(false)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle size={16} className="text-green-400" />
      case 'rejected': return <XCircle size={16} className="text-red-400" />
      default: return <Clock size={16} className="text-yellow-400" />
    }
  }

  return (
    <div className="space-y-8">
      <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <Music size={20} className="text-fuchsia-400" />
          Request a Track
        </h3>
        <p className="text-white/50 text-sm mb-6">
          Can't find a track you need? Request it and we'll try to add it to the pool!
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white/70 text-sm mb-2">Track Title *</label>
            <input
              type="text"
              value={trackTitle}
              onChange={(e) => setTrackTitle(e.target.value)}
              placeholder="e.g., Unavailable"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-fuchsia-500/50"
            />
          </div>

          <div>
            <label className="block text-white/70 text-sm mb-2">Artist</label>
            <input
              type="text"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="e.g., Davido ft. Musa Keys"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-fuchsia-500/50"
            />
          </div>

          <div>
            <label className="block text-white/70 text-sm mb-2">Additional Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any specific version you need? (Clean, Extended, etc.)"
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-fuchsia-500/50"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !user}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white font-semibold hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Send size={20} />
            )}
            Submit Request
          </button>

          {!user && (
            <p className="text-white/50 text-sm text-center">Please sign in to submit track requests</p>
          )}
        </form>
      </div>

      {user && (
        <div>
          <h3 className="text-white font-semibold mb-4">Your Requests</h3>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 size={24} className="animate-spin text-fuchsia-500" />
            </div>
          ) : requests.length === 0 ? (
            <p className="text-white/50 text-center py-8">No requests yet</p>
          ) : (
            <div className="space-y-3">
              {requests.map((request) => (
                <div key={request.id} className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(request.status)}
                      <span className="text-white font-medium">{request.track_title}</span>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${request.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                        request.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                          'bg-yellow-500/20 text-yellow-400'
                      }`}>
                      {request.status}
                    </span>
                  </div>
                  {request.artist && (
                    <p className="text-white/50 text-sm">{request.artist}</p>
                  )}
                  {request.admin_response && (
                    <div className="mt-2 p-2 rounded-lg bg-fuchsia-500/10 border border-fuchsia-500/30">
                      <p className="text-fuchsia-400 text-sm">{request.admin_response}</p>
                    </div>
                  )}
                  <p className="text-white/30 text-xs mt-2">
                    {new Date(request.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
