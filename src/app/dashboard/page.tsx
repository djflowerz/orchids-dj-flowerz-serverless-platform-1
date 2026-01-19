"use client"

import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { 
    User, Crown, Package, Download, Clock, Send, Music, 
    ShoppingBag, Key, Truck, ExternalLink, Copy, CheckCircle,
    AlertCircle, RefreshCw, ChevronRight, Heart, Gift, Settings, Bell
  } from 'lucide-react'

interface Order {
  id: string
  type: string
  status: string
  amount: number
  license_key: string | null
  download_link: string | null
  download_expires: string | null
  download_count: number
  max_downloads: number
  created_at: string
  product: {
    id: string
    title: string
    type: string
    image_url: string | null
  } | null
}

interface Subscription {
  id: string
  tier: string
  status: string
  start_date: string
  end_date: string
  auto_renew: boolean
}

interface ShippingOrder {
  id: string
  order_id: string
  shipping_status: string
  courier: string | null
  tracking_number: string | null
  address_line1: string
  city: string
  country: string
  created_at: string
}

interface DownloadItem {
    id: string
    title: string
    type: string
    download_url: string
    expires_at: string | null
  }

  interface Favorite {
    id: string
    entity_type: string
    entity_id: string
    created_at: string
  }

  interface ReferralStats {
    referralCode: string
    referrals: Array<{
      id: string
      status: string
      created_at: string
      referred?: { name: string; email: string }
    }>
    stats: { totalReferrals: number; convertedReferrals: number; totalRewards: number }
  }

  interface NotificationPreferences {
    email_new_releases: boolean
    email_subscription_expiring: boolean
    email_promotions: boolean
    telegram_new_releases: boolean
    push_notifications: boolean
    low_data_mode: boolean
  }

