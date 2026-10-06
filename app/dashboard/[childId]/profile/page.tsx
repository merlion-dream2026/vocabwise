'use client'
import { useEffect, useMemo, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'
import { cachedFetch } from '@/lib/cachedFetch'
import { getAvatarSrc } from '@/lib/avatars'
import { PRESS } from '@/components/TopicHub'
import PageSkeleton from '@/components/PageSkeleton'
import StickerAlbum, { type AlbumTab } from '@/components/StickerAlbum'
import { ALL_BADGES, buildSyncSummary, computeEarnedBadges, getXpLevel, type SyncSummary } from '@/lib/badges'
import { DAILY_LEVEL_ORDER, getPhonicsProgress, type SyncLevel } from '@/lib/childProgress'

type Child = { id: string; name: string; emoji: string }
type LevelSync = SyncLevel & { streak?: { current?: number; best?: number; lastActive?: string }; battle?: { totalAllTime?: number } }

const card = 'rounded-3xl border-2 border-b-[4px] border-slate-200 border-b-slate-300 bg-white p-4'
const localDay = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

// The child's profile (nav avatar tab): who is playing, streak / XP / badges, and the sticker album for
// all three modules. "Đổi bé" is the old behaviour of this tab (the child picker).
export default function ProfilePage() {
  const router = useRouter()
  const { childId } = useParams<{ childId: string }>()
  const [child, setChild] = useState<Child | null>(null)
  const [sync, setSync] = useState<Record<string, LevelSync> | null>(null)
  const [showBadges, setShowBadges] = useState(false)

  useEffect(() => {
    Promise.all([
      cachedFetch('/api/children').then(r => r.json()),
      fetch(`/api/sync/${childId}`).then(r => r.json()).catch(() => ({})),
    ]).then(([kids, all]) => {
      const found = (Array.isArray(kids) ? kids as Child[] : []).find(k => k.id === childId)
      if (!found) { router.push('/kids'); return }
      try { localStorage.setItem('nav_child_id', found.id); localStorage.setItem('nav_child_info', JSON.stringify({ id: found.id, name: found.name, emoji: found.emoji })) } catch { /* ignore */ }
      setChild(found); setSync((all ?? {}) as Record<string, LevelSync>)
    }).catch(() => router.push('/kids'))
  }, [childId, router])

  const stats = useMemo(() => {
    const all = sync ?? {}
    const parts = DAILY_LEVEL_ORDER.map(l => buildSyncSummary(all[l] ?? null, l))
    const total: SyncSummary = {
      seenCount: parts.reduce((n, p) => n + p.seenCount, 0),
      bestStreak: Math.max(0, ...parts.map(p => p.bestStreak)),
      masteredTopics: parts.reduce((n, p) => n + p.masteredTopics, 0),
      xp: parts.reduce((n, p) => n + p.xp, 0),
      hasPerfect: parts.some(p => p.hasPerfect),
    }
    // Current streak: the best "current" across levels that was active today or yesterday.
    const today = new Date(); const yest = new Date(Date.now() - 86400000)
    const ok = new Set([localDay(today), localDay(yest)])
    const streak = Math.max(0, ...DAILY_LEVEL_ORDER.map(l => { const s = all[l]?.streak; return s?.lastActive && ok.has(s.lastActive) ? (s.current ?? 0) : 0 }))
    const earned = computeEarnedBadges(total, getPhonicsProgress(all.phonics).mastered)
    return { total, streak, earned, level: getXpLevel(total.xp) }
  }, [sync])

  if (!child || !sync) return <PageSkeleton header="bg-purple-500" bg="from-purple-50 via-pink-50 to-rose-50" cards={[90, 100, 260]} />

  const earnedIds = new Set(stats.earned.map(b => b.id))
  const qTab = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('tab') : null
  const initialTab: AlbumTab = qTab === 'academic' || qTab === 'phonics' ? qTab : 'daily'
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50">
      <div className="rounded-b-3xl border-b-[4px] border-black/20 bg-purple-500 text-white">
        <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-3">
          <Image src={getAvatarSrc(child.emoji)} width={48} height={48} className="h-12 w-12 flex-shrink-0 rounded-full border-2 border-white/80 object-cover shadow" alt="" unoptimized />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-bold leading-tight">{child.name}</h1>
            <p className="text-xs font-semibold text-white/80">{stats.level.emoji} {stats.level.name} · {stats.total.xp} XP</p>
          </div>
          <button type="button" onClick={() => router.push('/kids')}
            className={`flex-shrink-0 rounded-full border-b-[3px] border-black/20 bg-white/25 px-3 py-1.5 text-xs font-bold ${PRESS}`}>🔄 Đổi bé</button>
        </div>
      </div>

      <div className="mx-auto max-w-lg space-y-3 px-4 py-4">
        <div className="grid grid-cols-3 gap-2">
          <div className={`${card} !p-3 text-center`}>
            <p className="text-2xl">🔥</p>
            <p className="text-xl font-bold text-orange-600">{stats.streak}</p>
            <p className="text-[11px] font-semibold text-slate-500">ngày liên tiếp</p>
          </div>
          <div className={`${card} !p-3 text-center`}>
            <p className="text-2xl">{stats.level.emoji}</p>
            <p className="truncate text-sm font-bold text-purple-700">{stats.level.name}</p>
            <div className="mx-auto mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-purple-400" style={{ width: `${stats.level.pct}%` }} /></div>
            <p className="mt-1 text-[11px] font-semibold text-slate-500">{stats.total.xp} XP</p>
          </div>
          <div className={`${card} !p-3 text-center`}>
            <p className="text-2xl">🏅</p>
            <p className="text-xl font-bold text-amber-600">{stats.earned.length}<span className="text-sm text-slate-400">/{ALL_BADGES.length}</span></p>
            <p className="text-[11px] font-semibold text-slate-500">huy hiệu</p>
          </div>
        </div>

        <section className={card}>
          <button type="button" aria-expanded={showBadges} onClick={() => setShowBadges(v => !v)} className="flex w-full items-center justify-between text-left">
            <p className="text-base font-bold text-slate-800">🏅 Huy hiệu</p>
            <span className={`flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500 transition-transform ${showBadges ? 'rotate-180' : ''}`}>▾</span>
          </button>
          {showBadges ? (
            <ul className="mt-3 grid grid-cols-2 gap-2">
              {ALL_BADGES.map(b => (
                <li key={b.id} className={`flex items-center gap-2 rounded-2xl p-2 ${earnedIds.has(b.id) ? 'bg-amber-50' : 'bg-slate-50 opacity-50 grayscale'}`}>
                  <span className="text-2xl">{b.emoji}</span>
                  <span className="min-w-0"><span className="block truncate text-xs font-bold text-slate-700">{b.name}</span><span className="block text-[10px] font-semibold leading-tight text-slate-500">{b.desc}</span></span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {stats.earned.length === 0 && <p className="text-sm font-semibold text-slate-500">Học một chút để nhận huy hiệu đầu tiên nhé!</p>}
              {stats.earned.map(b => <span key={b.id} title={b.name} className="rounded-full bg-amber-50 px-2.5 py-1 text-lg">{b.emoji}</span>)}
            </div>
          )}
        </section>

        <p className="px-1 pt-1 text-base font-bold text-slate-800">🎁 Bộ sưu tập sticker</p>
        <StickerAlbum child={child} initialTab={initialTab} />
      </div>
    </div>
  )
}
