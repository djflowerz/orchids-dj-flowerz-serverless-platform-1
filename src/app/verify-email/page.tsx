"use client"

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { applyActionCode } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { toast } from 'sonner'
import Link from 'next/link'

function VerifyEmailContent() {
    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying')
    const [message, setMessage] = useState('Verifying your email...')
    const router = useRouter()
    const searchParams = useSearchParams()
    const oobCode = searchParams.get('oobCode')
    const mode = searchParams.get('mode') // 'verifyEmail'

    useEffect(() => {
        if (!oobCode) {
            setStatus('error')
            setMessage('Invalid verification link. No code found.')
            return
        }

        const verify = async () => {
            try {
                await applyActionCode(auth, oobCode)
                setStatus('success')
                setMessage('Email verified successfully! Redirecting to login...')
                toast.success('Email verified!')

                // Redirect after 3 seconds
                setTimeout(() => {
                    router.push('/login')
                }, 3000)
            } catch (error: any) {
                console.error('Verification error:', error)
                setStatus('error')
                if (error.code === 'auth/expired-action-code') {
                    setMessage('The verification link has expired. Please sign in to request a new one.')
                } else if (error.code === 'auth/invalid-action-code') {
                    setMessage('The verification link is invalid. It may have already been used.')
                } else {
                    setMessage('Failed to verify email. Please try again.')
                }
            }
        }

        verify()
    }, [oobCode, router])

    return (
        <div className="min-h-screen flex items-center justify-center bg-black text-white p-4">
            <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center space-y-6">
                <h1 className="text-2xl font-bold">Email Verification</h1>

                <div className={`text-lg ${status === 'verifying' ? 'text-zinc-400' :
                        status === 'success' ? 'text-green-400' :
                            'text-red-400'
                    }`}>
                    {message}
                </div>

                {status === 'verifying' && (
                    <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
                    </div>
                )}

                {status === 'success' && (
                    <div className="text-zinc-400 text-sm">
                        <p>You will be redirected automatically.</p>
                        <Link href="/login" className="text-primary-500 hover:text-primary-400 underline mt-2 inline-block">
                            Click here if you are not redirected
                        </Link>
                    </div>
                )}

                {status === 'error' && (
                    <div className="pt-4">
                        <Link href="/login" className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors">
                            Back to Login
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-black text-white">Loading...</div>}>
            <VerifyEmailContent />
        </Suspense>
    )
}
