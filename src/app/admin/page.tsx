"use client"

import { useAuth } from '@/context/AuthContext'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, useCallback, Suspense, useRef } from 'react'
import { db, storage } from '@/lib/firebase'
import { collection, getDocs, query, orderBy, limit, doc, updateDoc, deleteDoc, addDoc, setDoc, getDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { 
  LayoutDashboard, Users, Package, Music, Crown, CreditCard, Calendar,
  DollarSign, Heart, Send, FileText, Settings, Search, Bell, RefreshCw,
  LogOut, Home, Plus, Edit, Trash2, Eye, Download,
  ExternalLink, X, AlertCircle, TrendingUp, ShoppingBag,
  Upload, Play, Shield, Activity, BarChart3, Save, Key, Hash
} from 'lucide-react'

interface DashboardStats {
  totalRevenue: number
  totalUsers: number
  totalProducts: number
  totalMixtapes: number
  activeSubscribers: number
  totalBookings: number
  totalTips: number
  pendingOrders: number
}

interface UserData {
  id: string
  name: string
  email: string
  role: string
  subscription_status: string
  subscription_tier: string | null
  account_status: string
  telegram_user_id: string | null
  telegram_username: string | null
  created_at: string
  last_login?: string
}

interface Product {
  id: string
  title: string
  description: string
  price: number
  type: 'digital' | 'physical'
  version?: string
  stock?: number
  sku?: string
  deliveryStatus?: string
  status: 'active' | 'inactive'
  downloads: number
  created_at: string
}

interface Mixtape {
  id: string
  title: string
  description: string
  coverImage: string
  mixLink: string
  genre: string
  price: number
  isFree: boolean
  plays: number
  status: 'active' | 'inactive'
  created_at: string
}

interface MusicPoolTrack {
  id: string
  title: string
  artist: string
  genre: string
  bpm: number
  trackLink: string
  coverImage: string
  tier: 'basic' | 'pro' | 'unlimited'
  downloads: number
  created_at: string
}

interface Subscription {
  id: string
  user_id: string
  user_email: string
  tier: string
  status: string
  start_date: string
  end_date: string
  telegram_channels: string[]
  created_at: string
}

interface Booking {
  id: string
  customer_name: string
  email: string
  phone: string
  event_type: string
  event_date: string
  event_time: string
  location: string
  status: string
  amount: number
  notes: string
  assigned_dj?: string
  created_at: string
}

interface Transaction {
  id: string
  user_id: string
  user_email: string
  amount: number
  type: string
  status: string
  reference: string
  payment_method: string
  created_at: string
}

interface Tip {
  id: string
  donor_name: string
  donor_email: string
  amount: number
  message: string
  source: string
  created_at: string
}

interface Order {
  id: string
  user_id: string
  user_email: string
  items: { product_id: string; title: string; quantity: number; price: number }[]
  total: number
  status: string
  shipping_address?: string
  tracking_number?: string
  created_at: string
}

interface TelegramChannel {
  id: string
  name: string
  chatId: string
  tier: 'basic' | 'pro' | 'unlimited'
}

interface SiteSettings {
  maintenanceMode: boolean
  paystackPublicKey: string
  paystackSecretKey: string
  mpesaConsumerKey: string
  mpesaConsumerSecret: string
  telegramBotToken: string
  telegramChannels: TelegramChannel[]
  autoSyncEnabled: boolean
}

type TabType = 'dashboard' | 'users' | 'products' | 'mixtapes' | 'music-pool' | 'subscriptions' | 'bookings' | 'payments' | 'tips' | 'telegram' | 'reports' | 'settings'

function AdminContent() {
  const { user, loading, isAdmin, signOut } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab') as TabType | null
  
  const [activeTab, setActiveTab] = useState<TabType>(tabParam || 'dashboard')
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalUsers: 0,
    totalProducts: 0,
    totalMixtapes: 0,
    activeSubscribers: 0,
    totalBookings: 0,
    totalTips: 0,
    pendingOrders: 0
  })
  const [users, setUsers] = useState<UserData[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [mixtapes, setMixtapes] = useState<Mixtape[]>([])
  const [musicPool, setMusicPool] = useState<MusicPoolTrack[]>([])
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [tips, setTips] = useState<Tip[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [dateFilter, setDateFilter] = useState<'today' | '7days' | '30days' | 'all'>('30days')

  const [showProductModal, setShowProductModal] = useState(false)
  const [showMixtapeModal, setShowMixtapeModal] = useState(false)
  const [showTrackModal, setShowTrackModal] = useState(false)
  const [editingItem, setEditingItem] = useState<Product | Mixtape | MusicPoolTrack | null>(null)

  const [siteSettings, setSiteSettings] = useState<SiteSettings>({
    maintenanceMode: false,
    paystackPublicKey: '',
    paystackSecretKey: '',
    mpesaConsumerKey: '',
    mpesaConsumerSecret: '',
    telegramBotToken: '',
    telegramChannels: [],
    autoSyncEnabled: true
  })

  const [showTelegramTokenModal, setShowTelegramTokenModal] = useState(false)
  const [showChannelModal, setShowChannelModal] = useState(false)
  const [showPaymentConfigModal, setShowPaymentConfigModal] = useState<'paystack' | 'mpesa' | null>(null)
  const [showEmailTemplateModal, setShowEmailTemplateModal] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    } else if (!loading && user && !isAdmin) {
      router.push('/dashboard')
    }
  }, [user, loading, isAdmin, router])

  const fetchAllData = useCallback(async () => {
    setIsRefreshing(true)
    try {
      const [
        usersSnap, productsSnap, mixtapesSnap, musicPoolSnap,
        subscriptionsSnap, bookingsSnap, transactionsSnap, tipsSnap, ordersSnap, settingsSnap
      ] = await Promise.all([
        getDocs(query(collection(db, 'users'), orderBy('created_at', 'desc'))),
        getDocs(query(collection(db, 'products'), orderBy('created_at', 'desc'))),
        getDocs(query(collection(db, 'mixtapes'), orderBy('created_at', 'desc'))),
        getDocs(query(collection(db, 'music_pool'), orderBy('created_at', 'desc'))),
        getDocs(query(collection(db, 'subscriptions'), orderBy('created_at', 'desc'))),
        getDocs(query(collection(db, 'bookings'), orderBy('created_at', 'desc'))),
        getDocs(query(collection(db, 'transactions'), orderBy('created_at', 'desc'), limit(200))),
        getDocs(query(collection(db, 'tips'), orderBy('created_at', 'desc'))),
        getDocs(query(collection(db, 'orders'), orderBy('created_at', 'desc'))),
        getDoc(doc(db, 'settings', 'site'))
      ])

      const usersData = usersSnap.docs.map(d => ({ id: d.id, ...d.data() } as UserData))
      const productsData = productsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Product))
      const mixtapesData = mixtapesSnap.docs.map(d => ({ id: d.id, ...d.data() } as Mixtape))
      const musicPoolData = musicPoolSnap.docs.map(d => ({ id: d.id, ...d.data() } as MusicPoolTrack))
      const subscriptionsData = subscriptionsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Subscription))
      const bookingsData = bookingsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Booking))
      const transactionsData = transactionsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction))
      const tipsData = tipsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Tip))
      const ordersData = ordersSnap.docs.map(d => ({ id: d.id, ...d.data() } as Order))

      if (settingsSnap.exists()) {
        setSiteSettings({ ...siteSettings, ...settingsSnap.data() as SiteSettings })
      }

      setUsers(usersData)
      setProducts(productsData)
      setMixtapes(mixtapesData)
      setMusicPool(musicPoolData)
      setSubscriptions(subscriptionsData)
      setBookings(bookingsData)
      setTransactions(transactionsData)
      setTips(tipsData)
      setOrders(ordersData)

      const activeSubscribers = subscriptionsData.filter(s => s.status === 'active').length
      const totalRevenue = transactionsData.filter(t => t.status === 'completed').reduce((sum, t) => sum + (t.amount || 0), 0)
      const totalTipsAmount = tipsData.reduce((sum, t) => sum + (t.amount || 0), 0)
      const pendingOrders = ordersData.filter(o => o.status === 'pending' || o.status === 'processing').length

      setStats({
        totalRevenue,
        totalUsers: usersData.length,
        totalProducts: productsData.length,
        totalMixtapes: mixtapesData.length,
        activeSubscribers,
        totalBookings: bookingsData.length,
        totalTips: totalTipsAmount,
        pendingOrders
      })
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    if (isAdmin) {
      fetchAllData()
    }
  }, [isAdmin, fetchAllData])

  const saveSiteSettings = async (newSettings: Partial<SiteSettings>) => {
    try {
      const updated = { ...siteSettings, ...newSettings }
      await setDoc(doc(db, 'settings', 'site'), updated, { merge: true })
      setSiteSettings(updated)
    } catch (error) {
      console.error('Error saving settings:', error)
    }
  }

  const tabs = [
    { id: 'dashboard' as TabType, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users' as TabType, label: 'Users', icon: Users },
    { id: 'products' as TabType, label: 'Products', icon: Package },
    { id: 'mixtapes' as TabType, label: 'Mixtapes', icon: Music },
    { id: 'music-pool' as TabType, label: 'Music Pool', icon: Crown },
    { id: 'subscriptions' as TabType, label: 'Subscriptions', icon: CreditCard },
    { id: 'bookings' as TabType, label: 'Bookings', icon: Calendar },
    { id: 'payments' as TabType, label: 'Payments & Revenue', icon: DollarSign },
    { id: 'tips' as TabType, label: 'Tips & Donations', icon: Heart },
    { id: 'telegram' as TabType, label: 'Telegram', icon: Send },
    { id: 'reports' as TabType, label: 'Reports', icon: FileText },
    { id: 'settings' as TabType, label: 'Settings', icon: Settings },
  ]

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(amount)
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      completed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      confirmed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      processing: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
      failed: 'bg-red-500/20 text-red-400 border-red-500/30',
      expired: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      suspended: 'bg-red-500/20 text-red-400 border-red-500/30',
      inactive: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      shipped: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      delivered: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    }
    return styles[status?.toLowerCase()] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  }

  const handleUpdateUserStatus = async (userId: string, status: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), { account_status: status })
      setUsers(users.map(u => u.id === userId ? { ...u, account_status: status } : u))
    } catch (error) {
      console.error('Error updating user:', error)
    }
  }

  const handleUpdateUserRole = async (userId: string, role: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), { role })
      setUsers(users.map(u => u.id === userId ? { ...u, role } : u))
    } catch (error) {
      console.error('Error updating role:', error)
    }
  }

  const handleUpdateBookingStatus = async (bookingId: string, status: string) => {
    try {
      await updateDoc(doc(db, 'bookings', bookingId), { status })
      setBookings(bookings.map(b => b.id === bookingId ? { ...b, status } : b))
    } catch (error) {
      console.error('Error updating booking:', error)
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    try {
      await deleteDoc(doc(db, 'products', productId))
      setProducts(products.filter(p => p.id !== productId))
    } catch (error) {
      console.error('Error deleting product:', error)
    }
  }

  const handleDeleteMixtape = async (mixtapeId: string) => {
    try {
      await deleteDoc(doc(db, 'mixtapes', mixtapeId))
      setMixtapes(mixtapes.filter(m => m.id !== mixtapeId))
    } catch (error) {
      console.error('Error deleting mixtape:', error)
    }
  }

  const handleDeleteTrack = async (trackId: string) => {
    try {
      await deleteDoc(doc(db, 'music_pool', trackId))
      setMusicPool(musicPool.filter(t => t.id !== trackId))
    } catch (error) {
      console.error('Error deleting track:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-500"></div>
      </div>
    )
  }

  if (!isAdmin) return null

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10"
      >
        {sidebarOpen ? <X size={20} /> : <LayoutDashboard size={20} />}
      </button>

      <aside className={`fixed inset-y-0 left-0 z-40 w-72 bg-[#12121a] border-r border-white/5 transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
              <Shield size={20} />
            </div>
            <div>
              <h1 className="font-bold text-lg">Admin Panel</h1>
              <p className="text-xs text-white/50">Command Center</p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-200px)]">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSidebarOpen(false) }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                activeTab === tab.id 
                  ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30' 
                  : 'text-white/60 hover:bg-white/5 hover:text-white border border-transparent'
              }`}
            >
              <tab.icon size={18} />
              <span className="font-medium text-sm">{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/5 bg-[#12121a]">
          <button
            onClick={() => router.push('/')}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-white/60 hover:bg-white/5 hover:text-white transition-all mb-2 text-sm"
          >
            <Home size={18} />
            <span>Back to Site</span>
          </button>
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 transition-all text-sm"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <main className="lg:ml-72 min-h-screen">
        <header className="sticky top-0 z-30 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 ml-12 lg:ml-0">
              <h2 className="text-xl font-bold capitalize">{activeTab.replace('-', ' ')}</h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                <input
                  type="text"
                  placeholder="Search anything..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/50 w-64"
                />
              </div>
              <button
                onClick={fetchAllData}
                disabled={isRefreshing}
                className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white transition-all disabled:opacity-50"
              >
                <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
              </button>
              <button className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white transition-all relative">
                <Bell size={18} />
                {stats.pendingOrders > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center">{stats.pendingOrders}</span>
                )}
              </button>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-sm font-bold">
                {user?.name?.charAt(0) || 'A'}
              </div>
            </div>
          </div>
        </header>

        <div className="p-6">
          {activeTab === 'dashboard' && (
            <DashboardTab 
              stats={stats} 
              bookings={bookings} 
              transactions={transactions}
              formatCurrency={formatCurrency}
              formatDate={formatDate}
              getStatusBadge={getStatusBadge}
              dateFilter={dateFilter}
              setDateFilter={setDateFilter}
            />
          )}

          {activeTab === 'users' && (
            <UsersTab 
              users={users}
              searchQuery={searchQuery}
              formatDate={formatDate}
              getStatusBadge={getStatusBadge}
              onUpdateStatus={handleUpdateUserStatus}
              onUpdateRole={handleUpdateUserRole}
            />
          )}

          {activeTab === 'products' && (
            <ProductsTab 
              products={products}
              searchQuery={searchQuery}
              formatCurrency={formatCurrency}
              formatDate={formatDate}
              getStatusBadge={getStatusBadge}
              onDelete={handleDeleteProduct}
              onAdd={() => { setEditingItem(null); setShowProductModal(true) }}
              onEdit={(p) => { setEditingItem(p); setShowProductModal(true) }}
            />
          )}

          {activeTab === 'mixtapes' && (
            <MixtapesTab 
              mixtapes={mixtapes}
              searchQuery={searchQuery}
              formatCurrency={formatCurrency}
              formatDate={formatDate}
              getStatusBadge={getStatusBadge}
              onDelete={handleDeleteMixtape}
              onAdd={() => { setEditingItem(null); setShowMixtapeModal(true) }}
              onEdit={(m) => { setEditingItem(m); setShowMixtapeModal(true) }}
            />
          )}

          {activeTab === 'music-pool' && (
            <MusicPoolTab 
              tracks={musicPool}
              subscriptions={subscriptions}
              searchQuery={searchQuery}
              onDelete={handleDeleteTrack}
              onAdd={() => { setEditingItem(null); setShowTrackModal(true) }}
              onEdit={(t) => { setEditingItem(t); setShowTrackModal(true) }}
            />
          )}

          {activeTab === 'subscriptions' && (
            <SubscriptionsTab 
              subscriptions={subscriptions}
              searchQuery={searchQuery}
              formatDate={formatDate}
              getStatusBadge={getStatusBadge}
            />
          )}

          {activeTab === 'bookings' && (
            <BookingsTab 
              bookings={bookings}
              searchQuery={searchQuery}
              formatCurrency={formatCurrency}
              formatDate={formatDate}
              getStatusBadge={getStatusBadge}
              onUpdateStatus={handleUpdateBookingStatus}
            />
          )}

          {activeTab === 'payments' && (
            <PaymentsTab 
              transactions={transactions}
              stats={stats}
              searchQuery={searchQuery}
              formatCurrency={formatCurrency}
              formatDate={formatDate}
              getStatusBadge={getStatusBadge}
            />
          )}

          {activeTab === 'tips' && (
            <TipsTab 
              tips={tips}
              formatCurrency={formatCurrency}
              formatDate={formatDate}
            />
          )}

          {activeTab === 'telegram' && (
            <TelegramTab 
              subscriptions={subscriptions}
              users={users}
              settings={siteSettings}
              onConfigureToken={() => setShowTelegramTokenModal(true)}
              onManageChannels={() => setShowChannelModal(true)}
              onToggleAutoSync={() => saveSiteSettings({ autoSyncEnabled: !siteSettings.autoSyncEnabled })}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsTab 
              users={users}
              transactions={transactions}
              bookings={bookings}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsTab 
              settings={siteSettings}
              onToggleMaintenance={() => saveSiteSettings({ maintenanceMode: !siteSettings.maintenanceMode })}
              onConfigurePaystack={() => setShowPaymentConfigModal('paystack')}
              onConfigureMpesa={() => setShowPaymentConfigModal('mpesa')}
              onEditEmailTemplate={(template) => setShowEmailTemplateModal(template)}
            />
          )}
        </div>
      </main>

      {showProductModal && (
        <ProductModal 
          product={editingItem as Product | null}
          onClose={() => { setShowProductModal(false); setEditingItem(null) }}
          onSave={async (data) => {
            try {
              if (editingItem) {
                await updateDoc(doc(db, 'products', editingItem.id), data)
                setProducts(products.map(p => p.id === editingItem.id ? { ...p, ...data } : p))
              } else {
                const docRef = await addDoc(collection(db, 'products'), { ...data, created_at: new Date().toISOString(), downloads: 0 })
                setProducts([{ id: docRef.id, ...data, downloads: 0, created_at: new Date().toISOString() } as Product, ...products])
              }
              setShowProductModal(false)
              setEditingItem(null)
            } catch (error) {
              console.error('Error saving product:', error)
            }
          }}
        />
      )}

      {showMixtapeModal && (
        <MixtapeModal 
          mixtape={editingItem as Mixtape | null}
          onClose={() => { setShowMixtapeModal(false); setEditingItem(null) }}
          onSave={async (data, imageFile) => {
            try {
              let coverImage = data.coverImage
              if (imageFile) {
                const storageRef = ref(storage, `covers/mixtapes/${Date.now()}_${imageFile.name}`)
                await uploadBytes(storageRef, imageFile)
                coverImage = await getDownloadURL(storageRef)
              }
              const saveData = { ...data, coverImage }
              if (editingItem) {
                await updateDoc(doc(db, 'mixtapes', editingItem.id), saveData)
                setMixtapes(mixtapes.map(m => m.id === editingItem.id ? { ...m, ...saveData } : m))
              } else {
                const docRef = await addDoc(collection(db, 'mixtapes'), { ...saveData, created_at: new Date().toISOString(), plays: 0 })
                setMixtapes([{ id: docRef.id, ...saveData, plays: 0, created_at: new Date().toISOString() } as Mixtape, ...mixtapes])
              }
              setShowMixtapeModal(false)
              setEditingItem(null)
            } catch (error: any) {
              console.error('Mixtape save error:', error)
              throw new Error(error?.message || 'Failed to save mixtape. Check Firebase permissions.')
            }
          }}
        />
      )}

      {showTrackModal && (
        <TrackModal 
          track={editingItem as MusicPoolTrack | null}
          onClose={() => { setShowTrackModal(false); setEditingItem(null) }}
          onSave={async (data, imageFile) => {
            try {
              let coverImage = data.coverImage
              if (imageFile) {
                const storageRef = ref(storage, `covers/music_pool/${Date.now()}_${imageFile.name}`)
                await uploadBytes(storageRef, imageFile)
                coverImage = await getDownloadURL(storageRef)
              }
              const saveData = { ...data, coverImage }
              if (editingItem) {
                await updateDoc(doc(db, 'music_pool', editingItem.id), saveData)
                setMusicPool(musicPool.map(t => t.id === editingItem.id ? { ...t, ...saveData } : t))
              } else {
                const docRef = await addDoc(collection(db, 'music_pool'), { ...saveData, created_at: new Date().toISOString(), downloads: 0 })
                setMusicPool([{ id: docRef.id, ...saveData, downloads: 0, created_at: new Date().toISOString() } as MusicPoolTrack, ...musicPool])
              }
              setShowTrackModal(false)
              setEditingItem(null)
            } catch (error: any) {
              console.error('Track save error:', error)
              throw new Error(error?.message || 'Failed to save track. Check Firebase permissions.')
            }
          }}
        />
      )}

      {showTelegramTokenModal && (
        <TelegramTokenModal 
          currentToken={siteSettings.telegramBotToken}
          onClose={() => setShowTelegramTokenModal(false)}
          onSave={async (token) => { 
            await saveSiteSettings({ telegramBotToken: token })
            setShowTelegramTokenModal(false) 
          }}
        />
      )}

      {showChannelModal && (
        <ChannelManagementModal 
          channels={siteSettings.telegramChannels}
          onClose={() => setShowChannelModal(false)}
          onSave={async (channels) => { 
            await saveSiteSettings({ telegramChannels: channels })
            setShowChannelModal(false) 
          }}
        />
      )}

      {showPaymentConfigModal && (
        <PaymentConfigModal 
          type={showPaymentConfigModal}
          settings={siteSettings}
          onClose={() => setShowPaymentConfigModal(null)}
          onSave={async (data) => { 
            await saveSiteSettings(data)
            setShowPaymentConfigModal(null) 
          }}
        />
      )}

      {showEmailTemplateModal && (
        <EmailTemplateModal 
          template={showEmailTemplateModal}
          onClose={() => setShowEmailTemplateModal(null)}
        />
      )}
    </div>
  )
}

function StatCard({ icon: Icon, label, value, trend, color }: { icon: any; label: string; value: string | number; trend?: string; color: string }) {
  const colorStyles: Record<string, string> = {
    violet: 'from-violet-500/20 to-violet-500/5 border-violet-500/20',
    emerald: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/20',
    amber: 'from-amber-500/20 to-amber-500/5 border-amber-500/20',
    blue: 'from-blue-500/20 to-blue-500/5 border-blue-500/20',
    fuchsia: 'from-fuchsia-500/20 to-fuchsia-500/5 border-fuchsia-500/20',
    rose: 'from-rose-500/20 to-rose-500/5 border-rose-500/20',
  }
  const iconColors: Record<string, string> = {
    violet: 'text-violet-400',
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
    blue: 'text-blue-400',
    fuchsia: 'text-fuchsia-400',
    rose: 'text-rose-400',
  }

  return (
    <div className={`bg-gradient-to-br ${colorStyles[color]} rounded-2xl border p-5`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2.5 rounded-xl bg-white/10 ${iconColors[color]}`}>
          <Icon size={20} />
        </div>
        {trend && (
          <span className="text-xs text-emerald-400 flex items-center gap-1">
            <TrendingUp size={12} /> {trend}
          </span>
        )}
      </div>
      <p className="text-white/50 text-sm mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  )
}

function DashboardTab({ stats, bookings, transactions, formatCurrency, formatDate, getStatusBadge, dateFilter, setDateFilter }: any) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Overview</h3>
        <select 
          value={dateFilter} 
          onChange={(e) => setDateFilter(e.target.value)}
          className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-violet-500/50"
        >
          <option value="today">Today</option>
          <option value="7days">Last 7 Days</option>
          <option value="30days">Last 30 Days</option>
          <option value="all">All Time</option>
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={DollarSign} label="Total Revenue" value={formatCurrency(stats.totalRevenue)} trend="+12%" color="emerald" />
        <StatCard icon={Users} label="Total Users" value={stats.totalUsers} trend="+8%" color="violet" />
        <StatCard icon={Package} label="Products" value={stats.totalProducts} color="blue" />
        <StatCard icon={Music} label="Mixtapes" value={stats.totalMixtapes} color="fuchsia" />
        <StatCard icon={Crown} label="Active Subscribers" value={stats.activeSubscribers} color="amber" />
        <StatCard icon={Calendar} label="Total Bookings" value={stats.totalBookings} color="violet" />
        <StatCard icon={Heart} label="Total Tips" value={formatCurrency(stats.totalTips)} color="rose" />
        <StatCard icon={ShoppingBag} label="Pending Orders" value={stats.pendingOrders} color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Bookings</h3>
          <div className="space-y-3">
            {bookings.slice(0, 5).map((booking: Booking) => (
              <div key={booking.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                <div>
                  <p className="font-medium">{booking.customer_name}</p>
                  <p className="text-sm text-white/50">{booking.event_type} • {formatDate(booking.event_date)}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${getStatusBadge(booking.status)}`}>
                  {booking.status}
                </span>
              </div>
            ))}
            {bookings.length === 0 && <p className="text-white/50 text-center py-4">No bookings yet</p>}
          </div>
        </div>

        <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
          <div className="space-y-3">
            {transactions.slice(0, 5).map((tx: Transaction) => (
              <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                <div>
                  <p className="font-medium">{tx.user_email}</p>
                  <p className="text-sm text-white/50">{tx.type}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatCurrency(tx.amount)}</p>
                  <span className={`px-2 py-0.5 rounded text-xs ${getStatusBadge(tx.status)}`}>{tx.status}</span>
                </div>
              </div>
            ))}
            {transactions.length === 0 && <p className="text-white/50 text-center py-4">No transactions yet</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

function UsersTab({ users, searchQuery, formatDate, getStatusBadge, onUpdateStatus, onUpdateRole }: any) {
  const filteredUsers = users.filter((u: UserData) => 
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <span className="text-white/50">{filteredUsers.length} users</span>
      </div>

      <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left p-4 text-white/50 font-medium text-sm">User</th>
                <th className="text-left p-4 text-white/50 font-medium text-sm">Role</th>
                <th className="text-left p-4 text-white/50 font-medium text-sm">Subscription</th>
                <th className="text-left p-4 text-white/50 font-medium text-sm">Status</th>
                <th className="text-left p-4 text-white/50 font-medium text-sm">Joined</th>
                <th className="text-left p-4 text-white/50 font-medium text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u: UserData) => (
                <tr key={u.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="p-4">
                    <p className="font-medium">{u.name || 'No name'}</p>
                    <p className="text-sm text-white/50">{u.email}</p>
                  </td>
                  <td className="p-4">
                    <select
                      value={u.role}
                      onChange={(e) => onUpdateRole(u.id, e.target.value)}
                      className="px-2 py-1 rounded-lg bg-white/10 border border-white/10 text-sm focus:outline-none"
                    >
                      <option value="user">User</option>
                      <option value="subscriber">Subscriber</option>
                      <option value="staff">Staff</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${getStatusBadge(u.subscription_status)}`}>
                      {u.subscription_status} {u.subscription_tier && `(${u.subscription_tier})`}
                    </span>
                  </td>
                  <td className="p-4">
                    <select
                      value={u.account_status}
                      onChange={(e) => onUpdateStatus(u.id, e.target.value)}
                      className={`px-2 py-1 rounded-lg text-sm focus:outline-none ${
                        u.account_status === 'active' ? 'bg-emerald-500/20 text-emerald-400' :
                        u.account_status === 'suspended' ? 'bg-red-500/20 text-red-400' :
                        'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                      <option value="unverified">Unverified</option>
                    </select>
                  </td>
                  <td className="p-4 text-white/70 text-sm">{formatDate(u.created_at)}</td>
                  <td className="p-4">
                    <button className="p-2 rounded-lg hover:bg-white/10 text-white/50 hover:text-white">
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function ProductsTab({ products, searchQuery, formatCurrency, formatDate, getStatusBadge, onDelete, onAdd, onEdit }: any) {
  const filteredProducts = products.filter((p: Product) => 
    p.title?.toLowerCase().includes(searchQuery.toLowerCase())
  )
  const digitalProducts = filteredProducts.filter((p: Product) => p.type === 'digital')
  const physicalProducts = filteredProducts.filter((p: Product) => p.type === 'physical')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-white/50">{filteredProducts.length} products</span>
          <span className="text-xs px-2 py-1 rounded bg-blue-500/20 text-blue-400">{digitalProducts.length} digital</span>
          <span className="text-xs px-2 py-1 rounded bg-amber-500/20 text-amber-400">{physicalProducts.length} physical</span>
        </div>
        <button 
          onClick={onAdd}
          className="px-4 py-2 rounded-xl bg-violet-500 hover:bg-violet-600 font-medium text-sm flex items-center gap-2"
        >
          <Plus size={16} /> Add Product
        </button>
      </div>

      <div className="bg-white/5 rounded-2xl border border-white/10 p-4 mb-4">
        <h4 className="font-medium text-sm text-white/70 mb-2">Store Rules</h4>
        <ul className="text-xs text-white/50 space-y-1">
          <li>• Digital products: Support versioning, instant download access</li>
          <li>• Physical products: Stock tracking, SKU, delivery/shipping management</li>
          <li>• No image uploads for products</li>
        </ul>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map((product: Product) => (
          <div key={product.id} className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
            <div className="aspect-video bg-white/5 relative flex items-center justify-center">
              <Package size={40} className="text-white/20" />
              <span className={`absolute top-2 right-2 px-2 py-1 rounded-lg text-xs font-medium ${
                product.type === 'digital' ? 'bg-blue-500/80' : 'bg-amber-500/80'
              }`}>
                {product.type}
              </span>
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold">{product.title}</h3>
                  {product.version && <p className="text-xs text-white/50">v{product.version}</p>}
                </div>
                <span className={`px-2 py-0.5 rounded text-xs ${getStatusBadge(product.status)}`}>{product.status}</span>
              </div>
              <p className="text-violet-400 font-semibold mb-2">{formatCurrency(product.price)}</p>
              <div className="flex items-center justify-between text-xs text-white/50">
                {product.type === 'digital' ? (
                  <span>{product.downloads || 0} downloads</span>
                ) : (
                  <span>Stock: {product.stock || 0}</span>
                )}
                <span>{formatDate(product.created_at)}</span>
              </div>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/10">
                <button onClick={() => onEdit(product)} className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm">
                  Edit
                </button>
                <button onClick={() => onDelete(product.id)} className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function MixtapesTab({ mixtapes, searchQuery, formatCurrency, formatDate, onDelete, onAdd, onEdit }: any) {
  const filteredMixtapes = mixtapes.filter((m: Mixtape) => 
    m.title?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <span className="text-white/50">{filteredMixtapes.length} mixtapes</span>
        <button 
          onClick={onAdd}
          className="px-4 py-2 rounded-xl bg-fuchsia-500 hover:bg-fuchsia-600 font-medium text-sm flex items-center gap-2"
        >
          <Plus size={16} /> Add Mixtape
        </button>
      </div>

      <div className="bg-fuchsia-500/10 rounded-2xl border border-fuchsia-500/20 p-4 mb-4">
        <h4 className="font-medium text-sm text-fuchsia-400 mb-2 flex items-center gap-2">
          <Music size={16} /> Mixtape Store Rules
        </h4>
        <ul className="text-xs text-white/60 space-y-1">
          <li>• <strong>External links only</strong> - No audio files stored (YouTube, Audiomack, Mixcloud, Google Drive)</li>
          <li>• Cover images uploaded to Firebase Storage</li>
          <li>• Free or paid - redirect to link after payment</li>
          <li>• No versioning, no stock, no delivery</li>
        </ul>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMixtapes.map((mixtape: Mixtape) => (
          <div key={mixtape.id} className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
            <div className="aspect-square bg-white/5 relative">
              {mixtape.coverImage ? (
                <img src={mixtape.coverImage} alt={mixtape.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-fuchsia-500/20 to-violet-500/20">
                  <Music size={48} className="text-white/30" />
                </div>
              )}
              {mixtape.isFree && (
                <span className="absolute top-2 left-2 px-2 py-1 rounded-lg text-xs font-medium bg-emerald-500/80">FREE</span>
              )}
            </div>
            <div className="p-4">
              <h3 className="font-semibold mb-1">{mixtape.title}</h3>
              <p className="text-sm text-white/50 mb-2">{mixtape.genre}</p>
              <div className="flex items-center justify-between mb-3">
                <span className="text-fuchsia-400 font-semibold">
                  {mixtape.isFree ? 'Free' : formatCurrency(mixtape.price)}
                </span>
                <span className="text-xs text-white/50 flex items-center gap-1">
                  <Play size={12} /> {mixtape.plays || 0} plays
                </span>
              </div>
              {mixtape.mixLink && (
                <a 
                  href={mixtape.mixLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-violet-400 hover:text-violet-300 mb-3"
                >
                  <ExternalLink size={12} /> View Mix Link
                </a>
              )}
              <div className="flex items-center gap-2 pt-3 border-t border-white/10">
                <button onClick={() => onEdit(mixtape)} className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm">
                  Edit
                </button>
                <button onClick={() => onDelete(mixtape.id)} className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function MusicPoolTab({ tracks, subscriptions, searchQuery, onDelete, onAdd, onEdit }: any) {
  const filteredTracks = tracks.filter((t: MusicPoolTrack) => 
    t.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.artist?.toLowerCase().includes(searchQuery.toLowerCase())
  )
  const activeSubscribers = subscriptions.filter((s: Subscription) => s.status === 'active').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-white/50">{filteredTracks.length} tracks</span>
          <span className="text-xs px-2 py-1 rounded bg-amber-500/20 text-amber-400">{activeSubscribers} active subscribers</span>
        </div>
        <button 
          onClick={onAdd}
          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-medium text-sm flex items-center gap-2"
        >
          <Plus size={16} /> Add Track
        </button>
      </div>

      <div className="bg-amber-500/10 rounded-2xl border border-amber-500/20 p-4 mb-4">
        <h4 className="font-medium text-sm text-amber-400 mb-2 flex items-center gap-2">
          <Crown size={16} /> Music Pool Rules (Subscription-Only)
        </h4>
        <ul className="text-xs text-white/60 space-y-1">
          <li>• <strong>External links only</strong> - No audio files stored</li>
          <li>• Cover/artwork images uploaded to Firebase Storage</li>
          <li>• Subscription-gated access (basic, pro, unlimited tiers)</li>
          <li>• Telegram channels handle actual file distribution</li>
          <li>• No single-item purchases</li>
        </ul>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white/5 rounded-xl border border-white/10 p-4">
          <p className="text-white/50 text-sm">Total Tracks</p>
          <p className="text-2xl font-bold">{tracks.length}</p>
        </div>
        <div className="bg-white/5 rounded-xl border border-white/10 p-4">
          <p className="text-white/50 text-sm">Total Downloads</p>
          <p className="text-2xl font-bold">{tracks.reduce((sum: number, t: MusicPoolTrack) => sum + (t.downloads || 0), 0)}</p>
        </div>
        <div className="bg-white/5 rounded-xl border border-white/10 p-4">
          <p className="text-white/50 text-sm">Active Subscribers</p>
          <p className="text-2xl font-bold">{activeSubscribers}</p>
        </div>
      </div>

      <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left p-4 text-white/50 font-medium text-sm">Track</th>
              <th className="text-left p-4 text-white/50 font-medium text-sm">Artist</th>
              <th className="text-left p-4 text-white/50 font-medium text-sm">Genre</th>
              <th className="text-left p-4 text-white/50 font-medium text-sm">BPM</th>
              <th className="text-left p-4 text-white/50 font-medium text-sm">Tier</th>
              <th className="text-left p-4 text-white/50 font-medium text-sm">Downloads</th>
              <th className="text-left p-4 text-white/50 font-medium text-sm">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTracks.map((track: MusicPoolTrack) => (
              <tr key={track.id} className="border-b border-white/5 hover:bg-white/5">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white/10 overflow-hidden">
                      {track.coverImage ? (
                        <img src={track.coverImage} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Music size={16} className="text-white/30" />
                        </div>
                      )}
                    </div>
                    <span className="font-medium">{track.title}</span>
                  </div>
                </td>
                <td className="p-4 text-white/70">{track.artist}</td>
                <td className="p-4 text-white/70">{track.genre}</td>
                <td className="p-4 text-white/70">{track.bpm}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                    track.tier === 'unlimited' ? 'bg-amber-500/20 text-amber-400' :
                    track.tier === 'pro' ? 'bg-violet-500/20 text-violet-400' :
                    'bg-white/10 text-white/70'
                  }`}>
                    {track.tier}
                  </span>
                </td>
                <td className="p-4 text-white/70">{track.downloads || 0}</td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    {track.trackLink && (
                      <a href={track.trackLink} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg hover:bg-white/10 text-white/50 hover:text-white">
                        <ExternalLink size={16} />
                      </a>
                    )}
                    <button onClick={() => onEdit(track)} className="p-2 rounded-lg hover:bg-white/10 text-white/50 hover:text-white">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => onDelete(track.id)} className="p-2 rounded-lg hover:bg-red-500/10 text-red-400">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function SubscriptionsTab({ subscriptions, searchQuery, formatDate, getStatusBadge }: any) {
  const filteredSubs = subscriptions.filter((s: Subscription) => 
    s.user_email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const planStats = {
    basic: subscriptions.filter((s: Subscription) => s.tier === 'basic' && s.status === 'active').length,
    pro: subscriptions.filter((s: Subscription) => s.tier === 'pro' && s.status === 'active').length,
    unlimited: subscriptions.filter((s: Subscription) => s.tier === 'unlimited' && s.status === 'active').length,
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white/5 rounded-xl border border-white/10 p-4">
          <p className="text-white/50 text-sm">Total Subscriptions</p>
          <p className="text-2xl font-bold">{subscriptions.length}</p>
        </div>
        <div className="bg-white/5 rounded-xl border border-white/10 p-4">
          <p className="text-white/50 text-sm">Basic</p>
          <p className="text-2xl font-bold text-white/70">{planStats.basic}</p>
        </div>
        <div className="bg-violet-500/10 rounded-xl border border-violet-500/20 p-4">
          <p className="text-violet-400 text-sm">Pro</p>
          <p className="text-2xl font-bold text-violet-400">{planStats.pro}</p>
        </div>
        <div className="bg-amber-500/10 rounded-xl border border-amber-500/20 p-4">
          <p className="text-amber-400 text-sm">Unlimited</p>
          <p className="text-2xl font-bold text-amber-400">{planStats.unlimited}</p>
        </div>
      </div>

      <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left p-4 text-white/50 font-medium text-sm">User</th>
              <th className="text-left p-4 text-white/50 font-medium text-sm">Plan</th>
              <th className="text-left p-4 text-white/50 font-medium text-sm">Status</th>
              <th className="text-left p-4 text-white/50 font-medium text-sm">Start Date</th>
              <th className="text-left p-4 text-white/50 font-medium text-sm">End Date</th>
              <th className="text-left p-4 text-white/50 font-medium text-sm">Telegram</th>
            </tr>
          </thead>
          <tbody>
            {filteredSubs.map((sub: Subscription) => (
              <tr key={sub.id} className="border-b border-white/5 hover:bg-white/5">
                <td className="p-4">{sub.user_email}</td>
                <td className="p-4">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                    sub.tier === 'unlimited' ? 'bg-amber-500/20 text-amber-400' :
                    sub.tier === 'pro' ? 'bg-violet-500/20 text-violet-400' :
                    'bg-white/10 text-white/70'
                  }`}>
                    {sub.tier}
                  </span>
                </td>
                <td className="p-4">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${getStatusBadge(sub.status)}`}>
                    {sub.status}
                  </span>
                </td>
                <td className="p-4 text-white/70 text-sm">{formatDate(sub.start_date)}</td>
                <td className="p-4 text-white/70 text-sm">{formatDate(sub.end_date)}</td>
                <td className="p-4">
                  {sub.telegram_channels?.length > 0 ? (
                    <span className="text-emerald-400 text-xs">{sub.telegram_channels.length} channels</span>
                  ) : (
                    <span className="text-white/30 text-xs">No channels</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function BookingsTab({ bookings, searchQuery, formatCurrency, formatDate, getStatusBadge, onUpdateStatus }: any) {
  const filteredBookings = bookings.filter((b: Booking) => 
    b.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <span className="text-white/50">{filteredBookings.length} bookings</span>
      </div>

      <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left p-4 text-white/50 font-medium text-sm">Client</th>
                <th className="text-left p-4 text-white/50 font-medium text-sm">Event</th>
                <th className="text-left p-4 text-white/50 font-medium text-sm">Date</th>
                <th className="text-left p-4 text-white/50 font-medium text-sm">Location</th>
                <th className="text-left p-4 text-white/50 font-medium text-sm">Amount</th>
                <th className="text-left p-4 text-white/50 font-medium text-sm">Status</th>
                <th className="text-left p-4 text-white/50 font-medium text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((booking: Booking) => (
                <tr key={booking.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="p-4">
                    <p className="font-medium">{booking.customer_name}</p>
                    <p className="text-sm text-white/50">{booking.email}</p>
                  </td>
                  <td className="p-4">{booking.event_type}</td>
                  <td className="p-4 text-white/70">{formatDate(booking.event_date)}</td>
                  <td className="p-4 text-white/70 text-sm">{booking.location}</td>
                  <td className="p-4 font-medium">{formatCurrency(booking.amount || 0)}</td>
                  <td className="p-4">
                    <select
                      value={booking.status}
                      onChange={(e) => onUpdateStatus(booking.id, e.target.value)}
                      className={`px-2 py-1 rounded-lg text-xs font-medium focus:outline-none ${getStatusBadge(booking.status)}`}
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td className="p-4">
                    <button className="p-2 rounded-lg hover:bg-white/10 text-white/50 hover:text-white">
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function PaymentsTab({ transactions, stats, searchQuery, formatCurrency, formatDate, getStatusBadge }: any) {
  const filteredTx = transactions.filter((t: Transaction) => 
    t.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.reference?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-emerald-500/10 rounded-xl border border-emerald-500/20 p-5">
          <p className="text-emerald-400 text-sm mb-1">Total Revenue</p>
          <p className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
        </div>
        <div className="bg-white/5 rounded-xl border border-white/10 p-5">
          <p className="text-white/50 text-sm mb-1">Total Transactions</p>
          <p className="text-2xl font-bold">{transactions.length}</p>
        </div>
        <div className="bg-amber-500/10 rounded-xl border border-amber-500/20 p-5">
          <p className="text-amber-400 text-sm mb-1">Pending Orders</p>
          <p className="text-2xl font-bold">{stats.pendingOrders}</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Transaction History</h3>
        <button className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm flex items-center gap-2 hover:bg-white/10">
          <Download size={16} /> Export CSV
        </button>
      </div>

      <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left p-4 text-white/50 font-medium text-sm">Reference</th>
                <th className="text-left p-4 text-white/50 font-medium text-sm">User</th>
                <th className="text-left p-4 text-white/50 font-medium text-sm">Type</th>
                <th className="text-left p-4 text-white/50 font-medium text-sm">Method</th>
                <th className="text-left p-4 text-white/50 font-medium text-sm">Amount</th>
                <th className="text-left p-4 text-white/50 font-medium text-sm">Status</th>
                <th className="text-left p-4 text-white/50 font-medium text-sm">Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredTx.map((tx: Transaction) => (
                <tr key={tx.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="p-4 font-mono text-sm">{tx.reference?.slice(0, 12)}...</td>
                  <td className="p-4 text-white/70">{tx.user_email}</td>
                  <td className="p-4 capitalize">{tx.type}</td>
                  <td className="p-4 text-white/70">{tx.payment_method || 'N/A'}</td>
                  <td className="p-4 font-medium">{formatCurrency(tx.amount)}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${getStatusBadge(tx.status)}`}>
                      {tx.status}
                    </span>
                  </td>
                  <td className="p-4 text-white/70 text-sm">{formatDate(tx.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function TipsTab({ tips, formatCurrency, formatDate }: any) {
  const totalTips = tips.reduce((sum: number, t: Tip) => sum + (t.amount || 0), 0)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-rose-500/10 rounded-xl border border-rose-500/20 p-5">
          <p className="text-rose-400 text-sm mb-1">Total Tips</p>
          <p className="text-2xl font-bold">{formatCurrency(totalTips)}</p>
        </div>
        <div className="bg-white/5 rounded-xl border border-white/10 p-5">
          <p className="text-white/50 text-sm mb-1">Total Donations</p>
          <p className="text-2xl font-bold">{tips.length}</p>
        </div>
        <div className="bg-white/5 rounded-xl border border-white/10 p-5">
          <p className="text-white/50 text-sm mb-1">Average Tip</p>
          <p className="text-2xl font-bold">{tips.length > 0 ? formatCurrency(totalTips / tips.length) : formatCurrency(0)}</p>
        </div>
      </div>

      <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left p-4 text-white/50 font-medium text-sm">Donor</th>
              <th className="text-left p-4 text-white/50 font-medium text-sm">Amount</th>
              <th className="text-left p-4 text-white/50 font-medium text-sm">Message</th>
              <th className="text-left p-4 text-white/50 font-medium text-sm">Source</th>
              <th className="text-left p-4 text-white/50 font-medium text-sm">Date</th>
            </tr>
          </thead>
          <tbody>
            {tips.map((tip: Tip) => (
              <tr key={tip.id} className="border-b border-white/5 hover:bg-white/5">
                <td className="p-4">
                  <p className="font-medium">{tip.donor_name || 'Anonymous'}</p>
                  <p className="text-sm text-white/50">{tip.donor_email}</p>
                </td>
                <td className="p-4 font-medium text-rose-400">{formatCurrency(tip.amount)}</td>
                <td className="p-4 text-white/70 text-sm max-w-xs truncate">{tip.message || '-'}</td>
                <td className="p-4 capitalize text-white/70">{tip.source || 'website'}</td>
                <td className="p-4 text-white/70 text-sm">{formatDate(tip.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function TelegramTab({ subscriptions, users, settings, onConfigureToken, onManageChannels, onToggleAutoSync }: any) {
  const activeSubscribers = subscriptions.filter((s: Subscription) => s.status === 'active')
  const connectedUsers = users.filter((u: UserData) => u.telegram_user_id).length

  return (
    <div className="space-y-6">
      <div className="bg-blue-500/10 rounded-2xl border border-blue-500/20 p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Send className="text-blue-400" size={20} /> Telegram Integration
        </h3>
        <p className="text-white/60 text-sm mb-6">Manage Telegram bot credentials and channel access for subscribers.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white/5 rounded-xl p-4">
            <p className="text-white/50 text-sm">Connected Users</p>
            <p className="text-2xl font-bold">{connectedUsers}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-4">
            <p className="text-white/50 text-sm">Active Subscribers</p>
            <p className="text-2xl font-bold">{activeSubscribers.length}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-4">
            <p className="text-white/50 text-sm">Bot Status</p>
            <p className={`font-medium flex items-center gap-2 ${settings.telegramBotToken ? 'text-emerald-400' : 'text-amber-400'}`}>
              <span className={`w-2 h-2 rounded-full ${settings.telegramBotToken ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span> 
              {settings.telegramBotToken ? 'Online' : 'Not Configured'}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
            <div>
              <p className="font-medium">Bot Token</p>
              <p className="text-sm text-white/50">
                {settings.telegramBotToken ? `${settings.telegramBotToken.slice(0, 10)}...${settings.telegramBotToken.slice(-5)}` : 'Not configured'}
              </p>
            </div>
            <button onClick={onConfigureToken} className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-sm font-medium">
              {settings.telegramBotToken ? 'Update' : 'Configure'}
            </button>
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
            <div>
              <p className="font-medium">Channel Management</p>
              <p className="text-sm text-white/50">{settings.telegramChannels?.length || 0} channels configured</p>
            </div>
            <button onClick={onManageChannels} className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm">Manage</button>
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
            <div>
              <p className="font-medium">Auto-Sync</p>
              <p className="text-sm text-white/50">Automatically sync subscription status with Telegram channels</p>
            </div>
            <button 
              onClick={onToggleAutoSync}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${settings.autoSyncEnabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-white/50'}`}
            >
              {settings.autoSyncEnabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ReportsTab({ users, transactions, bookings }: any) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Reports & Analytics</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
          <h4 className="font-medium mb-4 flex items-center gap-2">
            <Activity size={18} /> Activity Logs
          </h4>
          <p className="text-white/50 text-sm mb-4">View admin and user activity logs</p>
          <button className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm">View Logs</button>
        </div>

        <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
          <h4 className="font-medium mb-4 flex items-center gap-2">
            <BarChart3 size={18} /> Revenue Reports
          </h4>
          <p className="text-white/50 text-sm mb-4">Download detailed revenue reports</p>
          <button className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm flex items-center gap-2">
            <Download size={16} /> Export Report
          </button>
        </div>

        <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
          <h4 className="font-medium mb-4 flex items-center gap-2">
            <Users size={18} /> User Reports
          </h4>
          <p className="text-white/50 text-sm mb-4">User growth and engagement metrics</p>
          <button className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm flex items-center gap-2">
            <Download size={16} /> Export Report
          </button>
        </div>

        <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
          <h4 className="font-medium mb-4 flex items-center gap-2">
            <AlertCircle size={18} /> Error Logs
          </h4>
          <p className="text-white/50 text-sm mb-4">Auth failures and system errors</p>
          <button className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm">View Errors</button>
        </div>
      </div>
    </div>
  )
}

function SettingsTab({ settings, onToggleMaintenance, onConfigurePaystack, onConfigureMpesa, onEditEmailTemplate }: any) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">System Settings</h3>

      <div className="space-y-4">
        <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
          <h4 className="font-medium mb-4">Site Configuration</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Maintenance Mode</p>
                <p className="text-sm text-white/50">Temporarily disable site access</p>
              </div>
              <button 
                onClick={onToggleMaintenance}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${settings.maintenanceMode ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white/70'}`}
              >
                {settings.maintenanceMode ? 'Enabled' : 'Disabled'}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
          <h4 className="font-medium mb-4">Payment Gateway</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
              <div>
                <p className="font-medium">Paystack</p>
                <p className="text-sm text-white/50">Card and mobile money payments</p>
              </div>
              <button 
                onClick={onConfigurePaystack}
                className={`px-3 py-1 rounded-lg text-sm ${settings.paystackSecretKey ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}
              >
                {settings.paystackSecretKey ? 'Connected' : 'Configure'}
              </button>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
              <div>
                <p className="font-medium">M-Pesa</p>
                <p className="text-sm text-white/50">Mobile money integration</p>
              </div>
              <button 
                onClick={onConfigureMpesa}
                className={`px-3 py-1 rounded-lg text-sm ${settings.mpesaConsumerKey ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}
              >
                {settings.mpesaConsumerKey ? 'Connected' : 'Configure'}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
          <h4 className="font-medium mb-4">Email Templates</h4>
          <div className="space-y-2">
            <button onClick={() => onEditEmailTemplate('welcome')} className="w-full text-left p-3 rounded-xl bg-white/5 hover:bg-white/10 text-sm flex items-center justify-between">
              Welcome Email <Edit size={14} className="text-white/50" />
            </button>
            <button onClick={() => onEditEmailTemplate('order')} className="w-full text-left p-3 rounded-xl bg-white/5 hover:bg-white/10 text-sm flex items-center justify-between">
              Order Confirmation <Edit size={14} className="text-white/50" />
            </button>
            <button onClick={() => onEditEmailTemplate('subscription')} className="w-full text-left p-3 rounded-xl bg-white/5 hover:bg-white/10 text-sm flex items-center justify-between">
              Subscription Renewal <Edit size={14} className="text-white/50" />
            </button>
            <button onClick={() => onEditEmailTemplate('password')} className="w-full text-left p-3 rounded-xl bg-white/5 hover:bg-white/10 text-sm flex items-center justify-between">
              Password Reset <Edit size={14} className="text-white/50" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ProductModal({ product, onClose, onSave }: { product: Product | null; onClose: () => void; onSave: (data: any) => void }) {
  const [formData, setFormData] = useState({
    title: product?.title || '',
    description: product?.description || '',
    price: product?.price || 0,
    type: product?.type || 'digital' as 'digital' | 'physical',
    version: product?.version || '',
    stock: product?.stock || 0,
    sku: product?.sku || '',
    status: product?.status || 'active' as 'active' | 'inactive',
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#12121a] rounded-2xl border border-white/10 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{product ? 'Edit Product' : 'Add Product'}</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm text-white/70 mb-2">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:border-violet-500/50"
            />
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-2">Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as 'digital' | 'physical' })}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:border-violet-500/50"
            >
              <option value="digital">Digital</option>
              <option value="physical">Physical</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-2">Price (KES)</label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:border-violet-500/50"
            />
          </div>
          {formData.type === 'digital' && (
            <div>
              <label className="block text-sm text-white/70 mb-2">Version</label>
              <input
                type="text"
                value={formData.version}
                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                placeholder="e.g., 1.0.0"
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:border-violet-500/50"
              />
            </div>
          )}
          {formData.type === 'physical' && (
            <>
              <div>
                <label className="block text-sm text-white/70 mb-2">Stock</label>
                <input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:border-violet-500/50"
                />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-2">SKU</label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:border-violet-500/50"
                />
              </div>
            </>
          )}
          <div>
            <label className="block text-sm text-white/70 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:border-violet-500/50 resize-none"
            />
          </div>
        </div>
        <div className="p-6 border-t border-white/10 flex items-center gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10">Cancel</button>
          <button onClick={() => onSave(formData)} className="flex-1 py-2.5 rounded-xl bg-violet-500 hover:bg-violet-600 font-medium">Save</button>
        </div>
      </div>
    </div>
  )
}

function MixtapeModal({ mixtape, onClose, onSave }: { mixtape: Mixtape | null; onClose: () => void; onSave: (data: any, imageFile: File | null) => Promise<void> }) {
  const [formData, setFormData] = useState({
    title: mixtape?.title || '',
    description: mixtape?.description || '',
    coverImage: mixtape?.coverImage || '',
    mixLink: mixtape?.mixLink || '',
    genre: mixtape?.genre || '',
    price: mixtape?.price || 0,
    isFree: mixtape?.isFree ?? true,
    status: mixtape?.status || 'active' as 'active' | 'inactive',
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>(mixtape?.coverImage || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleSave = async () => {
    if (!formData.title) {
      setError('Title is required')
      return
    }
    setSaving(true)
    setError('')
    try {
      await onSave(formData, imageFile)
    } catch (err: any) {
      setError(err.message || 'Failed to save')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#12121a] rounded-2xl border border-white/10 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">{mixtape ? 'Edit Mixtape' : 'Add Mixtape'}</h3>
            <p className="text-sm text-fuchsia-400 mt-1">Links only - cover image upload</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm text-white/70 mb-2">Cover Image</label>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-full aspect-square max-w-[200px] mx-auto rounded-xl bg-white/5 border-2 border-dashed border-white/20 hover:border-fuchsia-500/50 cursor-pointer flex items-center justify-center overflow-hidden"
            >
              {imagePreview ? (
                <img src={imagePreview} alt="Cover" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center p-4">
                  <Upload size={32} className="mx-auto text-white/30 mb-2" />
                  <p className="text-sm text-white/50">Click to upload</p>
                </div>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-2">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:border-fuchsia-500/50"
            />
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-2">Mix Link (YouTube, Audiomack, Mixcloud, etc.)</label>
            <input
              type="url"
              value={formData.mixLink}
              onChange={(e) => setFormData({ ...formData, mixLink: e.target.value })}
              placeholder="https://..."
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:border-fuchsia-500/50"
            />
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-2">Genre</label>
            <input
              type="text"
              value={formData.genre}
              onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
              placeholder="Afrobeats, House, etc."
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:border-fuchsia-500/50"
            />
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isFree}
                onChange={(e) => setFormData({ ...formData, isFree: e.target.checked })}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm">Free mixtape</span>
            </label>
          </div>
          {!formData.isFree && (
            <div>
              <label className="block text-sm text-white/70 mb-2">Price (KES)</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:border-fuchsia-500/50"
              />
            </div>
          )}
          <div>
            <label className="block text-sm text-white/70 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:border-fuchsia-500/50 resize-none"
            />
          </div>
          {error && (
            <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}
        </div>
        <div className="p-6 border-t border-white/10 flex items-center gap-3">
          <button onClick={onClose} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-50">Cancel</button>
          <button 
            onClick={handleSave} 
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-fuchsia-500 hover:bg-fuchsia-600 font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <RefreshCw size={16} className="animate-spin" /> : null} {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

function TrackModal({ track, onClose, onSave }: { track: MusicPoolTrack | null; onClose: () => void; onSave: (data: any, imageFile: File | null) => Promise<void> }) {
  const [formData, setFormData] = useState({
    title: track?.title || '',
    artist: track?.artist || '',
    genre: track?.genre || '',
    bpm: track?.bpm || 120,
    trackLink: track?.trackLink || '',
    coverImage: track?.coverImage || '',
    tier: track?.tier || 'basic' as 'basic' | 'pro' | 'unlimited',
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>(track?.coverImage || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleSave = async () => {
    if (!formData.title) {
      setError('Title is required')
      return
    }
    setSaving(true)
    setError('')
    try {
      await onSave(formData, imageFile)
    } catch (err: any) {
      setError(err.message || 'Failed to save')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#12121a] rounded-2xl border border-white/10 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">{track ? 'Edit Track' : 'Add Track'}</h3>
            <p className="text-sm text-amber-400 mt-1">Subscription-only - cover image upload</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm text-white/70 mb-2">Cover Image</label>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-24 h-24 rounded-xl bg-white/5 border-2 border-dashed border-white/20 hover:border-amber-500/50 cursor-pointer flex items-center justify-center overflow-hidden"
            >
              {imagePreview ? (
                <img src={imagePreview} alt="Cover" className="w-full h-full object-cover" />
              ) : (
                <Upload size={24} className="text-white/30" />
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-2">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:border-amber-500/50"
            />
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-2">Artist</label>
            <input
              type="text"
              value={formData.artist}
              onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:border-amber-500/50"
            />
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-2">Track Link (External URL)</label>
            <input
              type="url"
              value={formData.trackLink}
              onChange={(e) => setFormData({ ...formData, trackLink: e.target.value })}
              placeholder="https://..."
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:border-amber-500/50"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/70 mb-2">Genre</label>
              <input
                type="text"
                value={formData.genre}
                onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:border-amber-500/50"
              />
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-2">BPM</label>
              <input
                type="number"
                value={formData.bpm}
                onChange={(e) => setFormData({ ...formData, bpm: Number(e.target.value) })}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:border-amber-500/50"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-2">Required Tier</label>
            <select
              value={formData.tier}
              onChange={(e) => setFormData({ ...formData, tier: e.target.value as 'basic' | 'pro' | 'unlimited' })}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:border-amber-500/50"
            >
              <option value="basic">Basic</option>
              <option value="pro">Pro</option>
              <option value="unlimited">Unlimited</option>
            </select>
          </div>
          {error && (
            <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}
        </div>
        <div className="p-6 border-t border-white/10 flex items-center gap-3">
          <button onClick={onClose} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-50">Cancel</button>
          <button 
            onClick={handleSave} 
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <RefreshCw size={16} className="animate-spin" /> : null} {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

function TelegramTokenModal({ currentToken, onClose, onSave }: { currentToken: string; onClose: () => void; onSave: (token: string) => Promise<void> }) {
  const [token, setToken] = useState(currentToken)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(token)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#12121a] rounded-2xl border border-white/10 w-full max-w-md">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2"><Key size={18} /> Bot Token</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10"><X size={18} /></button>
        </div>
        <div className="p-6">
          <label className="block text-sm text-white/70 mb-2">Telegram Bot API Token</label>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
            className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:border-blue-500/50 font-mono text-sm"
          />
          <p className="text-xs text-white/40 mt-2">Get this from @BotFather on Telegram</p>
        </div>
        <div className="p-6 border-t border-white/10 flex items-center gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10">Cancel</button>
          <button 
            onClick={handleSave} 
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 font-medium flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />} {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ChannelManagementModal({ channels, onClose, onSave }: { channels: TelegramChannel[]; onClose: () => void; onSave: (channels: TelegramChannel[]) => Promise<void> }) {
  const [localChannels, setLocalChannels] = useState<TelegramChannel[]>(channels || [])
  const [newChannel, setNewChannel] = useState({ name: '', chatId: '', tier: 'basic' as 'basic' | 'pro' | 'unlimited' })
  const [saving, setSaving] = useState(false)

  const addChannel = () => {
    if (newChannel.name && newChannel.chatId) {
      setLocalChannels([...localChannels, { ...newChannel, id: Date.now().toString() }])
      setNewChannel({ name: '', chatId: '', tier: 'basic' })
    }
  }

  const removeChannel = (id: string) => {
    setLocalChannels(localChannels.filter(c => c.id !== id))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(localChannels)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#12121a] rounded-2xl border border-white/10 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Manage Telegram Channels</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="space-y-3">
            {localChannels.map(channel => (
              <div key={channel.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                <div>
                  <p className="font-medium">{channel.name}</p>
                  <p className="text-xs text-white/50">{channel.chatId}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    channel.tier === 'unlimited' ? 'bg-amber-500/20 text-amber-400' :
                    channel.tier === 'pro' ? 'bg-violet-500/20 text-violet-400' :
                    'bg-white/10 text-white/70'
                  }`}>{channel.tier}</span>
                  <button onClick={() => removeChannel(channel.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-white/10 pt-4">
            <p className="text-sm text-white/70 mb-3">Add New Channel</p>
            <div className="space-y-3">
              <input
                type="text"
                value={newChannel.name}
                onChange={(e) => setNewChannel({ ...newChannel, name: e.target.value })}
                placeholder="Channel name"
                className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:border-blue-500/50 text-sm"
              />
              <input
                type="text"
                value={newChannel.chatId}
                onChange={(e) => setNewChannel({ ...newChannel, chatId: e.target.value })}
                placeholder="Chat ID (e.g., -1001234567890)"
                className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:border-blue-500/50 text-sm font-mono"
              />
              <select
                value={newChannel.tier}
                onChange={(e) => setNewChannel({ ...newChannel, tier: e.target.value as 'basic' | 'pro' | 'unlimited' })}
                className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:border-blue-500/50 text-sm"
              >
                <option value="basic">Basic Tier</option>
                <option value="pro">Pro Tier</option>
                <option value="unlimited">Unlimited Tier</option>
              </select>
              <button onClick={addChannel} className="w-full py-2 rounded-xl bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 text-sm flex items-center justify-center gap-2">
                <Plus size={16} /> Add Channel
              </button>
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-white/10 flex items-center gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10">Cancel</button>
            <button 
              onClick={handleSave} 
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? <RefreshCw size={16} className="animate-spin" /> : null} {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
      </div>
    </div>
  )
}

function PaymentConfigModal({ type, settings, onClose, onSave }: { type: 'paystack' | 'mpesa'; settings: SiteSettings; onClose: () => void; onSave: (data: any) => Promise<void> }) {
  const [formData, setFormData] = useState(
    type === 'paystack' 
      ? { paystackPublicKey: settings.paystackPublicKey, paystackSecretKey: settings.paystackSecretKey }
      : { mpesaConsumerKey: settings.mpesaConsumerKey, mpesaConsumerSecret: settings.mpesaConsumerSecret }
  )
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(formData)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#12121a] rounded-2xl border border-white/10 w-full max-w-md">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{type === 'paystack' ? 'Paystack' : 'M-Pesa'} Configuration</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4">
          {type === 'paystack' ? (
            <>
              <div>
                <label className="block text-sm text-white/70 mb-2">Public Key</label>
                <input
                  type="text"
                  value={(formData as any).paystackPublicKey}
                  onChange={(e) => setFormData({ ...formData, paystackPublicKey: e.target.value })}
                  placeholder="pk_live_..."
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:border-emerald-500/50 font-mono text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-2">Secret Key</label>
                <input
                  type="password"
                  value={(formData as any).paystackSecretKey}
                  onChange={(e) => setFormData({ ...formData, paystackSecretKey: e.target.value })}
                  placeholder="sk_live_..."
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:border-emerald-500/50 font-mono text-sm"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm text-white/70 mb-2">Consumer Key</label>
                <input
                  type="text"
                  value={(formData as any).mpesaConsumerKey}
                  onChange={(e) => setFormData({ ...formData, mpesaConsumerKey: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:border-emerald-500/50 font-mono text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-2">Consumer Secret</label>
                <input
                  type="password"
                  value={(formData as any).mpesaConsumerSecret}
                  onChange={(e) => setFormData({ ...formData, mpesaConsumerSecret: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:border-emerald-500/50 font-mono text-sm"
                />
              </div>
            </>
          )}
        </div>
          <div className="p-6 border-t border-white/10 flex items-center gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10">Cancel</button>
            <button 
              onClick={handleSave} 
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? <RefreshCw size={16} className="animate-spin" /> : null} {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
      </div>
    </div>
  )
}

function EmailTemplateModal({ template, onClose }: { template: string; onClose: () => void }) {
  const templates: Record<string, { title: string; subject: string; body: string }> = {
    welcome: { title: 'Welcome Email', subject: 'Welcome to our platform!', body: 'Thank you for signing up...' },
    order: { title: 'Order Confirmation', subject: 'Your order has been confirmed', body: 'Thank you for your purchase...' },
    subscription: { title: 'Subscription Renewal', subject: 'Your subscription is about to renew', body: 'Your subscription will renew...' },
    password: { title: 'Password Reset', subject: 'Reset your password', body: 'Click the link below to reset...' },
  }

  const templateData = templates[template] || { title: 'Email Template', subject: '', body: '' }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#12121a] rounded-2xl border border-white/10 w-full max-w-lg">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{templateData.title}</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm text-white/70 mb-2">Subject</label>
            <input
              type="text"
              defaultValue={templateData.subject}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:border-violet-500/50"
            />
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-2">Body</label>
            <textarea
              defaultValue={templateData.body}
              rows={6}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:border-violet-500/50 resize-none"
            />
          </div>
          <p className="text-xs text-white/40">Variables: {'{name}'}, {'{email}'}, {'{link}'}</p>
        </div>
        <div className="p-6 border-t border-white/10 flex items-center gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10">Cancel</button>
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-violet-500 hover:bg-violet-600 font-medium">Save Template</button>
        </div>
      </div>
    </div>
  )
}

export default function AdminPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-500"></div>
      </div>
    }>
      <AdminContent />
    </Suspense>
  )
}
