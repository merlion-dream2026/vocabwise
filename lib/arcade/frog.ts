import { shuffle, distractors, heartScorePct, type ArcadeWord } from './shared'

// ─── 🐸 Frog ───────────────────────────────────────────────────────────────────────────────────
// A listening game: 10 lily pads to the far bank. Each question says an English word out loud and
// shows 3 pads ahead (answer + 2 decoys) — hop onto the right one. Pads alternate between showing the
// English word and the emoji + Vietnamese meaning. No clock (listening needs calm); a wrong pad
// sinks, costs a heart and the word comes back later.

export const FROG_QUESTIONS = 10
export const FROG_HEARTS = 3
export const FROG_PADS = 3

/** word: pads show English words · meaning: pads show emoji + Vietnamese meaning. */
export type FrogKind = 'word' | 'meaning'
export type FrogQuestion = { target: ArcadeWord; pads: ArcadeWord[]; kind: FrogKind }

export function buildFrogQuestions(words: ArcadeWord[]): FrogQuestion[] {
  return shuffle(words).slice(0, FROG_QUESTIONS).map((target, i) => ({
    target,
    kind: i % 2 ? 'meaning' : 'word',
    pads: shuffle([target, ...distractors(words, target, FROG_PADS - 1)]),
  }))
}

export const frogScorePct = (correct: number, heartsLost: number) => heartScorePct(correct, FROG_QUESTIONS, heartsLost)
