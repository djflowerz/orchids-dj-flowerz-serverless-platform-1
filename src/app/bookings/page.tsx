import { BookingForm } from '@/components/bookings/BookingForm'
import { Calendar, Music, Headphones, Star } from 'lucide-react'

export default function BookingsPage() {
  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <div className="relative h-[40vh] min-h-[300px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200')] bg-cover bg-center opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        
        <div className="relative z-10 text-center px-4">
          <h1 className="font-display text-5xl sm:text-7xl text-white mb-4">BOOK DJ FLOWERZ</h1>
          <p className="text-white/70 text-lg max-w-2xl mx-auto">
            Take your event to the next level with premium sounds and unmatched energy.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Info Side */}
          <div className="lg:col-span-1 space-y-12">
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Why Book Me?</h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-fuchsia-500/20 flex items-center justify-center shrink-0">
                    <Music className="text-fuchsia-400" size={24} />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Versatile Style</h3>
                    <p className="text-white/50 text-sm">From Afrobeats to Amapiano, Hip-Hop to House. I play it all.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 flex items-center justify-center shrink-0">
                    <Headphones className="text-cyan-400" size={24} />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Pro Equipment</h3>
                    <p className="text-white/50 text-sm">High-end sound systems and lighting for any venue size.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center shrink-0">
                    <Star className="text-amber-400" size={24} />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Experience</h3>
                    <p className="text-white/50 text-sm">500+ successful events across the continent.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/5 rounded-3xl p-8 border border-white/10">
              <h3 className="text-white font-semibold mb-4">Direct Contact</h3>
              <p className="text-white/50 text-sm mb-6">For urgent inquiries, feel free to reach out via WhatsApp or Email.</p>
              <div className="space-y-3">
                <p className="text-white font-medium">djflowerz254@gmail.com</p>
                <p className="text-white font-medium">+254 789 783 258</p>
              </div>
            </div>
          </div>

          {/* Form Side */}
          <div className="lg:col-span-2">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">Request a Quote</h2>
              <p className="text-white/50">Fill out the form below and we'll get back to you within 24 hours.</p>
            </div>
            <BookingForm />
          </div>
        </div>
      </div>
    </div>
  )
}
