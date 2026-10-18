import { buildChoiceQuestions, questionCount, type ArcadeWord, type ChoiceQuestion } from './shared'

// ─── ⚽ Penalty ────────────────────────────────────────────────────────────────────────────────
// Shoot-out: each kick is a four-choice question (vi / listen / en, like 🚀 rocket) and the four
// answers sit in the goal's four corners. Tap the right corner → GOAL, the keeper dives the other
// way; a wrong corner (or the kick clock running out) → the keeper saves it. No retakes: 10 kicks,
// score = goals / kicks. 3★ (more than 80%, i.e. 9-10 goals) plays the celebration.

export const PENALTY_KICKS = 10
/** Seconds per kick (slower = easier). */
export const PENALTY_SECONDS: Record<string, number> = {
  seeker: 20, starter: 18, ranger: 16, explorer: 14, scholar: 12, master: 10,
}
export const penaltySeconds = (level: string) => PENALTY_SECONDS[level] ?? 15

export type PenaltyQuestion = ChoiceQuestion
export const buildPenaltyQuestions = (words: ArcadeWord[]): PenaltyQuestion[] =>
  buildChoiceQuestions(words, questionCount(words, PENALTY_KICKS))

export function penaltyScorePct(goals: number, kicks: number): number {
  if (!(kicks > 0)) return 0
  return Math.max(0, Math.min(100, Math.round((100 * goals) / kicks)))
}

/** The four corners in answer order: top-left, top-right, bottom-left, bottom-right. */
export const CORNERS = ['tl', 'tr', 'bl', 'br'] as const
export type Corner = (typeof CORNERS)[number]

/** Where the keeper dives: to the shot's corner on a save, else to a different one (never the shot). */
export function keeperDive(shot: Corner, saved: boolean, rnd = Math.random): Corner {
  if (saved) return shot
  const others = CORNERS.filter((c) => c !== shot)
  return others[Math.floor(rnd() * others.length)]
}

export type Celebration = 'spin' | 'sky'
/** The 3★ celebration: jump-spin-land (spin) or both arms pointing to the sky (sky). */
export const pickCelebration = (rnd = Math.random): Celebration => (rnd() < 0.5 ? 'spin' : 'sky')
