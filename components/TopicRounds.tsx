'use client'
import { useState, type ReactNode } from 'react'
import {
  masteryByRound, nextStep, gameStars, gamePct, roundSpec, bonusGames,
  type MasteryEntry, type GameDef, type RoundMastery,
} from '@/lib/topicMastery'
import { tap, Stars } from '@/components/TopicHub'
import { GameStrip, GamePickerSheet, type GameTile } from '@/components/GamePicker'
import type { HubTheme } from '@/components/hubTheme'

// The Daily topic hub's learning blocks: "Học từ mới" (Flashcard, video, Mini Story), Vòng 1 + Vòng 2
// as emoji strips with a grid picker sheet, then the level's bonus games behind one "Khu vui chơi"
// card; the star key sits in each round's ⓘ. A finished round folds down to its header; tap it to
// look back. HubList/HubRow are shared with the Academic hub.

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

function gameRow(entry: MasteryEntry, g: GameDef, nextKey: string | null): GameTile {
  const stars = gameStars(entry, g.key)
  const pct = gamePct(entry, g.key)
  const isNext = g.key === nextKey
  const score = typeof pct === 'number' ? `${starText(stars) || '☆'} · ${pct}%` : ''
  const status: RowStatus = stars === 3 ? 'done' : isNext ? 'next' : score ? 'started' : 'todo'
  const sub = status === 'todo' ? 'Chưa làm' : status === 'next' ? (score ? `${score} · Làm tiếp bài này` : 'Làm tiếp bài này') : score
  return { id: g.key, emoji: g.emoji, label: plainLabel(g.label), ai: g.key === 'speak' || g.key === 'sentence', status, stars, sub }
}

function flashTile(entry: MasteryEntry, label: string, emoji: string, isNext: boolean): GameTile {
  const status: RowStatus = entry.flashcard ? 'done' : isNext ? 'next' : 'todo'
  return { id: 'flashcard', emoji, label, ai: false, status, stars: 0, sub: entry.flashcard ? 'Đã xong' : isNext ? 'Bắt đầu ở đây' : 'Chưa làm' }
}

const nextKeyOf = (step: ReturnType<typeof nextStep>) => step.kind === 'flashcard' ? 'flashcard' : step.kind === 'game' ? step.game.key : null

// "① Học từ mới": Flashcard, then meeting the words in context — the topic's videos (optional,
// ✓ once one is watched to the end) and the Mini Story (`story`, rendered under the list).
export function LearnCard({ level, entry, games, theme, onOpen, videoCount, videoWatched, onOpenVideos, story }: {
  level: string; entry: MasteryEntry; games: GameDef[]; theme: HubTheme; onOpen: (gameKey: string) => void
  videoCount: number; videoWatched: boolean; onOpenVideos: () => void; story?: ReactNode
}) {
  const flash = flashTile(entry, 'Flashcard từ mới', '📖', nextKeyOf(nextStep(entry, games, level)) === 'flashcard')
  return (
    <section className={`rounded-3xl border-2 border-b-[4px] p-3 ${theme.card} ${theme.tint}`}>
      <span className={`inline-flex items-center gap-1.5 rounded-full border-b-[3px] py-1 pl-1.5 pr-3 text-sm font-bold ${theme.pill}`}>
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-black/10 text-[11px]">{entry.flashcard ? '✓' : '📖'}</span>
        Học từ mới
      </span>
      <HubList theme={theme}>
        <HubRow emoji={flash.emoji} label={flash.label} status={flash.status} sub={flash.sub} theme={theme} onClick={() => onOpen('flashcard')} />
        {videoCount > 0 && (
          <HubRow emoji="🎬" label="Xem video" theme={theme} onClick={onOpenVideos}
            status={videoWatched ? 'done' : 'todo'}
            sub={videoWatched ? 'Đã xem · xem lại nếu thích' : `${videoCount} video · nên xem sau Flashcard`} />
        )}
      </HubList>
      {story && <div className="mt-3">{story}</div>}
    </section>
  )
}

