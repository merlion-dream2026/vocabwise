'use client'
import { Fragment, useState, type ReactNode } from 'react'
import {
  masteryByRound, isTopicMastered, topicSteps, nextStep,
  type MasteryEntry, type GameDef,
} from '@/lib/topicMastery'
import { speak } from '@/lib/speak'
import Sticker from '@/components/Sticker'
import { MascotCutout, SpeechBubble } from '@/components/Mascot'
import type { HubTheme } from '@/components/hubTheme'

// Topic hub — "chunky 3D" look: thick bottom borders that press down on tap, the level's hue on the
// structure (cards, trail, next-step button) with a fixed emerald ✓ for "done", emoji "stickers"
// tilted a few degrees, and the child's mascot standing beside the next step, pointing at it.
// The two rounds' game lists live in components/TopicRounds.tsx.

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
export function tap() {
  try { navigator.vibrate?.(10) } catch { /* unsupported — ignore */ }
}

// Shared "presses down on tap" treatment: the bottom border shrinks 4px while the button moves
// down 4px, so it looks like it sinks into the page without shifting the layout.
export const PRESS = 'transition-[transform,border-width] duration-100 active:translate-y-0.5 active:border-b-2'

export type JourneyNode = { icon: string; label: string; done: boolean; last?: boolean; sticker?: string | null }

// Flashcard → Vòng 1 → Vòng 2 → quà, as small stops on a line: finished stops are emerald ✓, the
// next one wears the level colour with a soft ring, the rest are grey. The last stop is the gift,
// which turns into the trophy (or the earned sticker) — tapping it replays the celebration.
export function Journey({ nodes, theme, onTrophy }: { nodes: JourneyNode[]; theme: HubTheme; onTrophy: () => void }) {
  const current = nodes.findIndex((n) => !n.done)
  return (
    <div className="mt-3 flex items-start">
      {nodes.map((n, i) => (
        <Fragment key={n.label}>
          <div className="flex w-16 flex-shrink-0 flex-col items-center gap-1">
            {n.last && n.done ? (
              <button type="button" onClick={() => { tap(); onTrophy() }} aria-label="Xem lại hiệu ứng chúc mừng"
                className={`hub-shine flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-b-[3px] border-amber-600 bg-amber-400 text-base ${PRESS}`}>
                {n.sticker ? <Sticker emoji={n.sticker} size="sm" tilt={-8} className="!h-8 !w-8 !text-base" /> : '🏆'}
              </button>
            ) : (
              <span className={`flex h-8 w-8 items-center justify-center rounded-full border-b-[3px] text-sm font-bold ${
                n.done ? 'border-emerald-700 bg-emerald-500 text-white'
                : i === current ? `${theme.primary} text-white ring-4 ${theme.ring}`
                : 'border-slate-300 bg-slate-100 text-slate-400 grayscale'
              }`}>
                {n.done ? '✓' : n.icon}
              </span>
            )}
            <span className={`text-center text-[11px] font-bold leading-tight ${n.done ? 'text-emerald-600' : i === current ? theme.title : 'text-slate-400'}`}>{n.label}</span>
          </div>
          {i < nodes.length - 1 && (
            <div className={`mt-[14px] h-0 flex-1 rounded border-t-[3px] ${n.done ? theme.trail : 'border-slate-200'}`} />
          )}
        </Fragment>
      ))}
    </div>
  )
}

export type NextAction = { emoji: string; title: string; sub: string; run: () => void }

// The level-coloured "next best action" button.
export function NextStepButton({ action, theme }: { action: NextAction; theme: HubTheme }) {
  return (
    <button type="button" onClick={() => { tap(); action.run() }}
      className={`flex min-h-[60px] w-full items-center gap-2.5 rounded-2xl border-b-[4px] px-3 py-2.5 text-left text-white ${theme.primary} ${PRESS}`}>
      <span className="flex h-10 w-10 flex-shrink-0 rotate-6 items-center justify-center rounded-xl bg-white text-2xl shadow">{action.emoji}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-bold leading-tight">{action.title}</p>
        <p className="mt-0.5 text-xs font-bold text-white/85">{action.sub}</p>
      </div>
      <span className="flex-shrink-0 text-xl font-bold">→</span>
    </button>
  )
}

// The mascot standing beside the next step: it points at the button, its bubble says why.
export function MascotNextStep({ says, action, theme }: { says: string; action: NextAction; theme: HubTheme }) {
  return (
    <div className="mt-1 flex items-end gap-1">
      <MascotCutout shot="pose-point" size={120} className="mi-pop -ml-2" />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <SpeechBubble><p className="text-[13px] font-bold leading-snug text-slate-700">{says}</p></SpeechBubble>
        <NextStepButton action={action} theme={theme} />
      </div>
    </div>
  )
}

// Celebration header for a finished topic: the mascot cheering beside the headline.
export function MasteredHero({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <MascotCutout shot="pose-cheer" size={124} className="mi-pop" />
      <div className="min-w-0 flex-1">
        <p className="text-[17px] font-bold leading-tight text-amber-900">{title}</p>
        {children}
      </div>
    </div>
  )
}

