import Link from 'next/link'
import { Instagram, Twitter, Youtube, Send } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-black border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-fuchsia-500 to-cyan-500 flex items-center justify-center">
                <span className="text-white font-black text-sm">DJ</span>
              </div>
              <span className="text-white font-bold text-xl tracking-tight">FLOWERZ</span>
            </Link>
            <p className="text-white/50 text-sm max-w-md mb-4">
              Premium mixtapes, exclusive music, and official merchandise. Join the movement and elevate your sound.
            </p>
            <div className="flex items-center gap-3">
              <a href="#" className="p-2 rounded-full bg-white/5 text-white/50 hover:text-white hover:bg-white/10 transition-all">
                <Instagram size={18} />
              </a>
              <a href="#" className="p-2 rounded-full bg-white/5 text-white/50 hover:text-white hover:bg-white/10 transition-all">
                <Twitter size={18} />
              </a>
              <a href="#" className="p-2 rounded-full bg-white/5 text-white/50 hover:text-white hover:bg-white/10 transition-all">
                <Youtube size={18} />
              </a>
              <a href="#" className="p-2 rounded-full bg-white/5 text-white/50 hover:text-white hover:bg-white/10 transition-all">
                <Send size={18} />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <div className="space-y-2">
              <Link href="/mixtapes" className="block text-white/50 hover:text-white text-sm transition-colors">Mixtapes</Link>
              <Link href="/store" className="block text-white/50 hover:text-white text-sm transition-colors">Store</Link>
              <Link href="/music-pool" className="block text-white/50 hover:text-white text-sm transition-colors">Music Pool</Link>
              <Link href="/tip-jar" className="block text-white/50 hover:text-white text-sm transition-colors">Tip Jar</Link>
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Support</h4>
            <div className="space-y-2">
              <Link href="/profile" className="block text-white/50 hover:text-white text-sm transition-colors">My Account</Link>
              <Link href="/cart" className="block text-white/50 hover:text-white text-sm transition-colors">Cart</Link>
              <a href="mailto:support@djflowerz.com" className="block text-white/50 hover:text-white text-sm transition-colors">Contact</a>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 mt-8 pt-8 text-center">
          <p className="text-white/30 text-sm">
            &copy; {new Date().getFullYear()} DJ FLOWERZ. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
