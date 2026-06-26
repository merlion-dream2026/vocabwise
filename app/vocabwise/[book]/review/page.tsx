'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import VWExerciseRunner from '@/components/vocabwise/VWExerciseRunner'
import type { ExercisesData } from '@/components/vocabwise/types'

type QueueItem   = { topicId: string; topicTitle: string; cefrLevel?: string }
type TopicEx     = {
  topicTitle: string; cefrLevel: string; exTypes: string[]
  exercises: ExercisesData; answerKey: Record<string, Record<string, string>>
  prevScores: Record<string, number>
}
type ReviewResult = { topicTitle: string; score: number; max: number; passed: boolean }
type SyncState   = {
  mastery: Record<string, { completed: boolean; mastered: boolean; ex_scores: Record<string, number>; read?: boolean }>
  srs:     Record<string, { due: string; interval: number }>
  history: Record<string, unknown>
}

const HEADER_COLOR: Record<string, string> = {
  book1: 'bg-emerald-500',
  book2: 'bg-blue-500',
  book3: 'bg-violet-600',
}

export default function ReviewPage() {
  const router = useRouter()
  const { book } = useParams() as { book: string }

  const [queue,      setQueue]      = useState<QueueItem[]>([])
  const [phase,      setPhase]      = useState<'loading' | 'ready' | 'fetching' | 'reviewing' | 'done'>('loading')
  const [currentIdx, setCurrentIdx] = useState(0)
  const [currentEx,  setCurrentEx]  = useState<TopicEx | null>(null)
  const [results,    setResults]    = useState<ReviewResult[]>([])

  // Avoid stale closures in callbacks
  const syncRef            = useRef<SyncState>({ mastery: {}, srs: {}, history: {} })
  const queueRef           = useRef<QueueItem[]>([])
  const completedCurrentRef = useRef(false)

  useEffect(() => { queueRef.current = queue }, [queue])

  // Init: read localStorage queue + fetch sync data
  useEffect(() => {
    if (!book) return
    const raw = localStorage.getItem('vw_review_queue')
    if (!raw) { router.replace(`/vocabwise/${book}`); return }

    let q: QueueItem[]
    try { q = JSON.parse(raw) } catch { router.replace(`/vocabwise/${book}`); return }
    if (!q.length) { router.replace(`/vocabwise/${book}`); return }

    setQueue(q)
    queueRef.current = q

    fetch('/api/vocabwise/sync')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        syncRef.current = {
          mastery: d?.mastery  ?? {},
          srs:     d?.srs      ?? {},
          history: d?.history  ?? {},
        }
        setPhase('ready')
      })
      .catch(() => setPhase('ready'))
  }, [book, router])

  async function fetchTopic(idx: number) {
    const q = queueRef.current
    if (idx >= q.length) { setPhase('done'); return }

    setPhase('fetching')
    setCurrentIdx(idx)
    const topicId = q[idx].topicId

    try {
      const res = await fetch(`/api/vocabwise/topics/${topicId}`)
      if (!res.ok) throw new Error('not found')
      const data = await res.json()
      const prevScores = syncRef.current.mastery[topicId]?.ex_scores ?? {}
      completedCurrentRef.current = false
      setCurrentEx({ ...data, prevScores })
      setPhase('reviewing')
    } catch {
      // Skip failed topic, try next
      fetchTopic(idx + 1)
    }
  }

  function handleComplete(scores: number[]) {
    const q       = queueRef.current
    const idx     = currentIdx
    const topicId = q[idx].topicId
    const exTypes = currentEx?.exTypes ?? []

    // Build ex_scores keyed by exercise type (matches TopicViewer exactly)
    const existing  = syncRef.current.mastery[topicId]?.ex_scores ?? {}
    const newExScores: Record<string, number> = { ...existing }
    exTypes.forEach((type, i) => {
      newExScores[type] = Math.max(scores[i] ?? 0, existing[type] ?? 0)
    })
    const total    = Object.values(newExScores).reduce((a, b) => a + b, 0)
    const passed   = total >= 20  // same threshold as TopicViewer (20/25 = 80%)
    const maxScore = exTypes.length * 5

    // Update mastery
    const newMastery = {
      ...syncRef.current.mastery,
      [topicId]: {
        ...syncRef.current.mastery[topicId],
        read: true, ex_scores: newExScores, completed: true, mastered: passed,
      },
    }

    // Escalate SRS interval on pass, reset to 3 days on fail
    const prevInterval = syncRef.current.srs[topicId]?.interval ?? 7
    const interval     = passed ? Math.min(prevInterval * 2, 30) : 3
    const due          = new Date(Date.now() + interval * 86400000).toISOString().split('T')[0]
    const newSrs       = { ...syncRef.current.srs, [topicId]: { due, interval } }

    // XP history
    const today   = new Date().toISOString().split('T')[0]
    const prev    = (syncRef.current.history as any)[today] ?? {}
    const newHistory = {
      ...syncRef.current.history,
      [today]: {
        topics:   (prev.topics   ?? 0) + 1,
        xp:       (prev.xp       ?? 0) + total,
        topicIds: [...(prev.topicIds ?? []).filter((id: string) => id !== topicId), topicId],
      },
    }

    syncRef.current = { mastery: newMastery, srs: newSrs, history: newHistory }
    completedCurrentRef.current = true

    setResults(r => [...r, {
      topicTitle: q[idx].topicTitle,
      score: total, max: maxScore, passed,
    }])

    // Save to server (fire and forget)
    fetch('/api/vocabwise/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mastery: newMastery, srs: newSrs, history: newHistory }),
    }).catch(() => {})
  }

  function handleBack() {
    if (completedCurrentRef.current) {
      // Exercise done — advance to next topic
      completedCurrentRef.current = false
      const nextIdx = currentIdx + 1
      if (nextIdx >= queueRef.current.length) setPhase('done')
      else fetchTopic(nextIdx)
    } else {
      // User bailing early from exercise menu
      router.replace(`/vocabwise/${book}`)
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  const headerCls = HEADER_COLOR[book] ?? 'bg-teal-500'

  if (phase === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-4xl animate-spin">◌</div>
      </div>
    )
  }

  if (phase === 'ready') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className={`${headerCls} text-white`}>
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
            <button onClick={() => router.back()} aria-label="Quay lại" className="text-white/70 hover:text-white text-xl">←</button>
            <div>
              <p className="font-bold text-lg">📅 Ôn lại hôm nay</p>
              <p className="text-white/70 text-xs">{queue.length} chủ đề trong hàng đợi</p>
            </div>
          </div>
        </div>
        <div className="max-w-2xl mx-auto px-4 py-4 space-y-3">
          <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-sm divide-y divide-gray-50 overflow-hidden">
            {queue.map((item, i) => (
              <div key={item.topicId} className="px-4 py-3 flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-teal-100 text-teal-700 text-xs font-black flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 text-sm">{item.topicTitle}</p>
                  {item.cefrLevel && <p className="text-xs text-gray-400 mt-0.5">{item.cefrLevel}</p>}
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => fetchTopic(0)}
            className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-black py-4 rounded-2xl shadow-lg active:scale-95 transition-all text-base"
          >
            🚀 Bắt đầu ôn ({queue.length} chủ đề)
          </button>
          <button onClick={() => router.back()}
            className="w-full text-gray-400 font-bold py-2 text-sm active:scale-95 transition-transform">
            ← Quay lại
          </button>
        </div>
      </div>
    )
  }

  if (phase === 'fetching') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <div className="text-4xl animate-pulse">📖</div>
        <p className="text-gray-500 font-bold text-sm">
          Đang tải chủ đề {currentIdx + 1}/{queue.length}...
        </p>
      </div>
    )
  }

  if (phase === 'reviewing' && currentEx) {
    const progressPct = (currentIdx / queue.length) * 100
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className={`${headerCls} text-white`}>
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
            <button onClick={() => router.replace(`/vocabwise/${book}`)} aria-label="Quay lại" className="text-white/70 hover:text-white flex-shrink-0">←</button>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white/70 font-medium">📅 Ôn lại · {currentIdx + 1}/{queue.length}</p>
              <p className="font-bold text-sm truncate">{currentEx.topicTitle}</p>
            </div>
            <span className="text-xs font-black text-white/80 bg-white/20 px-2 py-1 rounded-full flex-shrink-0">
              {currentEx.cefrLevel}
            </span>
          </div>
          <div className="h-1 bg-white/20">
            <div className="h-full bg-white/60 transition-all duration-500"
              style={{ width: `${progressPct}%` }} />
          </div>
        </div>
        <div className="max-w-2xl mx-auto px-4 py-4">
          <VWExerciseRunner
            key={`review-${currentIdx}`}
            exercises={currentEx.exercises}
            answerKey={currentEx.answerKey}
            topicTitle={currentEx.topicTitle}
            cefr={currentEx.cefrLevel}
            prevScores={currentEx.prevScores}
            onBack={handleBack}
            onComplete={handleComplete}
          />
        </div>
      </div>
    )
  }

  // ── Done screen ─────────────────────────────────────────────────────────────
  const totalScore  = results.reduce((s, r) => s + r.score, 0)
  const totalMax    = results.reduce((s, r) => s + r.max, 0)
  const passedCount = results.filter(r => r.passed).length
  const pct         = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0
  const medal       = pct >= 80 ? '🏆' : pct >= 60 ? '⭐' : '💪'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className={`${headerCls} text-white`}>
        <div className="max-w-2xl mx-auto px-4 py-4">
          <p className="font-bold text-lg">✅ Phiên ôn tập xong!</p>
          <p className="text-white/70 text-xs">{results.length} chủ đề · {passedCount} thành thạo</p>
        </div>
      </div>
      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4 pb-12">

        <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-sm p-5 text-center">
          <div className="text-5xl mb-2">{medal}</div>
          <p className="text-3xl font-black text-gray-800">{pct}%</p>
          <p className="text-gray-400 text-sm mt-1">
            {totalScore}/{totalMax} điểm · {passedCount}/{results.length} chủ đề thành thạo
          </p>
        </div>

        <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-sm divide-y divide-gray-50 overflow-hidden">
          {results.map((r, i) => (
            <div key={i} className="px-4 py-3 flex items-center gap-3">
              <span className="text-xl flex-shrink-0">{r.passed ? '🏆' : '⚠️'}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 text-sm">{r.topicTitle}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${r.passed ? 'bg-emerald-400' : 'bg-amber-400'}`}
                      style={{ width: `${r.max > 0 ? (r.score / r.max) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-xs font-black text-gray-500 flex-shrink-0">{r.score}/{r.max}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => {
            localStorage.removeItem('vw_review_queue')
            router.replace(`/vocabwise/${book}`)
          }}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-black py-4 rounded-2xl shadow-lg active:scale-95 transition-all"
        >
          ← Quay lại danh sách chủ đề
        </button>
      </div>
    </div>
  )
}
