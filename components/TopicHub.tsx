'use client'
import { Fragment, useEffect, useState, type ReactNode } from 'react'
import {
  masteryByRound, isTopicMastered, topicSteps, nextStep, gameStars, gamePct, roundSpec, bonusGames,
  type MasteryEntry, type GameDef, type RoundMastery,
} from '@/lib/topicMastery'
import { speak } from '@/lib/speak'
import Sticker from '@/components/Sticker'

// Topic hub — "chunky 3D" look: thick bottom borders that press down on tap, saturated state colors
// (green = done, amber = next / in progress), emoji "stickers" tilted a few degrees, a trail-style
// journey ending in a gift that opens into the trophy, and a small mascot cheering the child on.

// Per-level theme: the page's existing { bg, header, text } plus two tints used by the hero.
export type LevelTheme = { bg: string; header: string; text: string; soft: string; deep: string }

// Self-contained CSS so the hub needs no Tailwind config changes. Render <HubStyles /> once.
export function HubStyles() {
  return (
    <style>{`
      @keyframes hub-rise { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: none } }
      @keyframes hub-pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(251,191,36,.55) } 50% { box-shadow: 0 0 0 9px rgba(251,191,36,0) } }
      @keyframes hub-shine { 0%,100% { transform: rotate(0) scale(1) } 25% { transform: rotate(-8deg) scale(1.1) } 75% { transform: rotate(8deg) scale(1.1) } }
      @keyframes hub-star { 0% { opacity: 0; transform: scale(0) rotate(-40deg) } 70% { opacity: 1; transform: scale(1.35) rotate(8deg) } 100% { opacity: 1; transform: scale(1) rotate(0) } }
      @keyframes hub-wobble { 0%,100% { transform: rotate(-4deg) } 50% { transform: rotate(4deg) } }
      @keyframes hub-bob { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-4px) } }
      .hub-rise { animation: hub-rise .45s ease-out both }
      .hub-pulse { animation: hub-pulse 1.6s ease-out infinite }
      .hub-shine { animation: hub-shine 1.2s ease-in-out .5s 2 }
      .hub-star { animation: hub-star .45s ease-out both }
      .hub-wobble { animation: hub-wobble 1.4s ease-in-out infinite }
      .hub-bob { animation: hub-bob 2.2s ease-in-out infinite }
      @media (prefers-reduced-motion: reduce) { .hub-rise, .hub-pulse, .hub-shine, .hub-star, .hub-wobble, .hub-bob { animation: none !important } }
    `}</style>
  )
}

// Staggered entrance: each block fades up a beat after the one above it.
export function Rise({ i, children }: { i: number; children: ReactNode }) {
  return <div className="hub-rise" style={{ animationDelay: `${i * 70}ms` }}>{children}</div>
}

// A short buzz on touch devices — the "click" you feel when a chunky button goes down.
function tap() {
  try { navigator.vibrate?.(10) } catch { /* unsupported — ignore */ }
}

// Shared "presses down on tap" treatment: the bottom border shrinks 4px while the button moves
// down 4px, so it looks like it sinks into the page without shifting the layout.
export const PRESS = 'transition-[transform,border-width] duration-100 active:translate-y-0.5 active:border-b-2'

export type JourneyNode = { icon: string; label: string; done: boolean; last?: boolean; sticker?: string | null }

