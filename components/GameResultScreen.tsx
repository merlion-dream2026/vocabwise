'use client'

import type { ReactNode } from 'react'

import { getGrade } from '@/lib/gameGrade'
import { starsFor } from '@/lib/topicMastery'
import { HubStyles } from '@/components/TopicHub'
import { PrimaryButton } from '@/components/ChunkyUI'
import Mascot from '@/components/Mascot'

export type ResultBreakdownRow = { icon: string; label: string; score: number; max: number }

type Props = {
  score: number
  total: number
  /** Omit entirely for a game that doesn't award XP — never fabricate a number. */
  xpEarned?: number
  /** Flat "words to review" chip list — the shape every current game uses. */
  wrongWords?: string[]
  /** Per-round score breakdown for a multi-round test/quiz instead of a flat wrong-words list. */
  breakdown?: ResultBreakdownRow[]
  /** Legacy per-game accent classes — ignored now that the restart button uses the shared amber CTA. Still accepted so callers needn't change. */
  accentCls?: string
  /** Override the star count (default: derived from score/total). */
  stars?: number
  /** Override the "X/Y câu đúng (Z%)" line for games that don't count questions. */
  scoreLine?: string
  /** Extra content under the score line (e.g. flips / time). */
  extra?: ReactNode
  onRestart: () => void
  onExit: () => void
}

/**
 * Content-only completion screen: score-tier emoji/label, score line, optional XP chip,
 * optional wrong-words chips OR round-breakdown panel, and the two fixed action buttons.
 * The caller keeps its own colored header + gradient background wrapper around this.
 */
export default function GameResultScreen({
  score, total, xpEarned, wrongWords, breakdown, stars: starsProp, scoreLine, extra, onRestart, onExit,
}: Props) {
  const pct = total > 0 ? Math.round((score / total) * 100) : 0
  const grade = getGrade(score, total)
  const stars = starsProp ?? starsFor(pct)
  const owl = pct >= 90 ? 'Quá đỉnh! Mình tự hào về bạn lắm!' : pct >= 60 ? 'Khá lắm! Thêm một lần nữa là lên 3 sao!' : 'Không sao, luyện thêm một chút là giỏi ngay!'

  return (
    <>
      <HubStyles />
      <div className="hub-shine mb-3 flex h-24 w-24 -rotate-6 items-center justify-center rounded-3xl bg-white text-6xl shadow-md ring-4 ring-amber-100">{grade.emoji}</div>
      <h2 className="mb-1 text-3xl font-bold text-gray-800">{grade.label}</h2>
      <div className="mb-1 flex gap-1 text-4xl">
        {[1, 2, 3].map(i => (
          <span key={i} className={i > stars ? 'opacity-25 grayscale' : 'hub-star'} style={i <= stars ? { animationDelay: `${300 + i * 150}ms` } : undefined}>⭐</span>
        ))}
      </div>
      <p className="mb-1 text-lg font-bold text-gray-500">{scoreLine ?? `${score}/${total} câu đúng (${pct}%)`}</p>
      <div className="mb-3 text-sm font-semibold text-gray-400">{extra}</div>

      {xpEarned !== undefined && (
        <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border-b-[3px] border-amber-600 bg-amber-400 px-4 py-1.5">
          <span className="text-base">⭐</span>
          <span className="text-sm font-bold text-amber-950">+{xpEarned} XP</span>
        </div>
      )}

      {breakdown && breakdown.length > 0 && (
        <div className="mb-4 w-full space-y-3 rounded-3xl border-2 border-b-[4px] border-slate-200 border-b-slate-300 bg-white p-4">
          {breakdown.map(r => (
            <div key={r.label} className="space-y-1">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-gray-500">{r.icon} {r.label}</span>
                <span className="text-gray-700">{r.score}/{r.max}</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-amber-400" style={{ width: `${r.max > 0 ? (r.score / r.max) * 100 : 0}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {wrongWords && wrongWords.length > 0 && (
        <div className="mb-4 w-full rounded-3xl border-2 border-b-[4px] border-orange-200 border-b-orange-300 bg-orange-50 px-4 py-3">
          <p className="mb-2 text-sm font-bold text-orange-700">📝 Cần ôn thêm:</p>
          <div className="flex flex-wrap gap-2">
            {wrongWords.map(w => (
              <span key={w} className="rounded-full bg-orange-100 px-3 py-1 text-sm font-bold text-orange-700">{w}</span>
            ))}
          </div>
        </div>
      )}

      <div className="mb-4 flex w-full items-center gap-3 rounded-2xl bg-white/80 px-3 py-2">
        <Mascot shot={pct >= 90 ? 'pose-cheer' : pct >= 60 ? 'pose-idle' : 'pose-oops'} size={48} blink />
        <p className="text-left text-sm font-bold text-slate-600">{owl}</p>
      </div>

      <div className="w-full space-y-3">
        <PrimaryButton tone="amber" onClick={onRestart}>🔄 Chơi lại</PrimaryButton>
        <PrimaryButton tone="slate" onClick={onExit}>← Chọn chế độ khác</PrimaryButton>
      </div>
    </>
  )
}
