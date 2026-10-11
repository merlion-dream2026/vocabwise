'use client'
import { useState, type ReactNode } from 'react'
import {
  masteryByRound, nextStep, gameStars, gamePct, roundSpec, bonusGames,
  type MasteryEntry, type GameDef, type RoundMastery,
} from '@/lib/topicMastery'
import { tap, Stars } from '@/components/TopicHub'
import type { HubTheme } from '@/components/hubTheme'

// Vòng 1 + Vòng 2 of the Daily topic hub as compact lists (one ~56px row per game), then the
// level's bonus games folded behind one row, then the "ⓘ Cách tính sao" key. A finished round
// folds down to its header; tap it to look back. HubList/HubRow are shared with the Academic hub.

export type RowStatus = 'done' | 'next' | 'started' | 'todo'

// Trailing decoration in game labels ("Phát âm cùng AI ✨") — the row's emoji tile / AI badge already says it.
const plainLabel = (label: string) => label.replace(/\s+\p{Extended_Pictographic}️?$/u, '')

export function HubList({ theme, children }: { theme: HubTheme; children: ReactNode }) {
  return <div className={`mt-2.5 divide-y divide-slate-100 overflow-hidden rounded-2xl border bg-white ${theme.card.split(' ')[0]}`}>{children}</div>
}

