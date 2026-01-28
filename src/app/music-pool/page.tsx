"use client"

import { useAuth } from '@/context/AuthContext'

import { useState, useEffect } from 'react'
import { Lock, Search, Play, Download, Crown, Filter, Calendar, Send, Music, Star, Check, ArrowRight, Zap, Users } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ShareButtons } from '@/components/ui/ShareButtons'
import { toast } from 'sonner'

interface MusicPoolTrack {
  id: string
  title: string
  artist: string
  bpm: number | null
  music_key: string | null
  version: string | null
  audio_file_path: string | null
  cover_image: string | null
  tier: string | null
  genre: string | null
  release_date: string | null
  download_count: number
  is_active: boolean
  created_at: string
}

const versions = ['All', 'Clean', 'Dirty', 'Intro', 'Extended']
const keys = ['All', 'Am', 'Bm', 'Cm', 'Dm', 'Em', 'Fm', 'Gm', 'A', 'B', 'C', 'D', 'E', 'F', 'G']
const genres = ['All', 'Afrobeats', 'Amapiano', 'Hip Hop', 'R&B', 'Dancehall', 'Reggae', 'House', 'EDM', 'Pop', 'Gospel', 'Gengetone']
const years = ['All', '2025', '2024', '2023', '2022', '2021']

