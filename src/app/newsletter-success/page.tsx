import Link from 'next/link'

export default function NewsletterSuccessPage() {
    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
            <div className="max-w-2xl text-center">
                {/* Success Icon */}
                <div className="mb-8">
                    <div className="w-24 h-24 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                        <svg
                            className="w-12 h-12 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={3}
                                d="M5 13l4 4L19 7"
                            />
                        </svg>
                    </div>
                    <h1 className="font-display text-4xl md:text-6xl mb-4 bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
                        You're In!
                    </h1>
                </div>

                {/* Message */}
                <p className="text-xl text-white/80 mb-8">
                    Welcome to the DJ Flowerz community! You'll now receive exclusive updates,
                    early access to new releases, and special offers directly to your inbox.
                </p>

                {/* What's Next */}
                <div className="bg-white/5 border border-purple-500/20 rounded-2xl p-8 mb-8">
                    <h2 className="font-display text-2xl mb-6 text-purple-400">What's Next?</h2>
                    <div className="space-y-4 text-left">
                        <div className="flex items-start gap-4">
                            <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                                1
                            </div>
                            <div>
                                <h3 className="font-bold mb-1">Check Your Email</h3>
                                <p className="text-sm text-white/60">
                                    Confirm your subscription to start receiving updates
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                                2
                            </div>
                            <div>
                                <h3 className="font-bold mb-1">Explore Premium Content</h3>
                                <p className="text-sm text-white/60">
                                    Subscribe to unlock exclusive tracks and the music pool
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                                3
                            </div>
                            <div>
                                <h3 className="font-bold mb-1">Join the Community</h3>
                                <p className="text-sm text-white/60">
                                    Connect with other music lovers on our Telegram channels
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                    <Link
                        href="/subscribe"
                        className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full font-semibold hover:scale-105 transition-transform"
                    >
                        View Subscription Plans
                    </Link>
                    <Link
                        href="/store"
                        className="px-8 py-4 bg-white/10 border border-purple-500/30 rounded-full font-semibold hover:bg-white/20 transition-colors"
                    >
                        Browse Store
                    </Link>
                </div>

                {/* Social Proof */}
                <div className="p-6 bg-purple-900/20 border border-purple-500/30 rounded-xl">
                    <p className="text-white/60 text-sm">
                        🎉 Join <strong className="text-white">50,000+</strong> music lovers already in the community
                    </p>
                </div>
            </div>
        </div>
    )
}
