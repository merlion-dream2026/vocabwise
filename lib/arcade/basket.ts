import { heartScorePct } from './shared'
import { FISH_QUESTIONS, buildFishQuestions } from './fish'

// ─── 🧺 Basket ─────────────────────────────────────────────────────────────────────────────────
// Catch: the meaning (or just the spoken word) is on the sign; 4 word-apples (answer + 3 decoys)
// keep dropping from the tree — slide Rocky's basket under the right one. Catching a wrong apple
// costs a heart; a question's 20s running out costs one too, and either way the word comes back
// later. Same question set as 🎣 fishing (8 words, vi / listen alternating).

export const BASKET_QUESTIONS = FISH_QUESTIONS
export const BASKET_HEARTS = 3
export const BASKET_SECONDS = 20
/** Seconds for an apple to fall from the tree to the ground (slower = easier). */
export const BASKET_FALL_SECONDS: Record<string, number> = {
  seeker: 7.5, starter: 7, ranger: 6.5, explorer: 6, scholar: 5.5, master: 5,
}
export const basketFallSeconds = (level: string) => BASKET_FALL_SECONDS[level] ?? 6.5
export const buildBasketQuestions = buildFishQuestions
export const basketScorePct = (correct: number, heartsLost: number) => heartScorePct(correct, BASKET_QUESTIONS, heartsLost)

/** Next lane for an apple re-dropping: a random lane no other apple is using near the top. */
export function freeLane(lanes: number, busy: number[], rnd = Math.random): number {
  const free = Array.from({ length: lanes }, (_, i) => i).filter((i) => !busy.includes(i))
  const pool = free.length ? free : Array.from({ length: lanes }, (_, i) => i)
  return pool[Math.floor(rnd() * pool.length)]
}
