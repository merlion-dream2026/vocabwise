'use client'
import type { ReactNode } from 'react'
import { PRESS } from '@/components/TopicHub'

// Shared building blocks for game screens in the "chunky 3D" style (thick bottom border that sinks on
// tap, saturated state colors). Visual only — callers keep their own game logic.

export function buzz() {
  try { navigator.vibrate?.(10) } catch { /* unsupported — ignore */ }
}

const TONES = {
  amber:  'border-amber-600 bg-amber-400 text-amber-950',
  green:  'border-emerald-700 bg-emerald-500 text-white',
  purple: 'border-purple-800 bg-purple-600 text-white',
  blue:   'border-blue-700 bg-blue-500 text-white',
  pink:   'border-pink-700 bg-pink-500 text-white',
  slate:  'border-2 border-slate-200 border-b-slate-300 bg-white text-slate-600',
  off:    'border-slate-200 bg-slate-100 text-slate-300',
} as const
export type Tone = keyof typeof TONES

// Big action button (Kiểm tra / Tiếp / Chơi lại …).
export function PrimaryButton({
  tone = 'amber', disabled, onClick, children, className = '',
}: { tone?: Tone; disabled?: boolean; onClick?: () => void; children: ReactNode; className?: string }) {
  return (
    <button type="button" disabled={disabled} onClick={() => { buzz(); onClick?.() }}
      className={`w-full rounded-2xl border-b-[4px] px-4 py-3.5 text-lg font-bold ${PRESS} ${TONES[disabled ? 'off' : tone]} ${disabled ? 'cursor-not-allowed' : ''} ${className}`}>
      {children}
    </button>
  )
}

// Game header: rounded bottom with a dark edge, round back button, title/subtitle, optional right
// slot (e.g. "3/10") and an optional chunky progress bar underneath.
export function GameHeader({
  colorCls, title, subtitle, onBack, right, progress, timer,
}: {
  colorCls: string            // background, e.g. "bg-violet-500" or "bg-gradient-to-br from-pink-400 to-rose-400"
  title: ReactNode; subtitle?: ReactNode; onBack: () => void; right?: ReactNode
  progress?: { value: number; max: number }
  // Countdown for timed games: bar drains linearly (1s steps) with the seconds left on the right.
  timer?: { pct: number; secondsLeft: number; urgent?: boolean; fillCls?: string }
}) {
  return (
    <div className={`${colorCls} rounded-b-3xl border-b-[4px] border-black/20 text-white`}>
      <div className="mx-auto flex max-w-xl items-center gap-3 px-4 py-4">
        <button type="button" onClick={() => { buzz(); onBack() }} aria-label="Quay lại"
          className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border-b-[3px] border-black/20 bg-white/25 text-lg font-bold ${PRESS}`}>←</button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold leading-tight">{title}</h1>
          {subtitle && <p className="truncate text-xs font-semibold text-white/80">{subtitle}</p>}
        </div>
        {right && <span className="flex-shrink-0 rounded-full bg-white/25 px-3 py-1 text-sm font-bold">{right}</span>}
      </div>
      {timer && (
        <div className={`mx-auto max-w-xl px-4 ${progress ? 'pb-2' : 'pb-4'}`}>
          <div className="h-3 overflow-hidden rounded-full bg-black/15">
            <div className={`h-full rounded-full transition-all duration-1000 ease-linear ${timer.urgent ? 'bg-red-300' : timer.fillCls ?? 'bg-white/90'}`}
              style={{ width: `${Math.max(0, Math.min(100, timer.pct))}%` }} />
          </div>
          <p className={`mt-1 text-right text-xs font-bold transition-colors ${timer.urgent ? 'text-red-200' : 'text-white/70'}`}>{timer.secondsLeft}s</p>
        </div>
      )}
      {progress && (
        <div className="mx-auto max-w-xl px-4 pb-4">
          <div className="h-3 overflow-hidden rounded-full bg-black/15">
            <div className="relative h-full rounded-full bg-white/90 transition-all duration-500"
              style={{ width: `${progress.max > 0 ? Math.min(100, (progress.value / progress.max) * 100) : 0}%` }} />
          </div>
        </div>
      )}
    </div>
  )
}

export type AnswerState = 'idle' | 'selected' | 'correct' | 'wrong' | 'dim'
const ANSWER_SURFACE: Record<AnswerState, string> = {
  idle:     'border-slate-200 border-b-slate-300 bg-white text-slate-800',
  selected: 'border-indigo-400 border-b-indigo-500 bg-indigo-50 text-indigo-900',
  correct:  'border-emerald-400 border-b-emerald-600 bg-emerald-50 text-emerald-800',
  wrong:    'border-red-300 border-b-red-500 bg-red-50 text-red-700 ax-shake',
  dim:      'border-slate-200 border-b-slate-200 bg-white text-slate-400 opacity-60',
}

// Multiple-choice answer row: optional letter badge (A/B/C/D), state-driven colors, shakes when wrong.
export function AnswerButton({
  state = 'idle', badge, onClick, disabled, children,
}: { state?: AnswerState; badge?: string; onClick?: () => void; disabled?: boolean; children: ReactNode }) {
  return (
    <button type="button" disabled={disabled} onClick={() => { buzz(); onClick?.() }}
      className={`flex w-full items-center gap-3 rounded-2xl border-2 border-b-[4px] px-4 py-3.5 text-left text-lg font-bold ${PRESS} ${ANSWER_SURFACE[state]}`}>
      {badge && (
        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-black/5 text-base font-bold">
          {state === 'correct' ? '✓' : state === 'wrong' ? '✕' : badge}
        </span>
      )}
      <span className="min-w-0 flex-1">{children}</span>
    </button>
  )
}

// Transition / confirm buttons inside games (Kiểm tra, Tiếp theo, Xem kết quả …). The accent follows the
// game's own color family. Full class strings so Tailwind keeps them.
const CTA_COLORS: Record<string, string> = {
  pink:    'border-pink-700 bg-pink-500 text-white',
  rose:    'border-rose-700 bg-rose-500 text-white',
  blue:    'border-blue-700 bg-blue-500 text-white',
  indigo:  'border-indigo-700 bg-indigo-500 text-white',
  violet:  'border-violet-700 bg-violet-500 text-white',
  teal:    'border-teal-700 bg-teal-500 text-white',
  green:   'border-emerald-700 bg-emerald-500 text-white',
  orange:  'border-orange-700 bg-orange-500 text-white',
  amber:   'border-amber-600 bg-amber-400 text-amber-950',
  red:     'border-red-700 bg-red-500 text-white',
  purple:  'border-purple-800 bg-purple-600 text-white',
  gray:    'border-gray-900 bg-gray-700 text-white',
  slate:   'border-2 border-slate-200 border-b-slate-300 bg-white text-slate-600',
}
const CTA_BASE = `rounded-2xl border-b-[4px] px-4 py-3.5 text-lg font-bold ${PRESS} disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-300 disabled:active:translate-y-0 disabled:active:border-b-[4px]`
export function cta(family: keyof typeof CTA_COLORS | string, extra = '') {
  return `${CTA_BASE} ${extra.includes('flex-1') ? '' : 'w-full'} ${CTA_COLORS[family] ?? CTA_COLORS.blue} ${extra}`.replace(/\s+/g, ' ').trim()
}

// Phonics games receive their accent as a class string (e.g. "bg-pink-500 hover:bg-pink-600"); map it to a cta() family.
export function colorFamily(cls: string) {
  const m = cls.match(/bg-(\w+)-\d+/)
  return !m ? 'blue' : m[1] === 'emerald' ? 'green' : m[1]
}