export default function DashboardPage() {
  const { user, loading: authLoading, hasActiveSubscription, refreshUser } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [subscription, setSubscription] = useState<Subscription | null>(null)
const [shippingOrders, setShippingOrders] = useState<ShippingOrder[]>([])
    const [downloads, setDownloads] = useState<DownloadItem[]>([])
    const [favorites, setFavorites] = useState<Favorite[]>([])
    const [referralStats, setReferralStats] = useState<ReferralStats | null>(null)
    const [preferences, setPreferences] = useState<NotificationPreferences | null>(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace('/login')
      return
    }
    fetchData()
  }, [user, authLoading, router])

  async function fetchData() {
    setLoading(true)
    try {
const [ordersRes, subsRes, shippingRes, favRes, refRes, prefsRes] = await Promise.all([
          fetch('/api/dashboard/orders'),
          fetch('/api/dashboard/subscription'),
          fetch('/api/dashboard/shipping'),
          fetch('/api/favorites'),
          fetch('/api/referrals'),
          fetch('/api/user/preferences')
        ])

        if (ordersRes.ok) {
          const data = await ordersRes.json()
          setOrders(data.orders || [])
        }
        if (subsRes.ok) {
          const data = await subsRes.json()
          setSubscription(data.subscription)
        }
        if (shippingRes.ok) {
          const data = await shippingRes.json()
          setShippingOrders(data.shipping || [])
        }
        if (favRes.ok) {
          const data = await favRes.json()
          setFavorites(data.favorites || [])
        }
        if (refRes.ok) {
          const data = await refRes.json()
          setReferralStats(data)
        }
        if (prefsRes.ok) {
          const data = await prefsRes.json()
          setPreferences(data.preferences)
        }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Copied to clipboard!')
    } catch {
      toast.error('Failed to copy')
    }
  }

  async function handleDownload(orderId: string) {
    try {
      const res = await fetch(`/api/downloads/${orderId}`)
      const data = await res.json()
      
      if (!res.ok) {
        toast.error(data.error || 'Download failed')
        return
      }

      window.open(data.downloadUrl, '_blank')
      fetchData()
    } catch {
      toast.error('Download failed')
    }
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-fuchsia-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

const tabs = [
      { id: 'overview', label: 'Overview', icon: User },
      { id: 'orders', label: 'Orders', icon: ShoppingBag },
      { id: 'downloads', label: 'Downloads', icon: Download },
      { id: 'subscription', label: 'Subscription', icon: Crown },
      { id: 'favorites', label: 'Favorites', icon: Heart },
      { id: 'referrals', label: 'Referrals', icon: Gift },
      { id: 'shipping', label: 'Shipping', icon: Truck },
      { id: 'settings', label: 'Settings', icon: Settings },
    ]

  const digitalOrders = orders.filter(o => o.type === 'digital' && o.status === 'completed')
  const physicalOrders = orders.filter(o => o.type === 'physical')

  return (
    <div className="min-h-screen bg-black py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display text-4xl sm:text-5xl text-white">MY DASHBOARD</h1>
          <button
            onClick={() => { fetchData(); refreshUser() }}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 text-white/70 hover:bg-white/10 transition-all"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-4 mb-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white'
                  : 'bg-white/5 text-white/70 hover:bg-white/10'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-fuchsia-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-fuchsia-500 to-cyan-500 flex items-center justify-center">
                        <User size={32} className="text-white" />
                      </div>
                      <div>
                        <h2 className="text-white font-semibold text-xl">{user.name || 'User'}</h2>
                        <p className="text-white/50 text-sm">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <span className={`px-3 py-1 rounded-full text-xs ${
                        user.email_verified ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {user.email_verified ? 'Verified' : 'Unverified'}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs ${
                        user.role === 'admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-white/10 text-white/60'
                      }`}>
                        {user.role}
                      </span>
                    </div>
                  </div>

                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-3 mb-4">
                      <Crown size={24} className={hasActiveSubscription ? 'text-yellow-400' : 'text-white/30'} />
                      <h3 className="text-white font-semibold">Music Pool</h3>
                    </div>
                    {subscription && subscription.status === 'active' ? (
                      <div>
                        <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm capitalize">
                          {subscription.tier} Plan
                        </span>
                        <p className="text-white/50 text-sm mt-3">
                          Expires: {new Date(subscription.end_date).toLocaleDateString()}
                        </p>
                        <Link href="/music-pool" className="text-cyan-400 text-sm hover:underline mt-2 inline-block">
                          Browse Music Pool →
                        </Link>
                      </div>
                    ) : (
                      <div>
                        <p className="text-white/50 text-sm mb-4">Subscribe for exclusive tracks</p>
                        <Link
                          href="/pricing"
                          className="px-4 py-2 rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white text-sm font-semibold hover:opacity-90 transition-all inline-block"
                        >
                          Subscribe Now
                        </Link>
                      </div>
                    )}
                  </div>

                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-3 mb-4">
                      <Send size={24} className="text-cyan-400" />
                      <h3 className="text-white font-semibold">Telegram</h3>
                    </div>
                    {user.telegram_username ? (
                      <div>
                        <p className="text-white/70">@{user.telegram_username}</p>
                        <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs mt-2 inline-block">
                          Connected
                        </span>
                      </div>
                    ) : (
                      <div>
                        <p className="text-white/50 text-sm mb-3">Link for exclusive access</p>
                        <Link href="/profile" className="text-cyan-400 text-sm hover:underline">
                          Link Telegram →
                        </Link>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-white font-semibold">Recent Orders</h3>
                      <button onClick={() => setActiveTab('orders')} className="text-fuchsia-400 text-sm hover:underline">
                        View All
                      </button>
                    </div>
                    {orders.length === 0 ? (
                      <p className="text-white/50 text-center py-4">No orders yet</p>
                    ) : (
                      <div className="space-y-3">
                        {orders.slice(0, 3).map(order => (
                          <div key={order.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                            <div>
                              <p className="text-white text-sm">{order.product?.title || 'Product'}</p>
                              <p className="text-white/50 text-xs capitalize">{order.type}</p>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              order.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                              order.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-white/10 text-white/60'
                            }`}>
                              {order.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-white font-semibold">Quick Actions</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Link href="/store" className="p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all text-center">
                        <ShoppingBag size={24} className="text-fuchsia-400 mx-auto mb-2" />
                        <p className="text-white text-sm">Store</p>
                      </Link>
                      <Link href="/mixtapes" className="p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all text-center">
                        <Music size={24} className="text-cyan-400 mx-auto mb-2" />
                        <p className="text-white text-sm">Mixtapes</p>
                      </Link>
                      <Link href="/music-pool" className="p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all text-center">
                        <Crown size={24} className="text-yellow-400 mx-auto mb-2" />
                        <p className="text-white text-sm">Music Pool</p>
                      </Link>
                      <Link href="/profile" className="p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all text-center">
                        <User size={24} className="text-green-400 mx-auto mb-2" />
                        <p className="text-white text-sm">Profile</p>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="space-y-4">
                <h2 className="text-white text-xl font-semibold mb-6">Order History</h2>
                {orders.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingBag size={48} className="text-white/20 mx-auto mb-4" />
                    <p className="text-white/50">No orders yet</p>
                    <Link href="/store" className="text-fuchsia-400 hover:underline text-sm mt-2 inline-block">
                      Browse Store →
                    </Link>
                  </div>
                ) : (
                  orders.map(order => (
                    <div key={order.id} className="p-6 rounded-2xl bg-white/5 border border-white/10">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-white font-semibold">{order.product?.title || 'Product'}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              order.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                              order.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                              order.status === 'shipped' ? 'bg-blue-500/20 text-blue-400' :
                              'bg-red-500/20 text-red-400'
                            }`}>
                              {order.status}
                            </span>
                          </div>
                          <p className="text-white/50 text-sm">
                            Order #{order.id.slice(0, 8)} • {new Date(order.created_at).toLocaleDateString()}
                          </p>
                          <p className="text-white/50 text-sm capitalize">{order.type} product</p>
                          {order.license_key && (
                            <div className="flex items-center gap-2 mt-2">
                              <Key size={14} className="text-amber-400" />
                              <code className="text-amber-400 text-sm bg-amber-500/10 px-2 py-1 rounded">
                                {order.license_key}
                              </code>
                              <button onClick={() => copyToClipboard(order.license_key!)} className="text-white/50 hover:text-white">
                                <Copy size={14} />
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <p className="text-white font-bold">KSh {(order.amount / 100).toLocaleString()}</p>
                          {order.type === 'digital' && order.status === 'completed' && (
                            <div className="text-right">
                              {order.download_count < order.max_downloads ? (
                                <button
                                  onClick={() => handleDownload(order.id)}
                                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-fuchsia-500 text-white text-sm hover:bg-fuchsia-600 transition-all"
                                >
                                  <Download size={16} />
                                  Download ({order.max_downloads - order.download_count} left)
                                </button>
                              ) : (
                                <span className="text-red-400 text-sm">Download limit reached</span>
                              )}
                              {order.download_expires && (
                                <p className="text-white/40 text-xs mt-1">
                                  Expires: {new Date(order.download_expires).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'downloads' && (
              <div className="space-y-4">
                <h2 className="text-white text-xl font-semibold mb-6">My Downloads</h2>
                {digitalOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <Download size={48} className="text-white/20 mx-auto mb-4" />
                    <p className="text-white/50">No digital purchases yet</p>
                    <Link href="/store" className="text-fuchsia-400 hover:underline text-sm mt-2 inline-block">
                      Browse Digital Products →
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {digitalOrders.map(order => (
                      <div key={order.id} className="p-6 rounded-2xl bg-white/5 border border-white/10">
                        <h3 className="text-white font-semibold mb-2">{order.product?.title}</h3>
                        <div className="flex items-center gap-4 mb-4">
                          <div className="flex items-center gap-2">
                            <Download size={14} className="text-white/50" />
                            <span className="text-white/50 text-sm">
                              {order.download_count} / {order.max_downloads} downloads
                            </span>
                          </div>
                        </div>
                        {order.license_key && (
                          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-amber-400/70 text-xs mb-1">License Key</p>
                                <code className="text-amber-400 text-sm">{order.license_key}</code>
                              </div>
                              <button 
                                onClick={() => copyToClipboard(order.license_key!)}
                                className="p-2 rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
                              >
                                <Copy size={16} />
                              </button>
                            </div>
                          </div>
                        )}
                        {order.download_count < order.max_downloads ? (
                          <button
                            onClick={() => handleDownload(order.id)}
                            className="w-full py-3 rounded-xl bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2"
                          >
                            <Download size={18} />
                            Download Now
                          </button>
                        ) : (
                          <div className="w-full py-3 rounded-xl bg-red-500/20 text-red-400 text-center">
                            Download limit reached
                          </div>
                        )}
                        {order.download_expires && new Date(order.download_expires) < new Date() && (
                          <p className="text-red-400 text-xs mt-2 text-center">
                            Download link expired
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'subscription' && (
              <div className="space-y-6">
                <h2 className="text-white text-xl font-semibold mb-6">Music Pool Subscription</h2>
                
                {subscription ? (
                  <div className="p-8 rounded-3xl bg-gradient-to-br from-fuchsia-500/10 to-cyan-500/10 border border-fuchsia-500/20">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-cyan-500 flex items-center justify-center">
                        <Crown size={32} className="text-white" />
                      </div>
                      <div>
                        <h3 className="text-white text-2xl font-bold capitalize">{subscription.tier} Plan</h3>
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          subscription.status === 'active' ? 'bg-green-500/20 text-green-400' :
                          subscription.status === 'expired' ? 'bg-red-500/20 text-red-400' :
                          'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {subscription.status}
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div>
                        <p className="text-white/50 text-sm">Start Date</p>
                        <p className="text-white">{new Date(subscription.start_date).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-white/50 text-sm">End Date</p>
                        <p className="text-white">{new Date(subscription.end_date).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-white/50 text-sm">Auto Renew</p>
                        <p className={subscription.auto_renew ? 'text-green-400' : 'text-white/70'}>
                          {subscription.auto_renew ? 'Enabled' : 'Disabled'}
                        </p>
                      </div>
                      <div>
                        <p className="text-white/50 text-sm">Days Remaining</p>
                        <p className="text-white">
                          {Math.max(0, Math.ceil((new Date(subscription.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} days
                        </p>
                      </div>
                    </div>

                    {subscription.status === 'active' && (
                      <Link
                        href="/music-pool"
                        className="w-full py-4 rounded-xl bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2"
                      >
                        <Music size={20} />
                        Browse Music Pool
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Crown size={64} className="text-white/20 mx-auto mb-6" />
                    <h3 className="text-white text-xl font-semibold mb-2">No Active Subscription</h3>
                    <p className="text-white/50 mb-6">Subscribe to access exclusive tracks from the Music Pool</p>
                    <Link
                      href="/pricing"
                      className="px-8 py-4 rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white font-semibold hover:opacity-90 transition-all inline-block"
                    >
                      View Plans
                    </Link>
                  </div>
                )}

                <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                  <h3 className="text-white font-semibold mb-4">Plan Benefits</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { tier: 'Basic', features: ['Standard tracks', '50 downloads/month', 'Email support'] },
                      { tier: 'Pro', features: ['All tracks', 'Unlimited downloads', 'Priority support', 'Early access'] },
                      { tier: 'Unlimited', features: ['Everything in Pro', 'Telegram VIP channel', 'Exclusive releases', 'Request tracks'] },
                    ].map(plan => (
                      <div key={plan.tier} className="p-4 rounded-xl bg-white/5">
                        <h4 className="text-white font-semibold mb-3">{plan.tier}</h4>
                        <ul className="space-y-2">
                          {plan.features.map((f, i) => (
                            <li key={i} className="text-white/60 text-sm flex items-center gap-2">
                              <CheckCircle size={14} className="text-green-400" />
                              {f}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'shipping' && (
              <div className="space-y-4">
                <h2 className="text-white text-xl font-semibold mb-6">Shipping & Tracking</h2>
                {shippingOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <Truck size={48} className="text-white/20 mx-auto mb-4" />
                    <p className="text-white/50">No physical orders</p>
                    <Link href="/store" className="text-fuchsia-400 hover:underline text-sm mt-2 inline-block">
                      Browse Physical Products →
                    </Link>
                  </div>
                ) : (
                  shippingOrders.map(ship => (
                    <div key={ship.id} className="p-6 rounded-2xl bg-white/5 border border-white/10">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-white font-semibold">Order #{ship.order_id.slice(0, 8)}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              ship.shipping_status === 'delivered' ? 'bg-green-500/20 text-green-400' :
                              ship.shipping_status === 'shipped' ? 'bg-blue-500/20 text-blue-400' :
                              'bg-yellow-500/20 text-yellow-400'
                            }`}>
                              {ship.shipping_status}
                            </span>
                          </div>
                          <div className="text-white/50 text-sm space-y-1">
                            <p>{ship.address_line1}</p>
                            <p>{ship.city}, {ship.country}</p>
                            {ship.courier && <p>Courier: {ship.courier}</p>}
                          </div>
                        </div>
                        {ship.tracking_number && (
                          <div className="text-right">
                            <p className="text-white/50 text-xs mb-1">Tracking Number</p>
                            <div className="flex items-center gap-2">
                              <code className="text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded">{ship.tracking_number}</code>
                              <button onClick={() => copyToClipboard(ship.tracking_number!)} className="text-white/50 hover:text-white">
                                <Copy size={14} />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-white/10">
                        <div className="flex items-center gap-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            ['pending', 'shipped', 'delivered'].includes(ship.shipping_status) ? 'bg-green-500' : 'bg-white/10'
                          }`}>
                            <CheckCircle size={16} className="text-white" />
                          </div>
                          <div className="flex-1 h-1 bg-white/10 rounded">
                            <div className={`h-full rounded transition-all ${
                              ship.shipping_status === 'pending' ? 'w-0' :
                              ship.shipping_status === 'shipped' ? 'w-1/2 bg-blue-500' :
                              'w-full bg-green-500'
                            }`} />
                          </div>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            ['shipped', 'delivered'].includes(ship.shipping_status) ? 'bg-blue-500' : 'bg-white/10'
                          }`}>
                            <Truck size={16} className="text-white" />
                          </div>
                          <div className="flex-1 h-1 bg-white/10 rounded">
                            <div className={`h-full rounded transition-all ${
                              ship.shipping_status === 'delivered' ? 'w-full bg-green-500' : 'w-0'
                            }`} />
                          </div>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            ship.shipping_status === 'delivered' ? 'bg-green-500' : 'bg-white/10'
                          }`}>
                            <Package size={16} className="text-white" />
                          </div>
                        </div>
                        <div className="flex justify-between mt-2 text-xs text-white/50">
                          <span>Processing</span>
                          <span>Shipped</span>
                          <span>Delivered</span>
                        </div>
</div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'favorites' && (
                <div className="space-y-4">
                  <h2 className="text-white text-xl font-semibold mb-6">My Favorites</h2>
                  {favorites.length === 0 ? (
                    <div className="text-center py-12">
                      <Heart size={48} className="text-white/20 mx-auto mb-4" />
                      <p className="text-white/50">No favorites yet</p>
                      <p className="text-white/30 text-sm mt-2">Save mixtapes and tracks to access them quickly</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {favorites.map(fav => (
                        <div key={fav.id} className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                          <div>
                            <span className="text-white/50 text-xs uppercase">{fav.entity_type}</span>
                            <p className="text-white">ID: {fav.entity_id.slice(0, 8)}...</p>
                            <p className="text-white/40 text-xs">{new Date(fav.created_at).toLocaleDateString()}</p>
                          </div>
                          <Link 
                            href={fav.entity_type === 'mixtape' ? `/mixtapes/${fav.entity_id}` : fav.entity_type === 'product' ? `/store/${fav.entity_id}` : '/music-pool'}
                            className="px-4 py-2 rounded-full bg-fuchsia-500/20 text-fuchsia-400 text-sm hover:bg-fuchsia-500/30"
                          >
                            View
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'referrals' && (
                <div className="space-y-6">
                  <h2 className="text-white text-xl font-semibold mb-6">Referral Program</h2>
                  
                  {referralStats && (
                    <>
                      <div className="p-6 rounded-2xl bg-gradient-to-br from-fuchsia-500/10 to-cyan-500/10 border border-fuchsia-500/20">
                        <h3 className="text-white font-semibold mb-4">Your Referral Code</h3>
                        <div className="flex items-center gap-4">
                          <code className="flex-1 text-2xl font-bold text-fuchsia-400 bg-fuchsia-500/10 px-6 py-3 rounded-xl text-center">
                            {referralStats.referralCode}
                          </code>
                          <button 
                            onClick={() => copyToClipboard(referralStats.referralCode)}
                            className="p-3 rounded-xl bg-fuchsia-500 text-white hover:bg-fuchsia-600"
                          >
                            <Copy size={20} />
                          </button>
                        </div>
                        <p className="text-white/50 text-sm mt-4">
                          Share this code with friends. When they subscribe, you both get rewards!
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-6 rounded-xl bg-white/5 border border-white/10 text-center">
                          <p className="text-3xl font-bold text-white">{referralStats.stats.totalReferrals}</p>
                          <p className="text-white/50 text-sm">Total Referrals</p>
                        </div>
                        <div className="p-6 rounded-xl bg-white/5 border border-white/10 text-center">
                          <p className="text-3xl font-bold text-green-400">{referralStats.stats.convertedReferrals}</p>
                          <p className="text-white/50 text-sm">Converted</p>
                        </div>
                        <div className="p-6 rounded-xl bg-white/5 border border-white/10 text-center">
                          <p className="text-3xl font-bold text-amber-400">KSh {referralStats.stats.totalRewards}</p>
                          <p className="text-white/50 text-sm">Total Rewards</p>
                        </div>
                      </div>

                      {referralStats.referrals.length > 0 && (
                        <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                          <h3 className="text-white font-semibold mb-4">Referral History</h3>
                          <div className="space-y-3">
                            {referralStats.referrals.map(ref => (
                              <div key={ref.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                                <div>
                                  <p className="text-white">{ref.referred?.name || ref.referred?.email || 'Pending'}</p>
                                  <p className="text-white/40 text-xs">{new Date(ref.created_at).toLocaleDateString()}</p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs ${
                                  ref.status === 'converted' ? 'bg-green-500/20 text-green-400' :
                                  ref.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                                  'bg-white/10 text-white/50'
                                }`}>
                                  {ref.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="space-y-6">
                  <h2 className="text-white text-xl font-semibold mb-6">Notification Settings</h2>
                  
                  {preferences && (
                    <div className="space-y-4">
                      <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                          <Bell size={20} className="text-fuchsia-400" />
                          Email Notifications
                        </h3>
                        <div className="space-y-4">
                          {[
                            { key: 'email_new_releases', label: 'New releases and mixtapes' },
                            { key: 'email_subscription_expiring', label: 'Subscription expiring reminders' },
                            { key: 'email_promotions', label: 'Promotions and special offers' },
                          ].map(item => (
                            <label key={item.key} className="flex items-center justify-between cursor-pointer">
                              <span className="text-white/70">{item.label}</span>
                              <input
                                type="checkbox"
                                checked={preferences[item.key as keyof NotificationPreferences] as boolean}
                                onChange={async (e) => {
                                  const newVal = e.target.checked
                                  setPreferences({ ...preferences, [item.key]: newVal })
                                  await fetch('/api/user/preferences', {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ [item.key]: newVal })
                                  })
                                  toast.success('Preferences updated')
                                }}
                                className="w-5 h-5 rounded accent-fuchsia-500"
                              />
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                          <Send size={20} className="text-cyan-400" />
                          Other Notifications
                        </h3>
                        <div className="space-y-4">
                          <label className="flex items-center justify-between cursor-pointer">
                            <span className="text-white/70">Telegram new release alerts</span>
                            <input
                              type="checkbox"
                              checked={preferences.telegram_new_releases}
                              onChange={async (e) => {
                                const newVal = e.target.checked
                                setPreferences({ ...preferences, telegram_new_releases: newVal })
                                await fetch('/api/user/preferences', {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ telegram_new_releases: newVal })
                                })
                                toast.success('Preferences updated')
                              }}
                              className="w-5 h-5 rounded accent-cyan-500"
                            />
                          </label>
                          <label className="flex items-center justify-between cursor-pointer">
                            <span className="text-white/70">Push notifications</span>
                            <input
                              type="checkbox"
                              checked={preferences.push_notifications}
                              onChange={async (e) => {
                                const newVal = e.target.checked
                                setPreferences({ ...preferences, push_notifications: newVal })
                                await fetch('/api/user/preferences', {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ push_notifications: newVal })
                                })
                                toast.success('Preferences updated')
                              }}
                              className="w-5 h-5 rounded accent-cyan-500"
                            />
                          </label>
                        </div>
                      </div>

                      <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                        <h3 className="text-white font-semibold mb-4">Data & Performance</h3>
                        <label className="flex items-center justify-between cursor-pointer">
                          <div>
                            <span className="text-white/70">Low data mode</span>
                            <p className="text-white/40 text-sm">Reduce data usage on slower connections</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={preferences.low_data_mode}
                            onChange={async (e) => {
                              const newVal = e.target.checked
                              setPreferences({ ...preferences, low_data_mode: newVal })
                              await fetch('/api/user/preferences', {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ low_data_mode: newVal })
                              })
                              toast.success('Preferences updated')
                            }}
                            className="w-5 h-5 rounded accent-fuchsia-500"
                          />
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    )
  }
