import Link from 'next/link'
import Image from 'next/image'
import { ReactNode } from 'react'

interface AuthLayoutProps {
    children: ReactNode
    title: string
    subtitle: string
    image?: string
}

export function AuthLayout({ children, title, subtitle, image = '/images/auth-bg.jpg' }: AuthLayoutProps) {
    return (
        <div className="min-h-screen w-full bg-[#f3f4f6] flex items-center justify-center p-4">
            <div className="w-full max-w-[1200px] bg-white rounded-[32px] shadow-xl overflow-hidden min-h-[700px] flex flex-col lg:flex-row">

                {/* Left Side - Form */}
                <div className="w-full lg:w-[55%] p-8 lg:p-12 flex flex-col">
                    {/* Logo */}
                    <div className="mb-12">
                        <Link href="/" className="inline-flex items-center gap-2">
                            <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center">
                                <span className="text-white font-bold text-lg">DJ</span>
                            </div>
                            <span className="font-bold text-xl text-black tracking-tight">DJ FLOWERZ</span>
                        </Link>
                    </div>

                    <div className="max-w-md mx-auto w-full flex-1 flex flex-col justify-center">
                        <div className="mb-8">
                            <h1 className="text-3xl font-bold text-black mb-2 font-display">{title}</h1>
                            <p className="text-gray-500">{subtitle}</p>
                        </div>

                        {children}
                    </div>

                    <div className="mt-8 text-center text-xs text-gray-400">
                        &copy; {new Date().getFullYear()} DJ Flowerz. All rights reserved.
                    </div>
                </div>

                {/* Right Side - Visual */}
                <div className="hidden lg:block w-[45%] bg-black relative p-4">
                    <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-600/20 to-cyan-600/20 z-10" />
                    <div className="h-full w-full rounded-[24px] overflow-hidden relative">
                        <Image
                            src={image}
                            alt="DJ Flowerz Auth"
                            fill
                            className="object-cover"
                            priority
                        />

                        {/* Overlay Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-20" />

                        {/* Content Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 p-8 z-30 text-white">
                            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                                <h3 className="text-xl font-bold mb-2">Exclusive Music Pool</h3>
                                <p className="text-white/80 text-sm">Join thousands of DJs and access high-quality extended edits, instrumentals, and acapellas.</p>

                                <div className="flex gap-2 mt-4">
                                    <div className="w-2 h-2 rounded-full bg-white" />
                                    <div className="w-2 h-2 rounded-full bg-white/40" />
                                    <div className="w-2 h-2 rounded-full bg-white/40" />
                                </div>
                            </div>
                        </div>

                        {/* Floating Badges */}
                        <div className="absolute top-8 right-8 z-30 animate-pulse">
                            <div className="bg-white text-black px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                                Pre-releases
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
