import Link from 'next/link'

export default function NotFound() {
    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
            <div className="max-w-2xl text-center">
                {/* Animated 404 */}
                <div className="mb-8">
                    <h1 className="font-display text-9xl md:text-[12rem] bg-gradient-to-r from-purple-400 via-pink-500 to-purple-600 bg-clip-text text-transparent animate-pulse">
                        404
                    </h1>
                </div>

                {/* Message */}
                <h2 className="font-display text-3xl md:text-5xl mb-6">
                    Track Not Found
                </h2>
                <p className="text-xl text-white/70 mb-12">
                    Looks like this beat dropped off the playlist. Let's get you back on track.
                </p>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        href="/"
                        className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full font-semibold hover:scale-105 transition-transform"
                    >
                        Back to Home
                    </Link>
                    <Link
                        href="/store"
                        className="px-8 py-4 bg-white/10 border border-purple-500/30 rounded-full font-semibold hover:bg-white/20 transition-colors"
                    >
                        Browse Store
                    </Link>
                </div>

                {/* Fun Element */}
                <div className="mt-16 p-6 bg-purple-900/20 border border-purple-500/30 rounded-xl">
                    <p className="text-white/60">
                        🎵 While you're here, check out our latest releases or explore the music pool!
                    </p>
                </div>
            </div>
        </div>
    )
}