// Flashcard → Vòng 1 → Vòng 2 → quà. A trail with stops that sit slightly up/down: finished stops
// are green, the next one is amber and pulses, the rest are grey. The last stop is a locked gift
// that turns into the trophy — tapping the finished trophy replays the celebration.
export function Journey({ nodes, onTrophy }: { nodes: JourneyNode[]; onTrophy: () => void }) {
  const current = nodes.findIndex((n) => !n.done)
  return (
    <div className="mt-3 flex items-start px-1">
      {nodes.map((n, i) => {
        const lift = ''
        return (
          <Fragment key={n.label}>
            <div className={`flex w-14 flex-shrink-0 flex-col items-center gap-1 ${lift}`}>
              {n.last && n.done ? (
                <button type="button" onClick={() => { tap(); onTrophy() }} aria-label="Xem lại hiệu ứng chúc mừng"
                  className={`hub-shine flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border-b-[3px] border-amber-600 bg-amber-400 text-2xl ${PRESS}`}>
                  {n.sticker ? <Sticker emoji={n.sticker} size="sm" tilt={-8} className="!h-11 !w-11 !text-2xl" /> : '🏆'}
                </button>
              ) : (
                <span className={`flex h-12 w-12 items-center justify-center rounded-full border-b-[3px] text-lg font-bold ${
                  n.done ? 'border-emerald-700 bg-emerald-500 text-white'
                  : i === current ? 'hub-pulse border-amber-600 bg-amber-400 text-amber-950'
                  : 'border-slate-300 bg-slate-100 text-slate-400 grayscale'
                }`}>
                  {n.done ? '✓' : n.icon}
                </span>
              )}
              <span className={`text-xs font-bold ${n.done ? 'text-emerald-600' : i === current ? 'text-slate-800' : 'text-slate-400'}`}>{n.label}</span>
            </div>
            {i < nodes.length - 1 && (
              <div className={`mt-6 h-0 flex-1 border-t-[5px] border-dashed ${n.done ? 'border-emerald-400' : 'border-slate-200'}`} />
            )}
          </Fragment>
        )
      })}
    </div>
  )
}

