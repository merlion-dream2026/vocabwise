'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { cachedFetch } from '@/lib/cachedFetch'
import { GameHeader } from '@/components/ChunkyUI'
import PageSkeleton from '@/components/PageSkeleton'
import Sticker from '@/components/Sticker'

type StickerRow = { collection?: string; level: string; topic_id: string; earned_at: string; legacy: boolean; redemption_id: number | null }
type TopicInfo = { id: string; name: string; emoji: string }
type Child = { id: string; name: string }

const LEVELS = [
  { key: 'seeker', label: 'Seeker', cefr: 'Pre-A1' },
  { key: 'starter', label: 'Starter', cefr: 'A1' },
  { key: 'ranger', label: 'Ranger', cefr: 'A2' },
  { key: 'explorer', label: 'Explorer', cefr: 'B1' },
  { key: 'scholar', label: 'Scholar', cefr: 'B2' },
  { key: 'master', label: 'Master', cefr: 'C1-C2' },
] as const
const TOPICS_PER_LEVEL = 30

// The child's sticker album: one section per level, earned stickers in color (in topic order) and the
// rest as "?" silhouettes. Topic names are only fetched for levels the child has stickers in.
export default function StickerAlbumPage() {
  const router = useRouter()
  const { childId } = useParams<{ childId: string }>()
  const [child, setChild] = useState<Child | null>(null)
  const [stickers, setStickers] = useState<StickerRow[] | null>(null)
  const [topics, setTopics] = useState<Record<string, TopicInfo[]>>({})
  // Level sections the child folded away. Levels with no stickers yet start folded (just a row of "?").
  const [toggled, setToggled] = useState<Record<string, boolean>>({})

  useEffect(() => {
    Promise.all([
      cachedFetch('/api/children').then(r => r.json()),
      fetch(`/api/stickers/${childId}`).then(r => r.ok ? r.json() : []).catch(() => []),
    ]).then(async ([kids, rows]) => {
      const found = (kids as Child[]).find(k => k.id === childId)
      if (!found) { router.push('/kids'); return }
      setChild(found)
      if (!Array.isArray(rows)) { setStickers([]); return }
      // This album is the Daily collection; other collections (Academic, Phonics) get their own tabs later.
      const list = (rows as StickerRow[]).filter(r => (r.collection ?? 'daily') === 'daily' && LEVELS.some(l => l.key === r.level))
      const levelsWith = Array.from(new Set(list.map(r => r.level)))
      const entries = await Promise.all(levelsWith.map(async lv => {
        const t = await cachedFetch(`/api/words/${lv}/topics`).then(r => r.json()).catch(() => [])
        return [lv, Array.isArray(t) ? (t as TopicInfo[]).map(x => ({ id: x.id, name: x.name, emoji: x.emoji })) : []] as const
      }))
      setTopics(Object.fromEntries(entries))
      setStickers(list)
    }).catch(() => setStickers([]))  // never leave the page on the loading skeleton
  }, [childId, router])

  if (!child || !stickers) return <PageSkeleton header="bg-purple-500" bg="from-purple-50 via-pink-50 to-rose-50" cards={[110, 220]} />

  const total = stickers.length
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50">
      <GameHeader colorCls="bg-purple-500" title="🎁 Bộ sưu tập sticker" subtitle={child.name}
        right={<>{total}</>} onBack={() => router.push(`/dashboard/${childId}/kids`)} />
      <div className="mx-auto max-w-lg space-y-3 px-4 py-4">
        {total === 0 && (
          <div className="rounded-3xl border-2 border-b-[4px] border-purple-200 border-b-purple-300 bg-white p-5 text-center">
            <p className="text-5xl">🎁</p>
            <p className="mt-2 text-base font-bold text-slate-800">Chưa có sticker nào</p>
            <p className="mt-1 text-sm font-semibold text-slate-500">Hoàn thành một chủ đề để nhận sticker đầu tiên nhé!</p>
          </div>
        )}
        {LEVELS.map(lv => {
          const mine = stickers.filter(s => s.level === lv.key)
          const order = topics[lv.key] ?? []
          const rank = (id: string) => { const i = order.findIndex(t => t.id === id); return i < 0 ? 999 : i }
          const earned = [...mine].sort((a, b) => rank(a.topic_id) - rank(b.topic_id))
          const lockedCount = Math.max(0, TOPICS_PER_LEVEL - earned.length)
          const hasLegacy = earned.some(e => e.legacy)
          const open = (earned.length > 0) !== !!toggled[lv.key]   // default open iff it has stickers; a tap flips it
          return (
            <section key={lv.key} className="rounded-3xl border-2 border-b-[4px] border-slate-200 border-b-slate-300 bg-white p-4">
              <button type="button" aria-expanded={open} onClick={() => setToggled(t => ({ ...t, [lv.key]: !t[lv.key] }))}
                className="flex w-full items-center justify-between gap-2 text-left">
                <p className="text-base font-bold text-slate-800">{lv.label} <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">{lv.cefr}</span></p>
                <span className="flex items-center gap-2">
                  <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700">{earned.length}/{TOPICS_PER_LEVEL}</span>
                  <span className={`flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
                </span>
              </button>
              {open && hasLegacy && <p className="mt-1 text-xs font-semibold text-slate-400">Một số sticker được tặng cho các chủ đề đã hoàn thành từ trước.</p>}
              {open && <div className="mt-3 grid grid-cols-4 gap-3">
                {earned.map((s, i) => {
                  const info = order.find(t => t.id === s.topic_id)
                  return (
                    <div key={s.topic_id} className="flex flex-col items-center gap-1 text-center">
                      <span className="relative">
                        <Sticker emoji={info?.emoji ?? '⭐'} size="md" tilt={i % 2 === 0 ? -6 : 6} />
                        {s.redemption_id && (
                          <span title="Đã đổi quà" className="absolute -bottom-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-purple-600 text-[11px]">🎁</span>
                        )}
                      </span>
                      <span className="line-clamp-2 text-[11px] font-semibold leading-tight text-slate-600">{info?.name ?? s.topic_id}</span>
                    </div>
                  )
                })}
                {Array.from({ length: lockedCount }).map((_, i) => (
                  <div key={`l${i}`} className="flex flex-col items-center gap-1">
                    <Sticker emoji="" locked size="md" tilt={(i + earned.length) % 2 === 0 ? -6 : 6} />
                  </div>
                ))}
              </div>}
            </section>
          )
        })}
      </div>
    </div>
  )
}
