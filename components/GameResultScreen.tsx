'use client'

import { getGrade } from '@/lib/gameGrade'

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
  /** Restart button background classes, e.g. "bg-pink-500 hover:bg-pink-600" — each game keeps its own accent color. */
  accentCls: string
  onRestart: () => void
  onExit: () => void
}

/**
 * Content-only completion screen: score-tier emoji/label, score line, optional XP chip,
 * optional wrong-words chips OR round-breakdown panel, and the two fixed action buttons.
 * The caller keeps its own colored header + gradient background wrapper around this.
 */
export default function GameResultScreen({
  score, total, xpEarned, wrongWords, breakdown, accentCls, onRestart, onExit,
}: Props) {
  const pct = total > 0 ? Math.round((score / total) * 100) : 0
  const grade = getGrade(score, total)

  return (
    <>
      <div className="text-7xl mb-4">{grade.emoji}</div>
      <h2 className="text-3xl font-black text-gray-800 mb-1">{grade.label}</h2>
      <p className="text-gray-500 font-bold text-lg mb-1">{score}/{total} câu đúng ({pct}%)</p>

      {xpEarned !== undefined && (
        <div className="inline-flex items-center gap-1.5 bg-yellow-50 border border-yellow-200 rounded-full px-4 py-1.5 mb-4">
          <span className="text-base">⭐</span>
          <span className="text-yellow-700 font-black text-sm">+{xpEarned} XP</span>
        </div>
      )}

      {breakdown && breakdown.length > 0 && (
        <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-sm p-4 w-full mb-4 space-y-2.5">
          {breakdown.map(r => (
            <div key={r.label} className="space-y-1">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-gray-500">{r.icon} {r.label}</span>
                <span className="text-gray-700">{r.score}/{r.max}</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gray-400 rounded-full" style={{ width: `${r.max > 0 ? (r.score / r.max) * 100 : 0}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {wrongWords && wrongWords.length > 0 && (
        <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl px-4 py-3 mb-6 w-full">
          <p className="text-orange-700 font-bold text-sm mb-2">📝 Cần ôn thêm:</p>
          <div className="flex flex-wrap gap-2">
            {wrongWords.map(w => (
              <span key={w} className="bg-orange-100 text-orange-700 font-bold text-sm px-3 py-1 rounded-full">{w}</span>
            ))}
          </div>
        </div>
      )}

      <div className="w-full space-y-3 mt-2">
        <button onClick={onRestart} className={`w-full ${accentCls} text-white font-black text-xl py-4 rounded-2xl shadow-lg transition-colors`}>
          🔄 Chơi lại
        </button>
        <button onClick={onExit} className="w-full bg-white border-2 border-gray-200 text-gray-600 font-bold text-xl py-4 rounded-2xl text-center">← Chọn chế độ khác</button>
      </div>
    </>
  )
}
