'use client'

// Sentence Rhythm Game — practice IELTS sentence stress rhythm
// Show sentence with content words highlighted → user records → Groq Whisper checks key words

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { speak } from '@/lib/speak'
import { recordPairGame, flushPhonics } from '@/lib/phonicsSync'
import { playCorrectSound, playWrongSound } from '@/lib/gameSound'
import Confetti from '@/components/Confetti'

type RhythmSentence = { en: string; stressed: string[]; vi: string }
type RhythmLesson   = { id: string; title: string; emoji: string; sentences: RhythmSentence[] }

const MAX_SECS = 12
type RecordPhase = 'idle' | 'recording' | 'processing' | 'done'

function getBestMime() {
  for (const t of ['audio/webm', 'audio/mp4', 'audio/ogg']) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)) return t
  }
  return 'audio/webm'
}

function HighlightedSentence({ sentence, stressed }: { sentence: string; stressed: string[] }) {
  const hlSet = new Set(stressed.map(s => s.toLowerCase()))
  return (
    <p className="text-xl font-bold text-center leading-relaxed px-2">
      {sentence.split(' ').map((w, i, arr) => {
        const clean = w.replace(/[.,!?'"]/g, '').toLowerCase()
        return (
          <span key={i}>
            <span className={hlSet.has(clean) ? 'text-amber-700 font-black underline decoration-2 underline-offset-2' : 'text-gray-600'}>
              {w}
            </span>
            {i < arr.length - 1 ? ' ' : ''}
          </span>
        )
      })}
    </p>
  )
}

export default function SentenceRhythmGame({
  lesson, childId: _childId, backUrl,
  gradient = 'from-amber-500 to-orange-600',
  btnColor = 'bg-amber-500',
}: {
  lesson: RhythmLesson; childId: string; backUrl: string
  gradient?: string; btnColor?: string
}) {
  const router = useRouter()
  const [idx, setIdx]         = useState(0)
  const [score, setScore]     = useState(0)
  const [phase, setPhase]     = useState<RecordPhase>('idle')
  const [transcript, setTranscript] = useState<string | null>(null)
  const [isCorrect, setIsCorrect]   = useState<boolean | null>(null)
  const [gameDone, setGameDone]     = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  const mediaRef  = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const answeredRef = useRef(false)

  const questions = lesson.sentences
  const q = questions[idx]

  const playSample = useCallback(() => { speak(q.en, { rate: 0.85 }) }, [q.en])

  const startRecording = useCallback(async () => {
    if (phase !== 'idle') return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mime = getBestMime()
      const mr = new MediaRecorder(stream, { mimeType: mime })
      chunksRef.current = []
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        setPhase('processing')
        const blob = new Blob(chunksRef.current, { type: mime })
        try {
          const fd = new FormData()
          fd.append('audio', blob, 'recording.' + mime.split('/')[1].split(';')[0])
          fd.append('target', q.en)
          const res = await fetch('/api/score-pronunciation', { method: 'POST', body: fd })
          const data = await res.json()
          const transcribed: string = (data.transcript ?? '').toLowerCase()
          const stressedLower = q.stressed.map(s => s.replace(/[.,!?]/g, '').toLowerCase())
          const matched = stressedLower.filter(w => transcribed.includes(w))
          const correct = matched.length >= Math.ceil(stressedLower.length * 0.6)
          setTranscript(data.transcript ?? '')
          setIsCorrect(correct)
          if (correct && !answeredRef.current) { answeredRef.current = true; setScore(s => s + 1) }
          if (correct) playCorrectSound(); else playWrongSound()
        } catch {
          setTranscript(null)
          setIsCorrect(false)
          playWrongSound()
        }
        setPhase('done')
      }
      mr.start()
      mediaRef.current = mr
      setPhase('recording')
      setTranscript(null)
      setIsCorrect(null)
      timerRef.current = setTimeout(() => { if (mr.state === 'recording') mr.stop() }, MAX_SECS * 1000)
    } catch {
      setPhase('idle')
    }
  }, [phase, q.en, q.stressed])

  const stopRecording = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (mediaRef.current?.state === 'recording') mediaRef.current.stop()
  }, [])

  const advance = useCallback(() => {
    const next = idx + 1
    if (next >= questions.length) {
      if (score / questions.length >= 0.7) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recordPairGame(lesson.id as any, 'rhythm' as any)
        flushPhonics()
      }
      if (score === questions.length) setShowConfetti(true)
      setGameDone(true)
    } else {
      setIdx(next)
      setPhase('idle')
      setTranscript(null)
      setIsCorrect(null)
      answeredRef.current = false
    }
  }, [idx, questions.length, score])

  const restart = () => {
    setIdx(0); setScore(0); setPhase('idle'); setTranscript(null)
    setIsCorrect(null); setGameDone(false); setShowConfetti(false)
    answeredRef.current = false
  }

  if (gameDone) {
    const final = score
    const total = questions.length
    const pct = Math.round((final / total) * 100)
    return (
      <div className="flex flex-col min-h-screen">
        {showConfetti && <Confetti />}
        <div className={`bg-gradient-to-br ${gradient} px-4 pt-12 pb-8 text-white`}>
          <button onClick={() => router.push(backUrl)} className="text-white/80 font-bold text-sm flex items-center gap-1 mb-4">← {lesson.title}</button>
          <h1 className="text-2xl font-black">{lesson.emoji} {lesson.title}</h1>
        </div>
        <div className="flex-1 bg-gray-50 flex flex-col items-center justify-center px-4 py-8">
          <div className="text-7xl mb-4">{final === total ? '🏆' : final >= total * 0.7 ? '⭐' : '💪'}</div>
          <h2 className="text-3xl font-black text-gray-800 mb-1">{final}/{total}</h2>
          <p className="text-gray-500 font-bold text-xl mb-8">{pct}%</p>
          {final < total * 0.7 && (
            <p className="text-sm text-gray-500 font-semibold mb-6 text-center">Cần ≥70% để đánh dấu hoàn thành. Thử lại nhé!</p>
          )}
          <div className="w-full space-y-3">
            <button onClick={restart} className={`w-full ${btnColor} text-white font-black text-xl py-4 rounded-2xl shadow-lg`}>🔄 Chơi lại</button>
            <button onClick={() => router.push(backUrl)} className="w-full bg-white border-2 border-gray-200 text-gray-600 font-bold text-xl py-4 rounded-2xl">← Xem bài học</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className={`bg-gradient-to-br ${gradient} px-4 pt-12 pb-4 text-white`}>
        <button onClick={() => router.push(backUrl)} className="text-white/80 font-bold text-sm flex items-center gap-1 mb-3">← {lesson.title}</button>
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-black">{lesson.emoji} {lesson.title}</h1>
          <span className="bg-white/20 px-3 py-1 rounded-full font-black text-sm">{idx + 1}/{questions.length}</span>
        </div>
        <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full bg-white/70 rounded-full transition-all duration-300"
            style={{ width: `${((idx + 1) / questions.length) * 100}%` }} />
        </div>
      </div>

      <div className="flex-1 bg-gray-50 flex flex-col items-center justify-center px-4 gap-4">
        {/* Score dots */}
        <div className="flex gap-1.5 flex-wrap justify-center">
          {Array.from({ length: questions.length }).map((_, i) => (
            <div key={i} className={`w-2 h-2 rounded-full ${i < score ? 'bg-green-400' : 'bg-gray-200'}`} />
          ))}
        </div>

        {/* Sentence card */}
        <div className="bg-white rounded-3xl px-5 py-5 shadow-md w-full">
          <p className="text-xs text-gray-500 font-bold uppercase tracking-wide mb-3 text-center">Đọc với nhịp tự nhiên</p>
          <HighlightedSentence sentence={q.en} stressed={q.stressed} />
          <p className="text-xs text-gray-500 font-semibold text-center mt-2">{q.vi}</p>
          <p className="text-xs text-amber-600 font-bold text-center mt-1.5">↑ Từ gạch chân = nhấn mạnh</p>
        </div>

        {/* Listen sample */}
        <button onClick={playSample}
          className="w-full flex items-center gap-3 bg-white border-2 border-gray-200 rounded-2xl px-4 py-3 active:scale-95 transition-all">
          <span className="text-xl">🔊</span>
          <div className="text-left">
            <p className="font-black text-sm text-gray-800">Nghe mẫu</p>
            <p className="text-gray-500 text-xs">Nghe kỹ nhịp điệu trước khi đọc</p>
          </div>
        </button>

        {/* Record controls */}
        {phase === 'idle' && (
          <button onClick={startRecording}
            className={`w-full ${btnColor} text-white font-black text-xl py-4 rounded-2xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3`}>
            🎤 Đọc theo
          </button>
        )}
        {phase === 'recording' && (
          <button onClick={stopRecording}
            className="w-full bg-red-500 text-white font-black text-xl py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 animate-pulse">
            ⏹️ Dừng ({MAX_SECS}s)
          </button>
        )}
        {phase === 'processing' && (
          <div className="w-full bg-gray-200 text-gray-500 font-black text-xl py-4 rounded-2xl flex items-center justify-center gap-2">
            ⏳ Đang chấm...
          </div>
        )}
        {phase === 'done' && (
          <div className="w-full space-y-3">
            {transcript !== null && (
              <div className={`rounded-2xl p-4 border-2 ${isCorrect ? 'bg-green-50 border-green-300' : 'bg-orange-50 border-orange-300'}`}>
                <p className="text-sm font-black text-gray-800 mb-1">{isCorrect ? '✅ Tốt lắm! Nhịp điệu chuẩn.' : '💪 Thử lại — nhớ nhấn từ nội dung!'}</p>
                <p className="text-xs text-gray-500 font-semibold">AI nghe: &ldquo;{transcript}&rdquo;</p>
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={() => { setPhase('idle'); setTranscript(null); setIsCorrect(null) }}
                className="flex-1 bg-gray-100 text-gray-700 font-bold text-base py-3.5 rounded-2xl">
                🔄 Thử lại
              </button>
              <button onClick={advance}
                className={`flex-1 ${isCorrect ? 'bg-green-500' : btnColor} text-white font-black text-base py-3.5 rounded-2xl`}>
                {idx + 1 >= questions.length ? 'Kết quả →' : 'Tiếp theo →'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
