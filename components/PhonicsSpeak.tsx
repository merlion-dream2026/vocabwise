'use client'

// Phonics Speak game — two phases per session:
// Phase 1 (words): 3 words per sound (pair lessons) or 6 words (solo lessons)
// Phase 2 (sentences): up to 4 sentences with target phoneme words highlighted
// Scoring via Groq Whisper → /api/score-pronunciation

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { speak as speakWord } from '@/lib/speak'
import { recordPairGame, flushPhonics, recordSoundResult } from '@/lib/phonicsSync'
import Confetti from '@/components/Confetti'

type Sound            = { symbol: string; keyword: string; emoji: string; wikiAudio?: string | null }
type PracticeSentence = { en: string; highlight: string[] }
type PairLesson       = {
  id: string; title: string; emoji: string
  sounds: Sound[]
  practice_words: string[]
  practice_sentences?: PracticeSentence[]
  tip?: string
}

type WordQuestion = {
  kind: 'word'
  word: string
  soundSymbol: string; soundKeyword: string; soundEmoji: string
  contrastWords: string[]
}
type SentenceQuestion = {
  kind: 'sentence'
  sentence: string; highlight: string[]; targetWord: string
}
type Question = WordQuestion | SentenceQuestion

const MAX_SECS = 8
type RecordPhase = 'idle' | 'recording' | 'processing' | 'done'

function getBestMime() {
  for (const t of ['audio/webm', 'audio/mp4', 'audio/ogg']) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)) return t
  }
  return 'audio/webm'
}

function buildQuestions(lesson: PairLesson): Question[] {
  const qs: Question[] = []
  const words = lesson.practice_words

  if (lesson.sounds.length >= 2) {
    // interleaved: even indices → sound[0], odd → sound[1] (all available words)
    const s0 = words.filter((_, i) => i % 2 === 0)
    const s1 = words.filter((_, i) => i % 2 === 1)
    for (const w of s0) qs.push({ kind: 'word', word: w, soundSymbol: lesson.sounds[0].symbol, soundKeyword: lesson.sounds[0].keyword, soundEmoji: lesson.sounds[0].emoji, contrastWords: s1 })
    for (const w of s1) qs.push({ kind: 'word', word: w, soundSymbol: lesson.sounds[1].symbol, soundKeyword: lesson.sounds[1].keyword, soundEmoji: lesson.sounds[1].emoji, contrastWords: s0 })
  } else {
    const s = lesson.sounds[0]
    for (const w of words.slice(0, 6)) qs.push({ kind: 'word', word: w, soundSymbol: s.symbol, soundKeyword: s.keyword, soundEmoji: s.emoji, contrastWords: [] })
  }

  for (const sent of (lesson.practice_sentences ?? []).slice(0, 4)) {
    qs.push({ kind: 'sentence', sentence: sent.en, highlight: sent.highlight, targetWord: sent.highlight[0] ?? '' })
  }
  return qs
}

