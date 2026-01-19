'use client'

import { useState, useEffect } from 'react'
import { Award, Crown, Download, Music, Star, Users, Zap, Heart, Trophy } from 'lucide-react'

interface Badge {
  id: string
  badge_type: string
  badge_name: string
  badge_icon: string
  earned_at: string
}

const badgeIcons: Record<string, React.ReactNode> = {
  crown: <Crown size={20} className="text-amber-400" />,
  download: <Download size={20} className="text-cyan-400" />,
  music: <Music size={20} className="text-fuchsia-400" />,
  star: <Star size={20} className="text-yellow-400" />,
  users: <Users size={20} className="text-green-400" />,
  zap: <Zap size={20} className="text-purple-400" />,
  heart: <Heart size={20} className="text-pink-400" />,
  trophy: <Trophy size={20} className="text-orange-400" />,
  award: <Award size={20} className="text-blue-400" />
}

const badgeColors: Record<string, string> = {
  first_download: 'from-cyan-500/20 to-blue-500/20 border-cyan-500/30',
  super_downloader: 'from-purple-500/20 to-pink-500/20 border-purple-500/30',
  subscriber: 'from-amber-500/20 to-yellow-500/20 border-amber-500/30',
  pro_subscriber: 'from-fuchsia-500/20 to-rose-500/20 border-fuchsia-500/30',
  early_adopter: 'from-green-500/20 to-emerald-500/20 border-green-500/30',
  referrer: 'from-orange-500/20 to-red-500/20 border-orange-500/30',
  top_tipper: 'from-pink-500/20 to-rose-500/20 border-pink-500/30',
  loyal_member: 'from-blue-500/20 to-indigo-500/20 border-blue-500/30'
}

export function BadgeDisplay({ badges, size = 'md' }: { badges: Badge[]; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  }

  if (!badges || badges.length === 0) {
    return null
  }

  return (
    <div className="flex flex-wrap gap-2">
      {badges.map(badge => (
        <div
          key={badge.id}
          className={`${sizeClasses[size]} rounded-full bg-gradient-to-br ${
            badgeColors[badge.badge_type] || 'from-white/10 to-white/5 border-white/20'
          } border flex items-center justify-center cursor-pointer hover:scale-110 transition-transform`}
          title={`${badge.badge_name} - Earned ${new Date(badge.earned_at).toLocaleDateString()}`}
        >
          {badgeIcons[badge.badge_icon] || <Award size={size === 'sm' ? 14 : size === 'md' ? 18 : 22} />}
        </div>
      ))}
    </div>
  )
}

export function UserBadges({ userId }: { userId?: string }) {
  const [badges, setBadges] = useState<Badge[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBadges()
  }, [userId])

  async function fetchBadges() {
    try {
      const url = userId ? `/api/badges?userId=${userId}` : '/api/badges'
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setBadges(data.badges || [])
      }
    } catch {}
    setLoading(false)
  }

  if (loading) {
    return <div className="flex gap-2">{[1,2,3].map(i => (
      <div key={i} className="w-10 h-10 rounded-full bg-white/10 animate-pulse" />
    ))}</div>
  }

  if (badges.length === 0) {
    return (
      <div className="text-white/40 text-sm">
        No badges earned yet
      </div>
    )
  }

  return <BadgeDisplay badges={badges} />
}

export function BadgeProgress() {
  const [progress, setProgress] = useState<Record<string, { current: number; target: number; name: string }>>({})

  useEffect(() => {
    fetchProgress()
  }, [])

  async function fetchProgress() {
    try {
      const res = await fetch('/api/badges/progress')
      if (res.ok) {
        const data = await res.json()
        setProgress(data.progress || {})
      }
    } catch {}
  }

  const entries = Object.entries(progress)

  if (entries.length === 0) return null

  return (
    <div className="space-y-3">
      <h3 className="text-white font-semibold flex items-center gap-2">
        <Trophy size={18} className="text-amber-400" />
        Badge Progress
      </h3>
      {entries.map(([key, { current, target, name }]) => {
        const pct = Math.min((current / target) * 100, 100)
        return (
          <div key={key} className="p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/70 text-sm">{name}</span>
              <span className="text-white/50 text-xs">{current}/{target}</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-fuchsia-500 to-cyan-500 rounded-full transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
