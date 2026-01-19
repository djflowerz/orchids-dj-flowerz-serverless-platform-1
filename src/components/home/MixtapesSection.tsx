"use client"

import Link from 'next/link'
import Image from 'next/image'
import { Mixtape } from '@/lib/types'
import { Play, Download, ArrowRight, Clock, Music } from 'lucide-react'

interface MixtapesSectionProps {
  mixtapes: Mixtape[]
}

export function MixtapesSection({ mixtapes }: MixtapesSectionProps) {
  return (
    <section className="py-24 px-6 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-fuchsia-950/5 to-transparent" />
      
      <div className="max-w-7xl mx-auto relative">
        <div className="flex items-end justify-between mb-12">
          <div>
            <span className="text-fuchsia-400 text-sm font-semibold tracking-wider uppercase mb-2 block">
              Latest Releases
            </span>
            <h2 className="font-display text-4xl sm:text-5xl text-white">
              Featured Mixtapes
            </h2>
          </div>
          <Link
            href="/mixtapes"
            className="group hidden sm:flex items-center gap-2 text-white/60 hover:text-white transition-colors"
          >
            View All
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
        
        {mixtapes.length === 0 ? (
          <div className="text-center py-20 glass rounded-2xl">
            <Music className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <p className="text-white/60 text-lg">No mixtapes available yet</p>
            <p className="text-white/40 text-sm mt-2">Check back soon for new releases!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {mixtapes.map((mixtape, index) => (
              <Link
                key={mixtape.id}
                href={`/mixtapes/${mixtape.id}`}
                className="group relative"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="relative aspect-square rounded-2xl overflow-hidden bg-white/5">
                  {mixtape.cover_image ? (
                    <Image
                      src={mixtape.cover_image}
                      alt={mixtape.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/30 to-cyan-500/30 flex items-center justify-center">
                      <Music className="w-16 h-16 text-white/30" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-xl">
                      <Play className="w-7 h-7 text-black ml-1" fill="currentColor" />
                    </div>
                  </div>
                  {mixtape.is_paid && mixtape.price > 0 && (
                    <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-fuchsia-500 text-white text-xs font-bold">
                      ${(mixtape.price / 100).toFixed(2)}
                    </div>
                  )}
                  {!mixtape.is_paid && (
                    <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-green-500 text-white text-xs font-bold">
                      FREE
                    </div>
                  )}
                </div>
                <div className="mt-4">
                  <h3 className="text-white font-semibold text-lg truncate group-hover:text-fuchsia-400 transition-colors">
                    {mixtape.title}
                  </h3>
                  <p className="text-white/50 text-sm mt-1">{mixtape.dj || 'DJ FLOWERZ'}</p>
                  <div className="flex items-center gap-4 mt-2 text-white/40 text-sm">
                    {mixtape.duration && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {mixtape.duration}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Download className="w-3 h-3" />
                      {mixtape.download_count || 0}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
        
        <div className="mt-8 text-center sm:hidden">
          <Link
            href="/mixtapes"
            className="inline-flex items-center gap-2 text-fuchsia-400 hover:text-fuchsia-300 transition-colors"
          >
            View All Mixtapes
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
