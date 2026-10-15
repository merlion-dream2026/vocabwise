'use client'

// Compact audio player for a kid's own recording (Phát âm cùng AI): play/pause,
// seekable progress bar, elapsed/total time. Replaces the old one-shot
// "▶️ Nghe lại giọng của bạn" button, which couldn't pause or show progress.

import { useEffect, useRef, useState } from 'react'

function fmt(s: number) {
  if (!isFinite(s) || s < 0) s = 0
  return `0:${String(Math.round(s)).padStart(2, '0')}`
}

export default function VoicePlayer({ src, label = 'Giọng của bạn' }: { src: string; label?: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)

  useEffect(() => {
    const a = new Audio(src)
    audioRef.current = a
    let fixingDuration = false

    const onMeta = () => {
      // Chrome's MediaRecorder webm has no duration header → Infinity.
      // Seeking far past the end forces the browser to compute it.
      if (!isFinite(a.duration)) { fixingDuration = true; a.currentTime = 1e101; return }
      setDuration(a.duration)
    }
    const onTime = () => {
      if (fixingDuration) {
        fixingDuration = false
        a.currentTime = 0
        if (isFinite(a.duration)) setDuration(a.duration)
        return
      }
      setCurrent(a.currentTime)
    }
    const onEnd = () => { setPlaying(false); setCurrent(0) }

    a.addEventListener('loadedmetadata', onMeta)
    a.addEventListener('timeupdate', onTime)
    a.addEventListener('ended', onEnd)
    a.addEventListener('pause', () => setPlaying(false))
    a.addEventListener('play', () => setPlaying(true))
    a.load()
    return () => {
      a.pause()
      a.removeEventListener('loadedmetadata', onMeta)
      a.removeEventListener('timeupdate', onTime)
      a.removeEventListener('ended', onEnd)
      audioRef.current = null
    }
  }, [src])

  const toggle = () => {
    const a = audioRef.current
    if (!a) return
    if (a.paused) { window.speechSynthesis?.cancel(); a.play().catch(() => {}) }
    else a.pause()
  }

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const a = audioRef.current
    if (!a || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    a.currentTime = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)) * duration
    setCurrent(a.currentTime)
  }

  const pct = duration ? Math.min(100, (current / duration) * 100) : 0

  return (
    <div className="w-full bg-white border-2 border-rose-100 rounded-2xl px-3 py-2.5 flex items-center gap-3">
      <button onClick={toggle} aria-label={playing ? 'Tạm dừng' : 'Nghe lại giọng của bạn'}
        className="flex-shrink-0 w-10 h-10 rounded-full bg-rose-500 text-white flex items-center justify-center text-base active:scale-90 transition-all">
        {playing ? '⏸' : '▶'}
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-rose-500 mb-1">🗣️ {label}</p>
        <div onClick={seek} className="w-full h-2 bg-rose-100 rounded-full overflow-hidden cursor-pointer">
          <div className="h-full bg-rose-400 rounded-full transition-[width] duration-150" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <span className="flex-shrink-0 text-xs font-semibold text-gray-400 tabular-nums">
        {fmt(current)} / {fmt(duration)}
      </span>
    </div>
  )
}
