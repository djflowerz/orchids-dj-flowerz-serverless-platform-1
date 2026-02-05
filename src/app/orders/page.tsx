'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { Package, CheckCircle, Clock, AlertCircle, Truck, Download, Receipt, ChevronRight, Search, Filter, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { db } from '@/lib/firebase'
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore'
import { formatCurrency } from '@/lib/utils'

interface OrderItem {
  id: string
  title: string
  quantity: number
  price: number
  product_type?: string
  download_url?: string
}

interface Order {
  id: string
  user_email: string
  items: OrderItem[]
  total: number
  amount: number
  status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'failed'
  created_at: string
  updated_at?: string
  tracking_number?: string
  shipping_address?: {
    full_name: string
    phone: string
    address: string
    city: string
    country: string
  }
  payment_method?: string
  notes?: string
}

const statusConfig = {
  pending: { color: 'bg-yellow-500/10 text-yellow-400', icon: Clock, label: 'Pending' },
  paid: { color: 'bg-blue-500/10 text-blue-400', icon: CheckCircle, label: 'Payment Confirmed' },
  processing: { color: 'bg-cyan-500/10 text-cyan-400', icon: Package, label: 'Processing' },
  shipped: { color: 'bg-purple-500/10 text-purple-400', icon: Truck, label: 'Shipped' },
  delivered: { color: 'bg-green-500/10 text-green-400', icon: CheckCircle, label: 'Delivered' },
  failed: { color: 'bg-red-500/10 text-red-400', icon: AlertCircle, label: 'Failed' }
}

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | Order['status']>('all')
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      router.replace('/login')
      return
    }

    fetchOrders()
  }, [user, authLoading])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const q = query(
        collection(db, 'orders'),
        where('user_email', '==', user?.email),
        orderBy('created_at', 'desc')
      )
      const snapshot = await getDocs(q)
      const ordersList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[]

      setOrders(ordersList)
    } catch (error) {
      console.error('Error fetching orders:', error)
      toast.error('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(search.toLowerCase()) ||
                         order.items.some(item => item.title.toLowerCase().includes(search.toLowerCase()))
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusIcon = (status: Order['status']) => {
    const Icon = statusConfig[status].icon
    return <Icon size={16} />
  }

  const getStatusColor = (status: Order['status']) => {
    return statusConfig[status].color
  }

  const getStatusLabel = (status: Order['status']) => {
    return statusConfig[status].label
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <Link href="/profile" className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-6">
            <ArrowLeft size={20} />
            Back to Profile
          </Link>

          <div className="flex items-center gap-4 mb-2">
            <Package size={32} className="text-cyan-500" />
            <h1 className="font-display text-5xl sm:text-6xl text-white">Order History</h1>
          </div>
          <p className="text-white/50 text-lg">
            Track your orders and manage purchases
          </p>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Search by order ID or product name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
                statusFilter === 'all'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'bg-white/5 text-white/70 hover:bg-white/10'
              }`}
            >
              All Orders
            </button>
            {(['pending', 'paid', 'processing', 'shipped', 'delivered'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                  statusFilter === status
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'bg-white/5 text-white/70 hover:bg-white/10'
                }`}
              >
                {getStatusIcon(status)}
                {getStatusLabel(status)}
              </button>
            ))}
          </div>
        </div>

        {/* Empty State */}
        {!loading && filteredOrders.length === 0 && (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
            <Package size={64} className="text-white/20 mb-6" />
            <h2 className="text-2xl font-bold text-white mb-2">No orders found</h2>
            <p className="text-white/50 mb-8">
              {orders.length === 0 ? 'You haven\'t placed any orders yet.' : 'No orders match your filters.'}
            </p>
            <Link
              href="/store"
              className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-fuchsia-500 rounded-xl text-white font-semibold hover:opacity-90 transition-all"
            >
              Start Shopping
            </Link>
          </div>
        )}

        {/* Orders List */}
        {!loading && filteredOrders.length > 0 && (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div key={order.id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all">
                {/* Order Header */}
                <button
                  onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                  className="w-full p-6 flex items-center justify-between hover:bg-white/5 transition-colors"
                >
                  <div className="flex-1 text-left">
                    {/* Order Number & Status */}
                    <div className="flex items-center gap-4 mb-3 flex-wrap">
                      <div>
                        <p className="text-xs text-white/50">Order ID</p>
                        <p className="font-mono text-sm text-white font-bold">{order.id.slice(0, 12)}</p>
                      </div>

                      <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        {getStatusLabel(order.status)}
                      </div>

                      <div className="flex-1" />

                      <div className="text-right">
                        <p className="text-xs text-white/50">Order Date</p>
                        <p className="text-sm text-white">
                          {new Date(order.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Items Summary */}
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-white/50">
                        {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                      </span>
                      <span className="text-cyan-400 font-bold text-lg">
                        {formatCurrency(order.total || order.amount)}
                      </span>
                    </div>
                  </div>

                  <ChevronRight
                    size={24}
                    className={`text-white/50 transition-transform ${expandedOrder === order.id ? 'rotate-90' : ''}`}
                  />
                </button>

                {/* Order Details */}
                {expandedOrder === order.id && (
                  <div className="border-t border-white/10 p-6 space-y-6">
                    {/* Items */}
                    <div>
                      <h3 className="text-lg font-bold text-white mb-4">Items</h3>
                      <div className="space-y-3">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex items-start justify-between p-4 bg-white/5 rounded-lg">
                            <div className="flex-1">
                              <p className="font-semibold text-white">{item.title}</p>
                              <p className="text-sm text-white/50">Qty: {item.quantity}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-white">{formatCurrency(item.price)}</p>
                              {item.product_type === 'digital' && item.download_url && (
                                <a
                                  href={item.download_url}
                                  className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 mt-2 justify-end"
                                >
                                  <Download size={12} />
                                  Download
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Shipping Address */}
                    {order.shipping_address && (
                      <div>
                        <h3 className="text-lg font-bold text-white mb-3">Shipping Address</h3>
                        <div className="p-4 bg-white/5 rounded-lg text-sm text-white/70">
                          <p className="font-semibold text-white">{order.shipping_address.full_name}</p>
                          <p>{order.shipping_address.address}</p>
                          <p>{order.shipping_address.city}, {order.shipping_address.country}</p>
                          <p>{order.shipping_address.phone}</p>
                        </div>
                      </div>
                    )}

                    {/* Tracking */}
                    {order.tracking_number && (
                      <div>
                        <h3 className="text-lg font-bold text-white mb-3">Tracking</h3>
                        <div className="p-4 bg-white/5 rounded-lg">
                          <p className="text-sm text-white/50 mb-1">Tracking Number</p>
                          <p className="font-mono text-white font-bold">{order.tracking_number}</p>
                        </div>
                      </div>
                    )}

                    {/* Order Summary */}
                    <div>
                      <h3 className="text-lg font-bold text-white mb-3">Order Summary</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between text-white/70">
                          <span>Subtotal</span>
                          <span>{formatCurrency((order.total || order.amount) * 0.9)}</span>
                        </div>
                        <div className="flex justify-between text-white/70">
                          <span>Tax</span>
                          <span>{formatCurrency((order.total || order.amount) * 0.1)}</span>
                        </div>
                        <div className="border-t border-white/10 pt-2 mt-2 flex justify-between font-bold text-white">
                          <span>Total</span>
                          <span>{formatCurrency(order.total || order.amount)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 flex-wrap">
                      <button className="px-6 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors flex items-center gap-2">
                        <Receipt size={16} />
                        View Invoice
                      </button>
                      {order.status === 'pending' && (
                        <button className="px-6 py-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 font-semibold transition-colors">
                          Complete Payment
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mb-4"></div>
              <p className="text-white/50">Loading your orders...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