export function HubRow({ emoji, label, sub, status, ai = false, theme, onClick }: {
  emoji: string; label: string; sub: string; status: RowStatus; ai?: boolean; theme: HubTheme; onClick: () => void
}) {
  const subColor = status === 'done' ? 'text-emerald-600' : status === 'next' ? theme.accent : status === 'started' ? 'text-amber-700' : 'text-slate-400'
  return (
    <button type="button" onClick={() => { tap(); onClick() }}
      className={`flex min-h-[56px] w-full items-center gap-2.5 px-3 py-2 text-left transition-colors active:brightness-95 ${status === 'next' ? theme.soft : 'bg-white'}`}>
      <span className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-xl ${theme.tint}`}>{emoji}</span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 text-sm font-bold text-slate-800">
          {plainLabel(label)}
          {ai && <span className="rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-1.5 text-[10px] font-bold text-white">AI</span>}
        </span>
        <span className={`mt-px block text-xs font-bold ${subColor}`}>{sub}</span>
      </span>
      {status === 'done'
        ? <span className="flex h-[22px] w-[22px] flex-shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white" aria-label="Đã xong">✓</span>
        : <span className="flex-shrink-0 text-lg font-bold text-slate-400" aria-hidden>›</span>}
    </button>
  )
}

const starText = (n: number) => '⭐'.repeat(n)

function gameRow(entry: MasteryEntry, g: GameDef, nextKey: string | null) {
  const stars = gameStars(entry, g.key)
  const pct = gamePct(entry, g.key)
  const isNext = g.key === nextKey
  const score = typeof pct === 'number' ? `${starText(stars) || '☆'} · ${pct}%` : ''
  const status: RowStatus = stars === 3 ? 'done' : isNext ? 'next' : score ? 'started' : 'todo'
  const sub = status === 'todo' ? 'Chưa làm' : status === 'next' ? (score ? `${score} · Làm tiếp bài này` : 'Làm tiếp bài này') : score
  return { id: g.key, emoji: g.emoji, label: g.label, ai: g.key === 'speak' || g.key === 'sentence', status, sub }
}

export function RoundCards({
  level, entry, games, theme, onOpen,
}: { level: string; entry: MasteryEntry; games: GameDef[]; theme: HubTheme; onOpen: (gameKey: string) => void }) {
  const [r1, r2] = masteryByRound(entry, level)
  const spec = roundSpec(level)
  const pick = (keys: readonly string[]) => games.filter((g) => keys.includes(g.key))
  const bonus = bonusGames(games, level)
  const step = nextStep(entry, games, level)
  const nextKey = step.kind === 'flashcard' ? 'flashcard' : step.kind === 'game' ? step.game.key : null
  return (
    <div className="space-y-3">
      <RoundCard no={1} label="Vòng 1 · Làm quen" pill={theme.pill} surface={theme.tint} mastery={r1} theme={theme}
        flash={{ label: 'Flashcard từ mới', emoji: '📖', isNext: nextKey === 'flashcard' }}
        entry={entry} games={pick(spec.r1)} nextKey={nextKey} onOpen={onOpen} />
      <RoundCard no={2} label="Vòng 2 · Ôn tập" pill={theme.pillSoft} surface="bg-white" mastery={r2} theme={theme}
        flash={{ label: 'Ôn lại Flashcard', emoji: '📚', isNext: false }}
        entry={entry} games={pick(spec.r2)} nextKey={nextKey} onOpen={onOpen} />
      {bonus.length > 0 && <BonusCard entry={entry} games={bonus} nextKey={nextKey} theme={theme} onOpen={onOpen} />}
      <StarInfo />
    </div>
  )
}

function RoundCard({
  no, label, pill, surface, mastery, theme, flash, entry, games, nextKey, onOpen,
}: {
  no: number; label: string; pill: string; surface: string; mastery: RoundMastery; theme: HubTheme
  flash: { label: string; emoji: string; isNext: boolean }
  entry: MasteryEntry; games: GameDef[]; nextKey: string | null; onOpen: (gameKey: string) => void
}) {
  const passed = mastery.ringDone >= mastery.ringTotal
  const [open, setOpen] = useState(!passed)
  const [info, setInfo] = useState(false)
  const rows = games.map((g) => gameRow(entry, g, nextKey))
  return (
    <section id={`round${no}`} className={`scroll-mt-4 rounded-3xl border-2 border-b-[4px] p-3 ${theme.card} ${surface}`}>
      <div className="flex items-center gap-1.5">
        <span className={`inline-flex items-center gap-1.5 rounded-full border-b-[3px] py-1 pl-1.5 pr-3 text-sm font-bold ${pill}`}>
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-black/10 text-[11px]">{passed ? '✓' : no}</span>
          {label}
        </span>
        <button type="button" onClick={() => setInfo((v) => !v)} aria-expanded={info} aria-label="Cách qua vòng"
          className="px-1 text-[15px] text-slate-400">ⓘ</button>
        <span className="flex-1" />
        {passed ? (
          <button type="button" onClick={() => { tap(); setOpen((v) => !v) }} aria-expanded={open}
            className={`text-[13px] font-bold ${theme.accent}`}>
            {mastery.ringDone}/{mastery.ringTotal} · {open ? 'Thu gọn ▴' : 'Xem lại ▾'}
          </button>
        ) : (
          <span className={`text-[13px] font-bold ${theme.accent}`}>{mastery.ringDone}/{mastery.ringTotal} bài</span>
        )}
      </div>
      {info && <p className="mt-2 text-xs font-semibold leading-snug text-slate-600">{passed ? 'Bạn đã qua vòng này rồi, quá tuyệt! 🎉' : mastery.note}</p>}
      {open && (
        <HubList theme={theme}>
          <HubRow emoji={flash.emoji} label={flash.label} theme={theme} onClick={() => onOpen('flashcard')}
            status={entry.flashcard ? 'done' : flash.isNext ? 'next' : 'todo'}
            sub={entry.flashcard ? 'Đã xong' : flash.isNext ? 'Bắt đầu ở đây' : 'Chưa làm'} />
          {rows.map(({ id, ...r }) => <HubRow key={id} {...r} theme={theme} onClick={() => onOpen(id)} />)}
        </HubList>
      )}
    </section>
  )
}

// Games outside the two rounds: still starred and fun, just not required for the trophy. Folded by default.
function BonusCard({ entry, games, nextKey, theme, onOpen }: {
  entry: MasteryEntry; games: GameDef[]; nextKey: string | null; theme: HubTheme; onOpen: (gameKey: string) => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <section className={`rounded-3xl border-2 border-dashed bg-white/75 ${theme.dashed}`}>
      <button type="button" onClick={() => { tap(); setOpen((v) => !v) }} aria-expanded={open}
        className="flex min-h-[52px] w-full items-center gap-2.5 px-3.5 py-2 text-left">
        <span className="text-xl" aria-hidden>🎁</span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold text-slate-800">Thử thách thêm</span>
          <span className="block text-xs font-semibold text-slate-500">{games.length} trò · gom thêm sao, không bắt buộc</span>
        </span>
        <span className="text-sm font-bold text-slate-400">{open ? '▴' : '▾'}</span>
      </button>
      {open && (
        <div className="px-3 pb-3">
          <HubList theme={theme}>
            {games.map((g) => { const { id, ...r } = gameRow(entry, g, nextKey); return <HubRow key={id} {...r} theme={theme} onClick={() => onOpen(id)} /> })}
          </HubList>
        </div>
      )}
    </section>
  )
}

// The star-to-% key, tucked behind an ⓘ so the screen leads with progress rather than legend.
function StarInfo() {
  return (
    <details className="text-center">
      <summary className="cursor-pointer list-none text-xs font-bold text-slate-500">ⓘ Cách tính sao</summary>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs font-semibold text-slate-500">
        <span className="flex items-center gap-1"><Stars filled={1} /> ≤50%</span>
        <span className="flex items-center gap-1"><Stars filled={2} /> ≤80%</span>
        <span className="flex items-center gap-1"><Stars filled={3} /> &gt;80%</span>
      </div>
    </details>
  )
}
