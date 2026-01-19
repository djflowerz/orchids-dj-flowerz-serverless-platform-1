'use client'

import { useState, useRef, useEffect } from 'react'
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward } from 'lucide-react'

interface AudioPreviewProps {
  src: string
  title?: string
  previewDuration?: number
  onEnded?: () => void
  className?: string
}

export function AudioPreview({ 
  src, 
  title, 
  previewDuration = 30,
  onEnded,
  className = '' 
}: AudioPreviewProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(0.7)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
      if (previewDuration && audio.currentTime >= previewDuration) {
        audio.pause()
        setIsPlaying(false)
        onEnded?.()
      }
    }

    const handleLoadedMetadata = () => {
      setDuration(Math.min(audio.duration, previewDuration || audio.duration))
    }

    const handleEnded = () => {
      setIsPlaying(false)
      onEnded?.()
    }

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [previewDuration, onEnded])

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
    } else {
      audio.play()
    }
    setIsPlaying(!isPlaying)
  }

  const toggleMute = () => {
    const audio = audioRef.current
    if (!audio) return

    audio.muted = !isMuted
    setIsMuted(!isMuted)
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    if (audioRef.current) {
      audioRef.current.volume = newVolume
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value)
    setCurrentTime(newTime)
    if (audioRef.current) {
      audioRef.current.currentTime = newTime
    }
  }

  const skip = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, Math.min(duration, currentTime + seconds))
    }
  }

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60)
    const secs = Math.floor(time % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className={`bg-white/5 border border-white/10 rounded-xl p-4 ${className}`}>
      <audio ref={audioRef} src={src} preload="metadata" />
      
      {title && (
        <p className="text-white/70 text-sm mb-3 truncate">{title}</p>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={() => skip(-10)}
          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 transition-colors"
        >
          <SkipBack size={16} />
        </button>

        <button
          onClick={togglePlay}
          className="p-3 rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white hover:opacity-90 transition-opacity"
        >
          {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
        </button>

        <button
          onClick={() => skip(10)}
          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 transition-colors"
        >
          <SkipForward size={16} />
        </button>

        <div className="flex-1 flex items-center gap-2">
          <span className="text-white/50 text-xs w-10">{formatTime(currentTime)}</span>
          <input
            type="range"
            min="0"
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="flex-1 h-1 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-500"
          />
          <span className="text-white/50 text-xs w-10">{formatTime(duration)}</span>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={toggleMute} className="text-white/70 hover:text-white transition-colors">
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={handleVolumeChange}
            className="w-16 h-1 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
          />
        </div>
      </div>

      {previewDuration && (
        <p className="text-white/40 text-xs mt-2 text-center">
          {previewDuration}s preview • Subscribe for full access
        </p>
      )}
    </div>
  )
}
