"use client"

import { useState } from 'react'
import { Download, Lock, CheckCircle, AlertCircle } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'

interface ProductDownloadButtonProps {
    productId: string
    productTitle: string
    isPaid: boolean
    downloadUrl?: string
}

export function ProductDownloadButton({ productId, productTitle, isPaid, downloadUrl }: ProductDownloadButtonProps) {
    const { user } = useAuth()
    const [downloading, setDownloading] = useState(false)
    const [downloadInfo, setDownloadInfo] = useState<any>(null)

    const handleDownload = async () => {
        if (!user) {
            toast.error('Please sign in to download')
            return
        }

        if (!isPaid) {
            // Free product - direct download
            if (downloadUrl) {
                window.open(downloadUrl, '_blank')
                toast.success('Download started!')
            }
            return
        }

        setDownloading(true)

        try {
            // Get Firebase ID token
            const idToken = await (user as any).getIdToken?.()

            if (!idToken) {
                toast.error('Authentication error. Please sign in again.')
                return
            }

            // Request download validation
            const response = await fetch('/api/downloads/request', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`
                },
                body: JSON.stringify({
                    productId,
                    userId: user.id
                })
            })

            const data = await response.json()

            if (!response.ok) {
                if (data.requiresPurchase) {
                    toast.error(data.error || 'Please purchase this product to download')
                } else {
                    toast.error(data.error || 'Download failed')
                }
                return
            }

            // Download granted
            setDownloadInfo(data)

            if (data.downloadUrl) {
                window.open(data.downloadUrl, '_blank')
                toast.success(data.message || 'Download started!')

                if (data.remainingDownloads !== undefined) {
                    toast.info(`${data.remainingDownloads} download${data.remainingDownloads === 1 ? '' : 's'} remaining`)
                }
            }

        } catch (error) {
            console.error('Download error:', error)
            toast.error('Failed to process download')
        } finally {
            setDownloading(false)
        }
    }

    if (!user && isPaid) {
        return (
            <button
                disabled
                className="w-full py-3 px-6 rounded-xl bg-white/10 text-white/50 flex items-center justify-center gap-2 cursor-not-allowed"
            >
                <Lock size={20} />
                Sign in to download
            </button>
        )
    }

    return (
        <div className="space-y-2">
            <button
                onClick={handleDownload}
                disabled={downloading}
                className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
            >
                {downloading ? (
                    <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Processing...
                    </>
                ) : (
                    <>
                        <Download size={20} />
                        {isPaid ? 'Download Now' : 'Free Download'}
                    </>
                )}
            </button>

            {downloadInfo && downloadInfo.remainingDownloads !== undefined && (
                <div className="flex items-center gap-2 text-sm text-white/70 bg-white/5 rounded-lg p-3">
                    {downloadInfo.remainingDownloads > 0 ? (
                        <>
                            <CheckCircle size={16} className="text-green-400" />
                            <span>{downloadInfo.remainingDownloads} download{downloadInfo.remainingDownloads === 1 ? '' : 's'} remaining</span>
                        </>
                    ) : (
                        <>
                            <AlertCircle size={16} className="text-amber-400" />
                            <span>No downloads remaining. Repurchase to download again.</span>
                        </>
                    )}
                </div>
            )}
        </div>
    )
}
