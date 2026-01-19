"use client"

import Link from 'next/link'
import { Play, Download, Headphones } from 'lucide-react'

export function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-black via-purple-950/30 to-black" />
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-fuchsia-500/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[150px]" />
      </div>
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0wIDBoNjB2NjBIMHoiLz48Y2lyY2xlIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiIGN4PSIxIiBjeT0iMSIgcj0iMSIvPjwvZz48L3N2Zz4=')] opacity-50" />
      
      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm text-white/80">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          Now Streaming Live Mixes
        </div>
        
        <h1 className="font-display text-6xl sm:text-8xl md:text-9xl tracking-tight mb-6">
          <span className="text-gradient">DJ FLOWERZ</span>
        </h1>
        
        <p className="text-xl sm:text-2xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed">
          Premium mixtapes, exclusive beats, and official merchandise. 
          <span className="text-white font-medium"> Join the movement.</span>
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/mixtapes"
            className="group flex items-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white font-semibold text-lg transition-all hover:scale-105 hover:shadow-lg hover:shadow-fuchsia-500/25"
          >
            <Play className="w-5 h-5 group-hover:scale-110 transition-transform" fill="currentColor" />
            Browse Mixtapes
          </Link>
          
          <Link
            href="/music-pool"
            className="group flex items-center gap-3 px-8 py-4 rounded-full border border-white/20 text-white font-semibold text-lg transition-all hover:bg-white/10 hover:border-white/40"
          >
            <Headphones className="w-5 h-5" />
            Music Pool
          </Link>
        </div>
        
        <div className="mt-16 flex items-center justify-center gap-12 text-center">
          <div>
            <div className="text-4xl font-bold text-white">500+</div>
            <div className="text-sm text-white/50 mt-1">Tracks Available</div>
          </div>
          <div className="w-px h-12 bg-white/10" />
          <div>
            <div className="text-4xl font-bold text-white">50K+</div>
            <div className="text-sm text-white/50 mt-1">Downloads</div>
          </div>
          <div className="w-px h-12 bg-white/10" />
          <div>
            <div className="text-4xl font-bold text-white">10K+</div>
            <div className="text-sm text-white/50 mt-1">Subscribers</div>
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <Download className="w-6 h-6 text-white/40" />
      </div>
    </section>
  )
}
