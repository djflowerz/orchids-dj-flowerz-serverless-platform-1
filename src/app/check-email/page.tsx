"use client"

import Link from 'next/link'
import { Mail, ArrowRight } from 'lucide-react'

export default function CheckEmailPage() {
    return (
        <div className="min-h-screen bg-black flex items-center justify-center px-4 py-12">
            <div className="max-w-md w-full bg-zinc-900/50 border border-white/10 rounded-2xl p-8 text-center backdrop-blur-xl">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-fuchsia-500/20 to-cyan-500/20 flex items-center justify-center mx-auto mb-6 border border-white/10">
                    <Mail className="text-white w-10 h-10" />
                </div>

                <h1 className="font-display text-3xl text-white mb-4">Check Your Email</h1>
                <p className="text-white/60 mb-8 leading-relaxed">
                    We've sent a verification link to your email address.<br />
                    Please click the link to verify your account and access the platform.
                </p>

                <div className="space-y-4">
                    <Link
                        href="/login"
                        className="block w-full py-4 rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2"
                    >
                        I've Verified My Email
                        <ArrowRight size={20} />
                    </Link>

                    <p className="text-white/30 text-xs">
                        Didn't receive it? Check your spam folder or <button onClick={() => window.location.reload()} className="text-fuchsia-400 hover:text-fuchsia-300">try signing up again</button>
                    </p>
                </div>
            </div>
        </div>
    )
}
