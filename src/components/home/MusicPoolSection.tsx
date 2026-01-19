"use client"

import Link from 'next/link'
import { Headphones, ArrowRight, Lock, Music, Sparkles } from 'lucide-react'

export function MusicPoolSection() {
  return (
    <section className="py-24 px-6 relative">
      <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-950/20 via-transparent to-cyan-950/20" />
      
      <div className="max-w-7xl mx-auto relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-fuchsia-400 text-sm font-semibold tracking-wider uppercase mb-2 block">
              Exclusive Access
            </span>
            <h2 className="font-display text-4xl sm:text-5xl text-white mb-6">
              Music Pool
            </h2>
            <p className="text-white/60 text-lg leading-relaxed mb-8">
              Get unlimited access to our exclusive music pool. Download high-quality tracks, 
              remixes, and DJ edits curated by DJ FLOWERZ. Perfect for DJs who want fresh, 
              unique sounds.
            </p>
            
            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-fuchsia-500/20 flex items-center justify-center flex-shrink-0">
                  <Music className="w-5 h-5 text-fuchsia-400" />
                </div>
                <div>
                  <h4 className="text-white font-semibold">500+ Exclusive Tracks</h4>
                  <p className="text-white/50 text-sm">Curated selection of remixes, edits, and originals</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h4 className="text-white font-semibold">Weekly Updates</h4>
                  <p className="text-white/50 text-sm">New tracks added every week to keep your sets fresh</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                  <Headphones className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h4 className="text-white font-semibold">High Quality Downloads</h4>
                  <p className="text-white/50 text-sm">MP3 320kbps and WAV formats available</p>
                </div>
              </div>
            </div>
            
            <Link
              href="/music-pool"
              className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-500 text-white font-semibold text-lg transition-all hover:scale-105 hover:shadow-lg hover:shadow-fuchsia-500/25"
            >
              <Lock className="w-5 h-5" />
              Access Music Pool
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
          
          <div className="relative">
            <div className="relative aspect-square max-w-md mx-auto">
              <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500 to-cyan-500 rounded-3xl opacity-20 blur-3xl" />
              <div className="relative h-full glass rounded-3xl p-8 flex flex-col">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-cyan-500 flex items-center justify-center">
                    <Headphones className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-xl">Music Pool</h3>
                    <p className="text-white/50 text-sm">Subscriber Exclusive</p>
                  </div>
                </div>
                
                <div className="flex-1 space-y-3">
                  {[
                    { name: 'Summer Vibes Edit', genre: 'House', bpm: 124 },
                    { name: 'Midnight Groove', genre: 'Deep House', bpm: 122 },
                    { name: 'Festival Anthem', genre: 'EDM', bpm: 128 },
                    { name: 'Chill Waves', genre: 'Lo-Fi', bpm: 85 },
                    { name: 'Bass Drop', genre: 'Dubstep', bpm: 140 },
                  ].map((track, index) => (
                    <div
                      key={track.name}
                      className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-fuchsia-500/50 to-cyan-500/50 flex items-center justify-center">
                        <Music className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium text-sm truncate">{track.name}</p>
                        <p className="text-white/40 text-xs">{track.genre} • {track.bpm} BPM</p>
                      </div>
                      <Lock className="w-4 h-4 text-white/30" />
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 pt-6 border-t border-white/10 flex items-center justify-between">
                  <span className="text-white/50 text-sm">500+ tracks available</span>
                  <span className="text-fuchsia-400 font-semibold">Subscribe Now</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
