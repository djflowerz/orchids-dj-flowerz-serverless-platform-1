'use client'

import { useState } from 'react'

export default function ReferralPage() {
    const [copied, setCopied] = useState(false)
    const referralCode = "DJFLOWERZ2026" // This would be dynamic per user

    const copyReferralLink = () => {
        navigator.clipboard.writeText(`https://djflowerz.com/signup?ref=${referralCode}`)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const leaderboard = [
        { rank: 1, name: "Alex M.", referrals: 47, reward: "KES 15,000" },
        { rank: 2, name: "Sarah K.", referrals: 38, reward: "KES 12,000" },
        { rank: 3, name: "John D.", referrals: 32, reward: "KES 10,000" },
        { rank: 4, name: "Emma W.", referrals: 28, reward: "KES 8,000" },
        { rank: 5, name: "Mike R.", referrals: 24, reward: "KES 6,000" },
    ]

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Hero Section */}
            <section className="relative py-20 px-4">
                <div className="max-w-6xl mx-auto text-center">
                    <h1 className="font-display text-5xl md:text-7xl mb-6 bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
                        Refer & Earn
                    </h1>
                    <p className="text-xl text-white/70 max-w-2xl mx-auto mb-12">
                        Share the music. Earn rewards. Build the community together.
                    </p>

                    {/* Referral Card */}
                    <div className="max-w-2xl mx-auto bg-gradient-to-br from-purple-900/40 to-pink-900/40 p-8 rounded-2xl border border-purple-500/30">
                        <h2 className="text-2xl font-bold mb-4">Your Referral Link</h2>
                        <div className="flex gap-2 mb-6">
                            <input
                                type="text"
                                value={`https://djflowerz.com/signup?ref=${referralCode}`}
                                readOnly
                                className="flex-1 px-4 py-3 bg-black/50 border border-purple-500/30 rounded-lg text-white/80"
                            />
                            <button
                                onClick={copyReferralLink}
                                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold transition-colors"
                            >
                                {copied ? '✓ Copied!' : 'Copy'}
                            </button>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div className="p-4 bg-black/30 rounded-lg">
                                <div className="text-3xl font-bold text-purple-400">12</div>
                                <div className="text-sm text-white/60">Referrals</div>
                            </div>
                            <div className="p-4 bg-black/30 rounded-lg">
                                <div className="text-3xl font-bold text-purple-400">KES 3,600</div>
                                <div className="text-sm text-white/60">Earned</div>
                            </div>
                            <div className="p-4 bg-black/30 rounded-lg">
                                <div className="text-3xl font-bold text-purple-400">KES 300</div>
                                <div className="text-sm text-white/60">Per Referral</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="py-20 px-4 bg-gradient-to-b from-purple-900/10 to-black">
                <div className="max-w-6xl mx-auto">
                    <h2 className="font-display text-4xl text-center mb-16 text-purple-400">How It Works</h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="text-center p-8">
                            <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                                1
                            </div>
                            <h3 className="text-xl font-bold mb-2">Share Your Link</h3>
                            <p className="text-white/60">
                                Copy your unique referral link and share it with friends, family, or on social media.
                            </p>
                        </div>
                        <div className="text-center p-8">
                            <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                                2
                            </div>
                            <h3 className="text-xl font-bold mb-2">They Subscribe</h3>
                            <p className="text-white/60">
                                When someone signs up using your link and subscribes to any plan, you both win!
                            </p>
                        </div>
                        <div className="text-center p-8">
                            <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                                3
                            </div>
                            <h3 className="text-xl font-bold mb-2">Earn Rewards</h3>
                            <p className="text-white/60">
                                Get KES 300 for each successful referral. Withdraw anytime or use for subscriptions!
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Leaderboard */}
            <section className="py-20 px-4">
                <div className="max-w-4xl mx-auto">
                    <h2 className="font-display text-4xl text-center mb-12 text-purple-400">Top Referrers</h2>
                    <div className="bg-white/5 rounded-2xl border border-purple-500/20 overflow-hidden">
                        <div className="grid grid-cols-4 gap-4 p-4 bg-purple-900/20 font-semibold text-sm">
                            <div>Rank</div>
                            <div>Name</div>
                            <div>Referrals</div>
                            <div>Rewards</div>
                        </div>
                        {leaderboard.map((entry) => (
                            <div
                                key={entry.rank}
                                className="grid grid-cols-4 gap-4 p-4 border-t border-white/5 hover:bg-white/5 transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    {entry.rank <= 3 && (
                                        <span className="text-2xl">
                                            {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'}
                                        </span>
                                    )}
                                    <span className="font-bold">#{entry.rank}</span>
                                </div>
                                <div className="text-white/80">{entry.name}</div>
                                <div className="text-purple-400 font-semibold">{entry.referrals}</div>
                                <div className="text-green-400 font-semibold">{entry.reward}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Bonus Tiers */}
            <section className="py-20 px-4 bg-gradient-to-b from-black to-purple-900/10">
                <div className="max-w-6xl mx-auto">
                    <h2 className="font-display text-4xl text-center mb-12 text-purple-400">Bonus Tiers</h2>
                    <div className="grid md:grid-cols-4 gap-6">
                        <div className="p-6 bg-white/5 rounded-xl border border-purple-500/20 text-center">
                            <div className="text-4xl mb-2">🎵</div>
                            <div className="text-2xl font-bold mb-2">10 Referrals</div>
                            <div className="text-purple-400">+KES 1,000 Bonus</div>
                        </div>
                        <div className="p-6 bg-white/5 rounded-xl border border-purple-500/20 text-center">
                            <div className="text-4xl mb-2">🎧</div>
                            <div className="text-2xl font-bold mb-2">25 Referrals</div>
                            <div className="text-purple-400">+KES 3,000 Bonus</div>
                        </div>
                        <div className="p-6 bg-white/5 rounded-xl border border-purple-500/20 text-center">
                            <div className="text-4xl mb-2">🎤</div>
                            <div className="text-2xl font-bold mb-2">50 Referrals</div>
                            <div className="text-purple-400">+KES 7,500 Bonus</div>
                        </div>
                        <div className="p-6 bg-white/5 rounded-xl border border-purple-500/20 text-center">
                            <div className="text-4xl mb-2">👑</div>
                            <div className="text-2xl font-bold mb-2">100 Referrals</div>
                            <div className="text-purple-400">+KES 20,000 Bonus</div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}
