'use client'

import { useState, useEffect } from 'react'
import { Wifi, WifiOff } from 'lucide-react'
import { toast } from 'sonner'

export function LowDataModeToggle({ className = '' }: { className?: string }) {
  const [lowDataMode, setLowDataMode] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('lowDataMode')
    if (stored) {
      setLowDataMode(stored === 'true')
    }
  }, [])

  const toggleLowDataMode = async () => {
    const newValue = !lowDataMode
    setLowDataMode(newValue)
    localStorage.setItem('lowDataMode', String(newValue))

    try {
      await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ low_data_mode: newValue })
      })
    } catch {}

    if (newValue) {
      toast.success('Low data mode enabled - images will load in lower quality')
    } else {
      toast.info('Low data mode disabled - full quality content')
    }
  }

  return (
    <button
      onClick={toggleLowDataMode}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
        lowDataMode 
          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
          : 'bg-white/5 text-white/50 hover:bg-white/10 border border-white/10'
      } ${className}`}
      title={lowDataMode ? 'Low data mode ON' : 'Low data mode OFF'}
    >
      {lowDataMode ? <WifiOff size={18} /> : <Wifi size={18} />}
      <span className="text-sm">{lowDataMode ? 'Low Data' : 'Full Quality'}</span>
    </button>
  )
}

export function useLowDataMode() {
  const [lowDataMode, setLowDataMode] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('lowDataMode')
    setLowDataMode(stored === 'true')

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'lowDataMode') {
        setLowDataMode(e.newValue === 'true')
      }
    }

    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  return lowDataMode
}
