'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { playCorrectSound, playWrongSound } from '@/lib/gameSound'
import { speak as speakWord } from '@/lib/speak'
import GameSoundToggle from '@/components/GameSoundToggle'
import { pickTestSet, TEST_SET_COUNT } from '@/lib/testSetRotation'
import UpgradeModal from '@/components/UpgradeModal'
import { getEffectivePlan } from '@/lib/planUtils'
import { cachedFetch } from '@/lib/cachedFetch'
import { useGameSync } from '@/lib/GameSyncContext'

type Session = { plan: string; username: string; plan_end_date?: string | null; bonus_pro_expires_at?: string | null; free_trial_expires_at?: string | null; bonus_features?: string[] | null }

type WordItem = { word: string; meaning: string; emoji: string; examples: { en: string; vi: string }[] }
type FlatWord = { word: string; meaning_vi: string; example_en: string; example_vi: string; emoji: string }
type MCQQuestion = { word: string; correct: string; options: string[] }
type FIBQuestion = { blanked: string; word: string; meaning_vi: string; correct: string; options: string[] }
type MatchPair  = { word: string; meaning: string }
type SpeakQuestion = { word: string; meaning_vi: string; emoji: string; target: string; isSentence: boolean; example_vi: string }

type Phase =
  | 'loading' | 'intro'
  | 'mcq' | 'mcq_done'
  | 'fib' | 'fib_done'
  | 'match1' | 'match1_done'
  | 'match2' | 'match2_done'
  | 'speak' | 'result'

const LEVEL_COLORS: Record<string, { header: string; accent: string; light: string }> = {
  seeker:   { header: 'bg-violet-500',  accent: 'bg-violet-400',  light: 'from-violet-50 to-purple-50'  },
  starter:  { header: 'bg-pink-500',    accent: 'bg-pink-400',    light: 'from-pink-50 to-rose-50'      },
  ranger:   { header: 'bg-emerald-500', accent: 'bg-emerald-400', light: 'from-emerald-50 to-teal-50'   },
  explorer: { header: 'bg-blue-500',    accent: 'bg-blue-400',    light: 'from-blue-50 to-indigo-50'    },
  scholar:  { header: 'bg-indigo-500',  accent: 'bg-indigo-400',  light: 'from-indigo-50 to-violet-50'  },
  master:   { header: 'bg-gray-700',    accent: 'bg-gray-600',    light: 'from-gray-50 to-slate-100'    },
}

const TOTAL_MAX = 40 // 15 MCQ + 10 FIB + 5+5 Matching + 5 Speak

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function blankWord(sentence: string, word: string): string {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`\\b${escaped}(?:s|es|ed|ing|er)?\\b`, 'gi')
  const result = sentence.replace(regex, '______')
  return result !== sentence ? result : sentence.replace(
    new RegExp(`\\b${escaped.slice(0, Math.max(3, escaped.length - 1))}\\w*\\b`, 'gi'), '______'
  )
}

function buildQuestions(chunk: FlatWord[]) {
  const words   = shuffle(chunk).slice(0, 40)
  const mcqW    = words.slice(0, 15)
  const fibW    = words.slice(15, 25)
  const match1  = words.slice(25, 30)
  const match2  = words.slice(30, 35)
  const speakW  = words.slice(35, 40)

  function distractMeanings(exclude: string): string[] {
    const seen = new Set([exclude])
    const result: string[] = []
    for (const w of shuffle([...chunk])) {
      if (!seen.has(w.meaning_vi)) { seen.add(w.meaning_vi); result.push(w.meaning_vi) }
      if (result.length === 3) break
    }
    return result
  }
  function distractWords(exclude: string): string[] {
    const seen = new Set([exclude])
    const result: string[] = []
    for (const w of shuffle([...chunk])) {
      if (!seen.has(w.word)) { seen.add(w.word); result.push(w.word) }
      if (result.length === 3) break
    }
    return result
  }

  const mcq: MCQQuestion[] = mcqW.map(item => ({
    word: item.word,
    correct: item.meaning_vi,
    options: shuffle([item.meaning_vi, ...distractMeanings(item.meaning_vi)]),
  }))

  const fib: FIBQuestion[] = fibW.map(item => ({
    blanked: blankWord(item.example_en, item.word),
    word: item.word, meaning_vi: item.meaning_vi, correct: item.word,
    options: shuffle([item.word, ...distractWords(item.word)]),
  }))

  const speak: SpeakQuestion[] = speakW.map(item => {
    const wordCount = item.example_en ? item.example_en.split(' ').length : 0
    const isSentence = !!item.example_en && wordCount > 0 && wordCount <= 15
    return {
      word: item.word, meaning_vi: item.meaning_vi, emoji: item.emoji,
      target: isSentence ? item.example_en : item.word,
      isSentence,
      example_vi: item.example_vi,
    }
  })

  return {
    mcq, fib, speak,
    match1: match1.map(i => ({ word: i.word, meaning: i.meaning_vi })) as MatchPair[],
    match2: match2.map(i => ({ word: i.word, meaning: i.meaning_vi })) as MatchPair[],
  }
}