// Hero card (status as a reward, trail, mascot) and the amber "next best action" button.
export function TopicHero({
  colors, level, topicEmoji, wordCount, entry, games, nextTopicName, onOpen, onNextTopic, onShare, onReplayTrophy, faqOpen, onToggleFaq, hasSticker = false,
}: {
  colors: LevelTheme; level: string; topicEmoji: string; wordCount: number; entry: MasteryEntry; games: GameDef[]
  nextTopicName: string | null
  onOpen: (gameKey: string) => void        // 'flashcard' or a game key
  onNextTopic: () => void
  onShare: () => void
  onReplayTrophy: () => void
  faqOpen: boolean
  onToggleFaq: () => void
  hasSticker?: boolean   // the child owns this topic's sticker → the Quà stop shows it
}) {
  const mastered = isTopicMastered(entry, level)
  const steps = topicSteps(entry, level)
  const step = nextStep(entry, games, level)
  const [r1, r2] = masteryByRound(entry, level)
  const nodes: JourneyNode[] = [
    { icon: '📖', label: 'Flashcard', done: entry.flashcard },
    { icon: '1', label: 'Vòng 1', done: r1.ringDone >= r1.ringTotal },
    { icon: '2', label: 'Vòng 2', done: r2.ringDone >= r2.ringTotal },
    { icon: '🎁', label: mastered && hasSticker ? 'Sticker' : 'Quà', done: mastered, last: true, sticker: hasSticker ? topicEmoji : null },
  ]
  const cta =
    step.kind === 'flashcard' ? { emoji: '📖', title: `Học Flashcard ${wordCount} từ`, sub: 'Bước đầu tiên — nhẹ nhàng thôi! 🚀', run: () => onOpen('flashcard') }
    : step.kind === 'game' ? {
        emoji: step.game.emoji,
        title: step.stars === 0 ? `Làm bài ${step.game.label}` : `Thử lại ${step.game.label} để lên 3 sao`,
        sub: step.stars === 0 ? `Vòng ${step.round} · chỉ mất vài phút` : `Bạn đang có ${step.stars}/3 sao — gần rồi!`,
        run: () => onOpen(step.game.key),
      }
    : nextTopicName ? { emoji: '🚀', title: 'Sang chủ đề tiếp theo', sub: nextTopicName, run: onNextTopic }
    : null
  const mascotSays = mastered ? 'Quá đỉnh! Mình tự hào về bạn lắm!'
    : steps.done === 0 ? 'Mình sẽ đồng hành cùng bạn nhé!'
    : step.kind === 'game' && step.stars > 0 ? 'Chỉ một chút nữa thôi, cố lên!'
    : 'Mỗi ngày một chút, bạn sẽ giỏi!'
  return (
    <>
      <div className={`rounded-3xl border-2 border-b-[4px] p-4 ${mastered ? 'border-amber-300 border-b-amber-500 bg-amber-50' : 'border-slate-200 border-b-slate-300 bg-white'}`}>
        <div className="flex items-center gap-4">
          <button type="button" disabled={!mastered} onClick={() => { tap(); onReplayTrophy() }}
            aria-label={mastered ? 'Xem lại hiệu ứng chúc mừng' : undefined}
            className={`flex h-16 w-16 flex-shrink-0 -rotate-6 items-center justify-center rounded-2xl text-4xl shadow-md ring-4 ring-white ${mastered ? `cursor-pointer bg-amber-100 ${PRESS}` : colors.soft}`}>
            <span className={mastered ? 'hub-shine' : ''}>{mastered ? '🏆' : topicEmoji}</span>
          </button>
          <div className="min-w-0 flex-1">
            <p className={`text-lg font-bold leading-tight ${colors.deep}`}>
              {mastered ? 'Bạn đã chinh phục chủ đề này! 🎉'
                : steps.done === 0 ? `Cùng học ${wordCount} từ mới nào! 🚀`
                : `Còn ${steps.total - steps.done}/${steps.total} bước nữa là có quà!`}
            </p>
            {mastered && (
              <button type="button" onClick={() => { tap(); onShare() }}
                className={`mt-2 rounded-full border-b-[3px] border-amber-600 bg-amber-400 px-3 py-1 text-xs font-bold text-amber-950 ${PRESS}`}>
                📤 Chia sẻ
              </button>
            )}
          </div>
        </div>

        <Journey nodes={nodes} onTrophy={onReplayTrophy} />

        {/* Mascot (placeholder emoji until VocabWise has its own character) */}
        <div className="mt-2 flex items-center gap-3 rounded-2xl bg-slate-50 px-3 py-1.5">
          <span className="hub-bob text-3xl" aria-hidden>🦉</span>
          <p className="min-w-0 flex-1 text-sm font-bold text-slate-600">{mascotSays}</p>
          <button type="button" onClick={() => { tap(); onToggleFaq() }} aria-expanded={faqOpen}
            className={`flex-shrink-0 rounded-full border-b-[3px] px-3 py-1 text-xs font-bold ${PRESS} ${faqOpen ? 'border-purple-300 bg-purple-100 text-purple-700' : 'border-slate-300 bg-white text-slate-600'}`}>
            ❓ Cách học
          </button>
        </div>
      </div>
      {cta && (
        <button type="button" onClick={() => { tap(); cta.run() }}
          className={`mt-3 flex min-h-[64px] w-full items-center gap-3 rounded-2xl border-b-[4px] border-amber-600 bg-amber-400 px-4 py-3 text-left text-amber-950 ${PRESS}`}>
          <span className="flex h-12 w-12 flex-shrink-0 rotate-6 items-center justify-center rounded-2xl bg-white text-3xl shadow">{cta.emoji}</span>
          <div className="min-w-0 flex-1">
            <p className="text-base font-bold leading-tight">{cta.title}</p>
            <p className="mt-0.5 text-xs font-bold text-amber-950/70">{cta.sub}</p>
          </div>
          <span className="flex-shrink-0 text-xl font-bold">→</span>
        </button>
      )}
    </>
  )
}

