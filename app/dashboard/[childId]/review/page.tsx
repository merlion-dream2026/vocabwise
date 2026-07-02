'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { useGameSync, type WeakEntry } from '@/lib/GameSyncContext'
import type { ReviewWord } from '@/components/ReviewSession'

const ReviewSession = dynamic(() => import('@/components/ReviewSession'), { ssr: false })

const MAX_REVIEW = 15

type Child = { id: string; name: string; emoji: string; level: string }

type LevelData = { topics: { words: { word: string; meaning: string; emoji: string }[] }[] }

function buildReviewWords(levelData: LevelData | null, weak: Record<string, WeakEntry>): ReviewWord[] {
  if (Object.keys(weak).length === 0) return []
  if (!levelData) return []

  // Build lookup: word → { meaning, emoji }
  const lookup: Record<string, { meaning: string; emoji: string }> = {}
  for (const topic of levelData.topics) {
    for (const w of topic.words as { word: string; meaning: string; emoji: string }[]) {
      lookup[w.word] = { meaning: w.meaning, emoji: w.emoji }
    }
  }

  return Object.entries(weak)
    .filter(([word]) => lookup[word])
    .map(([word, entry]) => ({
      word,
      meaning: lookup[word].meaning,
      emoji: lookup[word].emoji,
      wrong: entry.wrong,
      correctStreak: entry.correctStreak,
      lastWrong: entry.lastWrong,
    }))
    .sort((a, b) => b.wrong - a.wrong || b.correctStreak - a.correctStreak) // most wrong, least mastered first
    .slice(0, MAX_REVIEW) as ReviewWord[]
}

export default function ReviewPage() {
  const router = useRouter()
  const { initGameSync, getWeakWords } = useGameSync()
  const { childId } = useParams<{ childId: string }>()
  const searchParams = useSearchParams()
  const [child, setChild] = useState<Child | null>(null)
  const [activeLevel, setActiveLevel] = useState('')
  const [reviewWords, setReviewWords] = useState<ReviewWord[]>([])
  const [loading, setLoading] = useState(true)
  const [sessionKey, setSessionKey] = useState(0)

  const backUrl = `/dashboard/${childId}`

  const loadData = useCallback(async () => {
    setLoading(true)
    const kids = await fetch('/api/children').then(r => r.json())
    const found = (kids as Child[]).find(k => k.id === childId)
    if (!found) { router.push('/kids'); return }
    setChild(found)
    // Use level from URL param if present (e.g. from "Ôn ngay" on a specific level page)
    // so that weak words for the browsed level are loaded, not just the profile level
    const level = searchParams.get('level') ?? found.level
    setActiveLevel(level)
    const [syncData, levelData] = await Promise.all([
      fetch(`/api/sync/${childId}?level=${level}`).then(r => r.json()).catch(() => null),
      fetch(`/api/words/${level}`).then(r => r.json()).catch(() => null),
    ])
    initGameSync(childId, level, syncData)
    setReviewWords(buildReviewWords(levelData, getWeakWords()))
    setLoading(false)
  }, [childId, router, searchParams, initGameSync, getWeakWords])

  useEffect(() => { loadData() }, [loadData])

  const handleSessionDone = useCallback(async () => {
    // Re-fetch to get updated weak_words after flush
    await loadData()
    setSessionKey(k => k + 1)
  }, [loadData])

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
      <p className="text-gray-400 font-bold">Đang tải...</p>
    </div>
  )

  if (reviewWords.length === 0) {
    const isStarter = activeLevel === 'starter'
    const headerBg = isStarter
      ? 'bg-gradient-to-br from-pink-400 to-rose-400'
      : 'bg-gradient-to-br from-blue-500 to-cyan-400'
    return (
      <div className="flex flex-col min-h-screen">
        <div className={`${headerBg} px-4 pt-12 pb-8 text-white`}>
          <button onClick={() => router.back()}
            className="text-white/80 font-bold text-sm flex items-center gap-1 mb-4">
            ← Quay lại
          </button>
          <h1 className="text-2xl font-black">📚 Ôn Từ Yếu</h1>
        </div>
        <div className="flex-1 bg-gradient-to-b from-purple-50 to-pink-50 flex flex-col items-center justify-center px-4 py-8">
          <div className="text-7xl mb-4">🎉</div>
          <h2 className="text-2xl font-black text-gray-800 mb-2">Không có từ nào cần ôn!</h2>
          <p className="text-gray-500 font-semibold mb-8">Bé đang học rất tốt 💪</p>
          <button onClick={() => router.back()}
            className="w-full max-w-sm bg-white border-2 border-gray-200 text-gray-600 font-bold text-xl py-4 rounded-2xl">
            ← Quay lại
          </button>
        </div>
      </div>
    )
  }

  return (
    <ReviewSession
      key={sessionKey}
      words={reviewWords}
      level={activeLevel}
      backUrl={backUrl}
      onSessionDone={handleSessionDone}
    />
  )
}
