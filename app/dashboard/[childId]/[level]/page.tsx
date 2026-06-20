'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { buildSyncSummary, computeEarnedBadges, getXpLevel, ALL_BADGES, XP_LEVELS } from '@/lib/badges'
import { DAILY_XP_GOAL } from '@/lib/childProgress'
import { getAvatarSrc } from '@/lib/avatars'
import UpgradePaymentModal from '@/components/UpgradeModal'
import ExpiryBanner from '@/components/ExpiryBanner'
import { getEffectivePlan } from '@/lib/planUtils'

type Child = { id: string; name: string; emoji: string; level: string }
type Session = { familyId: string; username: string; plan: string; bonus_pro_expires_at?: string | null; free_trial_expires_at?: string | null; plan_end_date?: string | null; bonus_features?: string[] | null }
type Topic = { id: string; name: string; emoji: string; color: string; words: { word: string }[] }
type MasteryData = { flashcard: boolean; games: string[] }

const FREE_TOPIC_LIMIT = 1

const LEVEL_COLORS: Record<string, { bg: string; header: string }> = {
  seeker:   { bg: 'from-violet-50 to-purple-50',  header: 'bg-violet-500'  },
  starter:  { bg: 'from-pink-50 to-rose-50',       header: 'bg-pink-500'    },
  ranger:   { bg: 'from-emerald-50 to-teal-50',    header: 'bg-emerald-500' },
  explorer: { bg: 'from-blue-50 to-indigo-50',     header: 'bg-blue-500'    },
  scholar:  { bg: 'from-indigo-50 to-violet-50',   header: 'bg-indigo-500'  },
  master:   { bg: 'from-gray-50 to-slate-100',     header: 'bg-gray-700'    },
}

const LEVEL_LABELS: Record<string, { label: string; cefr: string }> = {
  seeker:   { label: 'Seeker',   cefr: 'Pre-A1' },
  starter:  { label: 'Starter',  cefr: 'A1'     },
  ranger:   { label: 'Ranger',   cefr: 'A2'     },
  explorer: { label: 'Explorer', cefr: 'B1'     },
  scholar:  { label: 'Scholar',  cefr: 'B2'     },
  master:   { label: 'Master',   cefr: 'C1-C2'  },
}

function UpsellModal({ onClose, username }: { onClose: () => void; username: string }) {
  const [showPayment, setShowPayment] = useState(false)
  if (showPayment) return <UpgradePaymentModal onClose={onClose} username={username} />
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl p-7 w-full max-w-sm shadow-2xl text-center" onClick={e => e.stopPropagation()}>
        <div className="text-5xl mb-3">🔓</div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Mở khóa tất cả chủ đề</h2>
        <p className="text-gray-500 text-sm mb-5">
          Gói Free chỉ học được <strong>1 chủ đề đầu tiên</strong> của mỗi level. Nâng cấp Pro để mở khóa toàn bộ 30 chủ đề × 6 levels và tối đa 3 bé.
        </p>
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-4 mb-5 text-left space-y-1.5">
          <p className="text-sm font-semibold text-gray-700">✅ Toàn bộ 30 chủ đề × 6 levels</p>
          <p className="text-sm font-semibold text-gray-700">✅ Tối đa 3 hồ sơ bé</p>
          <p className="text-sm font-semibold text-gray-700">✅ Tất cả trò chơi & AI phát âm</p>
        </div>
        <button onClick={() => setShowPayment(true)}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-black py-3 rounded-2xl text-sm mb-3 active:scale-95 transition-transform shadow-md">
          ⭐ Nâng cấp Pro ngay →
        </button>
        <button onClick={onClose} className="w-full text-gray-400 text-sm py-1 hover:text-gray-600 transition-colors">
          Để sau
        </button>
      </div>
    </div>
  )
}

