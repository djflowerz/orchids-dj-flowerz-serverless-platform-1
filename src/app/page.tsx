"use client"

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Headphones, Calendar, Music, ArrowRight, Play, Star, Users, Youtube, Mail, Download, Crown, Send, Shield, Zap, Check, ShoppingBag, TrendingUp, Sparkles, Award } from 'lucide-react'
import { NewsletterForm } from '@/components/home/NewsletterForm'
import { db } from '@/lib/firebase'
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore'
import { Product } from '@/lib/types'

export default function Home() {
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProducts() {
      try {
        // Fetch trending products (published products, ordered by downloads/popularity)
        const trendingQuery = query(
          collection(db, 'products'),
          where('status', '==', 'published'),
          orderBy('downloads', 'desc'),
          limit(4)
        )
        const trendingSnap = await getDocs(trendingQuery)
        const trending = trendingSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product))

        setTrendingProducts(trending)
      } catch (error) {
        console.error('Error fetching products:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(amount)

  return (
    <div className="min-h-screen bg-black">
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1600"
            alt="Hero Background"
            fill
            className="object-cover opacity-60 scale-105 animate-slow-zoom"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        </div>

        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-medium mb-8 animate-fade-in">
            <Star size={16} className="text-amber-400 fill-amber-400" />
            <span>The Official Platform of DJ FLOWERZ</span>
          </div>

          <h1 className="font-display text-6xl sm:text-8xl lg:text-9xl text-white font-black tracking-tighter mb-8 leading-none animate-slide-up">
            EXPERIENCE THE <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-500 to-cyan-500">SOUND.</span>
          </h1>

          <p className="text-white/70 text-lg sm:text-2xl max-w-2xl mx-auto mb-12 animate-slide-up delay-100">
            Free mixtapes, exclusive music pool, and world-class event bookings.
            Join the elite circle of DJs and music enthusiasts.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up delay-200">
            <Link
              href="/mixtapes"
              className="w-full sm:w-auto px-8 py-4 bg-white text-black rounded-full font-bold text-lg hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 group"
            >
              <Download size={20} />
              Free Mixtapes
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/music-pool"
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white rounded-full font-bold text-lg hover:opacity-90 transition-all flex items-center justify-center gap-2"
            >
              <Crown size={20} />
              Music Pool
            </Link>
            <Link
              href="/bookings"
              className="w-full sm:w-auto px-8 py-4 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full font-bold text-lg hover:bg-white/20 transition-all flex items-center justify-center gap-2"
            >
              <Calendar size={20} />
              Book DJ
            </Link>
          </div>
        </div>

        <div className="absolute bottom-12 left-0 right-0 z-10 hidden lg:block animate-fade-in delay-300">
          <div className="max-w-7xl mx-auto px-6 flex justify-between items-center text-white/50 border-t border-white/10 pt-8">
            <div className="flex items-center gap-3">
              <Users size={20} />
              <span className="text-white font-bold">50K+</span> Community Members
            </div>
            <div className="flex items-center gap-3">
              <Play size={20} />
              <span className="text-white font-bold">1M+</span> Monthly Streams
            </div>
            <div className="flex items-center gap-3">
              <Music size={20} />
              <span className="text-white font-bold">200+</span> Exclusive Tracks
            </div>
          </div>
        </div>
      </section>

      {/* Mixtapes & Music Pool Section - MOVED UP */}
      <section className="py-24 px-6 bg-black">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="relative group rounded-3xl overflow-hidden aspect-[16/10] bg-zinc-900 border border-white/5">
              <Image
                src="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800"
                alt="Free Mixtapes"
                fill
                className="object-cover opacity-50 group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 p-12 flex flex-col justify-end bg-gradient-to-t from-black to-transparent">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-semibold mb-4 w-fit">
                  <Download size={12} /> FREE DOWNLOADS
                </div>
                <h2 className="text-4xl font-bold text-white mb-4">Mixtapes</h2>
                <p className="text-white/60 mb-8 max-w-sm">From Afrobeats to Amapiano, get the hottest sets curated by DJ FLOWERZ. Always free.</p>
                <Link href="/mixtapes" className="inline-flex items-center gap-2 text-white font-bold group-hover:text-fuchsia-400 transition-colors">
                  Browse Collection <ArrowRight size={20} />
                </Link>
              </div>
            </div>

            <div className="relative group rounded-3xl overflow-hidden aspect-[16/10] bg-zinc-900 border border-white/5">
              <Image
                src="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800"
                alt="Music Pool"
                fill
                className="object-cover opacity-50 group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 p-12 flex flex-col justify-end bg-gradient-to-t from-black to-transparent">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-fuchsia-500/20 text-fuchsia-400 text-xs font-semibold mb-4 w-fit">
                  <Crown size={12} /> SUBSCRIBERS ONLY
                </div>
                <h2 className="text-4xl font-bold text-white mb-4">Music Pool</h2>
                <p className="text-white/60 mb-8 max-w-sm">Exclusive DJ edits, remixes, and tools. New tracks added weekly. From KSh 200/week.</p>
                <Link href="/music-pool" className="inline-flex items-center gap-2 text-white font-bold group-hover:text-cyan-400 transition-colors">
                  View Plans <ArrowRight size={20} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DJ Store Showcase Section - MOVED BEFORE "Who is this for" */}
      <section className="py-24 px-6 bg-zinc-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-sm font-medium mb-6">
              <ShoppingBag size={18} />
              <span>Computer Store</span>
            </div>
            <h2 className="font-display text-4xl sm:text-6xl text-white mb-4">LAPTOPS & TECH</h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              Shop our collection of high-performance Laptops, Desktops, Hard Drives, and tech accessories.
            </p>
          </div>

          {/* Trending Products */}
          <div className="mb-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                  <TrendingUp size={20} className="text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white">Trending Now</h3>
              </div>
              <Link href="/store?sort=trending" className="text-violet-400 hover:text-violet-300 font-semibold flex items-center gap-2">
                View All <ArrowRight size={16} />
              </Link>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="bg-white/5 rounded-2xl border border-white/10 p-4 animate-pulse">
                    <div className="aspect-square bg-white/10 rounded-xl mb-4" />
                    <div className="h-4 bg-white/10 rounded mb-2" />
                    <div className="h-3 bg-white/10 rounded w-2/3" />
                  </div>
                ))}
              </div>
            ) : trendingProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {trendingProducts.map((product) => (
                  <Link key={product.id} href={`/store/${product.id}`} className="group">
                    <div className="bg-white/5 rounded-2xl border border-white/10 hover:border-violet-500/50 transition-all overflow-hidden">
                      <div className="relative aspect-square overflow-hidden bg-white/5">
                        <Image
                          src={product.cover_images?.[0] || product.image_url || 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500'}
                          alt={product.title}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center gap-1">
                          <TrendingUp size={12} /> HOT
                        </div>
                      </div>
                      <div className="p-4">
                        <h4 className="text-white font-semibold mb-1 line-clamp-1 group-hover:text-violet-400 transition-colors">{product.title}</h4>
                        <p className="text-white/50 text-sm mb-2">{product.category}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-violet-400 font-bold">
                            {product.is_free ? 'Free' : formatCurrency(product.price)}
                          </span>
                          {product.average_rating && product.average_rating > 0 && (
                            <div className="flex items-center gap-1">
                              <Star size={14} className="text-yellow-400 fill-yellow-400" />
                              <span className="text-white/70 text-sm">{product.average_rating.toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-white/50">No trending products yet</div>
            )}
          </div>

          {/* CTA */}
          <div className="text-center">
            <Link
              href="/store"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-full font-bold text-lg hover:opacity-90 transition-all"
            >
              <ShoppingBag size={20} />
              Explore Full Store
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* YouTube Section - MOVED UP */}
      <section className="py-24 px-6 bg-zinc-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium mb-6">
              <Youtube size={18} />
              <span>@dj_flowerz</span>
            </div>
            <h2 className="font-display text-4xl sm:text-6xl text-white mb-4">WATCH THE VIBES</h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              Catch live sets, behind-the-scenes content, and exclusive video mixes on the official DJ FLOWERZ YouTube channel.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="relative group rounded-2xl overflow-hidden aspect-video bg-zinc-900 border border-white/5">
              <iframe
                src="https://www.youtube.com/embed?listType=user_uploads&list=dj_flowerz"
                title="DJ FLOWERZ - Latest Uploads"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
            <div className="relative group rounded-2xl overflow-hidden aspect-video bg-zinc-900 border border-white/5">
              <iframe
                src="https://www.youtube.com/embed?listType=user_uploads&list=dj_flowerz&index=1"
                title="DJ FLOWERZ - Featured Mix"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
            <div className="relative group rounded-2xl overflow-hidden aspect-video bg-zinc-900 border border-white/5">
              <iframe
                src="https://www.youtube.com/embed?listType=user_uploads&list=dj_flowerz&index=2"
                title="DJ FLOWERZ - Popular Mix"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          </div>

          <div className="text-center mt-10">
            <a
              href="https://www.youtube.com/@dj_flowerz"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-red-500 text-white rounded-full font-semibold hover:bg-red-600 transition-colors"
            >
              <Youtube size={20} />
              Subscribe to Channel
            </a>
          </div>
        </div>
      </section>

      {/* Who is this for Section */}
      <section className="py-20 px-6 bg-black">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl sm:text-5xl text-white mb-4">WHO IS THIS FOR?</h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              Whether you're a professional DJ, bedroom producer, or music lover - we've got you covered.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-gradient-to-br from-fuchsia-500/10 to-fuchsia-500/0 border border-fuchsia-500/20 hover:border-fuchsia-500/40 transition-all">
              <div className="w-14 h-14 rounded-2xl bg-fuchsia-500/20 flex items-center justify-center mb-6">
                <Headphones size={28} className="text-fuchsia-400" />
              </div>
              <h3 className="text-white text-xl font-bold mb-3">Professional DJs</h3>
              <p className="text-white/60 mb-4">
                Access exclusive edits, intros, and remixes. Stay ahead with fresh tracks every week in our Music Pool.
              </p>
              <ul className="space-y-2 text-white/50 text-sm">
                <li className="flex items-center gap-2"><Check size={14} className="text-fuchsia-400" /> Clean & Dirty versions</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-fuchsia-400" /> BPM & Key tagged</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-fuchsia-400" /> Intro/outro edits</li>
              </ul>
            </div>

            <div className="p-8 rounded-3xl bg-gradient-to-br from-cyan-500/10 to-cyan-500/0 border border-cyan-500/20 hover:border-cyan-500/40 transition-all">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 flex items-center justify-center mb-6">
                <Music size={28} className="text-cyan-400" />
              </div>
              <h3 className="text-white text-xl font-bold mb-3">Music Creators</h3>
              <p className="text-white/60 mb-4">
                Find inspiration, download free mixtapes, and learn from curated sets across all genres.
              </p>
              <ul className="space-y-2 text-white/50 text-sm">
                <li className="flex items-center gap-2"><Check size={14} className="text-cyan-400" /> Free mixtape downloads</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-cyan-400" /> Genre-specific content</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-cyan-400" /> Tracklists included</li>
              </ul>
            </div>

            <div className="p-8 rounded-3xl bg-gradient-to-br from-amber-500/10 to-amber-500/0 border border-amber-500/20 hover:border-amber-500/40 transition-all">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 flex items-center justify-center mb-6">
                <Star size={28} className="text-amber-400" />
              </div>
              <h3 className="text-white text-xl font-bold mb-3">Music Fans</h3>
              <p className="text-white/60 mb-4">
                Stream and download free mixes, follow your favorite DJ, and never miss a new release.
              </p>
              <ul className="space-y-2 text-white/50 text-sm">
                <li className="flex items-center gap-2"><Check size={14} className="text-amber-400" /> All mixes are free</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-amber-400" /> Telegram updates</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-amber-400" /> Newsletter drops</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-24 px-6 bg-gradient-to-b from-black to-zinc-950">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-400 text-sm font-medium mb-6">
            <Mail size={18} />
            <span>Newsletter</span>
          </div>
          <h2 className="font-display text-4xl sm:text-5xl text-white mb-4">STAY IN THE LOOP</h2>
          <p className="text-white/60 mb-8 max-w-xl mx-auto">
            Get exclusive updates, new release alerts, and early access to events. Join the DJ FLOWERZ mailing list.
          </p>
          <NewsletterForm />
        </div>
      </section>

      {/* Telegram Section */}
      <section className="py-24 px-6 bg-zinc-950">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium mb-6">
                <Send size={18} />
                <span>Telegram Community</span>
              </div>
              <h2 className="font-display text-4xl sm:text-5xl text-white mb-6">DJ CRACKED ZONE</h2>
              <p className="text-white/60 text-lg mb-8">
                Get access to cracked DJ software, tools, plugins, and other DJ-related resources. Join our Telegram community for the latest drops.
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3 text-white/70">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center">
                    <Zap size={16} className="text-cyan-400" />
                  </div>
                  Cracked DJ software & plugins
                </li>
                <li className="flex items-center gap-3 text-white/70">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center">
                    <Users size={16} className="text-cyan-400" />
                  </div>
                  Connect with other DJs
                </li>
                <li className="flex items-center gap-3 text-white/70">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center">
                    <Music size={16} className="text-cyan-400" />
                  </div>
                  DJ tools & resources
                </li>
              </ul>
              <a
                href="https://t.me/djs_cracked_zone"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-full font-bold text-lg hover:opacity-90 transition-all"
              >
                <Send size={20} />
                Join Telegram Channel
              </a>
            </div>
            <div className="flex-1 relative">
              <div className="aspect-square max-w-md mx-auto rounded-3xl overflow-hidden bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 p-8 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                    <Send size={40} className="text-white" />
                  </div>
                  <h3 className="text-white text-2xl font-bold mb-2">@djs_cracked_zone</h3>
                  <p className="text-white/60 mb-4">DJ Cracked Softwares & Tools</p>
                  <div className="flex items-center justify-center gap-2 text-white/50 text-sm">
                    <Users size={16} />
                    <span>Join the Community</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 px-6 bg-black">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl sm:text-5xl text-white mb-4">WHAT DJS ARE SAYING</h2>
            <p className="text-white/60">Trusted by DJs across Kenya and beyond</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: 'DJ Kenyan Vibes',
                role: 'Club DJ, Nairobi',
                quote: 'The music pool is a game changer. Fresh edits every week, and the BPM tagging saves me hours of prep time.',
                rating: 5,
              },
              {
                name: 'DJ Mixmaster',
                role: 'Wedding DJ',
                quote: 'Best investment for my DJ career. The clean versions are perfect for corporate events and weddings.',
                rating: 5,
              },
              {
                name: 'DJ Sunset',
                role: 'Radio DJ',
                quote: 'Been using the free mixtapes as reference for years. Finally subscribed to the pool - worth every shilling!',
                rating: 5,
              },
            ].map((testimonial, i) => (
              <div key={i} className="p-8 rounded-3xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, j) => (
                    <Star key={j} size={16} className="text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-white/80 mb-6 italic">"{testimonial.quote}"</p>
                <div>
                  <p className="text-white font-semibold">{testimonial.name}</p>
                  <p className="text-white/50 text-sm">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
