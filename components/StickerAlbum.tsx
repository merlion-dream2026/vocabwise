'use client'
import { useEffect, useState } from 'react'
import { cachedFetch } from '@/lib/cachedFetch'
import Sticker from '@/components/Sticker'
import Image from 'next/image'
import { getAvatarSrc } from '@/lib/avatars'
import { shareStickerCard } from '@/lib/stickerShare'

type StickerRow = { collection?: string; level: string; topic_id: string; earned_at: string; legacy: boolean; redemption_id: number | null }
type TopicInfo = { id: string; name: string; emoji: string }
export type AlbumChild = { id: string; name: string; emoji: string }
export type AlbumTab = 'daily' | 'academic' | 'phonics'
type Tab = AlbumTab
type Section = { key: string; label: string; tag: string; total: number }

const SECTIONS: Record<Tab, Section[]> = {
  daily: [
    { key: 'seeker', label: 'Seeker', tag: 'Pre-A1', total: 30 },
    { key: 'starter', label: 'Starter', tag: 'A1', total: 30 },
    { key: 'ranger', label: 'Ranger', tag: 'A2', total: 30 },
    { key: 'explorer', label: 'Explorer', tag: 'B1', total: 30 },
    { key: 'scholar', label: 'Scholar', tag: 'B2', total: 30 },
    { key: 'master', label: 'Master', tag: 'C1-C2', total: 30 },
  ],
  phonics: [],   // Phonics stickers are not awarded yet
  academic: [
    { key: 'book1', label: 'Foundation', tag: 'A1–A2', total: 60 },
    { key: 'book2', label: 'Progress', tag: 'B1–B2', total: 60 },
    { key: 'book3', label: 'Mastery', tag: 'C1–C2', total: 60 },
  ],
}
const TAB_LABEL: Record<Tab, string> = { daily: '📚 Daily', academic: '🎓 Academic', phonics: '🔊 Phonics' }

// Topic names/emoji for one section: Daily levels come from the words API, Academic books from topic-meta.
async function loadTopics(tab: Tab, key: string): Promise<TopicInfo[]> {
  const url = tab === 'daily' ? `/api/words/${key}/topics` : `/api/vocabwise/topic-meta?book=${key}`
  const t = await cachedFetch(url).then(r => r.json()).catch(() => [])
  return Array.isArray(t) ? (t as TopicInfo[]).map(x => ({ id: x.id, name: x.name, emoji: x.emoji })) : []
}

