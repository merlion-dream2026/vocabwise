'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { playCorrectSound, playWrongSound } from '@/lib/gameSound'
import GameSoundToggle from '@/components/GameSoundToggle'
import { pickTestSet, TEST_SET_COUNT } from '@/lib/testSetRotation'
import UpgradeModal from '@/components/UpgradeModal'
import { getEffectivePlan } from '@/lib/planUtils'
import { cachedFetch } from '@/lib/cachedFetch'

type Session = { plan: string; username: string; plan_end_date?: string | null; bonus_pro_expires_at?: string | null; free_trial_expires_at?: string | null; bonus_features?: string[] | null }

type GlossaryItem = { word: string; pos: string | null; meaning_vi: string; example_en: string; example_vi: string; topic_id: string; cefr_level: string | null }
type MCQQuestion = { word: string; pos: string | null; correct: string; options: string[] }
type FIBQuestion = { blanked: string; word: string; meaning_vi: string; correct: string; options: string[]; mode: 'mcq' | 'type' }
type MatchPair  = { word: string; meaning: string }
type ProductionQuestion = { targetWord: string; exampleVi: string; cefr: string | null }
type ProductionResult = { score: number; used_correctly: boolean; grammar_ok: boolean; feedback_vi: string; improved: string }

type Phase =
  | 'loading' | 'intro'
  | 'mcq' | 'mcq_done'
  | 'fib' | 'fib_done'
  | 'match1' | 'match1_done'
  | 'match2' | 'match2_done'
  | 'production' | 'result'

const BOOK_LABELS: Record<string, { title: string; header: string }> = {
  book1: { title: 'Foundation', header: 'bg-emerald-500' },
  book2: { title: 'Progress',   header: 'bg-blue-500'    },
  book3: { title: 'Mastery',    header: 'bg-violet-600'  },
}
const RECOGNITION_MAX = 35 // 15 MCQ + 10 FIB + 5+5 Matching
const PRODUCTION_MAX  = 10 // average AI score (0-10) across production sentences
const TOTAL_MAX = RECOGNITION_MAX + PRODUCTION_MAX

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
  const regex = new RegExp(`\\b${escaped}(?:s|es|ed|ing|er|'s)?\\b`, 'gi')
  const result = sentence.replace(regex, '______')
  return result !== sentence ? result : sentence.replace(
    new RegExp(`\\b${escaped.slice(0, Math.max(4, escaped.length - 2))}\\w*\\b`, 'gi'),
    '______'
  )
}

function getDistractors(pool: GlossaryItem[], exclude: string, count: number, field: 'meaning_vi' | 'word'): string[] {
  const seen = new Set([exclude])
  const result: string[] = []
  for (const w of shuffle([...pool])) {
    const val = w[field]
    if (!seen.has(val)) { seen.add(val); result.push(val) }
    if (result.length === count) break
  }
  return result
}

function buildQuestions(chunk: GlossaryItem[]) {
  const words = shuffle(chunk).slice(0, 44)
  const mcqWords = words.slice(0, 15)
  const fibWords = words.slice(15, 25)
  const match1   = words.slice(25, 30)
  const match2   = words.slice(30, 35)
  const prodWords = words.slice(35, 44)

  const mcq: MCQQuestion[] = mcqWords.map(item => ({
    word: item.word, pos: item.pos,
    correct: item.meaning_vi,
    options: shuffle([item.meaning_vi, ...getDistractors(chunk, item.meaning_vi, 3, 'meaning_vi')]),
  }))

  const fib: FIBQuestion[] = fibWords.map(item => ({
    blanked: blankWord(item.example_en, item.word),
    word: item.word,
    meaning_vi: item.meaning_vi,
    correct: item.word,
    options: shuffle([item.word, ...getDistractors(chunk, item.word, 3, 'word')]),
    mode: Math.random() < 0.5 ? 'type' : 'mcq',
  }))

  const m1: MatchPair[] = match1.map(i => ({ word: i.word, meaning: i.meaning_vi }))
  const m2: MatchPair[] = match2.map(i => ({ word: i.word, meaning: i.meaning_vi }))

  const production: ProductionQuestion[] = prodWords.map(item => ({
    targetWord: item.word, exampleVi: item.example_vi, cefr: item.cefr_level,
  }))

  return { mcq, fib, match1: m1, match2: m2, production }
}

