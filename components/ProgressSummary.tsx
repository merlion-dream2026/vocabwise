'use client'
import { useState } from 'react'
import { vnDate } from '@/lib/vnDate'
import {
  getAllAcademicProgress, getAllDailyProgress, getGlobalStreak, getPhonicsProgress, type SyncAllLevels,
} from '@/lib/childProgress'

// One child's progress for the parent dashboard: today / 7 days / 30 days with a comparison to the
// period before, plus all-time totals. Built from vocab_sync history (one entry per Vietnam day per
// module: words, games, topics) — every plan sees this; it is not a paid feature.

type Period = 'today' | '7d' | '30d' | 'all'
const PERIODS: { key: Period; label: string; days: number; prevLabel: string }[] = [
  { key: 'today', label: 'Hôm nay', days: 1, prevLabel: 'hôm qua' },
  { key: '7d', label: '7 ngày', days: 7, prevLabel: '7 ngày trước đó' },
  { key: '30d', label: '30 ngày', days: 30, prevLabel: '30 ngày trước đó' },
  { key: 'all', label: 'Tổng', days: 0, prevLabel: '' },
]

type DayEntry = { words?: number; games?: number; topics?: number; topicIds?: string[] }
type Totals = { activeDays: number; words: number; games: number; topics: number }

// Sum history over the `days` Vietnam days ending `offset` days ago (offset 0 = up to today).
function sumWindow(sync: SyncAllLevels, days: number, offset: number): Totals {
  const dates = new Set(Array.from({ length: days }, (_, i) => vnDate(-(offset + i))))
  const active = new Set<string>()
  const t: Totals = { activeDays: 0, words: 0, games: 0, topics: 0 }
  for (const lv of Object.values(sync)) {
    for (const [date, raw] of Object.entries(lv.history ?? {})) {
      if (!dates.has(date)) continue
      const e = raw as DayEntry
      const topics = e.topics ?? e.topicIds?.length ?? 0
      t.words += e.words ?? 0
      t.games += e.games ?? 0
      t.topics += topics
      if ((e.words ?? 0) + (e.games ?? 0) + topics > 0) active.add(date)
    }
  }
  t.activeDays = active.size
  return t
}

function Delta({ now, before }: { now: number; before: number }) {
  const d = now - before
  if (d === 0) return <span className="text-gray-500">= như kỳ trước</span>
  return d > 0
    ? <span className="text-emerald-600">▲ {d}</span>
    : <span className="text-rose-500">▼ {-d}</span>
}

function Tile({ emoji, value, label, children }: { emoji: string; value: string | number; label: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-3 py-2.5">
      <p className="text-lg font-black text-gray-800 leading-none"><span aria-hidden className="mr-1 text-base">{emoji}</span>{value}</p>
      <p className="mt-1 text-xs font-semibold text-gray-600">{label}</p>
      {children && <p className="mt-0.5 text-[11px] font-bold">{children}</p>}
    </div>
  )
}

export default function ProgressSummary({ sync }: { sync: SyncAllLevels }) {
  const [period, setPeriod] = useState<Period>('7d')
  const p = PERIODS.find(x => x.key === period)!

  let tiles: React.ReactNode
  if (period === 'all') {
    const daily = getAllDailyProgress(sync)
    const academic = getAllAcademicProgress(sync.academic)
    const phonics = getPhonicsProgress(sync.phonics)
    tiles = (
      <>
        <Tile emoji="📖" value={daily.seenWords + academic.seenWords} label="từ đã học" />
        <Tile emoji="🏆" value={daily.topicsCompleted + academic.completed} label="chủ đề chinh phục" />
        <Tile emoji="🔤" value={`${phonics.seen}/${phonics.total}`} label="bài phát âm đã học" />
        <Tile emoji="🔥" value={getGlobalStreak(sync).current} label="ngày streak hiện tại" />
      </>
    )
  } else {
    const now = sumWindow(sync, p.days, 0)
    const before = sumWindow(sync, p.days, p.days)
    tiles = (
      <>
        <Tile emoji="📅" value={p.days === 1 ? (now.activeDays ? 'Có học' : 'Chưa học') : `${now.activeDays}/${p.days}`} label="ngày học">
          {p.days > 1 && <Delta now={now.activeDays} before={before.activeDays} />}
        </Tile>
        <Tile emoji="📖" value={now.words} label="từ đã học"><Delta now={now.words} before={before.words} /></Tile>
        <Tile emoji="🎮" value={now.games} label="lượt chơi"><Delta now={now.games} before={before.games} /></Tile>
        <Tile emoji="🏆" value={now.topics} label="chủ đề / bài xong"><Delta now={now.topics} before={before.topics} /></Tile>
      </>
    )
  }

  return (
    <div className="px-3 pb-3">
      <div role="tablist" aria-label="Khoảng thời gian" className="mb-2 grid grid-cols-4 gap-1 rounded-xl bg-slate-100 p-1">
        {PERIODS.map(x => (
          <button key={x.key} type="button" role="tab" aria-selected={period === x.key} onClick={() => setPeriod(x.key)}
            className={`rounded-lg py-1.5 text-xs font-bold transition-colors ${period === x.key ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {x.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">{tiles}</div>
      {period !== 'all' && <p className="mt-1.5 text-[11px] font-semibold text-gray-500">▲▼ so với {p.prevLabel}</p>}
    </div>
  )
}
