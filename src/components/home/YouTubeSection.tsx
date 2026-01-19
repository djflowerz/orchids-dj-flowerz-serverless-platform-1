"use client"

import { Youtube, ExternalLink } from 'lucide-react'

export function YouTubeSection() {
  const youtubeChannelUrl = "https://www.youtube.com/@djflowerz"
  
  return (
    <section className="py-24 px-6 relative bg-gradient-to-b from-transparent to-black/50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-red-400 text-sm font-semibold tracking-wider uppercase mb-2 block">
            Watch & Subscribe
          </span>
          <h2 className="font-display text-4xl sm:text-5xl text-white mb-4">
            YouTube Channel
          </h2>
          <p className="text-white/60 max-w-2xl mx-auto">
            Watch live mixes, tutorials, and behind-the-scenes content on our official YouTube channel.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="group relative aspect-video rounded-2xl overflow-hidden bg-white/5 cursor-pointer"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.parent.postMessage({ type: "OPEN_EXTERNAL_URL", data: { url: youtubeChannelUrl } }, "*")
                }
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 to-purple-500/20 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Youtube className="w-8 h-8 text-white" />
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <p className="text-white font-semibold">DJ FLOWERZ Mix #{item}</p>
                <p className="text-white/50 text-sm">Coming Soon</p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-center">
          <button
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.parent.postMessage({ type: "OPEN_EXTERNAL_URL", data: { url: youtubeChannelUrl } }, "*")
              }
            }}
            className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-red-600 text-white font-semibold text-lg transition-all hover:bg-red-700 hover:scale-105"
          >
            <Youtube className="w-6 h-6" />
            Subscribe on YouTube
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  )
}
