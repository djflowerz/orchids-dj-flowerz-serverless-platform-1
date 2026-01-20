"use client"

import { useAuth } from '@/context/AuthContext'
import { db } from '@/lib/firebase'
import { collection, query, where, getDocs, orderBy, updateDoc, doc } from 'firebase/firestore'
import { Payment } from '@/lib/types'
import { useEffect, useState } from 'react'
import { User, Crown, Package, Clock, Send, Settings, Shield } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

const ADMIN_EMAIL = 'ianmuriithiflowerz@gmail.com'

export default function ProfilePage() {
  const { user, signOut, hasActiveSubscription, loading: authLoading } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [telegramUsername, setTelegramUsername] = useState('')

  const isAdminUser = user?.email === ADMIN_EMAIL

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      router.replace('/login')
      return
    }

    async function fetchOrders() {
      try {
        const q = query(
          collection(db, 'payments'),
          where('user_email', '==', user?.email),
          where('status', '==', 'success'),
          orderBy('created_at', 'desc')
        )
        const snapshot = await getDocs(q)
        const data = snapshot.docs.map(doc => {
          const d = doc.data()
          return {
            id: doc.id,
            ...d,
            created_at: d.created_at?.toDate?.().toISOString() || new Date().toISOString()
          }
        }) as Payment[]
        setOrders(data)
      } catch (error) {
        console.error('Error fetching orders:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
    setTelegramUsername(user.telegram_username || '')
  }, [user, router, authLoading])

  const handleLinkTelegram = async () => {
    if (!telegramUsername) {
      toast.error('Please enter your Telegram username')
      return
    }

    try {
      if (!user?.id) return
      await updateDoc(doc(db, 'users', user.id), { telegram_username: telegramUsername })
      toast.success('Telegram linked successfully!')
    } catch (error) {
      console.error('Error linking telegram:', error)
      toast.error('Failed to link Telegram')
    }
  }

  const handleSubscribe = async () => {
    toast.info('Subscription feature coming soon!')
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-fuchsia-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-black py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display text-4xl sm:text-5xl text-white">MY PROFILE</h1>
          <button
            onClick={signOut}
            className="px-4 py-2 rounded-full bg-white/5 text-white/70 hover:bg-white/10 transition-all"
          >
            Sign Out
          </button>
        </div>

        {isAdminUser && (
          <Link
            href="/admin"
            className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-fuchsia-500/20 to-cyan-500/20 border border-fuchsia-500/30 mb-8 hover:from-fuchsia-500/30 hover:to-cyan-500/30 transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-fuchsia-500 to-cyan-500 flex items-center justify-center">
              <Shield size={24} className="text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-semibold">Admin Dashboard</h3>
              <p className="text-white/50 text-sm">Manage products, mixtapes, users, and more</p>
            </div>
            <Settings size={20} className="text-white/50" />
          </Link>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-fuchsia-500 to-cyan-500 flex items-center justify-center">
                <User size={32} className="text-white" />
              </div>
              <div>
                <h2 className="text-white font-semibold text-xl">{user.name || 'User'}</h2>
                <p className="text-white/50">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-sm ${isAdminUser ? 'bg-yellow-500/20 text-yellow-400' : 'bg-white/5 text-white/50'
                }`}>
                {isAdminUser ? 'Admin' : 'Member'}
              </span>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-3 mb-4">
              <Crown size={24} className={hasActiveSubscription ? 'text-yellow-400' : 'text-white/30'} />
              <h3 className="text-white font-semibold">Music Pool Subscription</h3>
            </div>
            {hasActiveSubscription ? (
              <div>
                <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm">Active</span>
                <p className="text-white/50 text-sm mt-2">
                  Expires: {user.subscription_expires_at ? new Date(user.subscription_expires_at).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            ) : (
              <div>
                <p className="text-white/50 text-sm mb-4">Subscribe to access exclusive content</p>
                <button
                  onClick={handleSubscribe}
                  className="px-4 py-2 rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white text-sm font-semibold hover:opacity-90 transition-all"
                >
                  Subscribe - KSh 700/month
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Send size={24} className="text-cyan-400" />
            <h3 className="text-white font-semibold">Telegram Integration</h3>
          </div>
          <p className="text-white/50 text-sm mb-4">
            Link your Telegram to get added to the exclusive Music Pool group (subscribers only)
          </p>
          <div className="flex gap-3">
            <input
              type="text"
              value={telegramUsername}
              onChange={(e) => setTelegramUsername(e.target.value)}
              placeholder="@username"
              className="flex-1 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-cyan-500/50"
            />
            <button
              onClick={handleLinkTelegram}
              className="px-4 py-2 rounded-xl bg-cyan-500 text-white font-semibold hover:bg-cyan-600 transition-all"
            >
              Link
            </button>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-3 mb-6">
            <Package size={24} className="text-fuchsia-400" />
            <h3 className="text-white font-semibold">Order History</h3>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-fuchsia-500 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-white/50">No orders yet</p>
              <Link href="/store" className="text-fuchsia-400 hover:text-fuchsia-300 text-sm mt-2 inline-block">
                Browse Store
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-white/5"
                >
                  <div>
                    <p className="text-white font-medium capitalize">{order.payment_type}</p>
                    <p className="text-white/50 text-sm flex items-center gap-2">
                      <Clock size={14} />
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-semibold">KSh {(order.amount / 100).toLocaleString()}</p>
                    <span className="text-green-400 text-xs">Completed</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