// ── MCQ ───────────────────────────────────────────────────────────────────────
function MCQRound({ questions, accentCls, onDone }: { questions: MCQQuestion[]; accentCls: string; onDone: (s: number) => void }) {
  const [idx, setIdx]       = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [score, setScore]   = useState(0)
  const q = questions[idx]

  function pick(opt: string) {
    if (selected) return
    setSelected(opt)
    const correct = opt === q.correct
    if (correct) { setScore(s => s + 1); playCorrectSound() } else { playWrongSound() }
    setTimeout(() => {
      if (idx + 1 < questions.length) { setIdx(i => i + 1); setSelected(null) }
      else onDone(correct ? score + 1 : score)
    }, 700)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between text-xs text-gray-400 font-bold">
        <span>Câu {idx + 1}/{questions.length}</span><span>{score} đúng</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${accentCls} rounded-full transition-all duration-300`}
          style={{ width: `${(idx / questions.length) * 100}%` }} />
      </div>
      <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-sm p-6 text-center">
        <p className="text-2xl font-black text-gray-800 mb-1">{q.word}</p>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-3">Nghĩa tiếng Việt là gì?</p>
      </div>
      <div className="grid grid-cols-1 gap-2.5">
        {q.options.map(opt => {
          const isSelected = selected === opt
          const isCorrect = opt === q.correct
          let cls = 'bg-white border-2 border-gray-100 text-gray-700'
          if (selected) {
            if (isCorrect) cls = 'bg-green-50 border-2 border-green-400 text-green-800'
            else if (isSelected) cls = 'bg-red-50 border-2 border-red-400 text-red-700'
            else cls = 'bg-white border-2 border-gray-100 text-gray-400 opacity-60'
          }
          return (
            <button key={opt} onClick={() => pick(opt)}
              className={`w-full rounded-2xl px-4 py-3.5 text-left font-semibold text-sm transition-all active:scale-[0.98] shadow-sm ${cls}`}>
              {isSelected && selected && (isCorrect ? '✓ ' : '✗ ')}{opt}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── FIB ───────────────────────────────────────────────────────────────────────
function FIBRound({ questions, accentCls, onDone }: { questions: FIBQuestion[]; accentCls: string; onDone: (s: number) => void }) {
  const [idx, setIdx]       = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [score, setScore]   = useState(0)
  const q = questions[idx]

  function pick(opt: string) {
    if (selected) return
    setSelected(opt)
    const correct = opt === q.correct
    if (correct) { setScore(s => s + 1); playCorrectSound() } else { playWrongSound() }
    setTimeout(() => {
      if (idx + 1 < questions.length) { setIdx(i => i + 1); setSelected(null) }
      else onDone(correct ? score + 1 : score)
    }, 700)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between text-xs text-gray-400 font-bold">
        <span>Câu {idx + 1}/{questions.length}</span><span>{score} đúng</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${accentCls} rounded-full transition-all duration-300`}
          style={{ width: `${(idx / questions.length) * 100}%` }} />
      </div>
      <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-sm p-5">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Điền từ vào chỗ trống</p>
        <p className="text-base font-semibold text-gray-800 leading-relaxed">{q.blanked}</p>
        <p className="text-xs text-blue-500 font-semibold mt-2">💡 {q.meaning_vi}</p>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {q.options.map(opt => {
          const isSelected = selected === opt
          const isCorrect = opt === q.correct
          let cls = 'bg-white border-2 border-gray-100 text-gray-700'
          if (selected) {
            if (isCorrect) cls = 'bg-green-50 border-2 border-green-400 text-green-800'
            else if (isSelected) cls = 'bg-red-50 border-2 border-red-400 text-red-700'
            else cls = 'bg-white border-2 border-gray-100 text-gray-400 opacity-60'
          }
          return (
            <button key={opt} onClick={() => pick(opt)}
              className={`rounded-2xl px-4 py-3.5 font-bold text-sm transition-all active:scale-[0.98] shadow-sm ${cls}`}>
              {isSelected && selected && (isCorrect ? '✓ ' : '✗ ')}{opt}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Matching ──────────────────────────────────────────────────────────────────
function MatchRound({ pairs, setLabel, onDone }: { pairs: MatchPair[]; setLabel: string; onDone: (s: number) => void }) {
  const [words]    = useState(() => shuffle(pairs.map(p => p.word)))
  const [meanings] = useState(() => shuffle(pairs.map(p => p.meaning)))
  const wordToMeaning = Object.fromEntries(pairs.map(p => [p.word, p.meaning]))

  const [selWord, setSelWord]     = useState<string | null>(null)
  const [matched, setMatched]     = useState<Set<string>>(new Set())
  const [wrongWord, setWrongWord] = useState<string | null>(null)
  const [score, setScore]         = useState(0)
  const matchedMeanings = new Set(Array.from(matched).map(w => wordToMeaning[w]))

  useEffect(() => {
    if (matched.size === pairs.length) setTimeout(() => onDone(score), 600)
  }, [matched, pairs.length, score, onDone])

  function tapWord(w: string) {
    if (matched.has(w)) return
    setSelWord(w === selWord ? null : w)
  }
  function tapMeaning(m: string) {
    if (!selWord || matchedMeanings.has(m)) return
    if (wordToMeaning[selWord] === m) {
      setMatched(s => new Set([...s, selWord])); setScore(n => n + 1); setSelWord(null)
      playCorrectSound()
    } else {
      setWrongWord(selWord); setSelWord(null)
      playWrongSound()
      setTimeout(() => setWrongWord(null), 600)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between text-xs text-gray-400 font-bold">
        <span>{setLabel} — Nối từ với nghĩa</span>
        <span>{score}/{pairs.length} cặp</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2.5">
          {words.map(w => {
            const isMatched  = matched.has(w)
            const isSelected = selWord === w
            const isWrong    = wrongWord === w
            let cls = 'bg-white border-2 border-gray-100 text-gray-700'
            if (isMatched)   cls = 'bg-gray-50 border-2 border-gray-100 text-gray-300 line-through'
            else if (isWrong)   cls = 'bg-red-50 border-2 border-red-300 text-red-600'
            else if (isSelected) cls = `bg-white border-2 border-purple-400 text-purple-800 shadow-md`
            return (
              <button key={w} onClick={() => tapWord(w)} disabled={isMatched}
                className={`w-full rounded-xl px-3 py-2.5 text-sm font-bold text-left transition-all ${cls}`}>
                {w}
              </button>
            )
          })}
        </div>
        <div className="space-y-2.5">
          {meanings.map(m => {
            const isMatched = matchedMeanings.has(m)
            let cls = 'bg-white border-2 border-gray-100 text-gray-700'
            if (isMatched) cls = 'bg-green-50 border-2 border-green-200 text-green-400 line-through'
            else if (selWord) cls = 'bg-white border-2 border-gray-200 text-gray-700 hover:bg-purple-50 hover:border-purple-300'
            return (
              <button key={m} onClick={() => tapMeaning(m)} disabled={isMatched}
                className={`w-full rounded-xl px-3 py-2.5 text-sm font-semibold text-left transition-all ${cls}`}>
                {m}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Speak (production) ─────────────────────────────────────────────────────────
function getBestMime() {
  for (const t of ['audio/webm', 'audio/mp4', 'audio/ogg']) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)) return t
  }
  return 'audio/webm'
}
const SPEAK_MAX_SECS = 8

function SpeakRound({ questions, accentCls, onDone }: { questions: SpeakQuestion[]; accentCls: string; onDone: (s: number) => void }) {
  const [idx, setIdx]     = useState(0)
  const [score, setScore] = useState(0)
  const [phase, setPhase] = useState<'idle' | 'recording' | 'processing' | 'done'>('idle')
  const [transcript, setTranscript] = useState('')
  const [isCorrect, setIsCorrect]   = useState<boolean | null>(null)
  const [unclear, setUnclear]       = useState(false)
  const [micError, setMicError]     = useState<string | null>(null)
  const [timeLeft, setTimeLeft]     = useState(SPEAK_MAX_SECS)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const autoStopRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const q = questions[idx]
  const total = questions.length

  const clearTimers = useCallback(() => {
    if (timerRef.current)    { clearInterval(timerRef.current);   timerRef.current = null }
    if (autoStopRef.current) { clearTimeout(autoStopRef.current); autoStopRef.current = null }
  }, [])
  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
  }, [])

  useEffect(() => {
    setPhase('idle'); setTranscript(''); setIsCorrect(null); setUnclear(false)
    setMicError(null); setTimeLeft(SPEAK_MAX_SECS)
    return () => { clearTimers(); window.speechSynthesis?.cancel() }
  }, [idx, clearTimers])

  const startRecording = async () => {
    setMicError(null)
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
        await scoreAudio(blob, mimeType)
      }
      mr.start()
      mediaRecorderRef.current = mr
      setPhase('recording')
      setTimeLeft(SPEAK_MAX_SECS)
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => { if (prev <= 1) { clearTimers(); return 0 }; return prev - 1 })
      }, 1000)
      autoStopRef.current = setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop()
        clearTimers()
      }, SPEAK_MAX_SECS * 1000)
    } catch (e: unknown) {
      const name = (e as { name?: string }).name
      setMicError(name === 'NotAllowedError' ? 'Chưa cấp quyền micro.' : 'Không thể mở micro.')
    }
  }

  const stopRecording = () => {
    clearTimers()
    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop()
  }

  const scoreAudio = async (blob: Blob, mimeType: string) => {
    setPhase('processing')
    try {
      const ext = mimeType.includes('mp4') ? 'm4a' : mimeType.includes('ogg') ? 'ogg' : 'webm'
      const fd = new FormData()
      fd.append('audio', new File([blob], `rec.${ext}`, { type: mimeType }))
      fd.append('target', q.target)
      fd.append('word', q.word)
      const res = await fetch('/api/score-pronunciation', { method: 'POST', body: fd })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      const correct = !!data.correct
      const isUnclear = !!data.unclear
      setTranscript(data.transcript ?? '')
      setIsCorrect(correct)
      setUnclear(isUnclear)
      setPhase('done')
      if (!isUnclear) {
        if (correct) { setScore(s => s + 1); playCorrectSound() } else { playWrongSound() }
      }
    } catch {
      setMicError('Lỗi kết nối. Bấm Thử lại.')
      setPhase('idle')
    }
  }

  const advance = () => {
    clearTimers()
    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop()
    stopStream()
    if (idx + 1 < total) setIdx(i => i + 1)
    else onDone(score) // score already incremented in scoreAudio
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between text-xs text-gray-400 font-bold">
        <span>Câu {idx + 1}/{total}</span><span>{score} đúng</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${accentCls} rounded-full transition-all duration-300`}
          style={{ width: `${(idx / total) * 100}%` }} />
      </div>

      <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-sm p-5 text-center">
        <span className="text-4xl">{q.emoji}</span>
        <p className="text-2xl font-black text-gray-800 mt-1">{q.word}</p>
        <p className="text-sm text-gray-400 font-semibold">{q.meaning_vi}</p>
        {q.isSentence && (
          <>
            <div className="my-3 border-t border-gray-100" />
            <p className="text-base font-bold text-gray-700">&ldquo;{q.target}&rdquo;</p>
            {q.example_vi && <p className="text-sm text-gray-400 mt-1">{q.example_vi}</p>}
          </>
        )}
        <button onClick={() => speakWord(q.target, { rate: 0.85 })}
          className="mt-3 bg-gray-50 text-gray-500 font-bold px-4 py-1.5 rounded-xl text-xs active:scale-95 transition-all">
          🔊 Nghe lại
        </button>
      </div>

      <div className="flex flex-col items-center gap-3 py-2">
        {phase === 'idle' && (
          <>
            <button onClick={startRecording}
              className="w-20 h-20 rounded-full bg-rose-400 shadow-xl flex items-center justify-center text-4xl active:scale-90 hover:bg-rose-500 transition-all">
              🎤
            </button>
            {micError ? <p className="text-red-500 font-semibold text-sm text-center">{micError}</p> : <p className="text-gray-400 font-semibold text-sm">Bấm để đọc</p>}
          </>
        )}
        {phase === 'recording' && (
          <>
            <button onClick={stopRecording}
              className="w-20 h-20 rounded-full bg-rose-600 shadow-xl flex items-center justify-center text-3xl animate-pulse active:scale-95 transition-all">
              ⏹️
            </button>
            <p className="text-rose-500 font-bold text-sm">Đang thu âm... {timeLeft}s</p>
          </>
        )}
        {phase === 'processing' && (
          <>
            <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center text-3xl animate-spin">⏳</div>
            <p className="text-indigo-400 font-bold text-sm">Đang chấm điểm...</p>
          </>
        )}
        {phase === 'done' && (
          <div className="w-full flex flex-col gap-3">
            <div className={`rounded-2xl p-4 text-center border-2 ${unclear ? 'bg-amber-50 border-amber-200' : isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <p className="text-2xl mb-1">{unclear ? '🔄' : isCorrect ? '✅' : '❌'}</p>
              {unclear
                ? <p className="font-black text-amber-700 text-sm">Chưa nghe rõ, đọc to hơn nhé!</p>
                : <>
                    {transcript && <p className="font-bold text-gray-600 text-sm">Bạn đọc: <span className="italic">&ldquo;{transcript}&rdquo;</span></p>}
                    {!isCorrect && <p className="text-green-600 font-bold text-sm mt-1">Đáp án: &ldquo;{q.target}&rdquo;</p>}
                  </>
              }
            </div>
            <div className="flex gap-3">
              <button onClick={() => setPhase('idle')} className="flex-1 bg-white border-2 border-gray-100 text-gray-500 font-bold py-3 rounded-2xl active:scale-95 transition-all">🔄 Thử lại</button>
              <button onClick={advance} className={`flex-1 font-black py-3 rounded-2xl shadow-md text-white active:scale-95 transition-all ${accentCls}`}>
                {idx + 1 >= total ? 'Kết quả →' : 'Tiếp theo →'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Break screen ──────────────────────────────────────────────────────────────
function BreakScreen({ emoji, title, score, max, accentCls, onContinue }: {
  emoji: string; title: string; score: number; max: number; accentCls: string; onContinue: () => void
}) {
  const pct = max > 0 ? score / max : 0
  const grade = pct >= 0.8 ? '🏆 Xuất sắc!' : pct >= 0.6 ? '👍 Tốt!' : '📖 Cần ôn thêm'
  return (
    <div className="flex flex-col items-center gap-6 py-8 text-center">
      <span className="text-6xl">{emoji}</span>
      <h2 className="text-xl font-black text-gray-800">{title}</h2>
      <div className="bg-white border-2 border-gray-100 rounded-2xl p-5 w-full max-w-xs shadow-sm">
        <p className="text-3xl font-black text-gray-800 mb-1">{score}/{max}</p>
        <p className="text-sm font-bold text-gray-500">{grade}</p>
      </div>
      <button onClick={onContinue}
        className={`w-full max-w-xs ${accentCls} text-white font-black py-4 rounded-2xl text-base active:scale-95 transition-all shadow-md`}>
        Tiếp tục →
      </button>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function LevelTestPage() {
  const router = useRouter()
  const { childId, level } = useParams<{ childId: string; level: string }>()
  const { initGameSync, addScore, recordActivity, recordTestCompleted, flush } = useGameSync()
  const colors = LEVEL_COLORS[level] ?? LEVEL_COLORS.seeker
  const levelLabel = level ? level.charAt(0).toUpperCase() + level.slice(1) : ''

  const [phase, setPhase]     = useState<Phase>('loading')
  const [questions, setQuestions] = useState<ReturnType<typeof buildQuestions> | null>(null)
  const [fullPool, setFullPool] = useState<FlatWord[]>([])
  const [attempt, setAttempt] = useState(0)
  const [savedScore, setSavedScore] = useState<{ score: number; max: number } | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [sessionLoaded, setSessionLoaded] = useState(false)

  const [mcqScore,    setMcqScore]    = useState(0)
  const [fibScore,    setFibScore]    = useState(0)
  const [match1Score, setMatch1Score] = useState(0)
  const [match2Score, setMatch2Score] = useState(0)
  const [speakScore,  setSpeakScore]  = useState(0)

  useEffect(() => {
    cachedFetch('/api/auth/me').then(r => r.ok ? r.json() : null).then((s) => {
      setSession(s as Session | null)
      setSessionLoaded(true)
    })
  }, [])

  useEffect(() => {
    if (!sessionLoaded || !(session && getEffectivePlan(session).isProActive)) return
    Promise.all([
      fetch(`/api/words/${level}`).then(r => r.ok ? r.json() : null),
      fetch(`/api/sync/${childId}?level=${level}`).then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(([data, syncData]) => {
      if (!data?.topics) { router.back(); return }
      const flat: FlatWord[] = (data.topics as { words: WordItem[] }[]).flatMap(t =>
        t.words.map(w => ({
          word: w.word,
          meaning_vi: w.meaning,
          example_en: w.examples?.[0]?.en ?? `I see a ${w.word}.`,
          example_vi: w.examples?.[0]?.vi ?? '',
          emoji: w.emoji,
        }))
      )
      const levelTest = syncData?.revision_scores?.level_test as { score: number; max: number; attempt?: number } | undefined
      const currentAttempt = levelTest?.attempt ?? 0
      setAttempt(currentAttempt)
      setSavedScore(levelTest ? { score: levelTest.score, max: levelTest.max } : null)
      setFullPool(flat)
      setQuestions(buildQuestions(pickTestSet(flat, currentAttempt)))
      initGameSync(childId, level, syncData)
      setPhase('intro')
    }).catch(() => router.back())
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, childId, router, sessionLoaded, session])

  const saveScore = useCallback((total: number) => {
    const value = { score: total, max: TOTAL_MAX, date: new Date().toISOString().split('T')[0], attempt: attempt + 1 }
    fetch(`/api/sync/${childId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level, revision_score_key: 'level_test', revision_score_value: value }),
    }).catch(() => {})
    // Level Test previously only wrote revision_scores — it never fed the 30-day history
    // panel or the profile-card streak, both of which read from the same GameSync-driven
    // history/streak columns that regular topic games push. Wire it into that shared path too.
    addScore(level, total)
    recordTestCompleted(level)
    recordActivity(level)
    flush()
  }, [childId, level, attempt, addScore, recordTestCompleted, recordActivity, flush])

  if (!sessionLoaded) {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${colors.light} flex items-center justify-center`}>
        <div className="text-4xl animate-pulse">🏆</div>
      </div>
    )
  }

  if (!(session && getEffectivePlan(session).isProActive)) {
    return <UpgradeModal onClose={() => router.back()} username={session?.username ?? ''} />
  }

  if (phase === 'loading') {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${colors.light} flex items-center justify-center`}>
        <div className="text-center">
          <div className="text-4xl mb-3 animate-bounce">🏆</div>
          <p className="text-gray-500 font-bold text-sm">Đang tải bài kiểm tra...</p>
        </div>
      </div>
    )
  }
  if (!questions) return null

  const totalScore = mcqScore + fibScore + match1Score + match2Score + speakScore

  return (
    <div className={`min-h-screen bg-gradient-to-br ${colors.light}`}>
      <div className={`${colors.header} text-white`}>
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => router.back()} className="text-white/70 hover:text-white text-xl flex-shrink-0">←</button>
          <span className="text-xl flex-shrink-0">🏆</span>
          <div className="min-w-0 flex-1">
            <h1 className="font-black text-base leading-tight">Level Test — {levelLabel}</h1>
            <p className="text-white/70 text-xs">Tổng kết toàn bộ level</p>
          </div>
          {phase !== 'intro' && (
            <span className="text-xs font-black bg-white/20 px-2 py-0.5 rounded-full">{totalScore}/{TOTAL_MAX}</span>
          )}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-5 pb-nav">
        {phase === 'intro' && (
          <div className="flex flex-col items-center gap-6 py-8 text-center">
            <div className={`w-24 h-24 rounded-3xl ${colors.header} flex items-center justify-center shadow-lg`}>
              <span className="text-4xl">🏆</span>
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-800 mb-2">Level Test — {levelLabel}</h2>
              <p className="text-gray-500 text-sm">Tổng kết toàn bộ 30 chủ đề trong level!</p>
            </div>
            <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-sm p-5 w-full max-w-xs space-y-3">
              {[
                { icon: '🧩', label: 'Round 1 — MCQ', desc: '15 câu chọn nghĩa tiếng Việt' },
                { icon: '✏️', label: 'Round 2 — Điền từ', desc: '10 câu điền từ vào câu' },
                { icon: '🔗', label: 'Round 3 — Matching', desc: '10 cặp nối từ với nghĩa' },
                { icon: '🎤', label: 'Round 4 — Nói', desc: '5 câu nói lại bằng AI' },
              ].map(r => (
                <div key={r.label} className="flex items-center gap-3 text-left">
                  <span className="text-2xl flex-shrink-0">{r.icon}</span>
                  <div>
                    <p className="font-black text-gray-700 text-sm">{r.label}</p>
                    <p className="text-xs text-gray-400">{r.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400">Đề bài đổi mới mỗi lần làm lại (xoay vòng {TEST_SET_COUNT} bộ đề)</p>
            {savedScore && (
              <div className="bg-green-50 border-2 border-green-200 rounded-2xl px-4 py-2.5 w-full max-w-xs text-center">
                <p className="text-xs font-bold text-green-700">✓ Lần trước: {savedScore.score}/{savedScore.max} điểm · Làm lại để cải thiện!</p>
              </div>
            )}
            <button onClick={() => setPhase('mcq')}
              className={`w-full max-w-xs ${colors.accent} text-white font-black py-4 rounded-2xl text-base active:scale-95 transition-all shadow-md`}>
              {savedScore ? 'Làm lại →' : 'Bắt đầu →'}
            </button>
          </div>
        )}

        {phase === 'mcq' && (
          <>
            <div className="flex items-center gap-2 mb-5">
              <span className="text-lg">🧩</span>
              <div><p className="font-black text-gray-700 text-sm">Round 1 — MCQ</p><p className="text-xs text-gray-400">Chọn nghĩa tiếng Việt đúng</p></div>
            </div>
            <MCQRound questions={questions.mcq} accentCls={colors.accent} onDone={s => { setMcqScore(s); setPhase('mcq_done') }} />
          </>
        )}
        {phase === 'mcq_done' && (
          <BreakScreen emoji="🧩" title="Round 1 xong! 🎉" score={mcqScore} max={15} accentCls={colors.accent} onContinue={() => setPhase('fib')} />
        )}

        {phase === 'fib' && (
          <>
            <div className="flex items-center gap-2 mb-5">
              <span className="text-lg">✏️</span>
              <div><p className="font-black text-gray-700 text-sm">Round 2 — Điền từ</p><p className="text-xs text-gray-400">Điền từ vào chỗ trống trong câu</p></div>
            </div>
            <FIBRound questions={questions.fib} accentCls={colors.accent} onDone={s => { setFibScore(s); setPhase('fib_done') }} />
          </>
        )}
        {phase === 'fib_done' && (
          <BreakScreen emoji="✏️" title="Round 2 xong! 🎉" score={fibScore} max={10} accentCls={colors.accent} onContinue={() => setPhase('match1')} />
        )}

        {phase === 'match1' && (
          <>
            <div className="flex items-center gap-2 mb-5">
              <span className="text-lg">🔗</span>
              <div><p className="font-black text-gray-700 text-sm">Round 3 — Matching (Bộ 1/2)</p><p className="text-xs text-gray-400">Nối từ tiếng Anh với nghĩa tiếng Việt</p></div>
            </div>
            <MatchRound key="m1" pairs={questions.match1} setLabel="Bộ 1/2" onDone={s => { setMatch1Score(s); setPhase('match1_done') }} />
          </>
        )}
        {phase === 'match1_done' && (
          <BreakScreen emoji="🔗" title="Bộ 1 xong! 🎉" score={match1Score} max={5} accentCls={colors.accent} onContinue={() => setPhase('match2')} />
        )}

        {phase === 'match2' && (
          <>
            <div className="flex items-center gap-2 mb-5">
              <span className="text-lg">🔗</span>
              <div><p className="font-black text-gray-700 text-sm">Round 3 — Matching (Bộ 2/2)</p><p className="text-xs text-gray-400">Nối từ tiếng Anh với nghĩa tiếng Việt</p></div>
            </div>
            <MatchRound key="m2" pairs={questions.match2} setLabel="Bộ 2/2" onDone={s => { setMatch2Score(s); setPhase('match2_done') }} />
          </>
        )}
        {phase === 'match2_done' && (
          <BreakScreen emoji="🔗" title="Bộ 2 xong! 🎉" score={match2Score} max={5} accentCls={colors.accent} onContinue={() => setPhase('speak')} />
        )}

        {phase === 'speak' && (
          <>
            <div className="flex items-center gap-2 mb-5">
              <span className="text-lg">🎤</span>
              <div><p className="font-black text-gray-700 text-sm">Round 4 — Nói</p><p className="text-xs text-gray-400">Nghe và nói lại, AI chấm điểm</p></div>
            </div>
            <SpeakRound questions={questions.speak} accentCls={colors.accent} onDone={s => {
              setSpeakScore(s)
              const final = mcqScore + fibScore + match1Score + match2Score + s
              saveScore(final)
              setPhase('result')
            }} />
          </>
        )}

        {phase === 'result' && (() => {
          const final = mcqScore + fibScore + match1Score + match2Score + speakScore
          const pct   = final / TOTAL_MAX
          const grade = pct >= 0.9 ? { emoji: '🏆', label: 'Xuất sắc!' }
            : pct >= 0.7 ? { emoji: '⭐', label: 'Tốt lắm!' }
            : { emoji: '📖', label: 'Cần ôn thêm nhé!' }
          return (
            <div className="flex flex-col items-center gap-5 py-6 text-center">
              <span className="text-6xl">{grade.emoji}</span>
              <div>
                <h2 className="text-2xl font-black text-gray-800 mb-1">Hoàn thành Level Test!</h2>
                <p className="text-sm text-gray-500">{levelLabel} Level</p>
              </div>
              <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-sm p-5 w-full max-w-xs">
                <p className="text-4xl font-black text-gray-800 mb-1">{final}/{TOTAL_MAX}</p>
                <p className="text-base font-bold text-gray-500">{grade.label}</p>
                <p className="text-xs text-gray-400 mt-1">{Math.round(pct * 100)}% chính xác</p>
              </div>
              <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-sm p-4 w-full max-w-xs space-y-2.5">
                {[
                  { icon: '🧩', label: 'MCQ',     score: mcqScore,    max: 15 },
                  { icon: '✏️', label: 'Điền từ',  score: fibScore,    max: 10 },
                  { icon: '🔗', label: 'Matching', score: match1Score + match2Score, max: 10 },
                  { icon: '🎤', label: 'Nói',      score: speakScore,  max: 5  },
                ].map(r => (
                  <div key={r.label} className="flex items-center gap-3">
                    <span className="text-base flex-shrink-0">{r.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-bold text-gray-600">{r.label}</span>
                        <span className="font-black text-gray-700">{r.score}/{r.max}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full ${colors.accent} rounded-full`} style={{ width: `${(r.score / r.max) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 w-full max-w-xs">
                <button onClick={() => {
                  setMcqScore(0); setFibScore(0); setMatch1Score(0); setMatch2Score(0); setSpeakScore(0)
                  const nextAttempt = attempt + 1
                  setAttempt(nextAttempt)
                  setQuestions(buildQuestions(pickTestSet(fullPool, nextAttempt)))
                  setPhase('intro')
                }}
                  className="flex-1 bg-white border-2 border-gray-200 text-gray-600 font-black py-3.5 rounded-2xl text-sm active:scale-95 transition-all shadow-sm">
                  Làm lại
                </button>
                <button onClick={() => router.back()}
                  className={`flex-1 ${colors.accent} text-white font-black py-3.5 rounded-2xl text-sm active:scale-95 transition-all shadow-md`}>
                  Về danh sách
                </button>
              </div>
            </div>
          )
        })()}
      </div>
      <GameSoundToggle />
    </div>
  )
}
