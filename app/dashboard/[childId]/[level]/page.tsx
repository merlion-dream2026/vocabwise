'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { buildSyncSummary, computeEarnedBadges, getXpLevel, ALL_BADGES, XP_LEVELS } from '@/lib/badges'
import { DAILY_XP_GOAL } from '@/lib/childProgress'
import Image from 'next/image'
import { getAvatarSrc } from '@/lib/avatars'
import UpgradePaymentModal from '@/components/UpgradeModal'
import ExpiryBanner from '@/components/ExpiryBanner'
import { getEffectivePlan, getOfflineDownloadLimit } from '@/lib/planUtils'
import OfflineDailyDownloadButton from '@/components/OfflineDailyDownloadButton'
import { getDownloadedCount } from '@/lib/useOfflineDownload'

type Child = { id: string; name: string; emoji: string; level: string }
type Session = { familyId: string; username: string; plan: string; bonus_pro_expires_at?: string | null; free_trial_expires_at?: string | null; plan_end_date?: string | null; bonus_features?: string[] | null }
type Topic = { id: string; name: string; emoji: string; color: string; words: { word: string }[]; audioSize?: number }
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
  const [revScores, setRevScores] = useState<Record<string, { score: number; max: number }>>({})
  const [dlCount, setDlCount] = useState(0)
  const [downloadedTopics, setDownloadedTopics] = useState<Set<string>>(new Set())

  useEffect(() => {
    getDownloadedCount().then(setDlCount).catch(() => {})
    const handler = () => getDownloadedCount().then(setDlCount).catch(() => {})
    window.addEventListener('offline-cache-changed', handler)
    return () => window.removeEventListener('offline-cache-changed', handler)
  }, [])

  useEffect(() => {
    function refresh() {
      const dl = new Set<string>()
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i)
        if (k?.startsWith(`vw_dl_daily_${level}_`)) dl.add(k.replace(`vw_dl_daily_${level}_`, ''))
      }
      setDownloadedTopics(dl)
    }
    refresh()
    window.addEventListener('offline-cache-changed', refresh)
    return () => window.removeEventListener('offline-cache-changed', refresh)
  }, [level])

  useEffect(() => {
    const saved = localStorage.getItem('topicViewMode') as 'grid' | 'list' | null
    if (saved) setViewMode(saved)
  }, [])

  const loadRevScores = useCallback(() => {
    if (!level) return
    const scores: Record<string, { score: number; max: number }> = {}
    for (let i = 1; i <= 6; i++) {
      const rid = `r${String(i).padStart(2, '0')}`
      const raw = localStorage.getItem(`revision_kids_${level}_${rid}`)
      if (raw) { try { scores[rid] = JSON.parse(raw) } catch {} }
    }
    setRevScores(scores)
  }, [level])

  useEffect(() => {
    loadRevScores()
    window.addEventListener('focus', loadRevScores)
    return () => window.removeEventListener('focus', loadRevScores)
  }, [loadRevScores])

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
      try { localStorage.setItem('vw_child_' + childId, JSON.stringify(found)) } catch {}
      setTopics(levelData.topics ?? [])
      setMastery(syncData?.mastery ?? {})
      setSeen(new Set(syncData?.seen ?? []))
      setWeakKeys(new Set(Object.keys(syncData?.weak_words ?? {})))
      setSyncRaw(syncData)
      // Merge server revision scores with localStorage (local wins for same key — most recent)
      const serverScores: Record<string, { score: number; max: number }> = syncData?.revision_scores ?? {}
      setRevScores(local => ({ ...serverScores, ...local }))
      // Backfill: push any localStorage scores that aren't on the server yet
      for (let i = 1; i <= 6; i++) {
        const rid = `r${String(i).padStart(2, '0')}`
        const raw = localStorage.getItem(`revision_kids_${level}_${rid}`)
        if (raw && !serverScores[rid]) {
          try {
            const value = JSON.parse(raw)
            fetch(`/api/sync/${childId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ level, revision_score_key: rid, revision_score_value: value }),
            }).catch(() => {})
          } catch {}
        }
      }
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
  const isProForDl = getEffectivePlan(session!).isProActive
  const dlLimit = getOfflineDownloadLimit(session!)
  const colors = LEVEL_COLORS[level] ?? LEVEL_COLORS.explorer

  function renderRevCard(revNum: number) {
    const startT = (revNum - 1) * 5 + 1
    const endT   = revNum * 5
    const rid    = `r${String(revNum).padStart(2, '0')}`
    const score  = revScores[rid]
    return (
      <Link href={`/dashboard/${childId}/${level}/revision/${rid}`}
        className={`block ${score ? 'bg-green-500' : colors.header} rounded-2xl px-4 py-3 shadow-md active:scale-[0.98] transition-all`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-xl flex-shrink-0">{score ? '✅' : '✨'}</span>
            <div className="min-w-0">
              <p className="font-black text-white text-sm leading-snug">Revision: Topics {startT}–{endT}</p>
              <p className="text-white/80 text-xs mt-0.5">30 câu · 3 dạng bài</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
            {score ? (
              <>
                <span className="text-xs font-black bg-white/30 text-white px-2 py-0.5 rounded-full">Xong · {score.score}/{score.max}</span>
              </>
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
          <button onClick={() => router.push(`/dashboard/${childId}/kids`)} aria-label="Quay lại" className="text-white/70 hover:text-white text-xl">←</button>
          <Image src={getAvatarSrc(child!.emoji)} width={32} height={32} className="rounded-full object-cover flex-shrink-0" alt="" unoptimized />
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

      {/* Stats — 3 mini cards */}
      <div className="max-w-2xl mx-auto px-4 pt-4">
        <div className="grid grid-cols-3 gap-2">
          {/* XP + daily goal */}
          <button
            onClick={() => setShowXpGuide(true)}
            className="bg-white rounded-2xl border-2 border-purple-100 shadow-sm p-3 flex flex-col gap-1 text-left active:scale-95 transition-transform"
          >
            <div className="flex items-center gap-1">
              <span className="text-base leading-none">{xpInfo.emoji}</span>
              <span className="text-[11px] font-black text-gray-700 truncate leading-tight">{xpInfo.name}</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full transition-all duration-700" style={{ width: `${xpInfo.pct}%` }} />
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-bold ${todayXPDone ? 'text-green-600' : 'text-orange-500'}`}>
                ⚡{todayXP}/{DAILY_XP_GOAL}{todayXPDone ? ' ✅' : ''}
              </span>
              <span className="text-[10px] text-gray-400">🏅{earnedBadges.length}</span>
            </div>
          </button>

          {/* Từ yếu */}
          <button
            onClick={() => { if (totalWeak > 0) router.push(`/dashboard/${childId}/review?level=${level}`) }}
            className={`rounded-2xl border-2 shadow-sm p-3 flex flex-col gap-1 text-left transition-transform ${totalWeak > 0 ? 'bg-orange-50 border-orange-200 active:scale-95' : 'bg-gray-50 border-gray-100 opacity-50 cursor-default'}`}
          >
            <span className="text-base leading-none">⚠️</span>
            <p className="text-[11px] font-black text-gray-700">Từ yếu</p>
            <p className={`text-xl font-black leading-none ${totalWeak > 0 ? 'text-orange-500' : 'text-gray-400'}`}>{totalWeak}</p>
            <p className={`text-[10px] font-medium ${totalWeak > 0 ? 'text-orange-400' : 'text-gray-400'}`}>{totalWeak > 0 ? 'Ôn ngay →' : 'Tốt lắm!'}</p>
          </button>

          {/* Ôn lịch (SRS) */}
          <button
            onClick={() => { if (srsDueCount > 0) router.push(`/dashboard/${childId}/${level}/srs`) }}
            className={`rounded-2xl border-2 shadow-sm p-3 flex flex-col gap-1 text-left transition-transform ${srsDueCount > 0 ? 'bg-teal-50 border-teal-200 active:scale-95' : 'bg-gray-50 border-gray-100 opacity-50 cursor-default'}`}
          >
            <span className="text-base leading-none">📅</span>
            <p className="text-[11px] font-black text-gray-700">Ôn lịch</p>
            <p className={`text-xl font-black leading-none ${srsDueCount > 0 ? 'text-teal-500' : 'text-gray-400'}`}>{srsDueCount}</p>
            <p className={`text-[10px] font-medium ${srsDueCount > 0 ? 'text-teal-400' : 'text-gray-400'}`}>{srsDueCount > 0 ? 'Ôn ngay →' : 'Đã xong!'}</p>
          </button>
        </div>
      </div>

      {/* Free plan banner */}
      {!isPaid && (
        <div className="max-w-2xl mx-auto px-4 pt-3">
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
                <div className="relative">
                <button
                  onClick={() => handleTopicClick(topic, idx)}
                  className={`w-full relative ${cardCls} rounded-2xl p-4 text-left shadow-sm transition-all ${
                    locked ? '' : 'hover:shadow-md active:scale-95'
                  }`}>

                  {locked && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-gray-100/50">
                      <span className="text-2xl">🔒</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2.5 mb-2">
                    <span className="text-3xl flex-shrink-0">{topic.emoji}</span>
                    <div className="min-w-0 pr-7">
                      <p className="font-semibold text-gray-800 text-sm leading-snug">
                        <span className="text-gray-400 font-bold mr-1">{String(idx + 1).padStart(2, '0')}.</span>
                        {topic.name}
                        <span className="text-gray-400 font-normal ml-1 text-xs">({total} từ)</span>
                      </p>
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
                      {downloadedTopics.has(topic.id) && (
                        <span className="inline-block text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">
                          📴 {topic.audioSize ? `~${Math.round((topic.audioSize + 30720) / 1024)}KB` : 'Offline'}
                        </span>
                      )}
                    </div>
                  )}
                </button>
                {isProForDl && !locked && (
                  <OfflineDailyDownloadButton
                    childId={childId}
                    level={level}
                    topicId={topic.id}
                    topicName={topic.name}
                    audioSize={topic.audioSize ?? 0}
                    downloadedCount={dlCount}
                    downloadLimit={dlLimit}
                    className="absolute top-2 right-2 z-10"
                  />
                )}
                </div>
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
                <div className="relative flex items-center">
                <button
                  onClick={() => handleTopicClick(topic, idx)}
                  className={`flex-1 min-w-0 text-left px-4 py-3 flex items-center gap-3 transition-colors ${
                    locked ? 'opacity-50' : 'hover:bg-gray-50 active:bg-gray-100'
                  }`}>

                  <span className="text-2xl flex-shrink-0">{topic.emoji}</span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-800 text-sm truncate">
                        <span className="text-gray-400 font-bold mr-1">{String(idx + 1).padStart(2, '0')}.</span>
                        {topic.name}
                        {!locked && status === 'not_started' && (
                          <span className="text-gray-400 font-normal ml-1 text-xs">({total} từ)</span>
                        )}
                      </p>
                      {locked && <span className="text-sm">🔒</span>}
                      {!locked && status === 'done' && (
                        <span className="text-xs bg-green-100 text-green-600 px-1.5 py-0.5 rounded-full font-medium flex-shrink-0">🏆 Xong</span>
                      )}
                      {!locked && weakCount > 0 && (
                        <span className="text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full font-medium flex-shrink-0">⚠️ {weakCount}</span>
                      )}
                      {!locked && downloadedTopics.has(topic.id) && (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full flex-shrink-0">📴</span>
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
                    {!locked && status === 'in_progress'
                      ? (flashcardDone ? `🎮 ${gamesCount}/3` : `${seenCount}/${total}`)
                      : ''
                    }
                  </span>

                  <span className="text-gray-300 text-sm flex-shrink-0">›</span>
                </button>
                {isProForDl && !locked && (
                  <OfflineDailyDownloadButton
                    childId={childId}
                    level={level}
                    topicId={topic.id}
                    topicName={topic.name}
                    audioSize={topic.audioSize ?? 0}
                    downloadedCount={dlCount}
                    downloadLimit={dlLimit}
                    className="absolute right-9 top-1/2 -translate-y-1/2 z-10"
                  />
                )}
                </div>
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
              <button onClick={() => setShowXpGuide(false)} aria-label="Đóng" className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
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
            <button
              onClick={() => { setShowXpGuide(false); setShowBadgeGuide(true) }}
              className="mt-4 w-full py-2.5 rounded-xl bg-purple-50 text-purple-600 font-bold text-sm hover:bg-purple-100 transition-colors"
            >
              🏅 Xem huy hiệu ({earnedBadges.length}/{ALL_BADGES.length}) →
            </button>
          </div>
        </div>
      )}

      {/* Badge guide modal */}
      {showBadgeGuide && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={() => setShowBadgeGuide(false)}>
          <div className="bg-white w-full max-w-md rounded-t-3xl p-5 pb-8 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-black text-gray-800 text-base">🏅 Các huy hiệu</h2>
              <button onClick={() => setShowBadgeGuide(false)} aria-label="Đóng" className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
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
