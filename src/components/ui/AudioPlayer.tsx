"use client"

import { useState, useRef, useEffect } from 'react'
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Repeat, Shuffle, List, X } from 'lucide-react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'

interface Track {
  id: string
  title: string
  artist?: string
  audioUrl: string
  coverImage?: string
  duration?: string
}

interface AudioPlayerProps {
  tracks: Track[]
  currentTrack?: Track
  onTrackChange?: (track: Track) => void
  autoPlay?: boolean
  showPlaylist?: boolean
}

export function AudioPlayer({ 
  tracks, 
  currentTrack: initialTrack, 
  onTrackChange,
  autoPlay = false,
  showPlaylist: initialShowPlaylist = false
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTrack, setCurrentTrack] = useState(initialTrack || tracks[0])
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isRepeat, setIsRepeat] = useState(false)
  const [isShuffle, setIsShuffle] = useState(false)
  const [showPlaylist, setShowPlaylist] = useState(initialShowPlaylist)

  useEffect(() => {
    if (initialTrack) {
      setCurrentTrack(initialTrack)
    }
  }, [initialTrack])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => setCurrentTime(audio.currentTime)
    const updateDuration = () => setDuration(audio.duration)
    const handleEnded = () => {
      if (isRepeat) {
        audio.currentTime = 0
        audio.play()
      } else {
        playNext()
      }
    }

    audio.addEventListener('timeupdate', updateTime)
    audio.addEventListener('loadedmetadata', updateDuration)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('timeupdate', updateTime)
      audio.removeEventListener('loadedmetadata', updateDuration)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [isRepeat])

  useEffect(() => {
    if (autoPlay && audioRef.current && currentTrack) {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }, [currentTrack, autoPlay])

  const togglePlay = () => {
    if (!audioRef.current) return
    
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return
    const time = Number(e.target.value)
    audioRef.current.currentTime = time
    setCurrentTime(time)
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return
    const vol = Number(e.target.value)
    audioRef.current.volume = vol
    setVolume(vol)
    setIsMuted(vol === 0)
  }

  const toggleMute = () => {
    if (!audioRef.current) return
    if (isMuted) {
      audioRef.current.volume = volume || 1
      setIsMuted(false)
    } else {
      audioRef.current.volume = 0
      setIsMuted(true)
    }
  }

  const playNext = () => {
    const currentIndex = tracks.findIndex(t => t.id === currentTrack?.id)
    let nextIndex: number
    
    if (isShuffle) {
      nextIndex = Math.floor(Math.random() * tracks.length)
    } else {
      nextIndex = (currentIndex + 1) % tracks.length
    }
    
    const nextTrack = tracks[nextIndex]
    setCurrentTrack(nextTrack)
    onTrackChange?.(nextTrack)
    setIsPlaying(true)
  }

  const playPrevious = () => {
    const currentIndex = tracks.findIndex(t => t.id === currentTrack?.id)
    const prevIndex = currentIndex === 0 ? tracks.length - 1 : currentIndex - 1
    const prevTrack = tracks[prevIndex]
    setCurrentTrack(prevTrack)
    onTrackChange?.(prevTrack)
    setIsPlaying(true)
  }

  const selectTrack = (track: Track) => {
    setCurrentTrack(track)
    onTrackChange?.(track)
    setIsPlaying(true)
  }

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!currentTrack) return null

  return (
    <div className="relative">
      <audio
        ref={audioRef}
        src={currentTrack.audioUrl}
        preload="metadata"
      />
      
      <div className="bg-gradient-to-r from-zinc-900 to-zinc-800 rounded-2xl p-4 border border-white/10">
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0">
            <Image
              src={currentTrack.coverImage || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200'}
              alt={currentTrack.title}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/20" />
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="text-white font-semibold truncate">{currentTrack.title}</h4>
            {currentTrack.artist && (
              <p className="text-white/50 text-sm truncate">{currentTrack.artist}</p>
            )}
            
            <div className="flex items-center gap-2 mt-2">
              <span className="text-white/40 text-xs w-10">{formatTime(currentTime)}</span>
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="flex-1 h-1 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-fuchsia-500"
              />
              <span className="text-white/40 text-xs w-10 text-right">{formatTime(duration)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsShuffle(!isShuffle)}
              className={`p-2 rounded-full transition-colors ${isShuffle ? 'text-fuchsia-400' : 'text-white/50 hover:text-white'}`}
            >
              <Shuffle size={16} />
            </button>
            
            <button
              onClick={playPrevious}
              className="p-2 text-white/70 hover:text-white transition-colors"
            >
              <SkipBack size={20} />
            </button>
            
            <button
              onClick={togglePlay}
              className="w-12 h-12 rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-500 flex items-center justify-center text-white hover:opacity-90 transition-opacity"
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
            </button>
            
            <button
              onClick={playNext}
              className="p-2 text-white/70 hover:text-white transition-colors"
            >
              <SkipForward size={20} />
            </button>
            
            <button
              onClick={() => setIsRepeat(!isRepeat)}
              className={`p-2 rounded-full transition-colors ${isRepeat ? 'text-fuchsia-400' : 'text-white/50 hover:text-white'}`}
            >
              <Repeat size={16} />
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <button onClick={toggleMute} className="text-white/50 hover:text-white transition-colors">
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-20 h-1 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
            />
          </div>

          {tracks.length > 1 && (
            <button
              onClick={() => setShowPlaylist(!showPlaylist)}
              className={`p-2 rounded-full transition-colors ${showPlaylist ? 'text-fuchsia-400' : 'text-white/50 hover:text-white'}`}
            >
              <List size={20} />
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showPlaylist && tracks.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-full mb-2 left-0 right-0 bg-zinc-900 rounded-2xl border border-white/10 overflow-hidden max-h-64 overflow-y-auto"
          >
            <div className="flex items-center justify-between p-3 border-b border-white/10">
              <h5 className="text-white font-semibold text-sm">Playlist</h5>
              <button onClick={() => setShowPlaylist(false)} className="text-white/50 hover:text-white">
                <X size={16} />
              </button>
            </div>
            <div className="divide-y divide-white/5">
              {tracks.map((track, i) => (
                <button
                  key={track.id}
                  onClick={() => selectTrack(track)}
                  className={`w-full flex items-center gap-3 p-3 hover:bg-white/5 transition-colors ${
                    track.id === currentTrack?.id ? 'bg-fuchsia-500/10' : ''
                  }`}
                >
                  <span className="text-white/30 text-xs w-6">{i + 1}</span>
                  <div className="relative w-10 h-10 rounded overflow-hidden shrink-0">
                    <Image
                      src={track.coverImage || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=100'}
                      alt={track.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className={`truncate text-sm ${track.id === currentTrack?.id ? 'text-fuchsia-400' : 'text-white'}`}>
                      {track.title}
                    </p>
                    {track.artist && (
                      <p className="text-white/40 text-xs truncate">{track.artist}</p>
                    )}
                  </div>
                  {track.id === currentTrack?.id && isPlaying && (
                    <div className="flex items-end gap-0.5 h-4">
                      <span className="w-1 bg-fuchsia-500 animate-pulse" style={{ height: '60%' }} />
                      <span className="w-1 bg-fuchsia-500 animate-pulse" style={{ height: '100%', animationDelay: '0.2s' }} />
                      <span className="w-1 bg-fuchsia-500 animate-pulse" style={{ height: '40%', animationDelay: '0.4s' }} />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
