"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useCart } from '@/context/CartContext'
import { useTheme } from '@/context/ThemeContext'
import { useState, useEffect } from 'react'
import { Menu, X, ShoppingCart, User, Sun, Moon, Music, Store, Headphones, LayoutDashboard, Calendar, Crown, MessageCircle, Heart, Bell } from 'lucide-react'

export function Navbar() {
  const pathname = usePathname()
  const { user, isAdmin, signOut } = useAuth()
  const { itemCount } = useCart()
  const { theme, toggleTheme } = useTheme()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const navLinks = [
    { href: '/', label: 'Home', icon: Music },
    { href: '/mixtapes', label: 'Mixtapes', icon: Headphones },
    { href: '/music-pool', label: 'Music Pool', icon: Crown },
    { href: '/pricing', label: 'Pricing', icon: Crown },
    { href: '/store', label: 'Store', icon: Store },
    { href: '/bookings', label: 'Bookings', icon: Calendar },
    { href: '/tip-jar', label: 'Tip Jar', icon: Heart, isButton: true },
    { href: '/contact', label: 'Contact', icon: MessageCircle },
  ]

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-fuchsia-500 to-cyan-500 flex items-center justify-center">
              <span className="text-white font-black text-sm">DJ</span>
            </div>
            <span className="text-white font-bold text-xl tracking-tight hidden sm:block">FLOWERZ</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  link.isButton
                    ? 'bg-gradient-to-r from-pink-500 to-red-500 text-white hover:opacity-90 ml-2 shadow-lg shadow-pink-500/20'
                    : isActive(link.href)
                      ? 'bg-white text-black'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <span className="flex items-center gap-2">
                  {link.isButton && <Heart size={14} className="fill-white" />}
                  {link.label}
                </span>
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {mounted && (
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-all"
              >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            )}

            <Link
              href="/cart"
              className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-all relative"
            >
              <ShoppingCart size={20} />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-fuchsia-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>

            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/dashboard?tab=notifications"
                  className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-all"
                  title="Notifications"
                >
                  <Bell size={20} />
                </Link>
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-all"
                    title="Admin Panel"
                  >
                    <LayoutDashboard size={20} />
                  </Link>
                )}
                <Link
                  href="/dashboard"
                  className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-all"
                  title="My Dashboard"
                >
                  <User size={20} />
                </Link>
                <button
                  onClick={signOut}
                  className="hidden sm:block px-4 py-2 rounded-full text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white hover:opacity-90 transition-all"
              >
                Sign In
              </Link>
            )}

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-all"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-white/10 bg-black/95 backdrop-blur-xl">
          <div className="px-4 py-4 space-y-2">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive(link.href)
                    ? 'bg-white text-black'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <link.icon size={18} />
                {link.label}
              </Link>
            ))}
            {user && (
              <button
                onClick={() => {
                  signOut()
                  setMobileOpen(false)
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all"
              >
                Sign Out
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
