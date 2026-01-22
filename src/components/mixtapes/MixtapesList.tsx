"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Search, Play, Lock, Download } from 'lucide-react'
import { Mixtape } from '@/lib/types'
import { formatCurrency } from '@/lib/utils'
import { db } from '@/lib/firebase'
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore'

const genres = ['All', 'Afrobeats', 'Hip-Hop', 'EDM', 'Amapiano', 'House', 'R&B']

export function MixtapesList({ initialMixtapes }: { initialMixtapes: Mixtape[] }) {
  const [mixtapes, setMixtapes] = useState(initialMixtapes)
  const [search, setSearch] = useState('')
  const [genre, setGenre] = useState('All')
  const [filter, setFilter] = useState<'all' | 'free' | 'paid'>('all')

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
    return matchesSearch && matchesGenre
  })

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="Search mixtapes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-fuchsia-500/50"
          />
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
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link href={`/mixtapes/view?id=${mixtape.id}`} className="group block">
                <div className="relative aspect-square rounded-2xl overflow-hidden mb-4">
                  <Image
                    src={mixtape.cover_image || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500'}
                    alt={mixtape.title}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <Play size={28} className="text-white ml-1" />
                    </div>
                  </div>

                  <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-green-500/80 text-white text-xs font-semibold flex items-center gap-1">
                    <Download size={12} />
                    Free
                  </div>
                </div>

                <h3 className="text-white font-semibold text-lg mb-1 group-hover:text-fuchsia-400 transition-colors">
                  {mixtape.title}
                </h3>
                <div className="flex items-center gap-2 text-white/50 text-sm">
                  <span>{mixtape.dj}</span>
                  <span>•</span>
                  <span>{mixtape.genre}</span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