function HighlightedSentence({ sentence, highlight }: { sentence: string; highlight: string[] }) {
  const hl = new Set(highlight.map(h => h.toLowerCase()))
  return (
    <p className="text-xl font-bold text-center leading-relaxed px-2">
      {sentence.split(' ').map((w, i, arr) => {
        const clean = w.replace(/[.,!?'"]/g, '').toLowerCase()
        return (
          <span key={i}>
            <span className={hl.has(clean) ? 'text-indigo-700 font-black underline decoration-2 underline-offset-2' : 'text-gray-600'}>
              {w}
            </span>
            {i < arr.length - 1 ? ' ' : ''}
          </span>
        )
      })}
    </p>
  )
}

export default function PhonicsSpeak({ lesson, childId, backUrl }: { lesson: PairLesson; childId: string; backUrl: string }) {
  const router = useRouter()
  const [questions] = useState<Question[]>(() => buildQuestions(lesson))
  const [idx, setIdx]           = useState(0)
  const [score, setScore]       = useState(0)
  const [phase, setPhase]       = useState<RecordPhase>('idle')
  const [transcript, setTranscript] = useState('')
  const [isCorrect, setIsCorrect]   = useState<boolean | null>(null)
  const [unclear, setUnclear]       = useState(false)
  const [micError, setMicError]     = useState<string | null>(null)
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null)
  const [timeLeft, setTimeLeft]     = useState(MAX_SECS)
  const [gameDone, setGameDone]     = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef        = useRef<MediaStream | null>(null)
  const chunksRef        = useRef<BlobPart[]>([])
  const timerRef         = useRef<ReturnType<typeof setInterval> | null>(null)
  const autoStopRef      = useRef<ReturnType<typeof setTimeout> | null>(null)
  const answeredRef      = useRef(false)
  const scoreRef         = useRef(0)

  const q     = questions[idx]
  const total = questions.length
  const wordCount = questions.filter(q => q.kind === 'word').length
  const inSentencePhase = q?.kind === 'sentence'

  const stopStream  = useCallback(() => { streamRef.current?.getTracks().forEach(t => t.stop()); streamRef.current = null }, [])
  const clearTimers = useCallback(() => {
    if (timerRef.current)    { clearInterval(timerRef.current);  timerRef.current = null }
    if (autoStopRef.current) { clearTimeout(autoStopRef.current); autoStopRef.current = null }
  }, [])

  useEffect(() => {
    if (gameDone) return
    setPhase('idle'); setTranscript(''); setIsCorrect(null)
    setUnclear(false); setMicError(null); setTimeLeft(MAX_SECS); answeredRef.current = false
    if (playbackUrl) { URL.revokeObjectURL(playbackUrl); setPlaybackUrl(null) }

    if (q?.kind === 'word') {
      const t = setTimeout(() => speakWord(q.word, { rate: 0.75 }), 350)
      return () => { clearTimeout(t); clearTimers(); window.speechSynthesis?.cancel(); if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop(); stopStream() }
    }
    return () => { clearTimers(); window.speechSynthesis?.cancel(); if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop(); stopStream() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, gameDone])

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
      mediaRecorderRef.current = mr
      setPhase('recording'); setTimeLeft(MAX_SECS)
      timerRef.current = setInterval(() => setTimeLeft(p => { if (p <= 1) { clearTimers(); return 0 } return p - 1 }), 1000)
      autoStopRef.current = setTimeout(() => { if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop(); clearTimers() }, MAX_SECS * 1000)
    } catch (e: unknown) {
      const name = (e as { name?: string }).name
      setMicError(name === 'NotAllowedError' ? 'Chưa cấp quyền micro. Vào Settings → cho phép Microphone.' : 'Không thể mở micro. Thử lại nhé.')
    }
  }

  const stopRecording = () => { clearTimers(); if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop() }

  const scoreAudio = async (blob: Blob, mimeType: string) => {
    setPhase('processing')
    try {
      const ext = mimeType.includes('mp4') ? 'm4a' : mimeType.includes('ogg') ? 'ogg' : 'webm'
      const fd = new FormData()
      fd.append('audio', new File([blob], `rec.${ext}`, { type: mimeType }))
      if (q.kind === 'word') {
        fd.append('target', q.word); fd.append('word', q.word)
        if (q.contrastWords.length > 0) fd.append('contrastWords', q.contrastWords.join(','))
      } else {
        fd.append('target', q.sentence); fd.append('word', q.targetWord)
      }
      const res = await fetch('/api/score-pronunciation', { method: 'POST', body: fd })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setTranscript(data.transcript ?? ''); setIsCorrect(!!data.correct); setUnclear(!!data.unclear); setPhase('done')
      if (!data.unclear && q.kind === 'word') recordSoundResult(q.soundSymbol, !!data.correct)
      if (!data.unclear && !!data.correct && !answeredRef.current) { answeredRef.current = true; scoreRef.current++; setScore(scoreRef.current) }
    } catch { setMicError('Lỗi kết nối. Bấm Thử lại.'); setPhase('idle') }
  }

  const retry = () => {
    clearTimers(); if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop(); stopStream()
    if (playbackUrl) { URL.revokeObjectURL(playbackUrl); setPlaybackUrl(null) }
    setTranscript(''); setIsCorrect(null); setUnclear(false); setMicError(null); setTimeLeft(MAX_SECS); setPhase('idle')
  }

  const advance = () => {
    clearTimers(); if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop(); stopStream()
    const next = idx + 1
    if (next >= total) {
      const finalScore = scoreRef.current
      if (finalScore / total >= 0.7) { recordPairGame(lesson.id as Parameters<typeof recordPairGame>[0], 'speak'); flushPhonics() }
      if (finalScore === total) setShowConfetti(true)
      setGameDone(true)
    } else {
      setIdx(next)
    }
  }

  const restart = () => {
    clearTimers(); stopStream(); if (playbackUrl) URL.revokeObjectURL(playbackUrl)
    setIdx(0); setScore(0); setPhase('idle'); setTranscript(''); setIsCorrect(null)
    setUnclear(false); setMicError(null); setTimeLeft(MAX_SECS); setGameDone(false); setShowConfetti(false); setPlaybackUrl(null)
    answeredRef.current = false; scoreRef.current = 0
  }

  // ─── End screen ───────────────────────────────────────────────
  if (gameDone) {
    const pct = Math.round((score / total) * 100)
    return (
      <div className="flex flex-col min-h-screen">
        {showConfetti && <Confetti />}
        <div className="bg-gradient-to-br from-indigo-500 to-blue-600 px-4 pt-12 pb-8 text-white">
          <button onClick={() => router.push(backUrl)} className="text-white/80 font-bold text-sm flex items-center gap-1 mb-4">← {lesson.title}</button>
          <h1 className="text-2xl font-black">🎤 Luyện đọc</h1>
        </div>
        <div className="flex-1 bg-gradient-to-b from-indigo-50 to-blue-50 flex flex-col items-center justify-center px-4 py-8">
          <div className="text-7xl mb-4">{score === total ? '🏆' : score >= total * 0.7 ? '⭐' : '💪'}</div>
          <h2 className="text-3xl font-black text-gray-800 mb-1">{score}/{total} chính xác</h2>
          <p className="text-gray-500 font-bold text-xl mb-2">{pct}%</p>
          {score < total * 0.7 && <p className="text-sm text-gray-400 font-semibold mb-6">Cần ≥70% để đánh dấu hoàn thành</p>}
          <div className="w-full space-y-3 mt-4">
            <button onClick={restart} className="w-full bg-indigo-500 text-white font-black text-xl py-4 rounded-2xl shadow-lg">🔄 Chơi lại</button>
            <button onClick={() => router.push(backUrl)} className="w-full bg-white border-2 border-gray-200 text-gray-600 font-bold text-xl py-4 rounded-2xl">← Xem bài học</button>
          </div>
        </div>
      </div>
    )
  }

  // ─── Game screen ──────────────────────────────────────────────
  const speakTarget = q.kind === 'word' ? q.word : q.sentence

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-500 to-blue-600 px-4 pt-12 pb-4 text-white">
        <button onClick={() => router.push(backUrl)} className="text-white/80 font-bold text-sm flex items-center gap-1 mb-3">← {lesson.title}</button>
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-black">🎤 Luyện đọc</h1>
          <span className="bg-white/20 px-3 py-1 rounded-full font-black text-sm">{idx + 1}/{total}</span>
        </div>
        <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full bg-white/70 rounded-full transition-all duration-300" style={{ width: `${((idx + 1) / total) * 100}%` }} />
        </div>
        {/* Phase label */}
        <p className="text-white/60 text-xs font-semibold mt-1.5">
          {inSentencePhase ? `Câu ${idx - wordCount + 1}/4 — đọc cả câu, chú ý từ tô màu` : `Từ ${idx + 1}/${wordCount} — luyện từng âm riêng`}
        </p>
      </div>

      <div className="flex-1 bg-gradient-to-b from-indigo-50 to-blue-50 flex flex-col items-center justify-center px-4 gap-4">
        {/* Score dots */}
        <div className="flex gap-1.5 flex-wrap justify-center">
          {questions.map((_, i) => (
            <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i < score ? 'bg-green-400' : i === idx ? 'bg-indigo-400' : 'bg-gray-200'}`} />
          ))}
        </div>

        {/* Question card */}
        <div className="bg-white rounded-3xl px-5 py-5 shadow-md w-full text-center">
          {q.kind === 'word' ? (
            <>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wide mb-2">Đọc từ này</p>
              <p className="text-5xl font-black text-gray-800 mb-2">{q.word}</p>
              <p className="text-sm text-indigo-500 font-bold mb-3">/{q.soundSymbol}/ — {q.soundKeyword} {q.soundEmoji}</p>
            </>
          ) : (
            <>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wide mb-3">Đọc cả câu — chú ý từ <span className="text-indigo-600">được gạch chân</span></p>
              <HighlightedSentence sentence={q.sentence} highlight={q.highlight} />
            </>
          )}

          <button onClick={() => speakWord(speakTarget, { rate: 0.75 })}
            className="mt-3 bg-indigo-100 text-indigo-600 font-bold text-sm px-4 py-2 rounded-xl active:scale-90 transition-transform">
            🔊 Nghe mẫu
          </button>

          {/* Result feedback */}
          {phase === 'done' && !unclear && (
            <div className={`mt-3 rounded-xl px-3 py-2.5 border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <p className="text-sm font-bold text-gray-800">{isCorrect ? '✅ Tốt lắm!' : '❌ Chưa đúng'}</p>
              {transcript && <p className="text-xs text-gray-500 mt-0.5">Bạn đọc: <em>&ldquo;{transcript}&rdquo;</em></p>}
              {!isCorrect && <p className="text-xs text-green-700 font-semibold mt-0.5">Đáp án: <strong>&ldquo;{speakTarget}&rdquo;</strong></p>}
            </div>
          )}
          {phase === 'done' && unclear && (
            <div className="mt-3 rounded-xl px-3 py-2.5 border bg-amber-50 border-amber-200">
              <p className="text-sm font-bold text-amber-700">🔄 Chưa nghe rõ — đọc to hơn nhé!</p>
            </div>
          )}
        </div>

        {/* Recording controls */}
        {phase === 'idle' && (
          <div className="flex flex-col items-center gap-3 w-full">
            <button onClick={startRecording}
              className="w-20 h-20 rounded-full bg-indigo-500 shadow-lg flex items-center justify-center text-4xl active:scale-90 transition-all hover:bg-indigo-600">
              🎤
            </button>
            {micError
              ? <p className="text-red-600 font-semibold text-sm text-center max-w-xs">{micError}</p>
              : <p className="text-gray-400 font-semibold text-sm">Bấm micro rồi đọc to</p>}
            <button onClick={advance} className="text-gray-400 font-semibold text-sm underline active:scale-95">Bỏ qua →</button>
          </div>
        )}

        {phase === 'recording' && (
          <div className="flex flex-col items-center gap-3 w-full">
            <button onClick={stopRecording}
              className="w-20 h-20 rounded-full bg-red-500 shadow-lg flex items-center justify-center text-4xl animate-pulse active:scale-95">
              ⏹️
            </button>
            <p className="text-red-500 font-bold text-sm animate-pulse">Đang thu âm... · bấm ⏹️ để dừng</p>
            <div className="w-full bg-indigo-100 rounded-full h-2 overflow-hidden">
              <div className="h-full bg-indigo-400 rounded-full transition-all duration-1000" style={{ width: `${(timeLeft / MAX_SECS) * 100}%` }} />
            </div>
            <p className="text-indigo-400 text-xs font-semibold">Tự động dừng sau {timeLeft}s</p>
          </div>
        )}

        {phase === 'processing' && (
          <div className="flex flex-col items-center gap-3 py-2">
            <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center text-3xl animate-spin">⏳</div>
            <p className="text-indigo-500 font-bold text-sm">Đang chấm điểm...</p>
          </div>
        )}

        {phase === 'done' && (
          <div className="w-full flex flex-col gap-3">
                    <div className="flex gap-3 w-full">
              <button onClick={() => speakWord(speakTarget, { rate: 0.75 })}
                className="flex-1 bg-indigo-50 border-2 border-indigo-200 text-indigo-600 font-bold text-sm py-3 rounded-2xl flex items-center justify-center gap-1.5 active:scale-95">
                🔊 Mẫu
              </button>
              {playbackUrl && (
                <button onClick={() => new Audio(playbackUrl).play()}
                  className="flex-1 bg-gray-50 border-2 border-gray-200 text-gray-600 font-bold text-sm py-3 rounded-2xl flex items-center justify-center gap-1.5 active:scale-95">
                  🎙️ Bạn
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={retry} className="flex-1 bg-white border-2 border-gray-200 text-gray-600 font-bold text-base py-3 rounded-2xl active:scale-95">
                🔄 Thử lại
              </button>
              <button onClick={advance}
                className={`flex-1 font-black text-base py-3 rounded-2xl shadow-md text-white ${isCorrect ? 'bg-green-500' : 'bg-indigo-500'}`}>
                {idx + 1 >= total ? 'Kết quả →' : 'Tiếp theo →'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
