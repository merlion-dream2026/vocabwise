'use client'

// Inline "Đọc thử" widget embedded inside PairCard.
// Records one word, scores via Groq Whisper, shows ✅/❌ then auto-resets.
// No mastery tracking — purely for practice.

import { useState, useRef, useCallback } from 'react'

type Phase = 'idle' | 'recording' | 'processing' | 'correct' | 'wrong' | 'unclear'

const MAX_SECS = 6

function getBestMime() {
  for (const t of ['audio/webm', 'audio/mp4', 'audio/ogg']) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)) return t
  }
  return 'audio/webm'
}

export default function QuickRecordButton({ word }: { word: string }) {
  const [phase, setPhase]       = useState<Phase>('idle')
  const [timeLeft, setTimeLeft] = useState(MAX_SECS)

  const mrRef      = useRef<MediaRecorder | null>(null)
  const streamRef  = useRef<MediaStream | null>(null)
  const chunksRef  = useRef<BlobPart[]>([])
  const timerRef   = useRef<ReturnType<typeof setInterval> | null>(null)
  const autoRef    = useRef<ReturnType<typeof setTimeout> | null>(null)
  const resetRef   = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimers = useCallback(() => {
    if (timerRef.current)  { clearInterval(timerRef.current);  timerRef.current = null }
    if (autoRef.current)   { clearTimeout(autoRef.current);    autoRef.current = null }
    if (resetRef.current)  { clearTimeout(resetRef.current);   resetRef.current = null }
  }, [])

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
  }, [])

  const startRecording = async () => {
    clearTimers()
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const mimeType = getBestMime()
      chunksRef.current = []

      const mr = new MediaRecorder(stream, { mimeType })
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.onstop = async () => {
        stopStream()
        const blob = new Blob(chunksRef.current, { type: mimeType })
        setPhase('processing')
        try {
          const ext = mimeType.includes('mp4') ? 'm4a' : mimeType.includes('ogg') ? 'ogg' : 'webm'
          const fd = new FormData()
          fd.append('audio', new File([blob], `rec.${ext}`, { type: mimeType }))
          fd.append('target', word)
          fd.append('word', word)
          const res = await fetch('/api/score-pronunciation', { method: 'POST', body: fd })
          const data = await res.json()
          if (data.unclear) {
            setPhase('unclear')
          } else {
            setPhase(data.correct ? 'correct' : 'wrong')
          }
          // Auto-reset after 2.5s
          resetRef.current = setTimeout(() => setPhase('idle'), 2500)
        } catch {
          setPhase('idle')
        }
      }
      mr.start()
      mrRef.current = mr
      setPhase('recording')
      setTimeLeft(MAX_SECS)

      timerRef.current = setInterval(() => setTimeLeft(p => {
        if (p <= 1) { clearTimers(); return 0 }
        return p - 1
      }), 1000)
      autoRef.current = setTimeout(() => {
        if (mrRef.current?.state === 'recording') mrRef.current.stop()
        clearTimers()
      }, MAX_SECS * 1000)
    } catch {
      setPhase('idle')
    }
  }

  const stopRecording = () => {
    clearTimers()
    if (mrRef.current?.state === 'recording') mrRef.current.stop()
  }

  if (phase === 'idle') return (
    <button onClick={startRecording}
      className="flex items-center gap-1.5 bg-amber-100 border border-amber-300 text-amber-700 text-xs font-bold px-3 py-1.5 rounded-full active:scale-90 transition-all">
      🎤 Đọc &quot;{word}&quot;
    </button>
  )

  if (phase === 'recording') return (
    <button onClick={stopRecording}
      className="flex items-center gap-1.5 bg-red-100 border border-red-300 text-red-600 text-xs font-bold px-3 py-1.5 rounded-full animate-pulse">
      ⏹️ {timeLeft}s · Đang ghi...
    </button>
  )

  if (phase === 'processing') return (
    <span className="flex items-center gap-1.5 bg-gray-100 text-gray-400 text-xs font-bold px-3 py-1.5 rounded-full">
      ⏳ Đang chấm...
    </span>
  )

  if (phase === 'correct') return (
    <span className="flex items-center gap-1.5 bg-green-100 border border-green-300 text-green-700 text-xs font-bold px-3 py-1.5 rounded-full">
      ✅ Đúng rồi!
    </span>
  )

  if (phase === 'wrong') return (
    <span className="flex items-center gap-1.5 bg-red-100 border border-red-300 text-red-600 text-xs font-bold px-3 py-1.5 rounded-full">
      ❌ Thử lại nhé
    </span>
  )

  // unclear
  return (
    <span className="flex items-center gap-1.5 bg-amber-100 border border-amber-300 text-amber-600 text-xs font-bold px-3 py-1.5 rounded-full">
      🔄 Đọc to hơn
    </span>
  )
}