export function RoundCards({ level, entry, games, theme, onOpen }: {
  level: string; entry: MasteryEntry; games: GameDef[]; theme: HubTheme; onOpen: (gameKey: string) => void
}) {
  const [r1, r2] = masteryByRound(entry, level)
  const spec = roundSpec(level)
  const nextKey = nextKeyOf(nextStep(entry, games, level))
  const tiles = (keys: readonly string[]) => games.filter((g) => keys.includes(g.key)).map((g) => gameRow(entry, g, nextKey))
  const bonus = bonusGames(games, level).map((g) => gameRow(entry, g, nextKey))
  return (
    <div className="space-y-3">
      <RoundCard no={1} label="Vòng 1 · Làm quen" pill={theme.pill} surface="bg-white" mastery={r1} theme={theme}
        tiles={tiles(spec.r1)} onOpen={onOpen} />
      <RoundCard no={2} label="Vòng 2 · Ôn tập" pill={theme.pillSoft} surface="bg-white" mastery={r2} theme={theme}
        tiles={[flashTile(entry, 'Ôn lại Flashcard', '📚', false), ...tiles(spec.r2)]} onOpen={onOpen} />
      {bonus.length > 0 && <PlayZoneCard tiles={bonus} theme={theme} onOpen={onOpen} />}
    </div>
  )
}

// One round: header (pill, ⓘ rule + star key, progress), then its games as an emoji strip (tap =
// play) and a "Chọn trò" button opening the labelled grid. A finished round folds to its header.
function RoundCard({ no, label, pill, surface, mastery, theme, tiles, onOpen }: {
  no: number; label: string; pill: string; surface: string; mastery: RoundMastery; theme: HubTheme
  tiles: GameTile[]; onOpen: (gameKey: string) => void
}) {
  const passed = mastery.ringDone >= mastery.ringTotal
  const [open, setOpen] = useState(!passed)
  const [info, setInfo] = useState(false)
  const [picker, setPicker] = useState(false)
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
      {info && <RoundInfo passed={passed} note={mastery.note} />}
      {open && (
        <>
          <GameStrip tiles={tiles} theme={theme} onOpen={onOpen} />
          <button type="button" onClick={() => { tap(); setPicker(true) }}
            className={`mt-2.5 flex min-h-[44px] w-full items-center justify-center gap-1 rounded-2xl border-2 border-b-[4px] bg-white text-sm font-bold ${theme.card} ${theme.accent}`}>
            🎯 Chọn trò ({tiles.length}) ›
          </button>
        </>
      )}
      {picker && (
        <GamePickerSheet title={label} tiles={tiles} theme={theme} onOpen={onOpen} onClose={() => setPicker(false)}
          note={<RoundInfo passed={passed} note={mastery.note} />} />
      )}
    </section>
  )
}

function RoundInfo({ passed, note }: { passed: boolean; note: string }) {
  return (
    <div className="mt-2 text-xs font-semibold leading-snug text-slate-600">
      <p>{passed ? 'Bạn đã qua vòng này rồi, quá tuyệt! 🎉' : note}</p>
      {/* The star key lives here, next to the rule that needs it (⭐⭐⭐ = over 80%). */}
      <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-500">
        <span className="flex items-center gap-1"><Stars filled={1} /> ≤50%</span>
        <span className="flex items-center gap-1"><Stars filled={2} /> ≤80%</span>
        <span className="flex items-center gap-1"><Stars filled={3} /> &gt;80%</span>
      </p>
    </div>
  )
}

// Games outside the two rounds (the arcade extras): still starred and fun, just not required for
// the trophy. One card; the games open in a grid sheet.
function PlayZoneCard({ tiles, theme, onOpen }: { tiles: GameTile[]; theme: HubTheme; onOpen: (gameKey: string) => void }) {
  const [picker, setPicker] = useState(false)
  const done = tiles.filter((t) => t.status === 'done').length
  return (
    <>
      <button type="button" onClick={() => { tap(); setPicker(true) }}
        className={`flex min-h-[64px] w-full items-center gap-2.5 rounded-3xl border-2 border-dashed bg-white/75 px-3.5 py-2.5 text-left ${theme.dashed}`}>
        <span className="text-2xl" aria-hidden>🎮</span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold text-slate-800">Khu vui chơi</span>
          <span className="block text-xs font-semibold text-slate-500">{tiles.length} trò · gom thêm sao, không bắt buộc{done ? ` · ${done} trò ⭐⭐⭐` : ''}</span>
          <span className="mt-1 block truncate text-lg leading-none" aria-hidden>{tiles.map((t) => t.emoji).join(' ')}</span>
        </span>
        <span className="flex-shrink-0 text-lg font-bold text-slate-400" aria-hidden>›</span>
      </button>
      {picker && <GamePickerSheet title="🎮 Khu vui chơi" tiles={tiles} theme={theme} onOpen={onOpen} onClose={() => setPicker(false)}
        note="Trò chơi thêm để gom sao — không bắt buộc để nhận quà." />}
    </>
  )
}
