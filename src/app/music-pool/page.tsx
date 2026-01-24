"use client"

import { useAuth } from '@/context/AuthContext'
import { db } from '@/lib/firebase'
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore'
import { useState, useEffect } from 'react'
import { Lock, Search, Play, Download, Crown, Filter, Calendar } from 'lucide-react'
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
const tiers = ['All', 'Standard', 'Pro']
const genres = ['All', 'Afrobeats', 'Amapiano', 'Hip Hop', 'R&B', 'Dancehall', 'Reggae', 'House', 'EDM', 'Pop', 'Gospel', 'Gengetone']
const years = ['All', '2024', '2023', '2022', '2021', '2020']

export default function MusicPoolPage() {
  const { user, loading: authLoading, isAdmin } = useAuth()
  const [tracks, setTracks] = useState<MusicPoolTrack[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [versionFilter, setVersionFilter] = useState('All')
  const [keyFilter, setKeyFilter] = useState('All')
  const [tierFilter, setTierFilter] = useState('All')
  const [genreFilter, setGenreFilter] = useState('All')
  const [yearFilter, setYearFilter] = useState('All')
  const [bpmRange, setBpmRange] = useState({ min: 0, max: 200 })
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  const handleSubscribe = async (planId: string) => {
    if (!user) {
      toast.error("Please sign in to subscribe")
      return
    }
    toast.loading("Initiating subscription...")
    try {
      const { createCheckout } = await import('@/actions/checkout')
      await createCheckout(planId, user.email)
    } catch (e) {
      toast.error("Subscription failed")
      console.error(e)
    }
  }

  useEffect(() => {
    async function checkSubscription() {
      // Admin always has access
      if (isAdmin) {
        setHasActiveSubscription(true)
        return
      }

      if (!user) {
        setHasActiveSubscription(false)
        return
      }

      try {
        const q = query(
          collection(db, 'subscriptions'),
          where('user_id', '==', user.id),
          where('status', '==', 'active'),
          limit(1)
        )
        const snapshot = await getDocs(q)

        if (!snapshot.empty) {
          const subscription = snapshot.docs[0].data()
          if (subscription.ends_at) {
            const endDate = subscription.ends_at.toDate ? subscription.ends_at.toDate() : new Date(subscription.ends_at)
            setHasActiveSubscription(endDate > new Date())
          } else {
            // If active status but no end date, assume valid (e.g. lifetime or recurring without set end)
            setHasActiveSubscription(true)
          }
        } else {
          setHasActiveSubscription(false)
        }
      } catch (error) {
        console.error('Error checking subscription:', error)
        setHasActiveSubscription(false)
      }
    }

    if (!authLoading) {
      checkSubscription()
    }
  }, [user, authLoading, isAdmin])

  useEffect(() => {
    async function fetchContent() {
      try {
        // Fetch Pool Tracks
        const poolQ = query(
          collection(db, 'music_pool'),
          where('is_active', '==', true),
          orderBy('created_at', 'desc')
        )
        const poolSnap = await getDocs(poolQ)
        const poolData = poolSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          type: 'track',
          created_at: doc.data().created_at?.toDate?.().toISOString() || new Date().toISOString()
        })) as any[]

        // Fetch Mixtapes (All are free for pool)
        const mixQ = query(
          collection(db, 'mixtapes'),
          where('status', '==', 'active'),
          orderBy('created_at', 'desc')
        )
        const mixSnap = await getDocs(mixQ)
        const mixData = mixSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          title: doc.data().title || doc.data().name, // Handle legacy name
          audio_file_path: doc.data().audio_download_url || doc.data().download_url || doc.data().audio_url || doc.data().audio_file_path, // Normalize
          type: 'mixtape',
          created_at: doc.data().created_at?.toDate?.().toISOString() || new Date().toISOString()
        })) as any[]

        // Merge and Sort
        const allContent = [...poolData, ...mixData].sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )

        setTracks(allContent)
      } catch (error) {
        console.error('Error fetching content:', error)
        setTracks([])
      } finally {
        setLoading(false)
      }
    }
    fetchContent()
  }, [])

  // ... inside component ...
  const [sortBy, setSortBy] = useState<'latest' | 'hot'>('latest')

  // ... existing logic ...

  const filteredTracks = tracks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.artist.toLowerCase().includes(search.toLowerCase())
    const matchesVersion = versionFilter === 'All' || t.version === versionFilter
    const matchesKey = keyFilter === 'All' || t.music_key === keyFilter
    const matchesTier = tierFilter === 'All' || t.tier === tierFilter
    const matchesGenre = genreFilter === 'All' || t.genre === genreFilter
    const matchesYear = yearFilter === 'All' || (t.release_date && t.release_date.startsWith(yearFilter))
    const matchesBpm = !t.bpm || (t.bpm >= bpmRange.min && t.bpm <= bpmRange.max)
    return matchesSearch && matchesVersion && matchesKey && matchesTier && matchesGenre && matchesYear && matchesBpm
  })

  // Apply sorting
  const sortedTracks = [...filteredTracks].sort((a, b) => {
    if (sortBy === 'hot') {
      return (b.download_count || 0) - (a.download_count || 0)
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-fuchsia-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!hasActiveSubscription) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="max-w-lg text-center">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-fuchsia-500/20 to-cyan-500/20 flex items-center justify-center">
            <Lock size={40} className="text-fuchsia-400" />
          </div>
          <h1 className="font-display text-4xl text-white mb-4">MUSIC POOL</h1>
          <p className="text-white/60 mb-8">
            Get unlimited access to exclusive DJ edits, remixes, and tools.
            Subscribe to unlock the full music pool and join our Telegram community.
          </p>

          <div className="space-y-4 mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-fuchsia-500/30 transition-all">
                <div className="text-white/50 text-sm mb-1">1 Week</div>
                <div className="text-2xl font-bold text-white mb-3">KSh 200</div>
                <button
                  onClick={() => handleSubscribe('plan_weekly')}
                  className="block w-full py-2.5 rounded-full bg-white/10 text-white font-semibold hover:bg-fuchsia-500 transition-all text-sm text-center"
                >
                  Subscribe
                </button>
              </div>

              <div className="p-5 rounded-2xl bg-gradient-to-br from-fuchsia-500/20 to-cyan-500/20 border border-fuchsia-500/30 relative">
                <div className="absolute -top-2 -right-2 px-2 py-1 bg-fuchsia-500 text-white text-xs font-bold rounded-full">POPULAR</div>
                <div className="text-white/50 text-sm mb-1">1 Month</div>
                <div className="text-2xl font-bold text-white mb-3">KSh 700</div>
                <button
                  onClick={() => handleSubscribe('plan_monthly')}
                  className="block w-full py-2.5 rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white font-semibold hover:opacity-90 transition-all text-sm text-center"
                >
                  Subscribe
                </button>
              </div>

              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-cyan-500/30 transition-all">
                <div className="text-white/50 text-sm mb-1">3 Months</div>
                <div className="text-2xl font-bold text-white mb-1">KSh 1,800</div>
                <div className="text-emerald-400 text-xs mb-3">Save KSh 300</div>
                <button
                  onClick={() => handleSubscribe('plan_3months')}
                  className="block w-full py-2.5 rounded-full bg-white/10 text-white font-semibold hover:bg-cyan-500 transition-all text-sm text-center"
                >
                  Subscribe
                </button>
              </div>

              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-cyan-500/30 transition-all">
                <div className="text-white/50 text-sm mb-1">6 Months</div>
                <div className="text-2xl font-bold text-white mb-1">KSh 3,500</div>
                <div className="text-emerald-400 text-xs mb-3">Save KSh 700</div>
                <button
                  onClick={() => handleSubscribe('plan_6months')}
                  className="block w-full py-2.5 rounded-full bg-white/10 text-white font-semibold hover:bg-cyan-500 transition-all text-sm text-center"
                >
                  Subscribe
                </button>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/30">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Crown size={20} className="text-yellow-400" />
                    <span className="text-white font-semibold">12 Months - VIP</span>
                  </div>
                  <div className="text-yellow-400 text-xs">Best Value - Save KSh 2,400</div>
                </div>
                <div className="text-2xl font-bold text-white">KSh 6,000</div>
              </div>
              <button
                onClick={() => handleSubscribe('plan_annual')}
                className="block w-full py-2.5 rounded-full bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-semibold hover:opacity-90 transition-all text-sm text-center"
              >
                Subscribe for 1 Year
              </button>
            </div>

            <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
              <p className="text-cyan-400 text-sm font-medium mb-1">Telegram Access Included</p>
              <p className="text-white/60 text-xs">After payment, link your Telegram in your profile to get added to our exclusive DJ channels.</p>
            </div>

            <ul className="text-white/60 text-sm space-y-2 mt-6 text-center">
              <li>Unlimited downloads • Weekly new releases</li>
              <li>Exclusive DJ edits • Telegram group access</li>
            </ul>

            {!user && (
              <Link
                href="/login"
                className="block w-full py-3 rounded-full bg-white/10 text-white font-semibold hover:bg-white/20 transition-all text-center mt-4"
              >
                Sign In First
              </Link>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-fuchsia-500 to-cyan-500 flex items-center justify-center">
              <Crown size={24} className="text-white" />
            </div>
            <div>
              <h1 className="font-display text-4xl sm:text-5xl text-white">MUSIC POOL</h1>
              <p className="text-white/50">Exclusive DJ tracks for subscribers</p>
            </div>
          </div>
          <ShareButtons title="DJ FLOWERZ Music Pool" type="page" />
        </div>

        {/* Quick Categories & Sort Nav */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 no-scrollbar mask-gradient-right">
          <button
            onClick={() => {
              setSortBy('latest')
              setGenreFilter('All')
            }}
            className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 ${sortBy === 'latest' && genreFilter === 'All'
              ? 'bg-white text-black'
              : 'bg-white/5 text-white/70 hover:bg-white/10'
              }`}
          >
            <Calendar size={16} />
            Latest
          </button>
          <button
            onClick={() => {
              setSortBy('hot')
              setGenreFilter('All')
            }}
            className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 ${sortBy === 'hot' && genreFilter === 'All'
              ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/20'
              : 'bg-white/5 text-white/70 hover:bg-white/10'
              }`}
          >
            <div className={`w-2 h-2 rounded-full bg-orange-400 ${sortBy !== 'hot' ? 'animate-pulse' : ''}`} />
            Hot
          </button>

          <div className="w-px h-6 bg-white/10 mx-2 shrink-0" />

          {genres.filter(g => g !== 'All').map((g) => (
            <button
              key={g}
              onClick={() => {
                setGenreFilter(g)
                // Optionally reset sort to latest when picking a genre, or keep it
              }}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${genreFilter === g
                ? 'bg-fuchsia-500 text-white'
                : 'bg-white/5 text-white/70 hover:bg-white/10'
                }`}
            >
              {g}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Search by title or artist..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-fuchsia-500/50"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all ${showFilters ? 'bg-fuchsia-500 text-white' : 'bg-white/5 text-white/70 hover:bg-white/10'
              }`}
          >
            <Filter size={18} />
            Filters
          </button>
        </div>

        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="p-4 rounded-xl bg-white/5 border border-white/10 mb-6 space-y-4"
          >
            {/* Genre filter reduced/removed since it's up top now, or kept for full visibility */}
            {/* Let's keep other filters but maybe simplify genre if it's redundant, but for now specific filters like Key/BPM are useful here */}

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-white/50 text-sm w-16">Year:</span>
              {years.map((y) => (
                <button
                  key={y}
                  onClick={() => setYearFilter(y)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1 ${yearFilter === y
                    ? 'bg-cyan-500 text-white'
                    : 'bg-white/5 text-white/70 hover:bg-white/10'
                    }`}
                >
                  {y !== 'All' && <Calendar size={12} />}
                  {y}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-white/50 text-sm w-16">Version:</span>
              {versions.map((v) => (
                <button
                  key={v}
                  onClick={() => setVersionFilter(v)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${versionFilter === v
                    ? 'bg-fuchsia-500 text-white'
                    : 'bg-white/5 text-white/70 hover:bg-white/10'
                    }`}
                >
                  {v}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-white/50 text-sm w-16">Key:</span>
              {keys.map((k) => (
                <button
                  key={k}
                  onClick={() => setKeyFilter(k)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${keyFilter === k
                    ? 'bg-cyan-500 text-white'
                    : 'bg-white/5 text-white/70 hover:bg-white/10'
                    }`}
                >
                  {k}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-white/50 text-sm w-16">Tier:</span>
              {tiers.map((t) => (
                <button
                  key={t}
                  onClick={() => setTierFilter(t)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${tierFilter === t
                    ? 'bg-amber-500 text-white'
                    : 'bg-white/5 text-white/70 hover:bg-white/10'
                    }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <span className="text-white/50 text-sm w-16">BPM:</span>
              <input
                type="number"
                placeholder="Min"
                value={bpmRange.min || ''}
                onChange={(e) => setBpmRange({ ...bpmRange, min: Number(e.target.value) || 0 })}
                className="w-20 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-fuchsia-500/50"
              />
              <span className="text-white/30">-</span>
              <input
                type="number"
                placeholder="Max"
                value={bpmRange.max || ''}
                onChange={(e) => setBpmRange({ ...bpmRange, max: Number(e.target.value) || 200 })}
                className="w-20 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-fuchsia-500/50"
              />
            </div>
          </motion.div>
        )}

        <div className="flex items-center justify-between mb-4">
          <p className="text-white/50 text-sm">{sortedTracks.length} tracks found</p>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-2 border-fuchsia-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : sortedTracks.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-white/50">No tracks found. Adjust your filters or check back later!</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {sortedTracks.map((track, i) => (
              <motion.div
                key={track.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group"
              >
                <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0">
                  <Image
                    src={track.cover_image || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200'}
                    alt={track.title}
                    fill
                    className="object-cover"
                  />
                  {/* Play overlay removed */}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${(track as any).type === 'mixtape' ? 'bg-fuchsia-500 text-white' : 'bg-cyan-500 text-white'
                      }`}>
                      {(track as any).type === 'mixtape' ? 'MIXTAPE' : 'TRACK'}
                    </span>
                    {track.genre && <span className="text-white/40 text-xs">• {track.genre}</span>}
                  </div>
                  <h3 className="text-white font-semibold truncate text-lg">{track.title}</h3>
                  <p className="text-white/50 text-sm truncate">{track.artist || (track as any).dj || 'DJ Flowerz'}</p>
                </div>

                <div className="flex items-center gap-4">
                  {(track as any).type === 'mixtape' ? (
                    <a
                      href={(track as any).audio_file_path}
                      download
                      className="flex items-center gap-2 px-4 py-2 rounded-full bg-white text-black font-bold hover:bg-fuchsia-500 hover:text-white transition-all text-sm"
                    >
                      <Download size={16} />
                      Download
                    </a>
                  ) : (
                    track.audio_file_path && (
                      <a
                        href={track.audio_file_path}
                        download
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-white text-black font-bold hover:bg-cyan-500 hover:text-white transition-all text-sm"
                      >
                        <Download size={16} />
                        Download
                      </a>
                    )
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
