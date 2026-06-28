'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  initPhonicsSync, getPhonicsStreak, getWeakSounds,
  getDecayScore, getDecayedLessons, canUseStreakFreeze, useStreakFreeze,
  getBadges, isLessonMastered, flushPhonics,
} from '@/lib/phonicsSync'
import phonicsLevels from '@/data/phonicsLevels.json'
import UpgradeModal from '@/components/UpgradeModal'
import { getEffectivePlan, canAccessWordStress } from '@/lib/planUtils'

type Level      = typeof phonicsLevels.levels[number]
type MasteryMap = Record<string, { flashcard: boolean; games: string[] }>
type LessonBase = { id: string; masteryGames: string[] }
type Session    = { plan: string; username: string; plan_end_date?: string | null; bonus_pro_expires_at?: string | null; free_trial_expires_at?: string | null; bonus_features?: string[] | null }

const TOTAL_LESSONS = phonicsLevels.levels.reduce((s, l) => s + l.lessons.length, 0)
const ALL_LESSONS: LessonBase[] = phonicsLevels.levels.flatMap(l => l.lessons as LessonBase[])

type SoundInfo = { levelId: string; lessonId: string; keyword: string; emoji: string; masteryGames: string[] }
const SOUND_TO_LESSON: Record<string, SoundInfo> = (() => {
  const map: Record<string, SoundInfo> = {}
  for (const level of phonicsLevels.levels) {
    for (const lesson of level.lessons) {
      const sounds = (lesson as { sounds?: { symbol: string; keyword: string; emoji: string }[] }).sounds ?? []
      for (const s of sounds) map[s.symbol] = { levelId: level.id, lessonId: lesson.id, keyword: s.keyword, emoji: s.emoji, masteryGames: lesson.masteryGames }
    }
  }
  return map
})()

const LESSON_META: Record<string, { levelId: string; title: string; emoji: string; masteryGames: string[] }> = (() => {
  const map: Record<string, { levelId: string; title: string; emoji: string; masteryGames: string[] }> = {}
  for (const level of phonicsLevels.levels) {
    for (const lesson of level.lessons) {
      map[lesson.id] = { levelId: level.id, title: lesson.title, emoji: lesson.emoji, masteryGames: lesson.masteryGames }
    }
  }
  return map
})()

function isLessonMasteredLocal(lesson: LessonBase, mastery: MasteryMap): boolean {
  const m = mastery[lesson.id]
  if (!m?.flashcard) return false
  return lesson.masteryGames.every(g => m.games.includes(g))
}

function decayColor(score: number): string {
  if (score >= 80) return 'text-green-500'
  if (score >= 65) return 'text-yellow-500'
  return 'text-red-400'
}

// Free tier: only first level (vowels-short) is accessible
const FREE_PHONICS_LEVEL = 'vowels-short'

