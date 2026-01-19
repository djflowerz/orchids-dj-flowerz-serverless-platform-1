'use client'

import { useState, useEffect } from 'react'
import { Trophy, Download, Gift, Heart, MessageSquare, Medal, Award, Crown } from 'lucide-react'

interface LeaderboardEntry {
  rank: number
  user_id: string
  downloads_count: number
  referrals_count: number
  tips_total: number
  comments_count: number
  activity_score: number
  users: { id: string; name: string; avatar_url?: string }
}

type Category = 'overall' | 'downloads' | 'referrals' | 'tips' | 'comments'

export function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [category, setCategory] = useState<Category>('overall')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLeaderboard()
  }, [category])

  const fetchLeaderboard = async () => {
    setLoading(true)
    const res = await fetch(`/api/leaderboard?category=${category}&limit=10`)
    if (res.ok) {
      const data = await res.json()
      setLeaderboard(data.leaderboard || [])
    }
    setLoading(false)
  }

  const categories: { id: Category; label: string; icon: typeof Trophy }[] = [
    { id: 'overall', label: 'Overall', icon: Trophy },
    { id: 'downloads', label: 'Downloads', icon: Download },
    { id: 'referrals', label: 'Referrals', icon: Gift },
    { id: 'tips', label: 'Tips', icon: Heart },
    { id: 'comments', label: 'Comments', icon: MessageSquare },
  ]

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown size={20} className="text-amber-400" />
    if (rank === 2) return <Medal size={20} className="text-gray-300" />
    if (rank === 3) return <Award size={20} className="text-amber-600" />
    return <span className="text-white/50 font-bold">#{rank}</span>
  }

  const getStatValue = (entry: LeaderboardEntry) => {
    switch (category) {
      case 'downloads': return `${entry.downloads_count} downloads`
      case 'referrals': return `${entry.referrals_count} referrals`
      case 'tips': return `KES ${entry.tips_total?.toLocaleString() || 0}`
      case 'comments': return `${entry.comments_count} comments`
      default: return `${entry.activity_score} pts`
    }
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3 mb-4">
          <Trophy size={24} className="text-amber-400" />
          <h2 className="text-white text-xl font-bold">Top Contributors</h2>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-all ${
                category === cat.id
                  ? 'bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white'
                  : 'bg-white/5 text-white/70 hover:bg-white/10'
              }`}
            >
              <cat.icon size={16} />
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="divide-y divide-white/5">
        {loading ? (
          <div className="p-8 text-center text-white/50">Loading...</div>
        ) : leaderboard.length === 0 ? (
          <div className="p-8 text-center text-white/50">No data yet</div>
        ) : (
          leaderboard.map((entry, index) => (
            <div
              key={entry.user_id}
              className={`p-4 flex items-center gap-4 transition-colors hover:bg-white/5 ${
                index < 3 ? 'bg-gradient-to-r from-amber-500/5 to-transparent' : ''
              }`}
            >
              <div className="w-10 flex items-center justify-center">
                {getRankIcon(entry.rank)}
              </div>

              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-fuchsia-500/30 to-cyan-500/30 flex items-center justify-center overflow-hidden">
                {entry.users?.avatar_url ? (
                  <img src={entry.users.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white font-bold text-sm">
                    {entry.users?.name?.charAt(0).toUpperCase() || '?'}
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">
                  {entry.users?.name || 'Anonymous'}
                </p>
                <p className="text-white/50 text-sm">{getStatValue(entry)}</p>
              </div>

              {entry.rank <= 3 && (
                <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                  entry.rank === 1 ? 'bg-amber-400/20 text-amber-400' :
                  entry.rank === 2 ? 'bg-gray-400/20 text-gray-300' :
                  'bg-amber-600/20 text-amber-600'
                }`}>
                  {entry.rank === 1 ? 'GOLD' : entry.rank === 2 ? 'SILVER' : 'BRONZE'}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