// Vòng 1 + Vòng 2 cards, each with every counted game as a tappable tile (live stars + latest
// score), then a "Thử thách thêm" card for the level's bonus games, then the "ⓘ Cách tính sao" key.
// `games` is the level's full list (incl. flashcard).
export function RoundCards({
  level, entry, games, onOpen,
}: { level: string; entry: MasteryEntry; games: GameDef[]; onOpen: (gameKey: string) => void }) {
  const [r1, r2] = masteryByRound(entry, level)
  const spec = roundSpec(level)
  const pick = (keys: readonly string[]) => games.filter((g) => keys.includes(g.key))
  const bonus = bonusGames(games, level)
  const step = nextStep(entry, games, level)
  const nextKey = step.kind === 'flashcard' ? 'flashcard' : step.kind === 'game' ? step.game.key : null
  return (
    <div className="space-y-3">
      <RoundCard no={1} label="Vòng 1 · Làm quen" color="#10B981" pillCls="border-emerald-800 bg-emerald-600 text-white"
        tint="border-emerald-200 border-b-emerald-300 bg-emerald-50"
        mastery={r1} entry={entry} games={pick(spec.r1)} flashLabel="Flashcard từ mới" nextKey={nextKey} onOpen={onOpen} />
      <RoundCard no={2} label="Vòng 2 · Ôn tập" color="#F59E0B" pillCls="border-amber-600 bg-amber-400 text-amber-950"
        tint="border-amber-200 border-b-amber-300 bg-amber-50"
        mastery={r2} entry={entry} games={pick(spec.r2)} flashLabel="Ôn lại Flashcard" nextKey={nextKey} onOpen={onOpen} />
      {bonus.length > 0 && <BonusCard entry={entry} games={bonus} nextKey={nextKey} onOpen={onOpen} />}
      <StarInfo />
    </div>
  )
}

// Games outside the two rounds: still starred and fun, just not required for the trophy.
function BonusCard({ entry, games, nextKey, onOpen }: { entry: MasteryEntry; games: GameDef[]; nextKey: string | null; onOpen: (gameKey: string) => void }) {
  return (
    <section className="rounded-3xl border-2 border-b-[4px] border-purple-200 border-b-purple-300 bg-purple-50 p-4">
      <span className="inline-flex items-center gap-1.5 rounded-full border-b-[3px] border-purple-800 bg-purple-600 px-3 py-1.5 text-sm font-bold text-white">🎁 Thử thách thêm</span>
      <p className="mt-2 text-xs font-semibold leading-snug text-slate-600">Chơi cho vui và gom thêm sao — không bắt buộc để nhận quà</p>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {games.map((g, i) => (
          <GameTile key={g.key} onOpen={onOpen} index={i}
            tile={{ key: g.key, label: g.label, emoji: g.emoji, stars: gameStars(entry, g.key), pct: gamePct(entry, g.key), wide: i === games.length - 1 && games.length % 2 === 1, isNext: g.key === nextKey }} />
        ))}
      </div>
    </section>
  )
}

function RoundCard({
  no, label, color, pillCls, tint, mastery, entry, games, flashLabel, nextKey, onOpen,
}: {
  no: number; label: string; color: string; pillCls: string; tint: string; mastery: RoundMastery
  entry: MasteryEntry; games: GameDef[]; flashLabel: string; nextKey: string | null; onOpen: (gameKey: string) => void
}) {
  const pct = mastery.ringTotal ? (mastery.ringDone / mastery.ringTotal) * 100 : 0
  const passed = mastery.ringDone >= mastery.ringTotal
  // A finished round folds down to its header (tap to reopen) — keeps the screen short for returning learners.
  const [open, setOpen] = useState(!passed)
  return (
    <section id={`round${no}`} className={`scroll-mt-4 rounded-3xl border-2 border-b-[4px] p-4 ${tint}`}>
      <div className={`flex items-center gap-3 ${passed ? 'cursor-pointer' : ''}`}
        onClick={passed ? () => { tap(); setOpen((v) => !v) } : undefined}>
        <div className="min-w-0 flex-1">
          <span className={`inline-flex items-center gap-1.5 rounded-full border-b-[3px] px-3 py-1.5 text-sm font-bold ${pillCls}`}>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-black/10 text-xs">{no}</span>
            {label}
          </span>
          <p className="mt-2 text-xs font-semibold leading-snug text-slate-600">
            {passed ? 'Bạn đã qua vòng này rồi — quá tuyệt! 🎉' : mastery.note}
          </p>
        </div>
        <CircularProgress pct={pct} size={passed ? 48 : 60} stroke={passed ? 7 : 8} color={color}>
          {passed
            ? <span className="text-xl leading-none">🏆</span>
            : <span className="text-sm font-bold text-slate-800">{mastery.ringDone}/{mastery.ringTotal}</span>}
        </CircularProgress>
      </div>
      {open && <div className="mt-3 grid grid-cols-2 gap-2.5">
        <GameTile index={0} onOpen={onOpen}
          tile={{ key: 'flashcard', label: flashLabel, emoji: no === 1 ? '📖' : '📚', wide: true, flashDone: entry.flashcard, isNext: no === 1 && nextKey === 'flashcard' }} />
        {games.map((g, i) => (
          <GameTile key={g.key} onOpen={onOpen} index={i + 1}
            tile={{ key: g.key, label: g.label, emoji: g.emoji, stars: gameStars(entry, g.key), pct: gamePct(entry, g.key), wide: i === games.length - 1 && games.length % 2 === 1, isNext: g.key === nextKey }} />
        ))}
      </div>}
    </section>
  )
}

