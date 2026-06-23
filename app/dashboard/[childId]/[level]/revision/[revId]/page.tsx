'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'

type WordItem = { word: string; meaning: string; emoji: string; examples: { en: string; vi: string }[] }
type FlatWord = { word: string; meaning_vi: string; example_en: string; emoji: string }
type MCQQuestion = { word: string; emoji: string; correct: string; options: string[] }
type FIBQuestion = { blanked: string; word: string; meaning_vi: string; correct: string; options: string[] }
type MatchPair  = { word: string; meaning: string }

type Phase =
  | 'loading' | 'intro'
  | 'mcq' | 'mcq_done'
  | 'fib' | 'fib_done'
  | 'match1' | 'match1_done'
  | 'match2' | 'result'

const LEVEL_COLORS: Record<string, { header: string; accent: string; light: string }> = {
  seeker:   { header: 'bg-violet-500',  accent: 'bg-violet-400',  light: 'from-violet-50 to-purple-50'  },
  starter:  { header: 'bg-pink-500',    accent: 'bg-pink-400',    light: 'from-pink-50 to-rose-50'      },
  ranger:   { header: 'bg-emerald-500', accent: 'bg-emerald-400', light: 'from-emerald-50 to-teal-50'   },
  explorer: { header: 'bg-blue-500',    accent: 'bg-blue-400',    light: 'from-blue-50 to-indigo-50'    },
  scholar:  { header: 'bg-indigo-500',  accent: 'bg-indigo-400',  light: 'from-indigo-50 to-violet-50'  },
  master:   { header: 'bg-gray-700',    accent: 'bg-gray-600',    light: 'from-gray-50 to-slate-100'    },
}

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

