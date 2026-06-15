'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { initPhonicsSync, isPairSeen, isLessonMastered, getPairGames } from '@/lib/phonicsSync'
import phonicsLevels from '@/data/phonicsLevels.json'

type Level  = typeof phonicsLevels.levels[number]
type Lesson = Level['lessons'][number]

function lessonMastered(lesson: Lesson, mastery: Record<string, { flashcard: boolean; games: string[] }>): boolean {
  const m = mastery[lesson.id]
  if (!m?.flashcard) return false
  return lesson.masteryGames.every(g => m.games.includes(g))
}

export default function LevelPage() {
  const router = useRouter()
  const params = useParams<{ childId: string; levelId: string }>()
  const childId = params.childId
  const levelId = decodeURIComponent(params.levelId)
  const [mastery, setMastery] = useState<Record<string, { flashcard: boolean; games: string[] }>>({})
  const [loading, setLoading] = useState(true)

  const level = phonicsLevels.levels.find(l => l.id === levelId) as Level | undefined
  const backUrl = `/dashboard/${childId}/phonics`

  useEffect(() => {
    if (!level) { router.push(backUrl); return }
    fetch(`/api/sync/${childId}?level=phonics`)
      .then(r => r.json()).catch(() => null)
      .then(data => {
        initPhonicsSync(childId, data)
        setMastery(data?.mastery ?? {})
        setLoading(false)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childId, levelId])

  if (!level || loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-4xl animate-pulse">{level?.emoji ?? '🔤'}</div>
    </div>
  )

  const masteredCount = level.lessons.filter(l => lessonMastered(l, mastery)).length
  const seenCount     = level.lessons.filter(l => (mastery[l.id]?.flashcard)).length
  const pct = level.lessons.length > 0 ? Math.round((masteredCount / level.lessons.length) * 100) : 0

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Header */}
      <div className={`bg-gradient-to-br ${level.gradient} px-4 pt-12 pb-6 text-white`}>
        <button onClick={() => router.back()} className="text-white/80 font-bold text-sm flex items-center gap-1 mb-4">
          ← Phonics
        </button>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-4xl">{level.emoji}</span>
          <div>
            <h1 className="text-2xl font-black leading-tight">{level.titleVi}</h1>
            <p className="text-white/70 text-sm font-semibold">{level.subtitle}</p>
          </div>
        </div>
        {/* Progress bar */}
        <div className="bg-white/20 rounded-full h-2 overflow-hidden">
          <div className={`h-full bg-gradient-to-r ${level.bar} rounded-full transition-all duration-500`}
            style={{ width: `${Math.max(pct, seenCount > 0 ? 3 : 0)}%` }} />
        </div>
        <p className="text-white/70 text-xs font-semibold mt-1.5">
          {seenCount === 0 ? 'Chưa bắt đầu' : `${seenCount}/${level.lessons.length} đã học · 🏆 ${masteredCount}/${level.lessons.length} thành thạo`}
        </p>
      </div>

      {/* Lesson list */}
      <div className="max-w-lg mx-auto px-4 pt-5 space-y-3">
        {level.lessons.map((lesson, idx) => {
          const seen     = mastery[lesson.id]?.flashcard ?? false
          const games    = mastery[lesson.id]?.games ?? []
          const mastered = lessonMastered(lesson, mastery)
          const gamesPlayed = games.length

          return (
            <button key={lesson.id}
              onClick={() => router.push(`/dashboard/${childId}/phonics/${levelId}/${lesson.id}`)}
              className={`w-full text-left rounded-2xl p-4 shadow-sm border-2 border-gray-100 bg-white active:scale-95 transition-transform`}>
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 bg-gradient-to-br ${level.gradient}`}>
                  {mastered ? '🏆' : lesson.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-black ${level.text} text-base`}>{lesson.title}</span>
                    <span className="text-xs text-gray-400 font-semibold">{lesson.subtitle}</span>
                  </div>
                  <div className="flex gap-1.5 mt-1 flex-wrap">
                    {!seen && <span className="text-xs text-gray-400 font-semibold">Chưa học</span>}
                    {seen && !mastered && gamesPlayed === 0 && (
                      <span className="text-xs bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">📖 Đã học</span>
                    )}
                    {seen && !mastered && gamesPlayed > 0 && (
                      <span className="text-xs bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">
                        {gamesPlayed}/{lesson.masteryGames.length} 🎮
                      </span>
                    )}
                    {mastered && <span className="text-xs bg-amber-100 text-amber-700 font-black px-2 py-0.5 rounded-full">🏆 Thành thạo</span>}
                  </div>
                </div>
                <span className={`${level.text} font-black text-lg flex-shrink-0`}>→</span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
