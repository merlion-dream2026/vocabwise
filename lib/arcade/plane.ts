import { shuffle, distractors, heartScorePct, type ArcadeWord } from './shared'

// ─── ✈️ Plane ──────────────────────────────────────────────────────────────────────────────────
// 10 clouds to fly through. Each question: the meaning on top, 3 clouds (answer + 2 decoys) come in
// on 3 lanes; steer the plane into the right lane before they arrive. A wrong cloud costs a heart and
// the question comes back later.

export const PLANE_QUESTIONS = 10
export const PLANE_HEARTS = 3
export const PLANE_LANES = 3
/** Seconds for the clouds to fly from the right edge to the plane. */
export const PLANE_FLY_SECONDS: Record<string, number> = {
  seeker: 8, starter: 7.5, ranger: 7, explorer: 6.5, scholar: 6, master: 5.5,
}
export const planeFlySeconds = (level: string) => PLANE_FLY_SECONDS[level] ?? 7

export type PlaneQuestion = { target: ArcadeWord; lanes: ArcadeWord[] }

export function buildPlaneQuestions(words: ArcadeWord[]): PlaneQuestion[] {
  return shuffle(words).slice(0, PLANE_QUESTIONS).map((target) => ({
    target, lanes: shuffle([target, ...distractors(words, target, PLANE_LANES - 1)]),
  }))
}

export const planeScorePct = (correct: number, heartsLost: number) => heartScorePct(correct, PLANE_QUESTIONS, heartsLost)