type Tile = { key: string; label: string; emoji: string; stars?: number; pct?: number; flashDone?: boolean; wide?: boolean; isNext?: boolean }

function GameTile({ tile, onOpen, index }: { tile: Tile; onOpen: (gameKey: string) => void; index: number }) {
  const isFlash = tile.key === 'flashcard'
  const isAI = tile.key === 'speak' || tile.key === 'sentence'
  const stars = tile.stars ?? 0
  const done = isFlash ? !!tile.flashDone : stars === 3
  const started = isFlash ? !!tile.flashDone : stars > 0
  const hint = isFlash
    ? (tile.flashDone ? 'Đã xong' : 'Bắt đầu ở đây')
    : stars === 3 ? 'Tuyệt vời!' : stars === 2 ? 'Gần rồi! 💪' : stars === 1 ? 'Luyện thêm nhé!' : 'Chưa làm'
  const hintColor = isAI ? 'text-white/90' : done ? 'text-emerald-600' : started ? 'text-amber-600' : 'text-slate-400'
  const score = typeof tile.pct === 'number' && !isFlash
    ? <span className={`text-xs font-bold ${isAI ? 'text-white/90' : 'text-slate-500'}`}>{tile.pct}%</span> : null
  // Surface by state — full class strings so Tailwind keeps them.
  const surface = isAI
    ? 'border-purple-400 border-b-purple-800 bg-gradient-to-r from-purple-500 to-pink-500'
    : done ? 'border-emerald-300 border-b-emerald-500 bg-emerald-50'
    : tile.isNext ? 'border-amber-300 border-b-amber-500 bg-amber-50'
    : started ? 'border-amber-200 border-b-amber-400 bg-white'
    : 'border-slate-200 border-b-slate-300 bg-white'
  const tilt = index % 2 === 0 ? '-rotate-6' : 'rotate-6'
  // The ✓ sits on the sticker's corner (not the tile's corner) so it never covers the game name.
  const sticker = (
    <span className="relative flex-shrink-0">
      <span className={`flex h-10 w-10 items-center justify-center rounded-xl bg-white text-2xl leading-none shadow ${tilt}`}>{tile.emoji}</span>
      {done && (
        <span className="absolute -bottom-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-emerald-500 text-[10px] font-bold text-white">✓</span>
      )}
    </span>
  )
  return (
    <button type="button" onClick={() => { tap(); onOpen(tile.key) }}
      className={`relative min-h-[56px] rounded-2xl border-2 border-b-[4px] px-2.5 py-2 text-left ${PRESS} ${surface} ${
        tile.wide ? 'col-span-2 flex items-center gap-3' : 'flex items-center gap-2.5'
      }`}>
      {tile.isNext && !done && (
        <span className="hub-wobble absolute -top-3 right-3 rounded-full border-b-2 border-amber-600 bg-amber-400 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-950">Chơi tiếp!</span>
      )}
      {sticker}
      {tile.wide ? (
        <>
          <div className="min-w-0 flex-1">
            <p className={`text-sm font-bold leading-tight ${isAI ? 'text-white' : 'text-slate-800'}`}>{tile.label}</p>
            <p className={`mt-0.5 text-xs font-bold ${hintColor}`}>{hint}</p>
          </div>
          {!isFlash && (
            <span className={`flex flex-col items-end gap-0.5 `}>
              <Stars filled={stars} animate />
              {score}
            </span>
          )}
        </>
      ) : (
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-bold leading-tight ${isAI ? 'text-white' : 'text-slate-800'}`}>{tile.label}</p>
          <div className="mt-1 flex items-center justify-between gap-1">
            <Stars filled={stars} animate />
            {score}
          </div>
        </div>
      )}
    </button>
  )
}

// Emoji ignore CSS color, so "unfilled" dims via grayscale+opacity. With `animate`, earned stars
// pop in one after another.
export function Stars({ filled, animate }: { filled: number; animate?: boolean }) {
  return (
    <span className="inline-flex gap-0.5 text-base">
      {[1, 2, 3].map((i) => (
        <span key={i} className={i > filled ? 'opacity-25 grayscale' : animate ? 'hub-star' : ''}
          style={i <= filled && animate ? { animationDelay: `${300 + i * 120}ms` } : undefined}>⭐</span>
      ))}
    </span>
  )
}

// The star-to-% key, tucked behind an ⓘ so the screen leads with progress rather than legend.
function StarInfo() {
  return (
    <details className="rounded-2xl border-2 border-slate-200 bg-white/70 px-4 py-2.5">
      <summary className="cursor-pointer list-none text-xs font-bold text-slate-500">ⓘ Cách tính sao</summary>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-slate-400">
        <span className="flex items-center gap-1"><Stars filled={1} /> ≤50%</span>
        <span className="flex items-center gap-1"><Stars filled={2} /> ≤80%</span>
        <span className="flex items-center gap-1"><Stars filled={3} /> &gt;80%</span>
      </div>
    </details>
  )
}

// The arc fills from empty to its value right after mount, so progress "grows" into view.
function CircularProgress({
  pct, size, stroke, color, children,
}: { pct: number; size: number; stroke: number; color: string; children: ReactNode }) {
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const raf = requestAnimationFrame(() => setShown(true))
    return () => cancelAnimationFrame(raf)
  }, [])
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c - ((shown ? Math.min(100, Math.max(0, pct)) : 0) / 100) * c
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#FFFFFFB3" strokeWidth={stroke} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none"
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 900ms ease-out' }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  )
}

// "Từ vựng chủ đề": header band (sticker, hint, "Chi tiết" button) over a strip of colorful word chips.
// Tapping a chip speaks the word; "Chi tiết" opens the Flashcard for the full word-by-word view.
// Reference only — nothing here is graded. Sits above the hero so the topic's words are the first thing seen.
const CHIP_TONES = [
  'bg-slate-100 text-slate-700',
  'bg-amber-100 text-amber-800',
  'bg-emerald-50 text-emerald-700',
]
export function WordPreview({ words, onDetail }: { words: { word: string; meaning: string; emoji: string }[]; onDetail: () => void }) {
  return (
    <section className="overflow-hidden rounded-3xl border-2 border-b-[4px] border-slate-200 border-b-slate-300 bg-white">
      <div className="flex items-center gap-3 bg-gradient-to-r from-slate-100 to-amber-50 px-4 py-2.5">
        <span className="flex h-10 w-10 flex-shrink-0 -rotate-6 items-center justify-center rounded-xl bg-amber-400 text-xl shadow">📋</span>
        <div className="min-w-0 flex-1">
          <p className="text-base font-bold leading-tight text-slate-800">Từ vựng chủ đề</p>
          <p className="mt-0.5 text-xs font-semibold text-slate-500">{words.length} từ · chạm vào từ để nghe 🔊</p>
        </div>
        <button type="button" onClick={() => { tap(); onDetail() }}
          className={`flex-shrink-0 rounded-full border-b-[3px] border-black/20 bg-slate-800 px-3.5 py-1.5 text-xs font-bold text-white ${PRESS}`}>
          Chi tiết →
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5 px-4 py-3">
        {words.map((w, i) => (
          <button key={w.word} type="button" onClick={() => speak(w.word)}
            className={`rounded-full px-3 py-1.5 text-sm font-bold transition-transform active:scale-95 ${CHIP_TONES[i % CHIP_TONES.length]}`}>
            {w.word}
          </button>
        ))}
      </div>
    </section>
  )
}