function buildQuestions(pool: FlatWord[]) {
  const words   = shuffle(pool).slice(0, 30)
  const mcqW    = words.slice(0, 10)
  const fibW    = words.slice(10, 20)
  const match1  = words.slice(20, 25)
  const match2  = words.slice(25, 30)

  function distractMeanings(exclude: string): string[] {
    const seen = new Set([exclude])
    const result: string[] = []
    for (const w of shuffle([...pool])) {
      if (!seen.has(w.meaning_vi)) { seen.add(w.meaning_vi); result.push(w.meaning_vi) }
      if (result.length === 3) break
    }
    return result
  }
  function distractWords(exclude: string): string[] {
    const seen = new Set([exclude])
    const result: string[] = []
    for (const w of shuffle([...pool])) {
      if (!seen.has(w.word)) { seen.add(w.word); result.push(w.word) }
      if (result.length === 3) break
    }
    return result
  }

  const mcq: MCQQuestion[] = mcqW.map(item => ({
    word: item.word, emoji: item.emoji,
    correct: item.meaning_vi,
    options: shuffle([item.meaning_vi, ...distractMeanings(item.meaning_vi)]),
  }))

  const fib: FIBQuestion[] = fibW.map(item => ({
    blanked: blankWord(item.example_en, item.word),
    word: item.word, meaning_vi: item.meaning_vi, correct: item.word,
    options: shuffle([item.word, ...distractWords(item.word)]),
  }))

  return {
    mcq, fib,
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
    if (correct) setScore(s => s + 1)
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
        <p className="text-5xl mb-2">{q.emoji}</p>
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
    if (correct) setScore(s => s + 1)
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
function MatchRound({ pairs, setLabel, accentCls, onDone }: { pairs: MatchPair[]; setLabel: string; accentCls: string; onDone: (s: number) => void }) {
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
    } else {
      setWrongWord(selWord); setSelWord(null)
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
export default function KidsRevisionPage() {
  const router = useRouter()
  const { childId, level, revId } = useParams<{ childId: string; level: string; revId: string }>()
  const revNum = parseInt(revId.replace('r', ''), 10)
  const colors = LEVEL_COLORS[level] ?? LEVEL_COLORS.seeker

  const [phase, setPhase]     = useState<Phase>('loading')
  const [topicRange, setTopicRange] = useState('')
  const [questions, setQuestions]   = useState<ReturnType<typeof buildQuestions> | null>(null)
  const [pool, setPool]             = useState<FlatWord[]>([])

  const [mcqScore,    setMcqScore]    = useState(0)
  const [fibScore,    setFibScore]    = useState(0)
  const [match1Score, setMatch1Score] = useState(0)
  const [match2Score, setMatch2Score] = useState(0)
  const [savedScore, setSavedScore]   = useState<{ score: number; max: number } | null>(null)

  useEffect(() => {
    const raw = localStorage.getItem(`revision_kids_${level}_${revId}`)
    if (raw) { try { setSavedScore(JSON.parse(raw)) } catch {} }
  }, [level, revId])

  useEffect(() => {
    fetch(`/api/words/${level}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data?.topics) { router.back(); return }
        const startIdx = (revNum - 1) * 5
        const fiveTopics = (data.topics as { name: string; words: WordItem[] }[]).slice(startIdx, startIdx + 5)
        if (!fiveTopics.length) { router.back(); return }

        const start = startIdx + 1
        const end   = startIdx + fiveTopics.length
        setTopicRange(`${start}–${end}`)

        const flat: FlatWord[] = fiveTopics.flatMap(t =>
          t.words.map(w => ({
            word: w.word,
            meaning_vi: w.meaning,
            example_en: w.examples?.[0]?.en ?? `I see a ${w.word}.`,
            emoji: w.emoji,
          }))
        )
        setPool(flat)
        setQuestions(buildQuestions(flat))
        setPhase('intro')
      })
      .catch(() => router.back())
  }, [level, revNum, router])

  const saveScore = useCallback((total: number) => {
    localStorage.setItem(
      `revision_kids_${level}_${revId}`,
      JSON.stringify({ score: total, max: 30, date: new Date().toISOString().split('T')[0] })
    )
  }, [level, revId])

  if (phase === 'loading') {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${colors.light} flex items-center justify-center`}>
        <div className="text-center">
          <div className="text-4xl mb-3 animate-bounce">✨</div>
          <p className="text-gray-500 font-bold text-sm">Đang tải bài ôn tập...</p>
        </div>
      </div>
    )
  }

  if (!questions) return null

  const totalScore = mcqScore + fibScore + match1Score + match2Score

  return (
    <div className={`min-h-screen bg-gradient-to-br ${colors.light}`}>
      {/* Header */}
      <div className={`${colors.header} text-white`}>
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => router.back()} className="text-white/70 hover:text-white text-xl flex-shrink-0">←</button>
          <span className="text-xl flex-shrink-0">✨</span>
          <div className="min-w-0 flex-1">
            <h1 className="font-black text-base leading-tight">Revision: Topics {topicRange}</h1>
            <p className="text-white/70 text-xs capitalize">{level} Level</p>
          </div>
          {phase !== 'intro' && (
            <span className="text-xs font-black bg-white/20 px-2 py-0.5 rounded-full">{totalScore}/30</span>
          )}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-5 pb-nav">

        {/* Intro */}
        {phase === 'intro' && (
          <div className="flex flex-col items-center gap-6 py-8 text-center">
            <div className={`w-24 h-24 rounded-3xl ${colors.header} flex items-center justify-center shadow-lg`}>
              <span className="text-4xl">✨</span>
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-800 mb-2">Revision: Topics {topicRange}</h2>
              <p className="text-gray-500 text-sm">Ôn tập từ vựng 5 chủ đề vừa học!</p>
            </div>
            <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-sm p-5 w-full max-w-xs space-y-3">
              {[
                { icon: '🧩', label: 'Round 1 — MCQ', desc: '10 câu chọn nghĩa tiếng Việt' },
                { icon: '✏️', label: 'Round 2 — Điền từ', desc: '10 câu điền từ vào câu' },
                { icon: '🔗', label: 'Round 3 — Matching', desc: '10 cặp nối từ với nghĩa' },
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
              <div>
                <p className="font-black text-gray-700 text-sm">Round 1 — MCQ</p>
                <p className="text-xs text-gray-400">Chọn nghĩa tiếng Việt đúng</p>
              </div>
            </div>
            <MCQRound questions={questions.mcq} accentCls={colors.accent}
              onDone={s => { setMcqScore(s); setPhase('mcq_done') }} />
          </>
        )}

        {phase === 'mcq_done' && (
          <BreakScreen emoji="🧩" title="Round 1 xong! 🎉" score={mcqScore} max={10}
            accentCls={colors.accent} onContinue={() => setPhase('fib')} />
        )}

        {phase === 'fib' && (
          <>
            <div className="flex items-center gap-2 mb-5">
              <span className="text-lg">✏️</span>
              <div>
                <p className="font-black text-gray-700 text-sm">Round 2 — Điền từ</p>
                <p className="text-xs text-gray-400">Điền từ vào chỗ trống trong câu</p>
              </div>
            </div>
            <FIBRound questions={questions.fib} accentCls={colors.accent}
              onDone={s => { setFibScore(s); setPhase('fib_done') }} />
          </>
        )}

        {phase === 'fib_done' && (
          <BreakScreen emoji="✏️" title="Round 2 xong! 🎉" score={fibScore} max={10}
            accentCls={colors.accent} onContinue={() => setPhase('match1')} />
        )}

        {phase === 'match1' && (
          <>
            <div className="flex items-center gap-2 mb-5">
              <span className="text-lg">🔗</span>
              <div>
                <p className="font-black text-gray-700 text-sm">Round 3 — Matching (Bộ 1/2)</p>
                <p className="text-xs text-gray-400">Nối từ tiếng Anh với nghĩa tiếng Việt</p>
              </div>
            </div>
            <MatchRound key="m1" pairs={questions.match1} setLabel="Bộ 1/2" accentCls={colors.accent}
              onDone={s => { setMatch1Score(s); setPhase('match1_done') }} />
          </>
        )}

        {phase === 'match1_done' && (
          <BreakScreen emoji="🔗" title="Bộ 1 xong! 🎉" score={match1Score} max={5}
            accentCls={colors.accent} onContinue={() => setPhase('match2')} />
        )}

        {phase === 'match2' && (
          <>
            <div className="flex items-center gap-2 mb-5">
              <span className="text-lg">🔗</span>
              <div>
                <p className="font-black text-gray-700 text-sm">Round 3 — Matching (Bộ 2/2)</p>
                <p className="text-xs text-gray-400">Nối từ tiếng Anh với nghĩa tiếng Việt</p>
              </div>
            </div>
            <MatchRound key="m2" pairs={questions.match2} setLabel="Bộ 2/2" accentCls={colors.accent}
              onDone={s => {
                setMatch2Score(s)
                const final = mcqScore + fibScore + match1Score + s
                saveScore(final)
                setPhase('result')
              }} />
          </>
        )}

        {/* Result */}
        {phase === 'result' && (() => {
          const final = mcqScore + fibScore + match1Score + match2Score
          const pct   = final / 30
          const grade = pct >= 0.9 ? { emoji: '🏆', label: 'Xuất sắc!' }
            : pct >= 0.7 ? { emoji: '⭐', label: 'Tốt lắm!' }
            : { emoji: '📖', label: 'Cần ôn thêm nhé!' }
          return (
            <div className="flex flex-col items-center gap-5 py-6 text-center">
              <span className="text-6xl">{grade.emoji}</span>
              <div>
                <h2 className="text-2xl font-black text-gray-800 mb-1">Hoàn thành!</h2>
                <p className="text-sm text-gray-500">Revision: Topics {topicRange}</p>
              </div>
              <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-sm p-5 w-full max-w-xs">
                <p className="text-4xl font-black text-gray-800 mb-1">{final}/30</p>
                <p className="text-base font-bold text-gray-500">{grade.label}</p>
                <p className="text-xs text-gray-400 mt-1">{Math.round(pct * 100)}% chính xác</p>
              </div>
              <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-sm p-4 w-full max-w-xs space-y-2.5">
                {[
                  { icon: '🧩', label: 'MCQ',     score: mcqScore,    max: 10 },
                  { icon: '✏️', label: 'Điền từ',  score: fibScore,    max: 10 },
                  { icon: '🔗', label: 'Matching', score: match1Score + match2Score, max: 10 },
                ].map(r => (
                  <div key={r.label} className="flex items-center gap-3">
                    <span className="text-base flex-shrink-0">{r.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-bold text-gray-600">{r.label}</span>
                        <span className="font-black text-gray-700">{r.score}/{r.max}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full ${colors.accent} rounded-full`}
                          style={{ width: `${(r.score / r.max) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 w-full max-w-xs">
                <button onClick={() => {
                  setMcqScore(0); setFibScore(0); setMatch1Score(0); setMatch2Score(0)
                  setQuestions(buildQuestions(pool))
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
    </div>
  )
}
