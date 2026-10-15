import { buildChoiceQuestions, clockScorePct, type ArcadeWord, type ChoiceKind, type ChoiceQuestion } from './shared'

// ─── 🚀 Rocket ────────────────────────────────────────────────────────────────────────────────
// 10 right answers = 10 rocket parts. A wrong answer sends the question to the back of the queue,
// so the rocket is only finished when every part's word has been answered correctly — against one
// shared fuel clock for the whole flight (no per-question timer, less pressure on young kids).

export const ROCKET_PARTS = 10
export const ROCKET_SECONDS: Record<string, number> = {
  seeker: 150, starter: 130, ranger: 110, explorer: 110, scholar: 100, master: 90,
}
export const rocketSeconds = (level: string) => ROCKET_SECONDS[level] ?? 120

export type RocketKind = ChoiceKind
export type RocketQuestion = ChoiceQuestion

export const buildRocketQuestions = (words: ArcadeWord[]) => buildChoiceQuestions(words, ROCKET_PARTS)

/**
 * 80% accuracy (parts ÷ answers given) + 20% fuel left (full marks with ≥30% of the tank still
 * there). A launch with up to 3 slips and fuel to spare is 3★, 4–6 slips 2★. A rocket that runs out of
 * fuel only earns credit for the parts built, capped under 50% (1★ at most).
 */
export const rocketScorePct = (parts: number, wrong: number, secondsLeft: number, totalSeconds: number) =>
  clockScorePct(parts, ROCKET_PARTS, wrong, secondsLeft, totalSeconds)
