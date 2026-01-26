"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Search, Play, Lock, Download, ShoppingCart, Music, Video, Headphones } from 'lucide-react'
import { Mixtape } from '@/lib/types'
import { formatCurrency } from '@/lib/utils'
import { db } from '@/lib/firebase'
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

const genres = ['All', 'Afrobeats', 'Hip-Hop', 'EDM', 'Amapiano', 'House', 'R&B']

export function MixtapesList({ initialMixtapes }: { initialMixtapes: Mixtape[] }) {
  const [mixtapes, setMixtapes] = useState(initialMixtapes)
  const [search, setSearch] = useState('')
  const [genre, setGenre] = useState('All')
  const [typeFilter, setTypeFilter] = useState<'all' | 'audio' | 'video'>('all')
  const { user } = useAuth()
  const router = useRouter()

  // Real-time listener for mixtapes
  useEffect(() => {
    const q = query(
      collection(db, 'mixtapes'),
      orderBy('created_at', 'desc')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const mixtapesData = snapshot.docs.map(doc => {
        const data = doc.data()
        // Map legacy fields to new schema
        return {
          id: doc.id,
          ...data,
          title: data.title || data.name || 'Untitled Mixtape',
          cover_image: data.cover_image || data.image || '',
          price: data.price || 0,
          status: data.status || 'active', // Default to active if missing (legacy)
          created_at: data.created_at?.toDate?.().toISOString() || new Date().toISOString()
        } as Mixtape
      }).filter(m => m.status === 'active') // Filter dynamically

      setMixtapes(mixtapesData)
    }, (error) => {
      console.error('Error fetching mixtapes:', error)
      // Fall back to initial mixtapes on error
      setMixtapes(initialMixtapes)
    })

    return () => unsubscribe()
  }, [initialMixtapes])

  const filteredMixtapes = mixtapes.filter(m => {
    const matchesSearch = m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.dj.toLowerCase().includes(search.toLowerCase())
    const matchesGenre = genre === 'All' || m.genre === genre

    // Type Filter Logic
    let matchesType = true
    if (typeFilter === 'video') {
      matchesType = !!(m.video_download_url || m.video_url)
    } else if (typeFilter === 'audio') {
      matchesType = !!(m.audio_download_url || m.audio_url || m.download_url)
    }

    return matchesSearch && matchesGenre && matchesType
  })

  const handleBuy = async (e: React.MouseEvent, mixtape: Mixtape) => {
    e.preventDefault() // Prevent navigation
    if (!user) {
      toast.error("Please sign in to purchase")
      router.push('/login')
      return
    }

    toast.loading("Initiating checkout...")
    try {
      const { createCheckout } = await import('@/actions/checkout')
      await createCheckout(mixtape.id, user.email)
    } catch (err) {
      console.error(err)
      toast.error("Checkout failed")
    }
  }

  const handleDownload = (e: React.MouseEvent, mixtape: Mixtape) => {
    e.preventDefault()
    // Use video format if in video tab, otherwise audio
    const format = typeFilter === 'video' ? 'video' : 'audio'
    window.location.href = `/api/download?mixtape_id=${mixtape.id}&format=${format}`
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="Search mixtapes or DJs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-fuchsia-500/50"
          />
        </div>
      </div>

      {/* Type Toggle Tabs */}
      <div className="flex justify-center mb-8">
        <div className="p-1 rounded-xl bg-white/5 border border-white/10 flex gap-1">
          <button
            onClick={() => setTypeFilter('audio')}
            className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${typeFilter === 'audio' ? 'bg-fuchsia-500 text-white' : 'text-white/50 hover:text-white'
              }`}
          >
            <Headphones size={16} />
            Audio Mixes
          </button>
          <button
            onClick={() => setTypeFilter('video')}
            className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${typeFilter === 'video' ? 'bg-cyan-500 text-white' : 'text-white/50 hover:text-white'
              }`}
          >
            <Video size={16} />
            Video Mixes
          </button>
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${typeFilter === 'all' ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white'
              }`}
          >
            All
          </button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-4 mb-8">
        {genres.map((g) => (
          <button
            key={g}
            onClick={() => setGenre(g)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${genre === g
              ? 'bg-white text-black'
              : 'bg-white/5 text-white/70 hover:bg-white/10'
              }`}
          >
            {g}
          </button>
        ))}
      </div>

      {filteredMixtapes.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-white/50">No mixtapes found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredMixtapes.map((mixtape, i) => (
            <motion.div
              key={mixtape.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="group relative bg-white/5 rounded-3xl overflow-hidden border border-white/5 hover:border-white/10 hover:bg-white/10 transition-all hover:shadow-2xl hover:shadow-fuchsia-500/10"
            >
              <Link href={`/mixtapes/view?id=${mixtape.id}`} className="block h-full">
                {/* Image Container */}
                <div className="relative aspect-square overflow-hidden">
                  <Image
                    src={mixtape.cover_image || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500'}
                    alt={mixtape.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

                  {/* Status Badge */}
                  <div className="absolute top-3 right-3">
                    {mixtape.price > 0 ? (
                      <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white text-xs font-bold flex items-center gap-1">
                        KSh {mixtape.price}
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full bg-green-500/80 text-white text-xs font-bold flex items-center gap-1 shadow-lg shadow-green-500/20">
                        <Download size={12} />
                        Free
                      </span>
                    )}
                  </div>

                  {/* Play Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-90 group-hover:scale-100">
                    <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all hover:scale-110">
                      <Play size={32} className="text-white fill-white ml-1" />
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="text-white font-bold text-lg mb-1 truncate group-hover:text-fuchsia-400 transition-colors">
                    {mixtape.title}
                  </h3>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-white/50 text-sm">{mixtape.dj}</p>
                    <span className="px-2 py-0.5 rounded-md bg-white/5 text-[10px] text-white/40 uppercase tracking-wider">{mixtape.genre}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-auto">
                    {mixtape.price > 0 && (
                      <button
                        onClick={(e) => handleBuy(e, mixtape)}
                        className="flex-1 py-2.5 rounded-xl bg-white text-black font-bold text-sm hover:bg-fuchsia-400 hover:text-white transition-all flex items-center justify-center gap-2"
                      >
                        <ShoppingCart size={16} />
                        Buy Now
                      </button>
                    )}
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