export default function LevelTopicsPage() {
  const router = useRouter()
  const { childId, level } = useParams<{ childId: string; level: string }>()
  const [child, setChild] = useState<Child | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [mastery, setMastery] = useState<Record<string, MasteryData>>({})
  const [seen, setSeen] = useState<Set<string>>(new Set())
  const [weakKeys, setWeakKeys] = useState<Set<string>>(new Set())
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [syncRaw, setSyncRaw] = useState<any>(null)
  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(true)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showBadgeGuide, setShowBadgeGuide] = useState(false)
  const [showXpGuide, setShowXpGuide] = useState(false)
  const [showAllBadges, setShowAllBadges] = useState(false)
  const [revScores, setRevScores] = useState<Record<string, { score: number; max: number }>>({})

  useEffect(() => {
    const saved = localStorage.getItem('topicViewMode') as 'grid' | 'list' | null
    if (saved) setViewMode(saved)
  }, [])

  useEffect(() => {
    if (!level) return
    const scores: Record<string, { score: number; max: number }> = {}
    for (let i = 1; i <= 6; i++) {
      const rid = `r${String(i).padStart(2, '0')}`
      const raw = localStorage.getItem(`revision_kids_${level}_${rid}`)
      if (raw) { try { scores[rid] = JSON.parse(raw) } catch {} }
    }
    setRevScores(scores)
  }, [level])

  function toggleView() {
    setViewMode(v => {
      const next = v === 'grid' ? 'list' : 'grid'
      localStorage.setItem('topicViewMode', next)
      return next
    })
  }

  useEffect(() => {
    Promise.all([
      fetch('/api/auth/me').then(r => r.json()),
      fetch('/api/children').then(r => r.json()),
      fetch(`/api/sync/${childId}?level=${level}`).then(r => r.json()),
      fetch(`/api/words/${level}`).then(r => r.json()).catch(() => null),
    ]).then(([sess, kids, syncData, levelData]) => {
      if (!sess) { router.push('/login'); return }
      const found = (kids as Child[]).find(k => k.id === childId)
      if (!found) { router.push('/'); return }
      if (!levelData) { router.push(`/dashboard/${childId}`); return }
      setSession(sess)
      setChild(found)
      setTopics(levelData.topics ?? [])
      setMastery(syncData?.mastery ?? {})
      setSeen(new Set(syncData?.seen ?? []))
      setWeakKeys(new Set(Object.keys(syncData?.weak_words ?? {})))
      setSyncRaw(syncData)
      setLoading(false)
    })
  }, [childId, level, router])

  if (loading) {
    const skeletonHeader = LEVEL_COLORS[level]?.header ?? 'bg-purple-500'
    const skeletonBg = LEVEL_COLORS[level]?.bg ?? 'from-purple-50 to-pink-50'
    return (
      <div className={`min-h-screen bg-gradient-to-br ${skeletonBg} animate-pulse`}>
        <div className={`${skeletonHeader} px-4 py-4 flex items-center gap-3`}>
          <div className="w-6 h-6 rounded bg-white/30" />
          <div className="w-10 h-10 rounded-xl bg-white/30" />
          <div className="space-y-1.5">
            <div className="h-4 w-28 bg-white/30 rounded-full" />
            <div className="h-3 w-20 bg-white/20 rounded-full" />
          </div>
        </div>
        <div className="max-w-2xl mx-auto px-4 pt-6 pb-4 space-y-3">
          <div className="h-20 bg-white/60 rounded-2xl" />
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-24 bg-white/60 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  const isPaid = getEffectivePlan(session!).isProActive || !!(session!.bonus_features?.includes('kids_full'))
  const colors = LEVEL_COLORS[level] ?? LEVEL_COLORS.explorer

  function renderRevCard(revNum: number) {
    const startT = (revNum - 1) * 5 + 1
    const endT   = revNum * 5
    const rid    = `r${String(revNum).padStart(2, '0')}`
    const score  = revScores[rid]
    return (
      <Link href={`/dashboard/${childId}/${level}/revision/${rid}`}
        className={`block ${colors.header} rounded-2xl px-4 py-3 shadow-md active:scale-[0.98] transition-all`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-xl flex-shrink-0">✨</span>
            <div className="min-w-0">
              <p className="font-black text-white text-sm leading-snug">Revision: Topics {startT}–{endT}</p>
              <p className="text-white/80 text-xs mt-0.5">30 câu · 3 dạng bài</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
            {score ? (
              <span className="text-xs font-black bg-white/30 text-white px-2 py-0.5 rounded-full">{score.score}/{score.max}</span>
            ) : (
              <span className="text-xs font-black bg-white/20 text-white px-2 py-0.5 rounded-full">REVISION</span>
            )}
            <span className="text-white/70 text-sm">›</span>
          </div>
        </div>
      </Link>
    )
  }
  const levelInfo = LEVEL_LABELS[level] ?? { label: level, cefr: '' }
  const totalWeak = weakKeys.size
  const today = new Date().toISOString().split('T')[0]
  const srsDueCount = Object.values((syncRaw?.srs ?? {}) as Record<string, { due: string }>).filter(e => e.due <= today).length
  const summary = buildSyncSummary(syncRaw)
  const xpInfo = getXpLevel(summary.xp)
  const earnedBadges = computeEarnedBadges(summary)
  const earnedIds = new Set(earnedBadges.map(b => b.id))
  const todayXP = (syncRaw?.history?.[today]?.xp ?? 0) as number
  const todayXPDone = todayXP >= DAILY_XP_GOAL
  const todayXPPct = Math.min(100, Math.round((todayXP / DAILY_XP_GOAL) * 100))

  function topicStatus(topic: Topic): 'done' | 'in_progress' | 'not_started' {
    const m = mastery[topic.id]
    if (m?.flashcard && m.games.length >= 3) return 'done'
    const seenCount = topic.words.filter(w => seen.has(w.word)).length
    if (seenCount > 0 || m?.flashcard) return 'in_progress'
    return 'not_started'
  }

  function topicSeenCount(topic: Topic): number {
    return topic.words.filter(w => seen.has(w.word)).length
  }

  function topicWeakCount(topic: Topic): number {
    return topic.words.filter(w => weakKeys.has(w.word)).length
  }

  function handleTopicClick(topic: Topic, idx: number) {
    if (!isPaid && idx >= FREE_TOPIC_LIMIT) { setShowUpgrade(true); return }
    router.push(`/dashboard/${childId}/${level}/${topic.id}`)
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${colors.bg}`}>
      {showUpgrade && <UpsellModal onClose={() => setShowUpgrade(false)} username={session?.username ?? ''} />}

      {/* Header */}
      <div className={`${colors.header} text-white`}>
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => router.push(`/dashboard/${childId}/kids`)} className="text-white/70 hover:text-white text-xl">←</button>
          <img src={getAvatarSrc(child!.emoji)} className="w-8 h-8 rounded-full object-cover flex-shrink-0" alt="" />
          <div>
            <h1 className="font-bold text-lg leading-tight">{child!.name}</h1>
            <p className="text-white/70 text-xs">{levelInfo.label} · {levelInfo.cefr}</p>
          </div>
        </div>
      </div>

      {/* Expiry countdown */}
      <div className="max-w-2xl mx-auto px-4 pt-3">
        <ExpiryBanner session={session!} onUpgrade={() => setShowUpgrade(true)} />
      </div>

      {/* Weak words review banner */}
      {totalWeak > 0 && (
        <div className="max-w-2xl mx-auto px-4 pt-4">
          <button onClick={() => router.push(`/dashboard/${childId}/review?level=${level}`)}
            className="w-full bg-orange-50 border-2 border-orange-200 rounded-2xl px-4 py-3 flex items-center justify-between active:scale-95 transition-transform">
            <div className="flex items-center gap-2">
              <span className="text-xl">⚠️</span>
              <div className="text-left">
                <p className="text-sm font-black text-orange-700">Ôn từ yếu</p>
                <p className="text-xs text-orange-500">{totalWeak} từ cần ôn lại</p>
              </div>
            </div>
            <span className="text-orange-500 font-black text-sm">Ôn ngay →</span>
          </button>
        </div>
      )}

      {/* SRS due-words banner */}
      {srsDueCount > 0 && (
        <div className="max-w-2xl mx-auto px-4 pt-3">
          <button onClick={() => router.push(`/dashboard/${childId}/${level}/srs`)}
            className="w-full bg-teal-50 border-2 border-teal-200 rounded-2xl px-4 py-3 flex items-center justify-between active:scale-95 transition-transform">
            <div className="flex items-center gap-2">
              <span className="text-xl">📅</span>
              <div className="text-left">
                <p className="text-sm font-black text-teal-700">Ôn lại hôm nay</p>
                <p className="text-xs text-teal-500">{srsDueCount} từ cần ôn theo lịch</p>
              </div>
            </div>
            <span className="text-teal-500 font-black text-sm">Ôn ngay →</span>
          </button>
        </div>
      )}

      {/* Free plan banner */}
      {!isPaid && (
        <div className="max-w-2xl mx-auto px-4 pt-4">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-center justify-between">
            <p className="text-sm text-amber-700">
              🔒 Gói Free: <strong>1/{topics.length}</strong> chủ đề miễn phí
            </p>
            <button onClick={() => setShowUpgrade(true)}
              className="text-xs bg-amber-500 text-white px-3 py-1.5 rounded-full font-medium">
              Nâng cấp
            </button>
          </div>
        </div>
      )}

      {/* XP + Badges */}
      <div className="max-w-2xl mx-auto px-4 pt-4">
        <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-sm p-4 space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-black text-gray-800 text-sm">
                {xpInfo.emoji} {xpInfo.name}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-gray-400">{summary.xp} XP</span>
                <button
                  onClick={() => setShowXpGuide(true)}
                  className="w-4 h-4 rounded-full bg-gray-100 text-gray-400 text-[10px] font-bold flex items-center justify-center hover:bg-purple-100 hover:text-purple-500 transition-colors"
                >?</button>
              </div>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full transition-all duration-700"
                style={{ width: `${xpInfo.pct}%` }}
              />
            </div>
            {xpInfo.level < 5 && (
              <p className="text-xs text-gray-400 mt-1 font-medium">
                Level tiếp: {xpInfo.maxXp + 1 - summary.xp} XP nữa
              </p>
            )}
          </div>

          {/* Daily XP goal */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-gray-500">⚡ Mục tiêu hôm nay</span>
              <span className={`text-xs font-black ${todayXPDone ? 'text-green-600' : 'text-gray-500'}`}>
                {todayXP}/{DAILY_XP_GOAL} XP {todayXPDone ? '✅' : ''}
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${todayXPDone ? 'bg-gradient-to-r from-green-400 to-emerald-400' : 'bg-gradient-to-r from-yellow-400 to-orange-400'}`}
                style={{ width: `${Math.max(todayXPPct, todayXP > 0 ? 3 : 0)}%` }}
              />
            </div>
          </div>

          <div>
            {/* Compact row — always visible */}
            <div className="flex items-center gap-2">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider flex-shrink-0">
                Huy hiệu · {earnedBadges.length}/{ALL_BADGES.length}
              </p>
              {/* 3 most-recent earned badges (or gray placeholders) */}
              <div className="flex items-center gap-1 flex-1">
                {earnedBadges.length === 0
                  ? [0,1,2].map(i => (
                      <div key={i} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-base grayscale opacity-30">
                        {ALL_BADGES[i]?.emoji}
                      </div>
                    ))
                  : earnedBadges.slice(-3).map(badge => (
                      <div key={badge.id} title={badge.name}
                        className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-base">
                        {badge.emoji}
                      </div>
                    ))
                }
                {earnedBadges.length > 3 && (
                  <span className="text-xs font-bold text-gray-400 ml-0.5">+{earnedBadges.length - 3}</span>
                )}
              </div>
              {/* Expand / collapse button */}
              <button
                onClick={() => setShowAllBadges(v => !v)}
                className="flex-shrink-0 flex items-center gap-0.5 text-xs font-bold text-gray-400 hover:text-purple-500 px-2 py-1 rounded-lg hover:bg-purple-50 transition-colors">
                {showAllBadges ? '▲' : '···'}
              </button>
            </div>

            {/* Expanded full badge grid */}
            {showAllBadges && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-1.5 mb-2">
                  <p className="text-xs text-gray-400 font-medium">Tất cả huy hiệu</p>
                  <button
                    onClick={() => setShowBadgeGuide(true)}
                    className="w-4 h-4 rounded-full bg-gray-100 text-gray-400 text-[10px] font-bold flex items-center justify-center hover:bg-purple-100 hover:text-purple-500 transition-colors"
                  >?</button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_BADGES.map(badge => {
                    const earned = earnedIds.has(badge.id)
                    return (
                      <div key={badge.id} title={`${badge.name}: ${badge.desc}`}
                        className={`w-9 h-9 flex items-center justify-center rounded-full text-lg transition-all ${
                          earned ? 'bg-purple-100' : 'bg-gray-100 grayscale opacity-40'
                        }`}>
                        {badge.emoji}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Topic section header with view toggle */}
      <div className="max-w-2xl mx-auto px-4 pt-5 pb-2 flex items-center justify-between">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
          📚 TOPICS ({topics.length})
        </p>
        <button onClick={toggleView}
          className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-bold text-gray-500 shadow-sm active:scale-95 transition-transform">
          {viewMode === 'grid' ? (
            <><span>☰</span> List</>
          ) : (
            <><span>⊞</span> Grid</>
          )}
        </button>
      </div>

      {/* Topic grid */}
      {viewMode === 'grid' ? (
        <div className="max-w-2xl mx-auto px-4 pb-5">
          <div className="grid grid-cols-2 gap-3">
            {topics.map((topic, idx) => {
              const locked = !isPaid && idx >= FREE_TOPIC_LIMIT
              const status = topicStatus(topic)
              const seenCount = topicSeenCount(topic)
              const total = topic.words.length
              const gamesCount = mastery[topic.id]?.games.length ?? 0
              const flashcardDone = mastery[topic.id]?.flashcard ?? false
              const pct = total > 0 ? Math.round((seenCount / total) * 100) : 0
              const weakCount = topicWeakCount(topic)

              const cardCls = locked
                ? 'bg-white opacity-60'
                : status === 'done'
                  ? 'bg-green-50 border-2 border-green-300'
                  : status === 'in_progress'
                    ? 'bg-amber-50 border-2 border-amber-300'
                    : 'bg-white border-2 border-transparent'

              const isRevPoint = (idx + 1) % 5 === 0
              const revNum = Math.floor(idx / 5) + 1
              return (
                <React.Fragment key={topic.id}>
                <button
                  onClick={() => handleTopicClick(topic, idx)}
                  className={`relative ${cardCls} rounded-2xl p-4 text-left shadow-sm transition-all ${
                    locked ? '' : 'hover:shadow-md active:scale-95'
                  }`}>

                  {locked && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-gray-100/50">
                      <span className="text-2xl">🔒</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2.5 mb-2">
                    <span className="text-3xl flex-shrink-0">{topic.emoji}</span>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-800 text-sm leading-snug"><span className="text-gray-400 font-bold mr-1">{String(idx + 1).padStart(2, '0')}.</span>{topic.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{total} từ</p>
                    </div>
                  </div>

                  {!locked && (
                    <div className="mt-2 space-y-1.5">
                      {status === 'done' && (
                        <span className="inline-block text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full font-medium">
                          🏆 Xong
                        </span>
                      )}
                      {status === 'in_progress' && (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {flashcardDone
                              ? <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">📖 ✓ · 🎮 {gamesCount}/3</span>
                              : <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">📖 {seenCount}/{total}</span>
                            }
                          </div>
                          <div className="h-1.5 bg-amber-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-amber-400 rounded-full transition-all"
                              style={{ width: `${flashcardDone ? 100 : pct}%` }}
                            />
                          </div>
                        </div>
                      )}
                      {weakCount > 0 && (
                        <span className="inline-block text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-medium">
                          ⚠️ {weakCount} từ yếu
                        </span>
                      )}
                    </div>
                  )}
                </button>
                {isRevPoint && (
                  <div className="col-span-2">
                    {renderRevCard(revNum)}
                  </div>
                )}
                </React.Fragment>
              )
            })}
          </div>
        </div>
      ) : (
        /* List view */
        <div className="max-w-2xl mx-auto px-4 pb-5">
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-100">
            {topics.map((topic, idx) => {
              const locked = !isPaid && idx >= FREE_TOPIC_LIMIT
              const status = topicStatus(topic)
              const seenCount = topicSeenCount(topic)
              const total = topic.words.length
              const gamesCount = mastery[topic.id]?.games.length ?? 0
              const flashcardDone = mastery[topic.id]?.flashcard ?? false
              const pct = total > 0 ? Math.round((seenCount / total) * 100) : 0
              const weakCount = topicWeakCount(topic)

              const isRevPoint = (idx + 1) % 5 === 0
              const revNum = Math.floor(idx / 5) + 1
              return (
                <React.Fragment key={topic.id}>
                <button
                  onClick={() => handleTopicClick(topic, idx)}
                  className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${
                    locked ? 'opacity-50' : 'hover:bg-gray-50 active:bg-gray-100'
                  }`}>

                  <span className="text-2xl flex-shrink-0">{topic.emoji}</span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-800 text-sm truncate"><span className="text-gray-400 font-bold mr-1">{String(idx + 1).padStart(2, '0')}.</span>{topic.name}</p>
                      {locked && <span className="text-sm">🔒</span>}
                      {!locked && status === 'done' && (
                        <span className="text-xs bg-green-100 text-green-600 px-1.5 py-0.5 rounded-full font-medium flex-shrink-0">🏆 Xong</span>
                      )}
                      {!locked && weakCount > 0 && (
                        <span className="text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full font-medium flex-shrink-0">⚠️ {weakCount}</span>
                      )}
                    </div>
                    {!locked && status === 'in_progress' && (
                      <div className="mt-1 h-1 bg-gray-100 rounded-full overflow-hidden w-full">
                        <div
                          className="h-full bg-amber-400 rounded-full transition-all"
                          style={{ width: `${flashcardDone ? 100 : pct}%` }}
                        />
                      </div>
                    )}
                  </div>

                  <span className="text-xs text-gray-400 font-medium flex-shrink-0">
                    {locked ? '' : status === 'in_progress'
                      ? (flashcardDone ? `🎮 ${gamesCount}/3` : `${seenCount}/${total}`)
                      : status === 'done' ? '' : `${total} từ`
                    }
                  </span>

                  <span className="text-gray-300 text-sm flex-shrink-0">›</span>
                </button>
                {isRevPoint && (
                  <div className="px-3 py-2 bg-gray-50">
                    {renderRevCard(revNum)}
                  </div>
                )}
                </React.Fragment>
              )
            })}
          </div>
        </div>
      )}

      {/* XP guide modal */}
      {showXpGuide && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={() => setShowXpGuide(false)}>
          <div className="bg-white w-full max-w-md rounded-t-3xl p-5 pb-8" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-black text-gray-800 text-base">⭐ XP là gì?</h2>
              <button onClick={() => setShowXpGuide(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
            </div>
            <p className="text-sm text-gray-500 mb-3">XP (điểm kinh nghiệm) tăng mỗi khi bạn trả lời đúng trong các trò chơi. Game khó → nhiều XP hơn!</p>
            {/* Game multiplier tiers */}
            <div className="space-y-1.5 mb-4">
              {[
                { dot: 'bg-red-400',    label: '2 XP/câu',   games: 'Đánh vần · Gõ từ nhanh · Điền chữ thiếu · Speed Round' },
                { dot: 'bg-yellow-400', label: '1.5 XP/câu', games: 'Trắc nghiệm · Điền từ · Nghe & Chọn · Sắp xếp câu · Câu chuyện · Phát âm AI · Ghép định nghĩa' },
                { dot: 'bg-green-400',  label: '1 XP/câu',   games: 'Nối từ · Lật thẻ · Đúng/Sai · Bắn bong bóng' },
              ].map(row => (
                <div key={row.label} className="flex items-start gap-2 bg-gray-50 rounded-xl px-3 py-2">
                  <span className={`mt-1 w-2.5 h-2.5 rounded-full flex-shrink-0 ${row.dot}`} />
                  <div>
                    <span className="text-xs font-black text-gray-700">{row.label} — </span>
                    <span className="text-xs text-gray-500">{row.games}</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs font-bold text-purple-600 mb-3">Cấp độ XP của bạn</p>
            <div className="space-y-2">
              {XP_LEVELS.map(lvl => {
                const isCurrentLevel = xpInfo.level === lvl.level
                const reached = summary.xp >= lvl.minXp
                return (
                  <div key={lvl.level} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${isCurrentLevel ? 'bg-purple-50 border border-purple-200' : reached ? 'bg-gray-50' : 'bg-gray-50 opacity-40'}`}>
                    <span className="text-2xl">{lvl.emoji}</span>
                    <div className="flex-1">
                      <p className={`text-sm font-bold ${isCurrentLevel ? 'text-purple-700' : 'text-gray-600'}`}>
                        {lvl.name} {isCurrentLevel && <span className="text-xs font-normal text-purple-400">← bạn đang ở đây</span>}
                      </p>
                      <p className="text-xs text-gray-400">
                        {lvl.maxXp === -1 ? `Từ ${lvl.minXp} XP trở lên` : `${lvl.minXp} – ${lvl.maxXp} XP`}
                      </p>
                    </div>
                    {reached && !isCurrentLevel && <span className="text-green-500 text-sm">✓</span>}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Badge guide modal */}
      {showBadgeGuide && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={() => setShowBadgeGuide(false)}>
          <div className="bg-white w-full max-w-md rounded-t-3xl p-5 pb-8 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-black text-gray-800 text-base">🏅 Các huy hiệu</h2>
              <button onClick={() => setShowBadgeGuide(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
            </div>
            <div className="space-y-1">
              {ALL_BADGES.map(badge => {
                const earned = earnedIds.has(badge.id)
                return (
                  <div key={badge.id} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${earned ? 'bg-purple-50' : 'bg-gray-50'}`}>
                    <span className={`text-2xl ${earned ? '' : 'grayscale opacity-40'}`}>{badge.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold ${earned ? 'text-purple-700' : 'text-gray-400'}`}>{badge.name}</p>
                      <p className="text-xs text-gray-400">{badge.desc}</p>
                    </div>
                    {earned && <span className="text-green-500 text-sm">✓</span>}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