// Status card (headline, ⓘ Cách học, trail) then the mascot + next-step button. A finished topic
// swaps both for the gold celebration card and a "next topic" button.
export function TopicHero({
  theme, level, topicEmoji, wordCount, entry, games, nextTopicName, onOpen, onNextTopic, onShare, onReplayTrophy, faqOpen, onToggleFaq, hasSticker = false,
}: {
  theme: HubTheme; level: string; topicEmoji: string; wordCount: number; entry: MasteryEntry; games: GameDef[]
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
  const nextTopic: NextAction | null = nextTopicName ? { emoji: '🚀', title: 'Sang chủ đề tiếp theo', sub: nextTopicName, run: onNextTopic } : null
  const action: NextAction | null =
    step.kind === 'flashcard' ? { emoji: '📖', title: `Học Flashcard ${wordCount} từ`, sub: 'Bước đầu tiên, nhẹ nhàng thôi!', run: () => onOpen('flashcard') }
    : step.kind === 'game' ? {
        emoji: step.game.emoji,
        title: step.stars === 0 ? `Làm bài ${step.game.label}` : `Thử lại ${step.game.label}`,
        sub: step.stars === 0 ? `Vòng ${step.round} · chỉ mất vài phút` : `Vòng ${step.round} · đang có ${step.stars}/3 sao`,
        run: () => onOpen(step.game.key),
      }
    : nextTopic
  const says = step.kind === 'flashcard' ? 'Mình sẽ đồng hành cùng bạn nhé! Bắt đầu với Flashcard nào!'
    : step.kind === 'game' && step.stars > 0 ? `Chỉ thiếu ${3 - step.stars} sao nữa thôi, mình tin bạn làm được!`
    : step.kind === 'game' ? 'Bài này vui lắm, thử ngay nhé!'
    : 'Mỗi ngày một chút, bạn sẽ giỏi!'

  if (mastered) {
    return (
      <>
        <div className="rounded-3xl border-2 border-b-[4px] border-amber-300 border-b-amber-500 bg-amber-50 p-4">
          <MasteredHero title="Bạn đã chinh phục chủ đề này! 🎉">
            <p className="mt-1 text-xs font-bold text-amber-800">Quá đỉnh! Mình tự hào về bạn lắm!</p>
            <button type="button" onClick={() => { tap(); onShare() }}
              className={`mt-2 rounded-full border-b-[3px] border-amber-600 bg-amber-400 px-3 py-1 text-xs font-bold text-amber-950 ${PRESS}`}>
              📤 Chia sẻ
            </button>
          </MasteredHero>
          <Journey nodes={nodes} theme={theme} onTrophy={onReplayTrophy} />
        </div>
        {nextTopic && <div className="mt-3"><NextStepButton action={nextTopic} theme={theme} /></div>}
      </>
    )
  }

  return (
    <>
      <div className={`rounded-3xl border-2 border-b-[4px] bg-white p-4 ${theme.card}`}>
        <div className="flex items-center gap-2">
          <p className={`min-w-0 flex-1 text-base font-bold leading-tight ${theme.title}`}>
            {steps.done === 0 ? `Cùng học ${wordCount} từ mới nào! 🚀` : `Còn ${steps.total - steps.done} bước nữa là có quà! 🎁`}
          </p>
          <button type="button" onClick={() => { tap(); onToggleFaq() }} aria-expanded={faqOpen}
            className={`flex-shrink-0 rounded-full border-2 px-2.5 py-0.5 text-xs font-bold ${faqOpen ? 'border-purple-300 bg-purple-100 text-purple-700' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>
            ⓘ Cách học
          </button>
        </div>
        <Journey nodes={nodes} theme={theme} onTrophy={onReplayTrophy} />
      </div>
      {action && <div className="mt-3"><MascotNextStep says={says} action={action} theme={theme} /></div>}
    </>
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

// "Từ vựng chủ đề": one header line and the first few words as chips; "+N từ" reveals the rest.
// Tapping a chip speaks the word; "Chi tiết" opens the full word-by-word view. Reference only —
// nothing here is graded.
const PREVIEW_WORDS = 5
export function WordPreview({ words, theme, onDetail }: { words: { word: string }[]; theme: HubTheme; onDetail: () => void }) {
  const [all, setAll] = useState(false)
  const tones = [`${theme.soft} text-slate-800`, 'bg-amber-100 text-amber-800', 'bg-slate-100 text-slate-700']
  const shown = all ? words : words.slice(0, PREVIEW_WORDS)
  return (
    <section className={`rounded-3xl border-2 border-b-[4px] bg-white px-3.5 py-3 ${theme.card}`}>
      <div className="flex items-center gap-2">
        <span className="text-lg" aria-hidden>📋</span>
        <p className="min-w-0 flex-1 text-[15px] font-bold text-slate-800">
          Từ vựng chủ đề <span className="text-xs font-semibold text-slate-500">· chạm để nghe</span>
        </p>
        <button type="button" onClick={() => { tap(); onDetail() }}
          className={`flex-shrink-0 rounded-full border-b-[3px] border-black/20 bg-slate-800 px-3 py-1.5 text-xs font-bold text-white ${PRESS}`}>
          Chi tiết →
        </button>
      </div>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {shown.map((w, i) => (
          <button key={w.word} type="button" onClick={() => speak(w.word)}
            className={`rounded-full px-3 py-1.5 text-sm font-bold transition-transform active:scale-95 ${tones[i % tones.length]}`}>
            {w.word}
          </button>
        ))}
        {words.length > PREVIEW_WORDS && (
          <button type="button" onClick={() => setAll((v) => !v)} aria-expanded={all}
            className={`rounded-full border-2 border-dashed bg-white px-3 py-1 text-[13px] font-bold ${theme.dashed} ${theme.accent}`}>
            {all ? 'Thu gọn' : `+${words.length - PREVIEW_WORDS} từ`}
          </button>
        )}
      </div>
    </section>
  )
}
