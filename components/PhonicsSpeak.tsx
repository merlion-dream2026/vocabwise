'use client'

// Phát âm cùng AI (Phonics) — mirrors Daily SpeakGame UI.
// Auto-plays sentence TTS on mount → user taps 🎤 → 3-2-1 → record → AI score.

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { speak as speakSentence } from '@/lib/speak'
import { recordPairGame, flushPhonics } from '@/lib/phonicsSync'
import Confetti from '@/components/Confetti'

type PracticeSentence = { en: string; highlight: string[] }
type RhythmSentence   = { en: string; stressed: string[]; vi: string }
type SentenceItem     = { en: string; targets: string[]; vi?: string }

type Lesson = {
  id: string; title: string; emoji: string
  masteryGames?: string[]
  practice_sentences?: PracticeSentence[]
  sentences?: RhythmSentence[]
}

type Props = {
  lesson: Lesson; childId: string; backUrl: string
  gradient: string; btnColor: string
}

const MAX_SECS = 8
type Phase = 'idle' | 'countdown' | 'recording' | 'processing' | 'done'

function getBestMime() {
  for (const t of ['audio/webm', 'audio/mp4', 'audio/ogg']) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)) return t
  }
  return 'audio/webm'
}

function buildItems(lesson: Lesson): SentenceItem[] {
  if (lesson.practice_sentences?.length) {
    return lesson.practice_sentences.map(s => ({ en: s.en, targets: s.highlight }))
  }
  if (lesson.sentences?.length) {
    return lesson.sentences.map(s => ({ en: s.en, targets: s.stressed, vi: s.vi }))
  }
  return []
}

function scoreResult(transcript: string, targets: string[]): { found: string[]; missed: string[] } {
  const t = transcript.toLowerCase()
  const found: string[] = []
  const missed: string[] = []
  for (const w of targets) {
    if (t.includes(w.toLowerCase())) found.push(w)
    else missed.push(w)
  }
  return { found, missed }
}

