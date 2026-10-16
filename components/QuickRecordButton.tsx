'use client'

// Inline "Đọc thử" widget embedded inside PairCard.
// Records one word (stops by itself once the child goes quiet — useVoiceRecorder), scores via
// Groq Whisper, shows ✅/❌ then auto-resets.
// No mastery tracking — purely for practice.

import { useState, useRef, useEffect } from 'react'
import { useVoiceRecorder, type Recording } from '@/lib/useVoiceRecorder'
import { micDeniedHelp } from '@/lib/micHelp'

type Phase = 'idle' | 'recording' | 'processing' | 'correct' | 'wrong' | 'unclear'

// One word: stops 1.2s after the child goes quiet, or after 4s of nothing, or at 6s.
const REC = { maxSecs: 6, silenceMs: 1200, noSpeechMs: 4000, minMs: 600 }

export default function QuickRecordButton({ word }: { word: string }) {
  const [result, setResult] = useState<Exclude<Phase, 'idle' | 'recording'> | null>(null)
  const resetRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => { if (resetRef.current) clearTimeout(resetRef.current) }, [])

  const showThenReset = (p: Exclude<Phase, 'idle' | 'recording' | 'processing'>) => {
    setResult(p)
    resetRef.current = setTimeout(() => setResult(null), 2500)
  }

  const score = async ({ file }: Recording) => {
    setResult('processing')
    try {
      const fd = new FormData()
      fd.append('audio', file)
      fd.append('target', word)
      fd.append('word', word)
      const res = await fetch('/api/score-pronunciation', { method: 'POST', body: fd })
      const data = await res.json()
      showThenReset(data.unclear ? 'unclear' : data.correct ? 'correct' : 'wrong')
    } catch {
      setResult(null)
    }
  }

  const rec = useVoiceRecorder({ ...REC, onDone: score, onNoSpeech: () => showThenReset('unclear') })
  const startRecording = () => {
    if (resetRef.current) clearTimeout(resetRef.current)
    setResult(null)
    void rec.start()
  }
  const stopRecording = rec.stop
  const timeLeft = rec.timeLeft
  const phase: Phase = rec.phase !== 'idle' ? 'recording' : result ?? 'idle'

  if (phase === 'idle' && rec.error) return (
    <button onClick={startRecording} title={rec.error === 'denied' ? micDeniedHelp() : undefined}
      className="flex max-w-xs items-center gap-1.5 bg-red-50 border border-red-200 text-red-600 text-xs font-bold px-3 py-1.5 rounded-full text-left">
      🎤 {rec.error === 'denied' ? micDeniedHelp() : 'Không mở được micro — bấm thử lại'}
    </button>
  )

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