export default function MusicPoolPage() {
  const { user, isLoading: authLoading, isAdmin } = useAuth()
  const [tracks, setTracks] = useState<MusicPoolTrack[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Filters
  const [versionFilter, setVersionFilter] = useState('All')
  const [keyFilter, setKeyFilter] = useState('All')
  const [genreFilter, setGenreFilter] = useState('All')
  const [yearFilter, setYearFilter] = useState('All')
  const [bpmRange, setBpmRange] = useState({ min: 0, max: 200 })
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState<'latest' | 'hot'>('latest')

  const TELEGRAM_CHANNEL_URL = "https://t.me/djs_cracked_zone" // Or a specific channel for the pool

  useEffect(() => {
    async function fetchContent() {
      try {
        // Parallel fetch from APIs
        const [poolRes, mixRes] = await Promise.all([
          fetch('/api/music-pool?active=true'),
          fetch('/api/mixtapes?all=false') // default is active only for non-all
        ])

        const poolData = await poolRes.json()
        const mixData = await mixRes.json()

        if (poolData.error) throw new Error(poolData.error)
        if (mixData.error) throw new Error(mixData.error)

        const poolItems = poolData.map((t: any) => ({
          ...t,
          type: 'track'
        }))

        const mixItems = mixData.map((m: any) => ({
          ...m,
          type: 'mixtape',
          audio_file_path: m.audio_download_url || m.download_url || m.audio_url || m.audio_file_path || m.mixLink, // Normalize
          title: m.title || m.name
        }))

        // Merge and Sort
        const allContent = [...poolItems, ...mixItems].sort((a: any, b: any) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )

        setTracks(allContent)
      } catch (error) {
        console.error('Error fetching content:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchContent()
    // Poll every 30 seconds
    const interval = setInterval(fetchContent, 30000)
    return () => clearInterval(interval)
  }, [])

  const filteredTracks = tracks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.artist.toLowerCase().includes(search.toLowerCase())
    const matchesVersion = versionFilter === 'All' || t.version === versionFilter
    const matchesKey = keyFilter === 'All' || t.music_key === keyFilter
    const matchesGenre = genreFilter === 'All' || t.genre === genreFilter
    const matchesYear = yearFilter === 'All' || (t.release_date && t.release_date.startsWith(yearFilter))
    const matchesBpm = !t.bpm || (t.bpm >= bpmRange.min && t.bpm <= bpmRange.max)
    return matchesSearch && matchesVersion && matchesKey && matchesGenre && matchesYear && matchesBpm
  })

  // Apply sorting
  const sortedTracks = [...filteredTracks].sort((a, b) => {
    if (sortBy === 'hot') {
      return (b.download_count || 0) - (a.download_count || 0)
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  return (
    <div className="min-h-screen bg-black">
      {/* HERO SECTION */}
      <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1571266028243-371695063ad6?w=1600"
            alt="Music Pool Hero"
            fill
            className="object-cover opacity-50 scale-105 animate-slow-zoom"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
        </div>

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 backdrop-blur-md border border-cyan-500/20 text-cyan-400 text-sm font-medium mb-6 animate-fade-in">
            <Crown size={16} />
            <span>Premium DJ Content</span>
          </div>

          <h1 className="font-display text-5xl sm:text-7xl text-white font-black tracking-tighter mb-6 leading-none animate-slide-up">
            THE ULTIMATE <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-500">MUSIC POOL.</span>
          </h1>

          <p className="text-white/70 text-lg sm:text-xl max-w-2xl mx-auto mb-10 animate-slide-up delay-100">
            Get unlimited access to exclusive DJ edits, extended mixes, and high-quality audio.
            Join our Telegram community for daily drops.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up delay-200">
            <a
              href={TELEGRAM_CHANNEL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-full font-bold text-lg hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
            >
              <Send size={20} />
              Join Telegram Channel
            </a>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        {/* Quick Categories */}
        <div className="mb-12">
          <h2 className="font-display text-2xl text-white mb-6">Explore Genres</h2>
          <div className="flex items-center gap-3 overflow-x-auto pb-4 no-scrollbar mask-gradient-right">
            <button
              onClick={() => {
                setSortBy('latest')
                setGenreFilter('All')
              }}
              className={`flex-shrink-0 px-6 py-3 rounded-full text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 ${sortBy === 'latest' && genreFilter === 'All'
                ? 'bg-white text-black'
                : 'bg-white/5 text-white/70 hover:bg-white/10'
                }`}
            >
              <Calendar size={16} />
              Latest Drops
            </button>

            <button
              onClick={() => {
                setSortBy('hot')
                setGenreFilter('All')
              }}
              className={`flex-shrink-0 px-6 py-3 rounded-full text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 ${sortBy === 'hot' && genreFilter === 'All'
                ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/20'
                : 'bg-white/5 text-white/70 hover:bg-white/10'
                }`}
            >
              <div className={`w-2 h-2 rounded-full bg-orange-200 ${sortBy !== 'hot' ? 'animate-pulse' : ''}`} />
              Trending
            </button>

            <div className="w-px h-8 bg-white/10 mx-2 shrink-0" />

            {genres.filter(g => g !== 'All').map((g) => (
              <button
                key={g}
                onClick={() => setGenreFilter(g)}
                className={`flex-shrink-0 px-6 py-3 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${genreFilter === g
                  ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                  : 'bg-white/5 border-transparent text-white/70 hover:bg-white/10'
                  }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Search by title, artist, or BPM..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-cyan-500/50 transition-all font-medium"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-6 py-4 rounded-2xl flex items-center gap-2 transition-all font-medium ${showFilters ? 'bg-cyan-500 text-white' : 'bg-white/5 text-white/70 hover:bg-white/10'}`}
          >
            <Filter size={20} />
            Filters
          </button>
        </div>

        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="p-6 rounded-3xl bg-white/5 border border-white/10 mb-8 space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-3">
                <span className="text-white/50 text-xs font-bold uppercase tracking-wider">Release Year</span>
                <div className="flex flex-wrap gap-2">
                  {years.map((y) => (
                    <button
                      key={y}
                      onClick={() => setYearFilter(y)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${yearFilter === y
                        ? 'bg-cyan-500 text-white'
                        : 'bg-white/5 text-white/60 hover:bg-white/10'
                        }`}
                    >
                      {y}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <span className="text-white/50 text-xs font-bold uppercase tracking-wider">Version</span>
                <div className="flex flex-wrap gap-2">
                  {versions.map((v) => (
                    <button
                      key={v}
                      onClick={() => setVersionFilter(v)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${versionFilter === v
                        ? 'bg-fuchsia-500 text-white'
                        : 'bg-white/5 text-white/60 hover:bg-white/10'
                        }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <span className="text-white/50 text-xs font-bold uppercase tracking-wider">Key</span>
                <div className="flex flex-wrap gap-2">
                  {keys.map((k) => (
                    <button
                      key={k}
                      onClick={() => setKeyFilter(k)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${keyFilter === k
                        ? 'bg-cyan-500 text-white'
                        : 'bg-white/5 text-white/60 hover:bg-white/10'
                        }`}
                    >
                      {k}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <span className="text-white/50 text-xs font-bold uppercase tracking-wider">BPM Range</span>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    placeholder="Min"
                    value={bpmRange.min || ''}
                    onChange={(e) => setBpmRange({ ...bpmRange, min: Number(e.target.value) || 0 })}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-500/50"
                  />
                  <span className="text-white/30">-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={bpmRange.max || ''}
                    onChange={(e) => setBpmRange({ ...bpmRange, max: Number(e.target.value) || 200 })}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tracks List */}
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-white/60 font-medium">{sortedTracks.length} tracks available</h3>
          <ShareButtons title="DJ FLOWERZ Music Pool" type="page" />
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white/50 animate-pulse">Loading tracks...</p>
          </div>
        ) : sortedTracks.length === 0 ? (
          <div className="py-20 text-center bg-white/5 rounded-3xl border border-white/5 border-dashed">
            <Music size={48} className="mx-auto text-white/20 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No tracks found</h3>
            <p className="text-white/50 mb-6">Try adjusting your search or filters.</p>
            <button
              onClick={() => {
                setSearch('')
                setGenreFilter('All')
                setVersionFilter('All')
              }}
              className="px-6 py-2 rounded-full bg-white text-black font-bold hover:opacity-90 transition-opacity"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedTracks.map((track, i) => (
              <motion.div
                key={track.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group relative bg-[#121216] rounded-2xl overflow-hidden border border-white/5 hover:border-cyan-500/30 transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-cyan-500/10"
              >
                <div className="relative aspect-square overflow-hidden bg-white/5">
                  <Image
                    src={track.cover_image || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500'}
                    alt={track.title}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                  <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-cyan-500 text-white shadow-lg`}>
                      {(track as any).type === 'mixtape' ? 'Mixtape' : 'Track'}
                    </span>
                    {track.bpm && (
                      <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-black/50 backdrop-blur-md text-white border border-white/10">
                        {track.bpm} BPM
                      </span>
                    )}
                  </div>

                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-12 h-12 rounded-full bg-cyan-500 flex items-center justify-center text-white shadow-xl scale-90 group-hover:scale-100 transition-transform">
                      <Play size={20} className="ml-1" />
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  <div className="mb-3">
                    <h3 className="text-white font-bold text-lg leading-tight mb-1 line-clamp-1 group-hover:text-cyan-400 transition-colors">
                      {track.title}
                    </h3>
                    <p className="text-white/50 text-sm line-clamp-1">
                      {track.artist || (track as any).dj || 'DJ Flowerz'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 mb-4 text-xs text-white/40 font-mono">
                    {track.music_key && <span className="px-1.5 py-0.5 rounded bg-white/5">{track.music_key}</span>}
                    {track.version && <span className="px-1.5 py-0.5 rounded bg-white/5">{track.version}</span>}
                    {track.genre && <span className="px-1.5 py-0.5 rounded bg-white/5">{track.genre}</span>}
                  </div>

                  <a
                    href={TELEGRAM_CHANNEL_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full py-3 rounded-xl bg-white/5 hover:bg-cyan-500/20 text-white/70 hover:text-cyan-400 font-semibold text-center text-sm border border-white/10 hover:border-cyan-500/50 transition-all flex items-center justify-center gap-2"
                  >
                    <Send size={16} />
                    Get on Telegram
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Telegram Footer CTA */}
      <section className="py-20 px-6 bg-gradient-to-b from-cyan-900/20 to-black border-t border-white/5">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Send size={32} className="text-white" />
          </div>
          <h2 className="font-display text-4xl text-white mb-6">Join the Community</h2>
          <p className="text-white/60 mb-8 text-lg">
            Don't miss a beat. Join our Telegram channel for instant updates on new uploads, exclusive edits, and community discussions.
          </p>
          <a
            href={TELEGRAM_CHANNEL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-black rounded-full font-bold text-lg hover:bg-gray-200 transition-all shadow-xl"
          >
            <Send size={20} className="text-cyan-600" />
            Join Now for Free
          </a>
        </div>
      </section>
    </div>
  )
}