function ScoreBadge({ score, max }: { score: number; max: number }) {
  const pct = max > 0 ? score / max : 0
  const cls = pct >= 0.8 ? 'bg-green-100 text-green-700' : pct >= 0.6 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600'
  return <span className={`text-xs font-black px-2 py-0.5 rounded-full ${cls}`}>{score}/{max}</span>
}

// ── MCQ Round ─────────────────────────────────────────────────────────────────
function MCQRound({ questions, onDone }: { questions: MCQQuestion[]; onDone: (score: number) => void }) {
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
        <div className="h-full bg-amber-400 rounded-full transition-all duration-300" style={{ width: `${(idx / questions.length) * 100}%` }} />
      </div>
      <div className="bg-white rounded-2xl border-2 border-amber-100 shadow-sm p-6 text-center">
        <p className="text-3xl font-black text-gray-800 mb-1">{q.word}</p>
        {q.pos && <p className="text-xs text-gray-400 italic">{q.pos}</p>}
        <p className="text-xs font-bold text-amber-600 mt-3 uppercase tracking-wider">Nghĩa tiếng Việt là gì?</p>
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

// ── FIB Round ─────────────────────────────────────────────────────────────────
function FIBRound({ questions, onDone }: { questions: FIBQuestion[]; onDone: (score: number) => void }) {
  const [idx, setIdx]       = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [typedInput, setTypedInput] = useState('')
  const [score, setScore]   = useState(0)
  const q = questions[idx]

  function resolve(answer: string) {
    if (selected) return
    setSelected(answer)
    const correct = answer.trim().toLowerCase() === q.correct.trim().toLowerCase()
    if (correct) { setScore(s => s + 1); playCorrectSound() } else { playWrongSound() }
    setTimeout(() => {
      if (idx + 1 < questions.length) { setIdx(i => i + 1); setSelected(null); setTypedInput('') }
      else onDone(correct ? score + 1 : score)
    }, correct ? 700 : 1600)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between text-xs text-gray-400 font-bold">
        <span>Câu {idx + 1}/{questions.length}</span><span>{score} đúng</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-amber-400 rounded-full transition-all duration-300" style={{ width: `${(idx / questions.length) * 100}%` }} />
      </div>
      <div className="bg-white rounded-2xl border-2 border-amber-100 shadow-sm p-5">
        <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-3">Điền từ vào chỗ trống</p>
        <p className="text-base font-semibold text-gray-800 leading-relaxed">{q.blanked}</p>
        <p className="text-xs text-blue-500 font-semibold mt-2">💡 {q.meaning_vi}</p>
      </div>
      {q.mode === 'type' ? (
        <div className="flex flex-col gap-2.5">
          <input
            type="text"
            value={typedInput}
            onChange={e => { if (!selected) setTypedInput(e.target.value) }}
            onKeyDown={e => { if (e.key === 'Enter' && typedInput.trim()) resolve(typedInput) }}
            disabled={!!selected}
            placeholder="Gõ từ tiếng Anh..."
            aria-label="Gõ từ tiếng Anh"
            autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false}
            className={`w-full border-2 rounded-2xl px-4 py-3.5 text-lg font-bold outline-none transition-colors ${
              !selected ? 'border-gray-200 bg-white text-gray-800' :
              selected.trim().toLowerCase() === q.correct.trim().toLowerCase() ? 'border-green-400 bg-green-50 text-green-800' : 'border-red-400 bg-red-50 text-red-700'
            }`}
          />
          {selected && selected.trim().toLowerCase() !== q.correct.trim().toLowerCase() && (
            <p className="text-red-500 font-bold text-sm">Đáp án đúng: <span className="underline">{q.correct}</span></p>
          )}
          {!selected && (
            <button onClick={() => typedInput.trim() && resolve(typedInput)} disabled={!typedInput.trim()}
              className="w-full bg-amber-400 hover:bg-amber-500 disabled:opacity-40 text-white font-black py-3.5 rounded-2xl text-sm active:scale-95 transition-all shadow-sm">
              Kiểm tra ✓
            </button>
          )}
        </div>
      ) : (
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
              <button key={opt} onClick={() => resolve(opt)}
                className={`rounded-2xl px-4 py-3.5 font-bold text-sm transition-all active:scale-[0.98] shadow-sm ${cls}`}>
                {isSelected && selected && (isCorrect ? '✓ ' : '✗ ')}{opt}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Matching Round ─────────────────────────────────────────────────────────────
function MatchRound({ pairs, setLabel, onDone }: { pairs: MatchPair[]; setLabel: string; onDone: (score: number) => void }) {
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
            const isMatched = matched.has(w)
            const isSelected = selWord === w
            const isWrong = wrongWord === w
            let cls = 'bg-white border-2 border-gray-100 text-gray-700'
            if (isMatched)  cls = 'bg-gray-50 border-2 border-gray-100 text-gray-300 line-through'
            else if (isWrong) cls = 'bg-red-50 border-2 border-red-300 text-red-600'
            else if (isSelected) cls = 'bg-amber-50 border-2 border-amber-400 text-amber-800 shadow-md'
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
            else if (selWord) cls = 'bg-white border-2 border-amber-200 text-gray-700 hover:bg-amber-50 hover:border-amber-400'
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

// ── Production Round — scroll through all questions, submit + grade once ──────
function ProductionRound({ questions, onDone }: { questions: ProductionQuestion[]; onDone: (score: number) => void }) {
  const [answers, setAnswers]     = useState<string[]>(() => questions.map(() => ''))
  const [submitting, setSubmitting] = useState(false)
  const [results, setResults]     = useState<ProductionResult[] | null>(null)
  const [error, setError]         = useState<string | null>(null)
  const filledCount = answers.filter(a => a.trim()).length

  async function submit() {
    setSubmitting(true); setError(null)
    try {
      const res = await fetch('/api/vocabwise/module-test/grade-production', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: questions.map((q, i) => ({ targetWord: q.targetWord, exampleVi: q.exampleVi, cefr: q.cefr ?? undefined, sentence: answers[i] })),
        }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setError(d.error ?? 'Có lỗi khi chấm bài, thử lại nhé.')
        setSubmitting(false)
        return
      }
      const data = await res.json()
      setResults(data.results)
    } catch {
      setError('Lỗi kết nối. Thử lại nhé.')
    }
    setSubmitting(false)
  }

  if (results) {
    const avg = Math.round(results.reduce((s, r) => s + r.score, 0) / results.length)
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between text-xs text-gray-400 font-bold">
          <span>Kết quả Round 4 — Viết câu</span>
          <ScoreBadge score={avg} max={10} />
        </div>
        {questions.map((q, i) => {
          const r = results[i]
          const cls = r.score >= 7 ? 'bg-green-50 border-green-200' : r.score >= 4 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'
          return (
            <div key={i} className={`rounded-2xl border-2 p-4 ${cls}`}>
              <div className="flex justify-between items-start gap-2 mb-1">
                <p className="font-black text-gray-700 text-sm">Câu {i + 1} · &quot;{q.targetWord}&quot;</p>
                <span className="text-xs font-black text-gray-600 flex-shrink-0">{r.score}/10</span>
              </div>
              <p className="text-xs text-gray-500 mb-1.5">🇻🇳 {q.exampleVi}</p>
              <p className="text-sm text-gray-800 font-semibold mb-1.5">
                {answers[i]?.trim() ? answers[i] : <em className="text-gray-300 font-normal">(bỏ trống)</em>}
              </p>
              <p className="text-xs text-blue-600">{r.feedback_vi}</p>
              {r.improved && <p className="text-xs text-green-600 mt-1">✓ Gợi ý: &ldquo;{r.improved}&rdquo;</p>}
            </div>
          )
        })}
        <button onClick={() => onDone(avg)}
          className="w-full bg-amber-400 hover:bg-amber-500 text-white font-black py-4 rounded-2xl text-base active:scale-95 transition-all shadow-md">
          Xem tổng kết →
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between text-xs text-gray-400 font-bold sticky top-0 bg-amber-50/95 backdrop-blur py-1 z-10">
        <span>Round 4 — Viết câu ({questions.length} câu)</span>
        <span>Đã điền {filledCount}/{questions.length}</span>
      </div>
      {questions.map((q, i) => (
        <div key={i} className="bg-white rounded-2xl border-2 border-amber-100 shadow-sm p-4">
          <p className="text-xs font-bold text-amber-600 mb-1.5">
            Câu {i + 1} · từ mục tiêu: &quot;{q.targetWord}&quot;{q.cefr ? ` (${q.cefr})` : ''}
          </p>
          <p className="text-sm text-gray-700 mb-2">🇻🇳 {q.exampleVi}</p>
          <textarea
            value={answers[i]}
            onChange={e => setAnswers(a => a.map((v, j) => j === i ? e.target.value : v))}
            placeholder="🇬🇧 Viết câu tiếng Anh..."
            rows={2}
            className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium outline-none focus:border-amber-400 transition-colors resize-none"
          />
        </div>
      ))}
      {error && <p className="text-red-500 text-xs font-bold text-center">{error}</p>}
      <button onClick={submit} disabled={submitting}
        className="w-full bg-amber-400 hover:bg-amber-500 disabled:opacity-50 text-white font-black py-4 rounded-2xl text-base active:scale-95 transition-all shadow-md">
        {submitting ? 'Đang chấm...' : `Nộp bài — chấm ${questions.length} câu`}
      </button>
    </div>
  )
}

// ── Break screen ───────────────────────────────────────────────────────────────
function BreakScreen({ emoji, title, subtitle, score, max, onContinue }: {
  emoji: string; title: string; subtitle: string
  score: number; max: number; onContinue: () => void
}) {
  const pct = max > 0 ? score / max : 0
  const grade = pct >= 0.8 ? { label: 'Xuất sắc! 🏆', cls: 'text-green-600' }
    : pct >= 0.6 ? { label: 'Tốt! 👍', cls: 'text-amber-600' }
    : { label: 'Cần ôn thêm 📖', cls: 'text-red-500' }
  return (
    <div className="flex flex-col items-center gap-6 py-8 text-center">
      <span className="text-6xl">{emoji}</span>
      <div>
        <h2 className="text-xl font-black text-gray-800 mb-1">{title}</h2>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>
      <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-5 w-full max-w-xs">
        <p className={`text-3xl font-black mb-1 ${grade.cls}`}>{score}/{max}</p>
        <p className={`text-sm font-bold ${grade.cls}`}>{grade.label}</p>
      </div>
      <button onClick={onContinue}
        className="w-full max-w-xs bg-amber-400 hover:bg-amber-500 text-white font-black py-4 rounded-2xl text-base active:scale-95 transition-all shadow-md">
        Tiếp tục →
      </button>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function ModuleTestPage() {
  const router = useRouter()
  const { book } = useParams<{ book: string }>()
  const bookInfo = BOOK_LABELS[book] ?? BOOK_LABELS.book1

  const [phase, setPhase]     = useState<Phase>('loading')
  const [fullPool, setFullPool] = useState<GlossaryItem[]>([])
  const [attempt, setAttempt] = useState(0)
  const [savedScore, setSavedScore] = useState<{ score: number; max: number } | null>(null)
  const [questions, setQuestions] = useState<ReturnType<typeof buildQuestions> | null>(null)

  const [mcqScore,    setMcqScore]    = useState(0)
  const [fibScore,    setFibScore]    = useState(0)
  const [match1Score, setMatch1Score] = useState(0)
  const [match2Score, setMatch2Score] = useState(0)
  const [productionScore, setProductionScore] = useState(0)
  const [session, setSession] = useState<Session | null>(null)
  const [sessionLoaded, setSessionLoaded] = useState(false)

  useEffect(() => {
    cachedFetch('/api/auth/me').then(r => r.ok ? r.json() : null).then((s) => {
      setSession(s as Session | null)
      setSessionLoaded(true)
    })
  }, [])

  useEffect(() => {
    if (!sessionLoaded || !(session && getEffectivePlan(session).isProActive)) return
    Promise.all([
      fetch(`/api/vocabwise/module-test?book=${book}`).then(r => r.ok ? r.json() : null),
      fetch('/api/vocabwise/sync').then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(([data, syncData]) => {
      if (!data?.glossary?.length) { router.back(); return }
      const key = `${book}_test`
      const moduleTest = syncData?.revision_scores?.[key] as { score: number; max: number; attempt?: number } | undefined
      const currentAttempt = moduleTest?.attempt ?? 0
      setAttempt(currentAttempt)
      setSavedScore(moduleTest ? { score: moduleTest.score, max: moduleTest.max } : null)
      setFullPool(data.glossary)
      setQuestions(buildQuestions(pickTestSet(data.glossary, currentAttempt)))
      setPhase('intro')
    }).catch(() => router.back())
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book, router, sessionLoaded, session])

  const saveScore = useCallback((total: number) => {
    const value = { score: total, max: TOTAL_MAX, date: new Date().toISOString().split('T')[0], attempt: attempt + 1 }
    fetch('/api/vocabwise/sync', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ revision_score_key: `${book}_test`, revision_score_value: value }),
    }).catch(() => {})
  }, [book, attempt])

  if (!sessionLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-yellow-50 flex items-center justify-center">
        <div className="text-4xl animate-pulse">🏆</div>
      </div>
    )
  }

  if (!(session && getEffectivePlan(session).isProActive)) {
    return <UpgradeModal onClose={() => router.back()} username={session?.username ?? ''} />
  }

  if (phase === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-bounce">🏆</div>
          <p className="text-gray-500 font-bold text-sm">Đang tải bài kiểm tra...</p>
        </div>
      </div>
    )
  }
  if (!questions) return null

  const recognitionScore = mcqScore + fibScore + match1Score + match2Score

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-yellow-50">
      <div className={`${bookInfo.header} text-white`}>
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => router.back()} aria-label="Quay lại" className="text-white/70 hover:text-white text-xl flex-shrink-0">←</button>
          <span className="text-xl flex-shrink-0">🏆</span>
          <div className="min-w-0 flex-1">
            <h1 className="font-black text-base leading-tight">Module Test — {bookInfo.title}</h1>
            <p className="text-white/70 text-xs">Tổng kết toàn bộ VocabWise {bookInfo.title}</p>
          </div>
          {phase !== 'intro' && phase !== 'production' && (
            <ScoreBadge score={recognitionScore} max={
              phase === 'mcq' || phase === 'mcq_done' ? 0
              : phase === 'fib' || phase === 'fib_done' ? mcqScore
              : phase === 'match1' || phase === 'match1_done' ? mcqScore + fibScore
              : RECOGNITION_MAX
            } />
          )}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-5 pb-nav">

        {phase === 'intro' && (
          <div className="flex flex-col items-center gap-6 py-8 text-center">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-lg">
              <span className="text-4xl">🏆</span>
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-800 mb-2">Module Test — {bookInfo.title}</h2>
              <p className="text-gray-500 text-sm">Tổng kết toàn bộ 60 chủ đề trong book!</p>
            </div>
            <div className="bg-white rounded-2xl border-2 border-amber-100 shadow-sm p-5 w-full max-w-xs space-y-3">
              {[
                { icon: '🧩', label: 'Round 1', desc: '15 câu MCQ — chọn nghĩa tiếng Việt' },
                { icon: '✏️', label: 'Round 2', desc: '10 câu Fill-in-blank — điền từ vào câu' },
                { icon: '🔗', label: 'Round 3', desc: '10 cặp Matching — nối từ với nghĩa' },
                { icon: '✍️', label: 'Round 4', desc: '9 câu Viết — dịch câu, AI chấm điểm' },
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
            <p className="text-xs text-gray-400">44 câu · Đề bài đổi mới mỗi lần làm lại (xoay vòng {TEST_SET_COUNT} bộ đề)</p>
            {savedScore && (
              <div className="bg-green-50 border-2 border-green-200 rounded-2xl px-4 py-2.5 w-full max-w-xs text-center">
                <p className="text-xs font-bold text-green-700">✓ Lần trước: {savedScore.score}/{savedScore.max} điểm · Làm lại để cải thiện!</p>
              </div>
            )}
            <button onClick={() => setPhase('mcq')}
              className="w-full max-w-xs bg-gradient-to-r from-amber-400 to-yellow-500 text-white font-black py-4 rounded-2xl text-base active:scale-95 transition-all shadow-md">
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
            <MCQRound questions={questions.mcq} onDone={s => { setMcqScore(s); setPhase('mcq_done') }} />
          </>
        )}
        {phase === 'mcq_done' && (
          <BreakScreen emoji="🧩" title="Round 1 hoàn thành!" subtitle="MCQ — Chọn nghĩa tiếng Việt" score={mcqScore} max={15} onContinue={() => setPhase('fib')} />
        )}

        {phase === 'fib' && (
          <>
            <div className="flex items-center gap-2 mb-5">
              <span className="text-lg">✏️</span>
              <div><p className="font-black text-gray-700 text-sm">Round 2 — Fill-in-blank</p><p className="text-xs text-gray-400">Điền từ vào chỗ trống trong câu</p></div>
            </div>
            <FIBRound questions={questions.fib} onDone={s => { setFibScore(s); setPhase('fib_done') }} />
          </>
        )}
        {phase === 'fib_done' && (
          <BreakScreen emoji="✏️" title="Round 2 hoàn thành!" subtitle="Fill-in-blank — Điền từ vào câu" score={fibScore} max={10} onContinue={() => setPhase('match1')} />
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
          <BreakScreen emoji="🔗" title="Bộ 1 hoàn thành!" subtitle="Matching — Nối từ với nghĩa" score={match1Score} max={5} onContinue={() => setPhase('match2')} />
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
          <BreakScreen emoji="🔗" title="Bộ 2 hoàn thành!" subtitle="Matching — Nối từ với nghĩa" score={match2Score} max={5} onContinue={() => setPhase('production')} />
        )}

        {phase === 'production' && (
          <>
            <div className="flex items-center gap-2 mb-5">
              <span className="text-lg">✍️</span>
              <div><p className="font-black text-gray-700 text-sm">Round 4 — Viết câu</p><p className="text-xs text-gray-400">Dịch câu tiếng Việt sang tiếng Anh, AI chấm cả bài 1 lần</p></div>
            </div>
            <ProductionRound questions={questions.production} onDone={s => {
              setProductionScore(s)
              const final = recognitionScore + s
              saveScore(final)
              setPhase('result')
            }} />
          </>
        )}

        {phase === 'result' && (() => {
          const final = recognitionScore + productionScore
          const pct = final / TOTAL_MAX
          const grade = pct >= 0.9 ? { emoji: '🏆', label: 'Xuất sắc!', cls: 'text-green-600', bg: 'bg-green-50 border-green-200' }
            : pct >= 0.7 ? { emoji: '⭐', label: 'Tốt!', cls: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' }
            : { emoji: '📖', label: 'Cần ôn thêm', cls: 'text-red-500', bg: 'bg-red-50 border-red-200' }
          return (
            <div className="flex flex-col items-center gap-5 py-6 text-center">
              <span className="text-6xl">{grade.emoji}</span>
              <div>
                <h2 className="text-2xl font-black text-gray-800 mb-1">Hoàn thành Module Test!</h2>
                <p className="text-sm text-gray-500">VocabWise {bookInfo.title}</p>
              </div>
              <div className={`w-full max-w-xs rounded-2xl border-2 p-5 ${grade.bg}`}>
                <p className={`text-4xl font-black mb-1 ${grade.cls}`}>{final}/{TOTAL_MAX}</p>
                <p className={`text-base font-bold ${grade.cls}`}>{grade.label}</p>
                <p className="text-xs text-gray-400 mt-1">{Math.round(pct * 100)}% chính xác</p>
              </div>
              <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-sm p-4 w-full max-w-xs space-y-2.5">
                {[
                  { icon: '🧩', label: 'MCQ',         score: mcqScore,    max: 15 },
                  { icon: '✏️', label: 'Fill-in-blank', score: fibScore,   max: 10 },
                  { icon: '🔗', label: 'Matching',      score: match1Score + match2Score, max: 10 },
                  { icon: '✍️', label: 'Viết câu',       score: productionScore, max: 10 },
                ].map(r => (
                  <div key={r.label} className="flex items-center gap-3">
                    <span className="text-base flex-shrink-0">{r.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-bold text-gray-600">{r.label}</span>
                        <span className="font-black text-gray-700">{r.score}/{r.max}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${(r.score / r.max) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 w-full max-w-xs">
                <button onClick={() => {
                  setPhase('intro')
                  setMcqScore(0); setFibScore(0); setMatch1Score(0); setMatch2Score(0); setProductionScore(0)
                  const nextAttempt = attempt + 1
                  setAttempt(nextAttempt)
                  setQuestions(buildQuestions(pickTestSet(fullPool, nextAttempt)))
                }}
                  className="flex-1 bg-white border-2 border-gray-200 text-gray-600 font-black py-3.5 rounded-2xl text-sm active:scale-95 transition-all shadow-sm">
                  Làm lại
                </button>
                <button onClick={() => router.back()}
                  className="flex-1 bg-amber-400 hover:bg-amber-500 text-white font-black py-3.5 rounded-2xl text-sm active:scale-95 transition-all shadow-md">
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