function HighlightedSentence({ en, targets }: { en: string; targets: string[] }) {
  const hl = new Set(targets.map(t => t.toLowerCase()))
  return (
    <p className="text-lg font-bold text-gray-700 leading-snug text-center">
      {en.split(' ').map((w, i, arr) => {
        const clean = w.replace(/[.,!?'"]/g, '').toLowerCase()
        return (
          <span key={i}>
            <span className={hl.has(clean) ? 'text-indigo-700 font-black underline decoration-2 underline-offset-2' : ''}>
              {w}
            </span>
            {i < arr.length - 1 ? ' ' : ''}
          </span>
        )
      })}
    </p>
  )
}

export default function PhonicsSpeak({ lesson, childId, backUrl, gradient, btnColor }: Props) {
  void childId
  const router = useRouter()
  const items  = buildItems(lesson)

  const [step, setStep]         = useState(0)
  const [scores, setScores]     = useState<number[]>([])
  const [gameDone, setGameDone] = useState(false)
  const [showConf, setShowConf] = useState(false)

  const [phase, setPhase]           = useState<Phase>('idle')
  const [countdown, setCountdown]   = useState(3)
  const [transcript, setTranscript] = useState('')
  const [isCorrect, setIsCorrect]   = useState<boolean | null>(null)
  const [unclear, setUnclear]       = useState(false)
  const [found, setFound]           = useState<string[]>([])
  const [missed, setMissed]         = useState<string[]>([])
  const [micError, setMicError]     = useState<string | null>(null)
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null)
  const [timeLeft, setTimeLeft]     = useState(MAX_SECS)

  const mediaRecRef  = useRef<MediaRecorder | null>(null)
  const streamRef    = useRef<MediaStream | null>(null)
  const chunksRef    = useRef<BlobPart[]>([])
  const timerRef     = useRef<ReturnType<typeof setInterval> | null>(null)
  const autoStopRef  = useRef<ReturnType<typeof setTimeout>  | null>(null)
  const cdRef        = useRef<ReturnType<typeof setInterval> | null>(null)
  const autoPlayRef  = useRef(false)

  const current     = items[step]
  const total       = items.length
  const totalScore  = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 100) : 0

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop()); streamRef.current = null
  }, [])

  const clearTimers = useCallback(() => {
    if (timerRef.current)    { clearInterval(timerRef.current);   timerRef.current  = null }
    if (autoStopRef.current) { clearTimeout(autoStopRef.current); autoStopRef.current = null }
    if (cdRef.current)       { clearInterval(cdRef.current);      cdRef.current     = null }
  }, [])

  // Auto-play sentence on step change
  useEffect(() => {
    if (gameDone || !current) return
    setPhase('idle')
    setTranscript(''); setIsCorrect(null); setUnclear(false)
    setFound([]); setMissed([]); setMicError(null)
    setTimeLeft(MAX_SECS)
    if (playbackUrl) { URL.revokeObjectURL(playbackUrl); setPlaybackUrl(null) }
    autoPlayRef.current = false

    const t = setTimeout(() => {
      if (!autoPlayRef.current) speakSentence(current.en, { rate: 0.85 })
    }, 350)
    return () => {
      autoPlayRef.current = true
      clearTimeout(t)
      clearTimers()
      window.speechSynthesis?.cancel()
      if (mediaRecRef.current?.state === 'recording') mediaRecRef.current.stop()
      stopStream()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, gameDone])

  const startRecording = async () => {
    setMicError(null)
    if (playbackUrl) { URL.revokeObjectURL(playbackUrl); setPlaybackUrl(null) }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const mimeType = getBestMime()
      chunksRef.current = []

      const mr = new MediaRecorder(stream, { mimeType })
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.onstop = async () => {
        stopStream()
        const blob = new Blob(chunksRef.current, { type: mimeType })
        setPlaybackUrl(URL.createObjectURL(blob))
        await scoreAudio(blob, mimeType)
      }
      mr.start()
      mediaRecRef.current = mr

      // 3-2-1 countdown (mic warms up during this)
      setPhase('countdown'); setCountdown(3)
      let c = 3
      cdRef.current = setInterval(() => {
        c--
        if (c > 0) {
          setCountdown(c)
        } else {
          clearInterval(cdRef.current!); cdRef.current = null
          setPhase('recording'); setTimeLeft(MAX_SECS)
          timerRef.current = setInterval(() => {
            setTimeLeft(prev => { if (prev <= 1) { clearTimers(); return 0 } return prev - 1 })
          }, 1000)
          autoStopRef.current = setTimeout(() => {
            if (mediaRecRef.current?.state === 'recording') mediaRecRef.current.stop()
            clearTimers()
          }, MAX_SECS * 1000)
        }
      }, 1000)
    } catch (e: unknown) {
      const name = (e as { name?: string }).name
      setMicError(name === 'NotAllowedError'
        ? 'Chưa cấp quyền micro. Vào Settings → cho phép Microphone.'
        : 'Không thể mở micro. Thử lại nhé.')
    }
  }

  const stopRecording = () => {
    clearTimers()
    if (mediaRecRef.current?.state === 'recording') mediaRecRef.current.stop()
  }

  const scoreAudio = async (blob: Blob, mimeType: string) => {
    setPhase('processing')
    try {
      const ext = mimeType.includes('mp4') ? 'm4a' : mimeType.includes('ogg') ? 'ogg' : 'webm'
      const fd = new FormData()
      fd.append('audio', new File([blob], `rec.${ext}`, { type: mimeType }))
      fd.append('target', current.en)
      fd.append('expected', current.en)

      const res  = await fetch('/api/score-pronunciation', { method: 'POST', body: fd })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()

      const tr = (data.transcript ?? '').trim()
      setTranscript(tr)
      setUnclear(!!data.unclear)
      const { found: f, missed: m } = scoreResult(tr, current.targets)
      setFound(f); setMissed(m)
      const correct = current.targets.length === 0
        ? !!data.correct
        : f.length / Math.max(current.targets.length, 1) >= 0.6
      setIsCorrect(correct)
      const itemScore = current.targets.length > 0 ? f.length / current.targets.length : (correct ? 1 : 0)
      setScores(prev => [...prev, itemScore])
      setPhase('done')
    } catch {
      setMicError('Lỗi kết nối. Bấm Thử lại.')
      setPhase('idle')
    }
  }

  const retry = () => {
    clearTimers()
    if (mediaRecRef.current?.state === 'recording') mediaRecRef.current.stop()
    stopStream()
    if (playbackUrl) { URL.revokeObjectURL(playbackUrl); setPlaybackUrl(null) }
    setTranscript(''); setIsCorrect(null); setUnclear(false)
    setFound([]); setMissed([]); setMicError(null); setTimeLeft(MAX_SECS)
    setPhase('idle')
  }

  const advance = useCallback(async () => {
    clearTimers()
    if (mediaRecRef.current?.state === 'recording') mediaRecRef.current.stop()
    stopStream()
    const next = step + 1
    if (next >= total) {
      const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
      if (avg >= 0.7) {
        recordPairGame(lesson.id, 'speak', lesson.masteryGames ?? [])
        setShowConf(true)
      }
      await flushPhonics()
      setGameDone(true)
    } else {
      setStep(next)
    }
  }, [step, total, scores, lesson, clearTimers, stopStream])

  useEffect(() => () => { clearTimers(); stopStream() }, [clearTimers, stopStream])

  if (!items.length) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-gray-50 gap-4 px-4">
        <p className="text-5xl">🎤</p>
        <p className="text-gray-500 text-sm font-semibold text-center">Lesson này chưa có câu để luyện phát âm.</p>
        <button onClick={() => router.push(backUrl)} className={`${btnColor} text-white px-6 py-2.5 rounded-xl font-bold`}>← Quay lại</button>
      </div>
    )
  }

  if (gameDone) {
    return (
      <div className="flex flex-col min-h-screen">
        {showConf && <Confetti />}
        <div className={`bg-gradient-to-br ${gradient} px-4 pt-12 pb-8 text-white`}>
          <button onClick={() => router.push(backUrl)} className="text-white/80 font-bold text-sm flex items-center gap-1 mb-4">← {lesson.title}</button>
          <h1 className="text-2xl font-black">🎤 Phát âm cùng AI ✨</h1>
        </div>
        <div className="flex-1 bg-gradient-to-b from-rose-50 to-pink-50 flex flex-col items-center justify-center px-4 py-8">
          <div className="text-7xl mb-4">{totalScore >= 70 ? '🏆' : totalScore >= 50 ? '⭐' : '💪'}</div>
          <h2 className="text-3xl font-black text-gray-800 mb-1">{totalScore}%</h2>
          <p className="text-gray-500 font-bold text-sm mb-6">
            {totalScore >= 70 ? 'Xuất sắc! Phát âm rất chuẩn.' : totalScore >= 50 ? 'Tốt! Luyện thêm nhé.' : 'Cần luyện thêm — thử lại nhé!'}
          </p>
          <div className="w-full space-y-3">
            <button onClick={() => { setStep(0); setScores([]); setGameDone(false); setShowConf(false) }}
              className={`w-full ${btnColor} text-white font-black text-xl py-4 rounded-2xl shadow-lg`}>🔄 Chơi lại</button>
            <button onClick={() => router.push(backUrl)} className="w-full bg-white border-2 border-gray-200 text-gray-600 font-bold text-xl py-4 rounded-2xl">← Xem bài học</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-rose-50">
      {/* Header */}
      <div className={`bg-gradient-to-br ${gradient} px-4 pt-12 pb-4 text-white`}>
        <button onClick={() => router.push(backUrl)} className="text-white/80 font-bold text-sm flex items-center gap-1 mb-3">← {lesson.title}</button>
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-black">🎤 Phát âm cùng AI</h1>
          <span className="bg-white/20 px-3 py-1 rounded-full font-black text-sm">{step + 1}/{total}</span>
        </div>
        <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full bg-white/70 rounded-full transition-all" style={{ width: `${((step + 1) / total) * 100}%` }} />
        </div>
      </div>

      <div className="flex-1 flex flex-col px-4 py-4 gap-4">
        {/* Sentence card */}
        <div className="bg-white rounded-3xl p-5 shadow-md w-full">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 flex flex-col gap-2">
              <HighlightedSentence en={current.en} targets={current.targets} />
              {current.vi && <p className="text-sm text-gray-400 font-medium text-center">{current.vi}</p>}
              {current.targets.length > 0 && (
                <div className="flex flex-wrap gap-1.5 justify-center mt-1">
                  {current.targets.map(w => (
                    <span key={w} className="text-xs bg-indigo-50 text-indigo-600 border border-indigo-200 px-2 py-0.5 rounded-full font-bold">{w}</span>
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => speakSentence(current.en, { rate: 0.85 })}
              className="flex-shrink-0 w-9 h-9 rounded-full bg-rose-50 flex items-center justify-center text-lg active:scale-90 transition-all">
              🔊
            </button>
          </div>
        </div>

        {/* Action zone */}
        <div className="flex-1 flex flex-col items-center justify-center gap-4">

          {phase === 'idle' && (
            <>
              <button onClick={startRecording}
                className="w-20 h-20 rounded-full bg-rose-400 shadow-xl flex items-center justify-center text-4xl active:scale-90 hover:bg-rose-500 transition-all">
                🎤
              </button>
              {micError
                ? <p className="text-red-500 font-semibold text-sm text-center max-w-xs">{micError}</p>
                : <p className="text-gray-400 font-semibold text-sm">Bấm để đọc</p>
              }
            </>
          )}

          {phase === 'countdown' && (
            <>
              <div className="w-20 h-20 rounded-full bg-rose-100 border-4 border-rose-300 flex items-center justify-center animate-pulse">
                <span className="text-5xl font-black text-rose-500">{countdown}</span>
              </div>
              <p className="text-rose-400 font-bold text-sm">Chuẩn bị đọc...</p>
              <button onClick={retry} className="text-gray-300 text-xs font-semibold underline active:scale-95">Huỷ</button>
            </>
          )}

          {phase === 'recording' && (
            <>
              <button onClick={stopRecording}
                className="w-20 h-20 rounded-full bg-rose-600 shadow-xl flex items-center justify-center text-3xl animate-pulse active:scale-95 transition-all">
                ⏹️
              </button>
              <p className="text-rose-500 font-bold text-sm animate-pulse">Đang thu âm...</p>
              <div className="w-full">
                <div className="w-full bg-rose-100 rounded-full h-2 overflow-hidden">
                  <div className="h-full bg-rose-400 rounded-full transition-all duration-1000"
                    style={{ width: `${(timeLeft / MAX_SECS) * 100}%` }} />
                </div>
                <p className="text-rose-300 text-xs font-semibold text-center mt-1">{timeLeft}s · bấm ⏹️ để dừng</p>
              </div>
            </>
          )}

          {phase === 'processing' && (
            <>
              <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center text-3xl animate-spin">⏳</div>
              <p className="text-indigo-400 font-bold text-sm">Đang chấm điểm...</p>
            </>
          )}

          {phase === 'done' && unclear && (
            <div className="w-full flex flex-col gap-3">
              <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 text-center">
                <p className="text-2xl mb-1">🔄</p>
                <p className="font-black text-amber-700">Chưa nghe rõ tiếng Anh</p>
                <p className="text-amber-500 text-sm mt-1">Đọc to hơn và gần micro hơn nhé!</p>
              </div>
              {playbackUrl && (
                <button onClick={() => new Audio(playbackUrl).play()}
                  className="w-full bg-white border-2 border-rose-100 text-rose-500 font-bold text-sm py-2.5 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all">
                  ▶️ Nghe lại giọng của bạn
                </button>
              )}
              <div className="flex gap-3">
                <button onClick={retry} className="flex-1 bg-rose-500 text-white font-black py-3 rounded-2xl shadow-md active:scale-95">🎤 Thử lại</button>
                <button onClick={advance} className="flex-1 bg-white border-2 border-gray-100 text-gray-400 font-bold py-3 rounded-2xl active:scale-95">Bỏ qua →</button>
              </div>
            </div>
          )}

          {phase === 'done' && !unclear && (
            <div className="w-full flex flex-col gap-3">
              <div className={`rounded-2xl p-4 text-center border-2 ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <p className="text-2xl mb-1">{isCorrect ? '✅' : '❌'}</p>
                {transcript && (
                  <p className="font-bold text-gray-600 text-sm">Bạn đọc: <span className="italic">&ldquo;{transcript}&rdquo;</span></p>
                )}
                {missed.length > 0 && (
                  <p className="text-red-500 text-xs font-semibold mt-1">Cần luyện: {missed.join(', ')}</p>
                )}
              </div>
              {playbackUrl && (
                <button onClick={() => new Audio(playbackUrl).play()}
                  className="w-full bg-white border-2 border-rose-100 text-rose-500 font-bold text-sm py-2.5 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all">
                  ▶️ Nghe lại giọng của bạn
                </button>
              )}
              <div className="flex gap-3">
                <button onClick={retry} className="flex-1 bg-white border-2 border-gray-100 text-gray-500 font-bold py-3 rounded-2xl active:scale-95">🔄 Thử lại</button>
                <button onClick={advance} className={`flex-1 font-black py-3 rounded-2xl shadow-md text-white active:scale-95 ${isCorrect ? 'bg-green-500' : btnColor}`}>
                  {step + 1 >= total ? 'Kết quả →' : 'Tiếp theo →'}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
