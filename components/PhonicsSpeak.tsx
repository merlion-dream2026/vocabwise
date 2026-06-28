'use client'

// Phát âm cùng AI — sentence-focused pronunciation practice with AI scoring.
// Flow: show sentence → tap "Nghe & Đọc theo" → TTS plays → 3-2-1 countdown → record → Groq scores.

import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { speak } from '@/lib/speak'
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
type Phase = 'idle' | 'listening' | 'countdown' | 'recording' | 'processing' | 'result' | 'done'

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
    <p className="text-xl font-bold text-center leading-relaxed px-2">
      {en.split(' ').map((w, i, arr) => {
        const clean = w.replace(/[.,!?'"]/g, '').toLowerCase()
        return (
          <span key={i}>
            <span className={hl.has(clean) ? 'text-indigo-700 font-black underline decoration-2 underline-offset-2' : 'text-gray-700'}>
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
  const router  = useRouter()
  const items   = buildItems(lesson)
  const [step, setStep]       = useState(0)
  const [phase, setPhase]     = useState<Phase>('idle')
  const [cd, setCd]           = useState(3)
  const [recSecs, setRecSecs] = useState(MAX_SECS)
  const [transcript, setTr]   = useState('')
  const [found, setFound]     = useState<string[]>([])
  const [missed, setMissed]   = useState<string[]>([])
  const [scores, setScores]   = useState<number[]>([])
  const [showConf, setShowConf] = useState(false)

  const mediaRef  = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null)
  const cdRef     = useRef<ReturnType<typeof setInterval> | null>(null)

  const current   = items[step]
  const totalScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 100) : 0

  const clearTimers = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    if (cdRef.current)    { clearInterval(cdRef.current);    cdRef.current    = null }
  }, [])

  const stopRecording = useCallback(() => {
    clearTimers()
    if (mediaRef.current?.state === 'recording') mediaRef.current.stop()
  }, [clearTimers])

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mime   = getBestMime()
      const rec    = new MediaRecorder(stream, { mimeType: mime })
      chunksRef.current = []
      rec.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      rec.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        setPhase('processing')
        try {
          const blob = new Blob(chunksRef.current, { type: mime })
          const fd   = new FormData()
          fd.append('audio', blob, `speak.${mime.split('/')[1]}`)
          fd.append('expected', current.en)
          const res  = await fetch('/api/score-pronunciation', { method: 'POST', body: fd })
          const data = await res.json()
          const tr   = (data.transcript ?? '').trim()
          setTr(tr)
          const { found: f, missed: m } = scoreResult(tr, current.targets)
          setFound(f); setMissed(m)
          const itemScore = current.targets.length > 0 ? f.length / current.targets.length : 1
          setScores(prev => [...prev, itemScore])
        } catch {
          setFound([]); setMissed(current.targets); setScores(prev => [...prev, 0])
        }
        setPhase('result')
      }
      rec.start(250)
      mediaRef.current = rec
      setPhase('recording')
      setRecSecs(MAX_SECS)
      let secs = MAX_SECS
      timerRef.current = setInterval(() => {
        secs -= 1; setRecSecs(secs)
        if (secs <= 0) stopRecording()
      }, 1000)
    } catch {
      setPhase('idle')
    }
  }, [current, stopRecording])

  const startCountdown = useCallback(() => {
    setPhase('countdown'); setCd(3)
    let c = 3
    cdRef.current = setInterval(() => {
      c -= 1; setCd(c)
      if (c <= 0) { clearInterval(cdRef.current!); cdRef.current = null; startRecording() }
    }, 700)
  }, [startRecording])

  const playSentence = useCallback(() => {
    if (phase !== 'idle' && phase !== 'result') return
    setPhase('listening')
    speak(current.en, {
      rate: 0.85,
      onEnd:  () => setTimeout(startCountdown, 300),
      onError: () => startCountdown(),
    })
  }, [phase, current, startCountdown])

  const next = useCallback(async () => {
    clearTimers()
    if (step + 1 >= items.length) {
      const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
      if (avg >= 0.7) {
        recordPairGame(lesson.id, 'speak', lesson.masteryGames ?? [])
        setShowConf(true)
      }
      await flushPhonics()
      setPhase('done')
    } else {
      setStep(s => s + 1)
      setPhase('idle')
      setTr(''); setFound([]); setMissed([])
    }
  }, [step, items.length, scores, lesson, clearTimers])

  useEffect(() => () => {
    clearTimers()
    mediaRef.current?.stream?.getTracks().forEach(t => t.stop())
  }, [clearTimers])

  if (!items.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-5xl mb-2">🎤</p>
        <p className="text-gray-500 text-sm font-semibold text-center">Lesson này chưa có câu để luyện phát âm.</p>
        <button onClick={() => router.push(backUrl)} className={`${btnColor} text-white px-6 py-2.5 rounded-xl font-bold`}>← Quay lại</button>
      </div>
    )
  }

  if (phase === 'done') {
    return (
      <div className={`min-h-screen bg-gradient-to-b ${gradient} flex flex-col items-center justify-center gap-6 px-4`}>
        {showConf && <Confetti />}
        <div className="text-6xl">{totalScore >= 70 ? '🏆' : totalScore >= 50 ? '⭐' : '💪'}</div>
        <div className="bg-white rounded-3xl p-6 w-full max-w-sm text-center shadow-xl">
          <p className="text-3xl font-black text-gray-800 mb-1">{totalScore}%</p>
          <p className="text-gray-500 text-sm mb-4">
            {totalScore >= 70 ? 'Xuất sắc! Phát âm rất chuẩn.' : totalScore >= 50 ? 'Tốt! Luyện thêm nhé.' : 'Cần luyện thêm — thử lại nhé!'}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => { setStep(0); setPhase('idle'); setScores([]); setTr(''); setFound([]); setMissed([]) }}
              className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl font-bold text-sm">
              🔁 Thử lại
            </button>
            <button onClick={() => router.push(backUrl)} className={`flex-1 ${btnColor} text-white py-2.5 rounded-xl font-bold text-sm`}>
              Xong ✓
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className={`bg-gradient-to-r ${gradient} text-white px-4 py-3`}>
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button onClick={() => router.push(backUrl)} className="text-white/70 hover:text-white text-xl">←</button>
          <div className="flex-1">
            <p className="font-black text-sm">🎤 Phát âm cùng AI — {lesson.title}</p>
            <div className="h-1.5 bg-white/20 rounded-full mt-1 overflow-hidden">
              <div className="h-full bg-white/70 rounded-full transition-all" style={{ width: `${Math.round((step / items.length) * 100)}%` }}/>
            </div>
          </div>
          <span className="font-bold text-sm text-white/80">{step + 1}/{items.length}</span>
        </div>
      </div>

      <div className="flex-1 max-w-lg mx-auto w-full px-4 py-6 flex flex-col gap-4">

        <div className="bg-indigo-50 rounded-2xl border border-indigo-100 px-4 py-3 text-xs text-indigo-700 font-semibold">
          🎯 Nghe câu rồi <strong>đọc to theo</strong> — chú ý từ <strong className="text-amber-600 underline">được gạch chân</strong>
        </div>

        {/* Sentence card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-5">
          <HighlightedSentence en={current.en} targets={current.targets} />
          {current.vi && <p className="text-center text-sm text-gray-400 mt-2 font-medium">{current.vi}</p>}
          {current.targets.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5 justify-center">
              {current.targets.map(w => (
                <span key={w} className="text-xs bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-bold">{w}</span>
              ))}
            </div>
          )}
          {(phase === 'idle' || phase === 'result') && (
            <button onClick={playSentence}
              className="mt-3 mx-auto block bg-indigo-100 text-indigo-600 font-bold text-sm px-4 py-2 rounded-xl active:scale-90">
              🔊 Nghe mẫu
            </button>
          )}
        </div>

        {/* Phase UIs */}
        {phase === 'idle' && (
          <button onClick={playSentence}
            className={`w-full ${btnColor} text-white py-4 rounded-2xl font-black text-base active:scale-95 shadow-sm`}>
            ▶ Nghe & Đọc theo
          </button>
        )}

        {phase === 'listening' && (
          <div className="bg-blue-50 rounded-2xl border border-blue-100 py-5 flex flex-col items-center gap-2">
            <div className="text-3xl animate-pulse">🔊</div>
            <p className="text-blue-700 font-bold text-sm">Đang phát… nghe kỹ nhé!</p>
          </div>
        )}

        {phase === 'countdown' && (
          <div className="bg-amber-50 rounded-2xl border border-amber-100 py-6 flex flex-col items-center gap-2">
            <p className="text-6xl font-black text-amber-500 tabular-nums">{cd}</p>
            <p className="text-amber-600 font-bold text-sm">Chuẩn bị đọc...</p>
          </div>
        )}

        {phase === 'recording' && (
          <div className="bg-red-50 rounded-2xl border border-red-100 py-5 flex flex-col items-center gap-3">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center animate-pulse">
                <span className="text-white text-3xl">🎙</span>
              </div>
              <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-600 text-white text-xs font-black rounded-full flex items-center justify-center">{recSecs}</span>
            </div>
            <p className="text-red-700 font-bold text-sm">Đang ghi âm… đọc to và rõ!</p>
            <button onClick={stopRecording} className="text-xs text-red-500 underline">Xong sớm</button>
          </div>
        )}

        {phase === 'processing' && (
          <div className="bg-gray-50 rounded-2xl border border-gray-100 py-5 flex flex-col items-center gap-2">
            <div className="text-3xl animate-spin">⚙️</div>
            <p className="text-gray-600 font-bold text-sm">AI đang chấm…</p>
          </div>
        )}

        {phase === 'result' && (
          <div className="space-y-3">
            {transcript && (
              <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">AI nghe được:</p>
                <p className="text-sm text-gray-700 italic">&ldquo;{transcript}&rdquo;</p>
              </div>
            )}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-4">
              {found.length > 0 && (
                <div className="mb-2">
                  <p className="text-[10px] font-bold text-green-600 uppercase mb-1.5">✅ Đúng ({found.length})</p>
                  <div className="flex flex-wrap gap-1.5">
                    {found.map(w => <span key={w} className="text-xs bg-green-100 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-bold">{w}</span>)}
                  </div>
                </div>
              )}
              {missed.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-red-500 uppercase mb-1.5">❌ Cần luyện lại ({missed.length})</p>
                  <div className="flex flex-wrap gap-1.5">
                    {missed.map(w => <span key={w} className="text-xs bg-red-100 text-red-600 border border-red-200 px-2 py-0.5 rounded-full font-bold">{w}</span>)}
                  </div>
                </div>
              )}
              {current.targets.length === 0 && (
                <p className="text-sm text-gray-500 text-center">Luyện câu hoàn chỉnh</p>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setPhase('idle'); setTr(''); setFound([]); setMissed([]) }}
                className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-2xl font-bold text-sm active:scale-95">
                🔁 Thử lại
              </button>
              <button onClick={next}
                className={`flex-1 ${btnColor} text-white py-3 rounded-2xl font-bold text-sm active:scale-95`}>
                {step + 1 >= items.length ? 'Xem kết quả →' : 'Tiếp theo →'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