// The child's sticker album: a tab per collection, a section per level/book (foldable), earned stickers in
// color in topic order and the rest as "?" silhouettes. Topic names are only fetched for sections that have stickers.
export default function StickerAlbum({ child, initialTab = 'daily' }: { child: AlbumChild; initialTab?: AlbumTab }) {
  const childId = child.id
  const [stickers, setStickers] = useState<StickerRow[] | null>(null)
  const [topics, setTopics] = useState<Record<string, TopicInfo[]>>({})
  const [tab, setTab] = useState<Tab>(initialTab)
  // Sections the child folded/unfolded by hand. Default: open iff it has stickers (empty ones are just a row of "?").
  const [toggled, setToggled] = useState<Record<string, boolean>>({})
  const [sharing, setSharing] = useState<string | null>(null)
  const [shareMsg, setShareMsg] = useState('')

  useEffect(() => {
    fetch(`/api/stickers/${childId}`).then(r => r.ok ? r.json() : []).catch(() => []).then(async rows => {
      if (!Array.isArray(rows)) { setStickers([]); return }
      const known = (r: StickerRow) => SECTIONS[(r.collection ?? 'daily') as Tab]?.some(s => s.key === r.level)
      const list = (rows as StickerRow[]).filter(known)
      const wanted = Array.from(new Set(list.map(r => `${r.collection ?? 'daily'}/${r.level}`)))
      const entries = await Promise.all(wanted.map(async w => {
        const [col, lv] = w.split('/')
        return [w, await loadTopics(col as Tab, lv)] as const
      }))
      setTopics(Object.fromEntries(entries))
      setStickers(list)
    }).catch(() => setStickers([]))  // never leave the album on a skeleton
  }, [childId])

  if (!stickers) return <div className="h-48 animate-pulse rounded-3xl border-2 border-b-[4px] border-slate-200 border-b-slate-300 bg-white" />

  const inTab = (t: Tab) => stickers.filter(s => (s.collection ?? 'daily') === t)
  return (
    <div className="space-y-3">
        <div className="grid grid-cols-3 gap-1.5 rounded-2xl bg-white/70 p-1">
          {(Object.keys(SECTIONS) as Tab[]).map(t => (
            <button key={t} type="button" onClick={() => setTab(t)} aria-pressed={tab === t}
              className={`rounded-xl py-2 text-xs font-bold ${tab === t ? 'bg-purple-600 text-white' : 'text-slate-500'}`}>
              {TAB_LABEL[t]} <span className="text-xs opacity-80">({inTab(t).length})</span>
            </button>
          ))}
        </div>
        {inTab(tab).length === 0 && (
          <div className="rounded-3xl border-2 border-b-[4px] border-purple-200 border-b-purple-300 bg-white p-5 text-center">
            <p className="text-5xl">🎁</p>
            <p className="mt-2 text-base font-bold text-slate-800">Chưa có sticker nào ở đây</p>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              {tab === 'daily' ? 'Hoàn thành một chủ đề Daily để nhận sticker đầu tiên nhé!' : tab === 'academic' ? 'Đạt từ 20/25 điểm bài tập ở một topic Academic để nhận sticker nhé!' : 'Sticker Phonics sắp ra mắt, chờ nhé!'}
            </p>
          </div>
        )}
        {shareMsg && <p className="rounded-2xl bg-white/80 px-4 py-2 text-center text-sm font-bold text-purple-700">{shareMsg}</p>}
        {SECTIONS[tab].map(sec => {
          const mine = inTab(tab).filter(s => s.level === sec.key)
          const order = topics[`${tab}/${sec.key}`] ?? []
          const rank = (id: string) => { const i = order.findIndex(t => t.id === id); return i < 0 ? 999 : i }
          const earned = [...mine].sort((a, b) => rank(a.topic_id) - rank(b.topic_id))
          const lockedCount = Math.max(0, sec.total - earned.length)
          const hasLegacy = earned.some(e => e.legacy)
          const tk = `${tab}/${sec.key}`
          const open = (earned.length > 0) !== !!toggled[tk]
          return (
            <section key={tk} className="rounded-3xl border-2 border-b-[4px] border-slate-200 border-b-slate-300 bg-white p-4">
              <div className="flex items-center gap-2">
                <button type="button" aria-expanded={open} onClick={() => setToggled(t => ({ ...t, [tk]: !t[tk] }))}
                  className="grid min-w-0 flex-1 grid-cols-[1fr_auto_1fr] items-center gap-2 text-left">
                  <p className="min-w-0 truncate text-base font-bold text-slate-800">{sec.label} <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">{sec.tag}</span></p>
                  <span className="flex items-center gap-1.5">
                    <Image src={getAvatarSrc(child.emoji)} width={28} height={28} className="h-7 w-7 rounded-full object-cover" alt="" unoptimized />
                    <span className="max-w-[72px] truncate text-sm font-bold text-slate-700">{child.name}</span>
                  </span>
                  <span className="flex items-center justify-end gap-2">
                    <span className="rounded-full bg-purple-100 px-2.5 py-1 text-xs font-bold text-purple-700">{earned.length}/{sec.total}</span>
                    <span className={`flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
                  </span>
                </button>
                <button type="button" aria-label={`Chia sẻ sticker ${sec.label}`} title="Chia sẻ" disabled={earned.length === 0 || sharing === tk}
                  onClick={async () => {
                    setSharing(tk); setShareMsg('')
                    try {
                      const slots = [
                        ...earned.map(e => { const i = order.find(t => t.id === e.topic_id); return { emoji: i?.emoji ?? '⭐', name: i?.name ?? e.topic_id } }),
                        ...Array.from({ length: lockedCount }, () => null),
                      ]
                      const r = await shareStickerCard({ childName: child.name, avatarSrc: getAvatarSrc(child.emoji), title: sec.label, tag: sec.tag, stickers: slots, earned: earned.length })
                      if (r === 'downloaded') setShareMsg('Đã tải hình về máy. Gửi cho người thân nhé!')
                    } catch { setShareMsg('Chưa tạo được hình, thử lại nhé.') }
                    setSharing(null)
                  }}
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 text-base text-purple-700 active:scale-95 disabled:opacity-40">
                  {sharing === tk ? '…' : '📤'}
                </button>
              </div>
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
  )
}
