"use client"

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Download, Lock, Clock, AlertCircle, ChevronLeft, ChevronRight,
  FileAudio, FileArchive, Check, Loader2, Shield, Package
} from 'lucide-react'
import { toast } from 'sonner'

interface ProductFile {
  name: string
  url: string
  size: number
  type: string
}

interface Product {
  id: string
  title: string
  description: string
  instructions: string
  access_password: string | null
  cover_images: string[]
  image_url: string
  files: ProductFile[]
  version: string
}

interface TokenData {
  id: string
  expires_at: string
  download_count: number
  max_downloads: number | null
  products: Product
}

export default function DownloadPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState<number | null>(null)
  const [tokenData, setTokenData] = useState<TokenData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [passwordRequired, setPasswordRequired] = useState(false)
  const [password, setPassword] = useState('')
  const [passwordVerified, setPasswordVerified] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  useEffect(() => {
    validateToken()
  }, [token])

  const validateToken = async () => {
    try {
      const res = await fetch(`/api/downloads/validate?token=${token}`)
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Invalid download link')
        setLoading(false)
        return
      }

      setTokenData(data)
      
      if (data.products?.access_password) {
        setPasswordRequired(true)
      }
    } catch (err) {
      setError('Failed to validate download link')
    } finally {
      setLoading(false)
    }
  }

  const verifyPassword = () => {
    if (password === tokenData?.products?.access_password) {
      setPasswordVerified(true)
      toast.success('Access granted!')
    } else {
      toast.error('Incorrect password')
    }
  }

  const handleDownload = async (fileIndex: number) => {
    setDownloading(fileIndex)
    
    try {
      const res = await fetch(`/api/downloads/secure?token=${token}&file=${fileIndex}`)
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Download failed')
        return
      }

      const link = document.createElement('a')
      link.href = data.downloadUrl
      link.download = data.fileName
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast.success('Download started!')
    } catch (err) {
      toast.error('Download failed')
    } finally {
      setDownloading(null)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (!bytes) return 'Unknown size'
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const formatTimeRemaining = (expiresAt: string) => {
    const now = new Date()
    const expires = new Date(expiresAt)
    const diff = expires.getTime() - now.getTime()
    
    if (diff <= 0) return 'Expired'
    
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 24) {
      const days = Math.floor(hours / 24)
      return `${days} day${days > 1 ? 's' : ''} remaining`
    }
    
    return `${hours}h ${minutes}m remaining`
  }

  const product = tokenData?.products
  const coverImages = product?.cover_images?.length 
    ? product.cover_images 
    : product?.image_url 
      ? [product.image_url] 
      : []

  const nextImage = () => {
    setCurrentImageIndex(prev => (prev + 1) % coverImages.length)
  }

  const prevImage = () => {
    setCurrentImageIndex(prev => (prev - 1 + coverImages.length) % coverImages.length)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-fuchsia-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/50">Validating download link...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
            <AlertCircle size={40} className="text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Download Unavailable</h1>
          <p className="text-white/60 mb-8">{error}</p>
          <button
            onClick={() => router.push('/store')}
            className="px-6 py-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all"
          >
            Browse Products
          </button>
        </div>
      </div>
    )
  }

  if (passwordRequired && !passwordVerified) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="p-8 rounded-3xl bg-white/5 border border-white/10">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-6">
              <Lock size={32} className="text-amber-400" />
            </div>
            <h1 className="text-2xl font-bold text-white text-center mb-2">Password Protected</h1>
            <p className="text-white/60 text-center mb-6">
              This download requires a password to access.
            </p>
            <div className="space-y-4">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-fuchsia-500/50"
                onKeyDown={(e) => e.key === 'Enter' && verifyPassword()}
              />
              <button
                onClick={verifyPassword}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white font-semibold hover:opacity-90 transition-all"
              >
                Access Downloads
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white/50">Product not found</p>
      </div>
    )
  }

  const files = product.files || []
  const downloadsRemaining = tokenData?.max_downloads 
    ? tokenData.max_downloads - (tokenData.download_count || 0)
    : null

  return (
    <div className="min-h-screen bg-black py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
            <Check size={20} className="text-green-400" />
          </div>
          <div>
            <h2 className="text-white font-semibold">Download Ready</h2>
            <p className="text-white/50 text-sm flex items-center gap-2">
              <Clock size={14} />
              {formatTimeRemaining(tokenData?.expires_at || '')}
              {downloadsRemaining !== null && (
                <span className="ml-2">• {downloadsRemaining} downloads remaining</span>
              )}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {coverImages.length > 0 && (
            <div className="relative">
              <div className="aspect-square rounded-2xl overflow-hidden bg-white/5">
                <img
                  src={coverImages[currentImageIndex]}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {coverImages.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-all"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-all"
                  >
                    <ChevronRight size={24} />
                  </button>
                  
                  <div className="flex justify-center gap-2 mt-4">
                    {coverImages.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentImageIndex(i)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          i === currentImageIndex ? 'bg-fuchsia-500 w-6' : 'bg-white/30'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-3xl font-bold text-white">{product.title}</h1>
                {product.version && (
                  <span className="px-2 py-1 rounded bg-white/10 text-white/60 text-sm">
                    v{product.version}
                  </span>
                )}
              </div>
              {product.description && (
                <p className="text-white/60">{product.description}</p>
              )}
            </div>

            {product.instructions && (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-start gap-3">
                  <Shield size={20} className="text-amber-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-amber-400 font-medium mb-1">Instructions</p>
                    <p className="text-white/70 text-sm whitespace-pre-wrap">{product.instructions}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <p className="text-white/50 text-sm">
                {files.length} file{files.length !== 1 ? 's' : ''} available
              </p>
              
              {files.length === 0 ? (
                <div className="p-6 rounded-xl bg-white/5 text-center">
                  <Package size={32} className="text-white/30 mx-auto mb-2" />
                  <p className="text-white/50">No files available</p>
                </div>
              ) : (
                files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all"
                  >
                    <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                      {file.type?.includes('audio') ? (
                        <FileAudio size={24} className="text-pink-400" />
                      ) : (
                        <FileArchive size={24} className="text-blue-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{file.name}</p>
                      <p className="text-white/40 text-sm">{formatFileSize(file.size)}</p>
                    </div>
                    <button
                      onClick={() => handleDownload(index)}
                      disabled={downloading === index}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white font-semibold hover:opacity-90 transition-all disabled:opacity-50"
                    >
                      {downloading === index ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Download size={18} />
                      )}
                      Download
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="text-white/40 text-xs">
                This is a secure download link. Do not share this link with others.
                The link will expire after the time shown above.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
