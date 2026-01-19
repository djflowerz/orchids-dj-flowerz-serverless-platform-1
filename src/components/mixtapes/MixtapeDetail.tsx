"use client"

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Download, Lock, Check, Clock, Calendar, ShoppingCart, Share2, Music, Play, Headphones } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/context/AuthContext'
import { useCart } from '@/context/CartContext'
import { Mixtape } from '@/lib/types'
import { formatCurrency } from '@/lib/utils'
import { AudioPlayer } from '@/components/ui/AudioPlayer'

export function MixtapeDetail({ mixtape }: { mixtape: Mixtape }) {
  const { user, hasPurchased } = useAuth()
  const { addToCart } = useCart()
  const [purchased, setPurchased] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showPlayer, setShowPlayer] = useState(false)

  useEffect(() => {
    async function checkPurchase() {
      if (user && mixtape.is_paid) {
        const result = await hasPurchased(undefined, mixtape.id)
        setPurchased(result)
      }
      setLoading(false)
    }
    checkPurchase()
  }, [user, mixtape.id, mixtape.is_paid, hasPurchased])

  const canAccess = !mixtape.is_paid || purchased

  const handleAddToCart = () => {
    addToCart(mixtape, 'mixtape')
    toast.success('Added to cart!')
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    toast.success('Link copied to clipboard!')
  }

  const tracklist = Array.isArray(mixtape.tracklist) ? mixtape.tracklist : 
    (typeof mixtape.tracklist === 'string' ? JSON.parse(mixtape.tracklist) : [])

  const audioTrack = mixtape.audio_url ? {
    id: mixtape.id,
    title: mixtape.title,
    artist: mixtape.dj,
    audioUrl: mixtape.audio_url,
    coverImage: mixtape.cover_image || undefined
  } : null

  return (
    <div className="min-h-screen bg-black">
      <div className="relative h-[50vh] min-h-[400px]">
        <Image
          src={mixtape.cover_image || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200'}
          alt={mixtape.title}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        
        <div className="absolute top-4 left-4">
          <Link href="/mixtapes" className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
            <ArrowLeft size={20} />
            Back to Mixtapes
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-32 relative z-10 pb-16">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-80 shrink-0">
            <div className="relative aspect-square rounded-2xl overflow-hidden shadow-2xl">
              <Image
                src={mixtape.cover_image || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500'}
                alt={mixtape.title}
                fill
                className="object-cover"
              />
            </div>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm font-medium flex items-center gap-1">
                <Download size={14} />
                Free Mixtape
              </span>
              <span className="px-3 py-1 rounded-full bg-white/5 text-white/70 text-sm">{mixtape.genre}</span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl text-white mb-2">{mixtape.title}</h1>
            <p className="text-white/60 text-lg mb-6">by {mixtape.dj}</p>

            <div className="flex flex-wrap items-center gap-4 text-white/50 text-sm mb-6">
              {mixtape.duration && (
                <div className="flex items-center gap-2">
                  <Clock size={16} />
                  {mixtape.duration}
                </div>
              )}
              {mixtape.release_year && (
                <div className="flex items-center gap-2">
                  <Calendar size={16} />
                  {mixtape.release_year}
                </div>
              )}
              <div className="flex items-center gap-2">
                <Download size={16} />
                {mixtape.download_count.toLocaleString()} downloads
              </div>
            </div>

            {mixtape.description && (
              <p className="text-white/70 mb-8">{mixtape.description}</p>
            )}

              <div className="flex flex-wrap gap-3 mb-8">
                {mixtape.audio_url && (
                  <button
                    onClick={() => setShowPlayer(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-fuchsia-500 to-cyan-500 rounded-full text-white font-semibold hover:opacity-90 transition-all"
                  >
                    <Headphones size={20} />
                    Stream Now
                  </button>
                )}
                <a
                  href={mixtape.audio_url || '#'}
                  download
                  className="flex items-center gap-2 px-6 py-3 bg-white/10 border border-white/10 rounded-full text-white font-semibold hover:bg-white/20 transition-all"
                >
                  <Download size={20} />
                  Download
                </a>
                <button
                  onClick={handleShare}
                  className="flex items-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-all"
                >
                  <Share2 size={20} />
                </button>
              </div>

              {showPlayer && audioTrack && (
                <div className="mb-8">
                  <AudioPlayer 
                    tracks={[audioTrack]} 
                    autoPlay={true}
                  />
                </div>
              )}

            {tracklist.length > 0 && (
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Music size={18} />
                  Tracklist
                </h3>
                <div className="space-y-2">
                  {tracklist.map((track: string, i: number) => (
                    <div key={i} className="flex items-center gap-3 text-white/70">
                      <span className="text-white/30 text-sm w-6">{String(i + 1).padStart(2, '0')}</span>
                      <span>{track}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {mixtape.video_url && canAccess && (
              <div className="mt-8">
                <h3 className="text-white font-semibold mb-4">Video</h3>
                <div className="aspect-video rounded-2xl overflow-hidden bg-white/5">
                  <iframe
                    src={mixtape.video_url.replace('watch?v=', 'embed/')}
                    title={mixtape.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
