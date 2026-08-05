'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useGameSync } from '@/lib/GameSyncContext'
import { speak as speakWord } from '@/lib/speak'
import { playCorrectSound, playWrongSound } from '@/lib/gameSound'
import GameSoundToggle from '@/components/GameSoundToggle'
import { getSRSLimit } from '@/lib/planUtils'
import { loadOfflineProgress, clearOfflineProgress } from '@/lib/offlineStorage'

type Word = { word: string; meaning: string; emoji: string }
// isRetry: reinserted after a wrong first attempt, for same-session reinforcement
// (Anki-style "learning step") — doesn't re-run the SRS interval math, just extra practice.
type Question = { target: Word; choices: Word[]; isRetry?: boolean }
type Session = { plan: string; username?: string; plan_end_date?: string | null; bonus_pro_expires_at?: string | null; free_trial_expires_at?: string | null; bonus_features?: string[] | null }

// Pseudo topic id — namespaces this page's offline-queue / localStorage keys so they
// don't collide with real topic pages (which key by actual topicId).
const SRS_TOPIC_ID = 'srs'
const DEFAULT_SRS_CAP = 20
// How many questions later a wrong word reappears within the same session.
const RETRY_GAP = 4
const LABELS = ['A', 'B', 'C']

const LEVEL_LABELS: Record<string, string> = {
  seeker: 'Seeker', starter: 'Starter', ranger: 'Ranger',
  explorer: 'Explorer', scholar: 'Scholar', master: 'Master',
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

function buildQuestions(dueWords: Word[], allWords: Word[]): Question[] {
  return dueWords.map(target => {
    const others = allWords.filter(w => w.word !== target.word)
    const distractors = shuffle(others).slice(0, 2)
    return { target, choices: shuffle([target, ...distractors]) }
  })
}

export default function SrsReviewPage() {
  const router = useRouter()
  const { initGameSync, recordSrsAnswer, flush } = useGameSync()
  const { childId, level } = useParams<{ childId: string; level: string }>()
  const [questions, setQuestions] = useState<Question[]>([])
  const [totalDue, setTotalDue] = useState(0)
  // Count of first-attempt questions this session (fixed at load) — the denominator
  // for the final score. `questions.length` grows as wrong answers get requeued for
  // retry practice, so it can't be used for the accuracy stat.
  const [officialTotal, setOfficialTotal] = useState(0)
  const [srsLimit, setSrsLimit] = useState<number | null>(DEFAULT_SRS_CAP)
  const [idx, setIdx] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [correct, setCorrect] = useState(0)
  const [loading, setLoading] = useState(true)

  const backUrl = `/dashboard/${childId}/${level}`

  // Mirrors `questions` state but readable synchronously — needed because a wrong
  // answer can append a retry question mid-session, and the "is this the last
  // question" check in handleChoice's setTimeout would otherwise read a stale
  // array length captured by the closure at render time.
  const questionsRef = useRef<Question[]>([])
  const allWordsRef = useRef<Word[]>([])
  const retriedWordsRef = useRef<Set<string>>(new Set())

  function setQuestionsBoth(updater: (qs: Question[]) => Question[]) {
    setQuestions(qs => {
      const next = updater(qs)
      questionsRef.current = next
      return next
    })
  }

  useEffect(() => {
    async function load() {
      const [syncData, levelData, session] = await Promise.all([
        fetch(`/api/sync/${childId}?level=${level}`).then(r => r.json()).catch(() => null),
        fetch(`/api/words/${level}/topics`).then(r => r.json()).then(topics => ({ topics })).catch(() => null),
        fetch('/api/auth/me', { cache: 'no-store' }).then(r => r.ok ? r.json() : null).catch(() => null) as Promise<Session | null>,
      ])

      // Recover any SRS answers that were queued offline (network dropped mid-session)
      // before this same session got a chance to flush — merge them in before computing
      // today's due list, otherwise a word just reviewed offline would still show as due.
      let effectiveSrs = syncData?.srs ?? {}
      const pending = loadOfflineProgress(childId, level, SRS_TOPIC_ID)
      if (pending) {
        const res = await fetch(`/api/sync/${childId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pending),
        }).catch(() => null)
        if (res?.ok) {
          clearOfflineProgress(childId, level, SRS_TOPIC_ID)
          effectiveSrs = { ...effectiveSrs, ...pending.srs }
        }
      }

      initGameSync(childId, level, { ...syncData, srs: effectiveSrs }, SRS_TOPIC_ID, 'Ôn SRS')

      if (!levelData) { router.push(backUrl); return }

      const limit = session ? getSRSLimit(session) : DEFAULT_SRS_CAP
      setSrsLimit(limit)

      const today = new Date().toISOString().split('T')[0]
      const srs = effectiveSrs as Record<string, { due: string }>

      const wordMap = new Map<string, Word>()
      for (const t of levelData.topics) {
        for (const w of t.words as Word[]) wordMap.set(w.word, w)
      }
      const allWords = [...wordMap.values()]
      allWordsRef.current = allWords

      // Sort most-overdue first (smallest due date first)
      const dueEntries = Object.entries(srs)
        .filter(([, e]) => e.due <= today)
        .sort(([, a], [, b]) => a.due < b.due ? -1 : 1)

      setTotalDue(dueEntries.length)

      const capped = (limit == null ? dueEntries : dueEntries.slice(0, limit))
        .map(([word]) => wordMap.get(word))
        .filter(Boolean) as Word[]

      const built = buildQuestions(capped, allWords)
      questionsRef.current = built
      setQuestions(built)
      setOfficialTotal(built.length)
      setLoading(false)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childId, level])

  const current = questions[idx]

  // Speak the correct word when answer is revealed
  useEffect(() => {
    if (selected && current) speakWord(current.target.word, { rate: 0.85 })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected])

  function handleChoice(word: string) {
    if (selected) return
    setSelected(word)
    const isCorrect = word === current.target.word
    if (isCorrect) playCorrectSound(); else playWrongSound()

    if (current.isRetry) {
      // Practice-only re-appearance — the SRS interval/due date was already committed
      // on the first attempt, so this pass just reinforces memory, no DB write.
    } else {
      if (isCorrect) setCorrect(c => c + 1)
      recordSrsAnswer(current.target.word, isCorrect)
      flush() // write-through: persist immediately, don't wait for the whole session

      // Wrong on first try → requeue a few questions later in this same session for
      // reinforcement (Anki-style short "learning step"), capped at one retry per word.
      if (!isCorrect && !retriedWordsRef.current.has(current.target.word)) {
        retriedWordsRef.current.add(current.target.word)
        const target = current.target
        const others = allWordsRef.current.filter(w => w.word !== target.word)
        const distractors = shuffle(others).slice(0, 2)
        const retryQuestion: Question = { target, choices: shuffle([target, ...distractors]), isRetry: true }
        setQuestionsBoth(qs => {
          const next = [...qs]
          const insertAt = Math.min(idx + RETRY_GAP, next.length)
          next.splice(insertAt, 0, retryQuestion)
          return next
        })
      }
    }

    setTimeout(() => {
      const next = idx + 1
      if (next >= questionsRef.current.length) setDone(true)
      else { setIdx(next); setSelected(null) }
    }, 1200)
  }

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50 flex items-center justify-center">
      <div className="text-4xl animate-pulse">📅</div>
    </div>
  )

  if (done || questions.length === 0) {
    const remaining = srsLimit == null ? 0 : totalDue - srsLimit
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-teal-50 to-cyan-50">
        <div className="bg-gradient-to-br from-teal-500 to-cyan-500 px-4 pt-12 pb-8 text-white">
          <button onClick={() => router.back()} className="text-teal-100 font-bold text-sm flex items-center gap-1 mb-4">← {LEVEL_LABELS[level]}</button>
          <h1 className="text-2xl font-black">📅 Ôn SRS</h1>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 text-center">
          {questions.length === 0 ? (
            <>
              <div className="text-7xl mb-4">🎉</div>
              <h2 className="text-2xl font-black text-gray-800 mb-2">Tất cả đã ôn rồi!</h2>
              <p className="text-gray-500 font-semibold mb-8">Không có từ nào cần ôn hôm nay. Quay lại sau nhé!</p>
            </>
          ) : (
            <>
              <div className="text-7xl mb-4">{correct === officialTotal ? '🏆' : correct >= officialTotal * 0.7 ? '⭐' : '💪'}</div>
              <h2 className="text-3xl font-black text-gray-800 mb-1">{correct}/{officialTotal}</h2>
              <p className="text-gray-500 font-bold text-lg mb-2">{Math.round((correct / officialTotal) * 100)}% trả lời đúng</p>
              <p className="text-gray-400 text-sm mb-3">Lịch ôn tiếp theo đã được cập nhật tự động.</p>
              {remaining > 0 && (
                <p className="text-teal-600 text-xs font-bold bg-teal-50 border border-teal-200 rounded-xl px-4 py-2 mb-6">
                  📅 Còn {remaining} từ nữa — ôn tiếp vào ngày mai nhé!
                </p>
              )}
            </>
          )}
          <button onClick={() => router.back()}
            className="w-full max-w-xs bg-teal-500 text-white font-black text-xl py-4 rounded-2xl shadow-lg">
            ← Quay lại
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-br from-teal-500 to-cyan-500 px-4 pt-12 pb-4 text-white">
        <button onClick={() => router.back()} className="text-teal-100 font-bold text-sm flex items-center gap-1 mb-3">← {LEVEL_LABELS[level]}</button>
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-black">📅 Ôn SRS</h1>
          <span className="bg-white/20 px-3 py-1 rounded-full font-black text-sm">{idx + 1}/{questions.length}</span>
        </div>
        <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full bg-white/70 rounded-full transition-all duration-300" style={{ width: `${(idx / questions.length) * 100}%` }} />
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 bg-gradient-to-b from-teal-50 to-cyan-50 flex flex-col px-4 py-6 gap-4">
        {/* Question card */}
        <div className="bg-white rounded-3xl p-6 shadow-md text-center">
          {current.isRetry && (
            <span className="inline-block bg-amber-100 text-amber-700 text-xs font-black px-3 py-1 rounded-full mb-3">
              🔁 Ôn lại — từ này bạn cần luyện thêm
            </span>
          )}
          <p className="text-gray-400 font-bold text-xs uppercase tracking-wider mb-3">Từ tiếng Anh nào có nghĩa là:</p>
          <p className="text-3xl font-black text-gray-800">{current.target.meaning}</p>
          {selected && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <span className="text-2xl">{current.target.emoji}</span>
              <span className="text-xl font-black text-teal-600">{current.target.word}</span>
              <button
                onClick={() => speakWord(current.target.word, { rate: 0.85 })}
                className="text-teal-400 hover:text-teal-600 text-lg active:scale-90 transition-all"
                aria-label="Nghe lại"
              >🔊</button>
            </div>
          )}
        </div>

        {/* MCQ choices */}
        <div className="space-y-3">
          {current.choices.map((choice, i) => {
            const isSelected = selected === choice.word
            const isCorrect = choice.word === current.target.word
            let style = 'bg-white border-gray-200 text-gray-800'
            if (selected) {
              if (isCorrect) style = 'bg-green-100 border-green-400 text-green-800'
              else if (isSelected) style = 'bg-red-100 border-red-400 text-red-700'
              else style = 'bg-white border-gray-100 text-gray-400'
            }
            return (
              <button
                key={choice.word}
                onClick={() => handleChoice(choice.word)}
                disabled={!!selected}
                className={`w-full flex items-center gap-4 border-2 rounded-2xl px-5 py-4 font-bold text-lg transition-all duration-150 active:scale-95 ${style}`}
              >
                <span className="w-9 h-9 rounded-xl bg-teal-100 text-teal-700 font-black text-base flex items-center justify-center flex-shrink-0">
                  {selected && isCorrect ? '✓' : selected && isSelected && !isCorrect ? '✗' : LABELS[i]}
                </span>
                <span>{choice.word}</span>
              </button>
            )
          })}
        </div>
      </div>
      <GameSoundToggle />
    </div>
  )
}