export default function PhonicsHub() {
  const router = useRouter()
  const { childId } = useParams<{ childId: string }>()
  const [mastery, setMastery]     = useState<MasteryMap>({})
  const [loading, setLoading]     = useState(true)
  const [session, setSession]     = useState<Session | null>(null)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [freezeApplied, setFreezeApplied] = useState(false)
  const [badgeCount, setBadgeCount] = useState(0)

  useEffect(() => {
    Promise.all([
      fetch('/api/auth/me', { cache: 'no-store' }).then(r => r.ok ? r.json() : null),
      fetch(`/api/sync/${childId}?level=phonics`).then(r => r.json()).catch(() => null),
    ]).then(([sess, data]) => {
      setSession(sess)
      initPhonicsSync(childId, data)
      setMastery(data?.mastery ?? {})
      setBadgeCount(getBadges().length)
      setLoading(false)
    })
  }, [childId])

  const handleStreakFreeze = useCallback(async () => {
    if (!canUseStreakFreeze()) return
    useStreakFreeze()
    await flushPhonics()
    setFreezeApplied(true)
  }, [])

  const isPro        = session ? getEffectivePlan(session).isProActive : false
  const hasWordStress = session ? canAccessWordStress(session) : false

  if (showUpgrade) return <UpgradeModal onClose={() => setShowUpgrade(false)} username={session?.username ?? ''} />

  if (loading) return (
    <div className="min-h-screen bg-gray-50 animate-pulse">
      <div className="bg-blue-600 px-4 py-4 flex items-center gap-3">
        <div className="w-6 h-6 rounded bg-white/30" />
        <div className="w-8 h-8 rounded-xl bg-white/30" />
        <div className="h-5 w-32 bg-white/30 rounded-full" />
      </div>
      <div className="max-w-2xl mx-auto px-4 pt-5 space-y-3">
        {[1,2,3,4].map(i => <div key={i} className="h-20 bg-white rounded-2xl" />)}
      </div>
    </div>
  )

  const totalMastered  = ALL_LESSONS.filter(l => isLessonMasteredLocal(l, mastery)).length
  const totalSeen      = Object.values(mastery).filter(m => m.flashcard).length
  const pct            = TOTAL_LESSONS > 0 ? Math.round((totalMastered / TOTAL_LESSONS) * 100) : 0
  const streak         = getPhonicsStreak()
  const weakSounds     = getWeakSounds(3, 0.6).slice(0, 5)
  const decayedLessons = getDecayedLessons(ALL_LESSONS, 65).slice(0, 3)
  const canFreeze      = canUseStreakFreeze() && !freezeApplied

  // Daily challenge: weak sound first, then decayed lesson, then next unstarted
  const dailyChallenge: { type: 'sound' | 'decay' | 'next'; lessonId: string; levelId: string; emoji: string; label: string; game: string } | null = (() => {
    const topWeak = weakSounds[0]
    if (topWeak) {
      const info = SOUND_TO_LESSON[topWeak]
      if (info) return { type: 'sound', lessonId: info.lessonId, levelId: info.levelId, emoji: info.emoji, label: `Ôn âm /${topWeak}/`, game: 'speak' }
    }
    if (decayedLessons[0]) {
      const meta = LESSON_META[decayedLessons[0]]
      if (meta) return { type: 'decay', lessonId: decayedLessons[0], levelId: meta.levelId, emoji: meta.emoji, label: `Ôn lại: ${meta.title}`, game: 'minimal-pairs' }
    }
    // Next unstarted lesson
    for (const level of phonicsLevels.levels) {
      for (const lesson of level.lessons) {
        if (!mastery[lesson.id]?.flashcard) {
          return { type: 'next', lessonId: lesson.id, levelId: level.id, emoji: lesson.emoji, label: `Học tiếp: ${lesson.title}`, game: '' }
        }
      }
    }
    return null
  })()

  const earnedBadges = getBadges().filter(b => b.startsWith('mastered:'))

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => router.back()} className="text-white/70 hover:text-white text-xl">←</button>
          <span className="text-2xl">🔤</span>
          <div>
            <h1 className="font-bold text-lg leading-tight">Phonics</h1>
            <p className="text-white/70 text-xs">IPA · Minimal Pairs · Quy tắc phát âm · Ngữ điệu</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-4 pb-8 space-y-3">

        {/* Progress + streak row */}
        <div className="flex gap-3">
          <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-gray-800 text-sm">🏆 Thành thạo</span>
              <span className="text-xs font-bold text-gray-400">{totalMastered}/{TOTAL_LESSONS} · {pct}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(pct, totalSeen > 0 ? 2 : 0)}%` }} />
            </div>
            <p className="text-xs text-gray-400 mt-1.5 font-medium">{totalSeen} đã học · {totalMastered} thành thạo</p>
          </div>

          {/* Streak card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-3 py-2 flex flex-col items-center justify-center min-w-[72px] gap-0.5">
            <span className="text-2xl">{streak.current > 0 ? '🔥' : '💤'}</span>
            <span className="text-blue-600 font-black text-sm leading-none">{streak.current}d</span>
            <span className="text-gray-400 text-[10px] font-semibold">streak</span>
            {canFreeze && (
              <button onClick={handleStreakFreeze}
                className="mt-1 text-[9px] font-bold bg-sky-100 text-sky-600 px-1.5 py-0.5 rounded-full active:scale-90 transition-transform">
                🧊 Freeze
              </button>
            )}
            {freezeApplied && (
              <span className="text-[9px] font-bold text-sky-500">🧊 Saved!</span>
            )}
          </div>
        </div>

        {/* Daily Challenge */}
        {dailyChallenge && (
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl px-4 py-3.5 text-white shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-wider text-white/60 mb-1.5">⚡ THỬ THÁCH HÔM NAY</p>
            <div className="flex items-center gap-3">
              <span className="text-3xl">{dailyChallenge.emoji}</span>
              <div className="flex-1">
                <p className="font-bold text-sm leading-tight">{dailyChallenge.label}</p>
                <p className="text-white/60 text-xs mt-0.5">
                  {dailyChallenge.type === 'sound' ? 'AI Speak · phát âm chính xác' :
                   dailyChallenge.type === 'decay' ? 'Ôn tập · tránh quên' : 'Bài học mới'}
                </p>
              </div>
              <button
                onClick={() => {
                  const url = dailyChallenge.game
                    ? `/dashboard/${childId}/phonics/${dailyChallenge.levelId}/${dailyChallenge.lessonId}/${dailyChallenge.game}`
                    : `/dashboard/${childId}/phonics/${dailyChallenge.levelId}/${dailyChallenge.lessonId}`
                  router.push(url)
                }}
                className="bg-white/20 hover:bg-white/30 active:scale-95 transition-all px-3 py-1.5 rounded-xl font-bold text-xs">
                Bắt đầu →
              </button>
            </div>
          </div>
        )}

        {/* Weak sounds review */}
        {weakSounds.length > 0 && (
          <div className="bg-amber-50 rounded-2xl border border-amber-200 px-4 py-3.5">
            <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-2.5">📊 Âm cần ôn luyện</p>
            <div className="space-y-2">
              {weakSounds.map(symbol => {
                const info = SOUND_TO_LESSON[symbol]
                if (!info) return null
                return (
                  <button key={symbol}
                    onClick={() => router.push(`/dashboard/${childId}/phonics/${info.levelId}/${info.lessonId}/speak`)}
                    className="w-full flex items-center gap-3 bg-white rounded-xl border border-amber-100 px-3 py-2.5 active:scale-95 transition-transform">
                    <span className="text-xl w-7 text-center">{info.emoji}</span>
                    <div className="flex-1 text-left">
                      <span className="font-black text-gray-800 font-mono">/{symbol}/</span>
                      <span className="text-gray-500 text-xs font-semibold ml-1.5">{info.keyword}</span>
                    </div>
                    <span className="text-amber-600 font-black text-xs">Ôn ngay →</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Decayed lessons (need review) */}
        {decayedLessons.length > 0 && (
          <div className="bg-orange-50 rounded-2xl border border-orange-200 px-4 py-3.5">
            <p className="text-xs font-bold text-orange-700 uppercase tracking-wide mb-2.5">🔄 Cần ôn lại (sắp quên)</p>
            <div className="space-y-2">
              {decayedLessons.map(lessonId => {
                const meta  = LESSON_META[lessonId]
                const score = getDecayScore(lessonId, meta.masteryGames)
                if (!meta) return null
                return (
                  <button key={lessonId}
                    onClick={() => router.push(`/dashboard/${childId}/phonics/${meta.levelId}/${lessonId}`)}
                    className="w-full flex items-center gap-3 bg-white rounded-xl border border-orange-100 px-3 py-2.5 active:scale-95 transition-transform">
                    <span className="text-xl w-7 text-center">{meta.emoji}</span>
                    <div className="flex-1 text-left">
                      <span className="font-bold text-gray-800 text-sm">{meta.title}</span>
                    </div>
                    <span className={`font-black text-xs ${decayColor(score)}`}>{score}%</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Badges */}
        {earnedBadges.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3.5">
            <div className="flex items-center justify-between mb-2.5">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">🏅 Huy hiệu thành thạo</p>
              <span className="text-xs font-bold text-blue-500">{earnedBadges.length}/{TOTAL_LESSONS}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {earnedBadges.map(b => {
                const lessonId = b.replace('mastered:', '')
                const meta = LESSON_META[lessonId]
                if (!meta) return null
                return (
                  <div key={b}
                    title={meta.title}
                    className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 border border-blue-200 flex items-center justify-center text-lg"
                    onClick={() => router.push(`/dashboard/${childId}/phonics/${meta.levelId}/${lessonId}`)}>
                    {meta.emoji}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* How to learn */}
        <HowToLearnCard />

        {/* Level cards */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">📚 CÁC LEVEL ({phonicsLevels.levels.length})</p>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-100">
            {phonicsLevels.levels.map((level: Level) => {
              const unlocked      = isPro || level.id === FREE_PHONICS_LEVEL
              const lessons       = level.lessons as LessonBase[]
              const masteredCount = lessons.filter(l => isLessonMasteredLocal(l, mastery)).length
              const seenCount     = level.lessons.filter(l => mastery[l.id]?.flashcard).length
              const masteredPct   = level.lessons.length > 0 ? Math.round((masteredCount / level.lessons.length) * 100) : 0
              const allDone       = masteredCount === level.lessons.length && seenCount > 0
              // Decay indicator: count faded lessons in this level
              const fadedCount = lessons.filter(l =>
                isLessonMastered(l.id, l.masteryGames) && getDecayScore(l.id, l.masteryGames) < 65
              ).length

              return (
                <button key={level.id}
                  onClick={() => unlocked ? router.push(`/dashboard/${childId}/phonics/${level.id}`) : setShowUpgrade(true)}
                  className={`w-full text-left px-4 py-3.5 flex items-center gap-3 transition-colors ${unlocked ? 'hover:bg-gray-50 active:bg-gray-100' : 'opacity-60'}`}>

                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${level.gradient} flex items-center justify-center text-2xl flex-shrink-0 shadow-sm relative`}>
                    {allDone ? '🏆' : level.emoji}
                    {fadedCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-orange-400 text-white text-[9px] font-black flex items-center justify-center">{fadedCount}</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-800 text-sm">{level.titleVi}</span>
                      <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-md">{level.lessons.length} bài</span>
                      {!unlocked && <span className="text-xs bg-gray-100 text-gray-400 font-bold px-2 py-0.5 rounded-full">🔒</span>}
                    </div>
                    {unlocked && seenCount > 0 && (
                      <div className="mt-1.5">
                        <div className="h-1 bg-gray-100 rounded-full overflow-hidden w-full">
                          <div className={`h-full bg-gradient-to-r ${level.bar} rounded-full transition-all`}
                            style={{ width: `${Math.max(masteredPct, 2)}%` }} />
                        </div>
                        <p className={`text-xs mt-0.5 font-medium ${allDone ? 'text-green-600' : 'text-gray-400'}`}>
                          {allDone ? '🏆 Hoàn thành' : `${seenCount}/${level.lessons.length} đã học · 🏆 ${masteredCount}/${level.lessons.length}`}
                        </p>
                      </div>
                    )}
                    {unlocked && seenCount === 0 && (
                      <p className="text-xs text-gray-400 mt-0.5">{level.subtitle}</p>
                    )}
                    {!unlocked && (
                      <p className="text-xs text-gray-400 mt-0.5">Nâng cấp Pro để mở 🔓</p>
                    )}
                  </div>

                  {unlocked && <span className="text-gray-300 text-sm flex-shrink-0">›</span>}
                </button>
              )
            })}
          </div>
        </div>

        {/* Extra tools */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">🛠️ CÔNG CỤ</p>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-100">
            <button onClick={() => router.push(`/dashboard/${childId}/phonics/chart`)}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 active:bg-gray-100 transition-colors">
              <span className="text-2xl">🗺️</span>
              <div className="text-left flex-1">
                <p className="font-semibold text-gray-800 text-sm">Bản đồ IPA</p>
                <p className="text-xs text-gray-400">Xem toàn bộ 44 âm — click để nghe</p>
              </div>
              <span className="text-gray-300 text-sm">›</span>
            </button>
            <button
              onClick={() => hasWordStress ? router.push(`/dashboard/${childId}/phonics/stress`) : setShowUpgrade(true)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 active:bg-gray-100 transition-colors ${!hasWordStress ? 'opacity-60' : ''}`}>
              <span className="text-2xl">📢</span>
              <div className="text-left flex-1">
                <p className="font-semibold text-gray-800 text-sm">Trọng âm từ
                  {!hasWordStress && <span className="ml-2 text-[10px] font-black bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">Pro 3 tháng+</span>}
                </p>
                <p className="text-xs text-gray-400">Nghe → tap âm tiết được nhấn</p>
              </div>
              <span className="text-gray-300 text-sm">{hasWordStress ? '›' : '🔒'}</span>
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-gray-300 pt-2">
          Phoneme audio: americanipachart.com · Alan Adelberg
        </p>
      </div>
    </div>
  )
}

function HowToLearnCard() {
  const [open, setOpen] = useState(false)
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
        <span className="font-semibold text-gray-700 text-sm">❓ Cách học phát âm</span>
        <span className={`text-gray-400 text-sm transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>
      {open && (
        <div className="px-4 pb-4 text-sm text-gray-600 space-y-2 border-t border-gray-100 pt-3">
          <p>① <strong className="text-gray-800">Học</strong> — đọc nội dung, nghe phát âm mẫu, thử đọc từng từ</p>
          <p>② <strong className="text-gray-800">🎧 / 🔊 / 🎤 / 🎯</strong> — chơi các game luyện tập</p>
          <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
            <p className="font-bold text-blue-700 text-xs mb-1">🏆 Thành thạo 1 bài khi:</p>
            <p className="text-xs text-gray-600">Đã học + hoàn thành các game bắt buộc <strong>mỗi game ≥70%</strong></p>
          </div>
          <p className="text-xs text-gray-400">Level sau mở khi <strong>thành thạo ≥3 bài</strong> ở level trước 🔓</p>
          <div className="bg-orange-50 rounded-xl p-3 border border-orange-100">
            <p className="font-bold text-orange-700 text-xs mb-1">🔄 Điểm ôn tập (Decay):</p>
            <p className="text-xs text-gray-600">Bài đã thành thạo nhưng lâu không ôn sẽ giảm điểm. Ôn lại để giữ ≥65%</p>
          </div>
        </div>
      )}
    </div>
  )
}
