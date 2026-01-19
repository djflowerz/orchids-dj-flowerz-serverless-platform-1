'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, Check, Trash2, X } from 'lucide-react'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  read: boolean
  is_read: boolean
  created_at: string
  metadata?: Record<string, unknown>
}

export function UserNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 60000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications?limit=10')
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch {
      console.error('Failed to fetch notifications')
    }
  }

  const markAsRead = async (id: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id })
      })
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, is_read: true, read: true } : n
      ))
      setUnreadCount(Math.max(0, unreadCount - 1))
    } catch {
      console.error('Failed to mark as read')
    }
  }

  const markAllRead = async () => {
    setLoading(true)
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true })
      })
      setNotifications(notifications.map(n => ({ ...n, is_read: true, read: true })))
      setUnreadCount(0)
    } catch {
      console.error('Failed to mark all as read')
    }
    setLoading(false)
  }

  const deleteNotification = async (id: string) => {
    try {
      await fetch(`/api/notifications?id=${id}`, { method: 'DELETE' })
      const removed = notifications.find(n => n.id === id)
      setNotifications(notifications.filter(n => n.id !== id))
      if (removed && !removed.is_read && !removed.read) {
        setUnreadCount(Math.max(0, unreadCount - 1))
      }
    } catch {
      console.error('Failed to delete notification')
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'new_release': return 'text-fuchsia-400'
      case 'subscription': return 'text-amber-400'
      case 'promotion': return 'text-green-400'
      case 'booking': return 'text-cyan-400'
      default: return 'text-white/70'
    }
  }

  const formatTime = (date: string) => {
    const diff = Date.now() - new Date(date).getTime()
    const mins = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (mins < 60) return `${mins}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-fuchsia-500 text-white text-xs flex items-center justify-center font-semibold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-zinc-900 border border-white/10 rounded-2xl shadow-xl overflow-hidden z-50">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h3 className="text-white font-semibold">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  disabled={loading}
                  className="text-xs text-cyan-400 hover:text-cyan-300 disabled:opacity-50"
                >
                  Mark all read
                </button>
              )}
              <button onClick={() => setIsOpen(false)} className="text-white/50 hover:text-white">
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell size={32} className="text-white/20 mx-auto mb-2" />
                <p className="text-white/50 text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-white/5 hover:bg-white/5 transition-colors ${
                    !notification.is_read && !notification.read ? 'bg-white/5' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      !notification.is_read && !notification.read ? 'bg-fuchsia-500' : 'bg-white/20'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${getTypeColor(notification.type)}`}>
                        {notification.title}
                      </p>
                      <p className="text-white/60 text-sm mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-white/40 text-xs mt-2">
                        {formatTime(notification.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {!notification.is_read && !notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="p-1 rounded text-white/50 hover:text-green-400 transition-colors"
                          title="Mark as read"
                        >
                          <Check size={14} />
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="p-1 rounded text-white/50 hover:text-red-400 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
