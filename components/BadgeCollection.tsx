'use client'
import { useEffect, useState } from 'react'
import { BadgeArt } from '@/components/Mascot'
import { PRESS } from '@/components/TopicHub'
import { ALL_BADGES, badgeExplain, badgeProgress, type SyncSummary } from '@/lib/badges'

// Badge grid with a −/+ size control (3 steps, remembered per device) and tap-to-zoom detail.
// Image sizes are picked so every step still fits a 320px-wide phone inside a padded card.
const SIZES = [
  { cols: 'grid-cols-4', img: 44, label: false },
  { cols: 'grid-cols-3', img: 64, label: true },
  { cols: 'grid-cols-2', img: 104, label: true },
] as const
const SIZE_KEY = 'badge_grid_size'

export default function BadgeCollection({ earnedIds, summary, phonics = 0 }: {
  earnedIds: Set<string>
  summary: SyncSummary
  phonics?: number
}) {
  const [size, setSize] = useState(1)
  const [open, setOpen] = useState<number | null>(null)

  useEffect(() => {
    try { const v = Number(localStorage.getItem(SIZE_KEY)); if (v >= 0 && v < SIZES.length) setSize(v) } catch { /* ignore */ }
  }, [])
  function resize(d: number) {
    const v = Math.min(SIZES.length - 1, Math.max(0, size + d))
    setSize(v)
    try { localStorage.setItem(SIZE_KEY, String(v)) } catch { /* ignore */ }
  }

  const s = SIZES[size]
  const btn = `flex h-8 w-8 items-center justify-center rounded-full border-b-[3px] border-slate-300 bg-slate-100 text-lg font-bold text-slate-600 disabled:opacity-40 ${PRESS}`
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-500">Chạm vào huy hiệu để xem chi tiết</p>
        <div className="flex items-center gap-1.5">
          <button type="button" onClick={() => resize(-1)} disabled={size === 0} aria-label="Thu nhỏ huy hiệu" className={btn}>−</button>
          <button type="button" onClick={() => resize(1)} disabled={size === SIZES.length - 1} aria-label="Phóng to huy hiệu" className={btn}>+</button>
        </div>
      </div>
      <ul className={`grid ${s.cols} gap-2`}>
        {ALL_BADGES.map((b, i) => {
          const earned = earnedIds.has(b.id)
          return (
            <li key={b.id}>
              <button type="button" onClick={() => setOpen(i)} aria-label={`${b.name}${earned ? ' — đã đạt' : ' — chưa đạt'}`}
                className={`flex w-full flex-col items-center gap-1 rounded-2xl p-1.5 text-center ${earned ? 'bg-amber-50' : 'bg-slate-50'} ${PRESS}`}>
                <span className="relative">
                  <BadgeArt id={b.id} emoji={b.emoji} size={s.img} className={`rounded-xl ${earned ? '' : 'opacity-50 grayscale'}`} />
                  {!earned && <span aria-hidden className="absolute -bottom-1 -right-1 rounded-full bg-white px-1 text-xs shadow">🔒</span>}
                </span>
                {s.label && <span className="w-full truncate text-xs font-bold text-slate-700">{b.name}</span>}
                {size === SIZES.length - 1 && <span className="text-[10px] font-semibold leading-tight text-slate-500">{b.desc}</span>}
              </button>
            </li>
          )
        })}
      </ul>
      {open !== null && (
        <BadgeDetailDialog index={open} onIndex={setOpen} onClose={() => setOpen(null)}
          earnedIds={earnedIds} summary={summary} phonics={phonics} />
      )}
    </div>
  )
}

// Zoomed badge: big art, earned/locked status, how to get it, live progress, ‹ › to browse.
export function BadgeDetailDialog({ index, onIndex, onClose, earnedIds, summary, phonics = 0, ids }: {
  index: number
  onIndex: (i: number) => void
  onClose: () => void
  earnedIds: Set<string>
  summary: SyncSummary
  phonics?: number
  ids?: string[]          // browse only these badges (default: all)
}) {
  const list = ids ? ALL_BADGES.filter(b => ids.includes(b.id)) : ALL_BADGES
  const b = list[index]
  const earned = earnedIds.has(b.id)
  const p = badgeProgress(b.id, summary, phonics)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight' && index < list.length - 1) onIndex(index + 1)
      if (e.key === 'ArrowLeft' && index > 0) onIndex(index - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [index, list.length, onClose, onIndex])

  const nav = `flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-b-[3px] border-slate-300 bg-slate-100 text-xl font-bold text-slate-600 disabled:invisible ${PRESS}`
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="badge-detail-title" onClick={e => { e.stopPropagation(); onClose() }}
      className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/50 p-4">
      <div onClick={e => e.stopPropagation()}
        className={`my-auto w-full max-w-xs rounded-[2rem] border-2 border-b-[4px] p-5 text-center ${earned ? 'border-amber-300 border-b-amber-500 bg-gradient-to-b from-amber-100 to-white' : 'border-slate-200 border-b-slate-300 bg-white'}`}>
        <div className="flex items-center justify-between gap-2">
          <button type="button" onClick={() => onIndex(index - 1)} disabled={index === 0} aria-label="Huy hiệu trước" className={nav}>‹</button>
          <span key={b.id} className={`mi-pop rounded-3xl ${earned ? 'shadow-[0_0_0_6px_rgba(251,191,36,.35)]' : ''}`}>
            <BadgeArt id={b.id} emoji={b.emoji} size={148} className={`rounded-3xl ${earned ? '' : 'opacity-60 grayscale'}`} />
          </span>
          <button type="button" onClick={() => onIndex(index + 1)} disabled={index === list.length - 1} aria-label="Huy hiệu tiếp theo" className={nav}>›</button>
        </div>
        <h2 id="badge-detail-title" className="mt-4 text-xl font-bold text-slate-800">{b.name}</h2>
        <p className={`mx-auto mt-1 inline-block rounded-full px-3 py-0.5 text-xs font-bold ${earned ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
          {earned ? '✅ Đã đạt' : '🔒 Chưa đạt'}
        </p>
        <p className="mt-3 text-sm font-semibold leading-relaxed text-slate-600">{badgeExplain(b.id) || b.desc}</p>
        {p && (
          <div className="mt-3">
            <div className="h-3 overflow-hidden rounded-full bg-slate-100">
              <div className={`h-full rounded-full ${earned ? 'bg-emerald-400' : 'bg-amber-400'}`} style={{ width: `${(p.current / p.target) * 100}%` }} />
            </div>
            <p className="mt-1 text-xs font-bold text-slate-500">{p.current}/{p.target} {p.unit}</p>
          </div>
        )}
        <button type="button" onClick={onClose}
          className={`mt-4 w-full rounded-2xl border-b-[4px] border-purple-700 bg-purple-500 py-2.5 text-sm font-bold text-white ${PRESS}`}>
          Đóng
        </button>
      </div>
    </div>
  )
}
