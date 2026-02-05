import Image from 'next/image'

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-black text-white">
            {/* Hero Section */}
            <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 to-black z-0" />
                <div className="relative z-10 text-center px-4">
                    <h1 className="font-display text-6xl md:text-8xl mb-6 bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
                        DJ FLOWERZ
                    </h1>
                    <p className="text-xl md:text-2xl text-white/70 max-w-2xl mx-auto">
                        The Journey of Sound, Passion, and Innovation
                    </p>
                </div>
            </section>

            {/* Story Section */}
            <section className="max-w-4xl mx-auto px-4 py-20">
                <div className="space-y-8">
                    <div>
                        <h2 className="font-display text-4xl mb-6 text-purple-400">The Beginning</h2>
                        <p className="text-lg text-white/80 leading-relaxed">
                            Born from a passion for music and an unwavering dedication to the craft, DJ Flowerz emerged
                            as a force in the electronic music scene. What started as late-night sessions in a bedroom
                            studio has evolved into a full-fledged music empire, touching lives across the globe.
                        </p>
                    </div>

                    <div>
                        <h2 className="font-display text-4xl mb-6 text-purple-400">The Evolution</h2>
                        <p className="text-lg text-white/80 leading-relaxed">
                            Over the years, DJ Flowerz has mastered the art of blending genres, creating unique soundscapes
                            that resonate with diverse audiences. From underground clubs to major festivals, the journey
                            has been nothing short of extraordinary.
                        </p>
                    </div>

                    <div>
                        <h2 className="font-display text-4xl mb-6 text-purple-400">The Vision</h2>
                        <p className="text-lg text-white/80 leading-relaxed">
                            Today, DJ Flowerz isn't just about the music—it's about building a community. Through exclusive
                            content, premium production services, and a state-of-the-art recording studio, we're empowering
                            the next generation of artists to find their voice.
                        </p>
                    </div>
                </div>
            </section>

            {/* Achievements Section */}
            <section className="bg-gradient-to-b from-purple-900/10 to-black py-20">
                <div className="max-w-6xl mx-auto px-4">
                    <h2 className="font-display text-5xl text-center mb-16 text-purple-400">Milestones</h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="text-center p-8 bg-white/5 rounded-2xl border border-purple-500/20">
                            <div className="text-5xl font-bold text-purple-400 mb-2">500+</div>
                            <div className="text-white/60">Tracks Produced</div>
                        </div>
                        <div className="text-center p-8 bg-white/5 rounded-2xl border border-purple-500/20">
                            <div className="text-5xl font-bold text-purple-400 mb-2">50K+</div>
                            <div className="text-white/60">Community Members</div>
                        </div>
                        <div className="text-center p-8 bg-white/5 rounded-2xl border border-purple-500/20">
                            <div className="text-5xl font-bold text-purple-400 mb-2">100+</div>
                            <div className="text-white/60">Live Performances</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="max-w-4xl mx-auto px-4 py-20 text-center">
                <h2 className="font-display text-4xl mb-6">Join the Journey</h2>
                <p className="text-lg text-white/70 mb-8">
                    Be part of something bigger. Subscribe to get exclusive access to premium content,
                    unreleased tracks, and behind-the-scenes insights.
                </p>
                <a
                    href="/subscribe"
                    className="inline-block px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full font-semibold hover:scale-105 transition-transform"
                >
                    Get Started
                </a>
            </section>
        </div>
    )
}
