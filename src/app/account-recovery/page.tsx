'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function AccountRecoveryPage() {
    const [email, setEmail] = useState('')
    const [sent, setSent] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        // Recovery logic would go here
        setSent(true)
    }

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
            <div className="max-w-md w-full">
                <div className="text-center mb-8">
                    <h1 className="font-display text-4xl md:text-5xl mb-4 bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
                        Account Recovery
                    </h1>
                    <p className="text-white/60">
                        Secure your account and regain access
                    </p>
                </div>

                {!sent ? (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="p-8 bg-white/5 border border-purple-500/20 rounded-2xl">
                            <h2 className="text-xl font-bold mb-6">Reset Your Password</h2>

                            <div className="mb-6">
                                <label className="block text-sm font-medium mb-2 text-white/80">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="your@email.com"
                                    required
                                    className="w-full px-4 py-3 bg-black/50 border border-purple-500/30 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500"
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-semibold hover:scale-105 transition-transform"
                            >
                                Send Recovery Email
                            </button>
                        </div>

                        <div className="p-6 bg-purple-900/20 border border-purple-500/30 rounded-xl">
                            <h3 className="font-bold mb-3 flex items-center gap-2">
                                <span>🔒</span>
                                Security Tips
                            </h3>
                            <ul className="text-sm text-white/70 space-y-2">
                                <li>• Use a strong, unique password</li>
                                <li>• Enable two-factor authentication</li>
                                <li>• Never share your password</li>
                                <li>• Check for suspicious activity regularly</li>
                            </ul>
                        </div>

                        <div className="text-center">
                            <Link href="/login" className="text-purple-400 hover:text-purple-300 text-sm">
                                ← Back to Login
                            </Link>
                        </div>
                    </form>
                ) : (
                    <div className="p-8 bg-white/5 border border-purple-500/20 rounded-2xl text-center">
                        <div className="text-6xl mb-4">✅</div>
                        <h2 className="text-2xl font-bold mb-4">Check Your Email</h2>
                        <p className="text-white/70 mb-6">
                            We've sent a password reset link to <strong className="text-white">{email}</strong>
                        </p>
                        <p className="text-sm text-white/60 mb-6">
                            Didn't receive the email? Check your spam folder or{' '}
                            <button
                                onClick={() => setSent(false)}
                                className="text-purple-400 hover:text-purple-300"
                            >
                                try again
                            </button>
                        </p>
                        <Link
                            href="/login"
                            className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold transition-colors"
                        >
                            Back to Login
                        </Link>
                    </div>
                )}

                {/* Additional Help */}
                <div className="mt-8 p-6 bg-black/30 border border-white/10 rounded-xl">
                    <h3 className="font-bold mb-3">Need More Help?</h3>
                    <p className="text-sm text-white/60 mb-4">
                        If you're having trouble accessing your account, our support team is here to help.
                    </p>
                    <Link
                        href="/contact"
                        className="text-purple-400 hover:text-purple-300 text-sm font-semibold"
                    >
                        Contact Support →
                    </Link>
                </div>
            </div>
        </div>
    )
}
