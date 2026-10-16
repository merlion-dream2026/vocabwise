import { shuffle, distractors, heartScorePct, type ArcadeWord } from './shared'

// ─── 🐸 Frog ───────────────────────────────────────────────────────────────────────────────────
// A listening game: 10 lily pads to the far bank. Each question says an English word out loud and
// shows 3 pads ahead (answer + 2 decoys) — hop onto the right one. Pads alternate between showing the
// English word and the emoji + Vietnamese meaning. The pads slowly sink: the clock starts once the
// word has been said, and running out (like a wrong pad) costs a heart and the word comes back later.
// Replaying the word doesn't stop the clock.

export const FROG_QUESTIONS = 10
export const FROG_HEARTS = 3
export const FROG_PADS = 3
/** Seconds before the pads sink — counted from just after the word is said. Generous at the bottom
 *  (young kids read the Vietnamese meanings slowly), tighter higher up. */
export const FROG_SECONDS: Record<string, number> = {
  seeker: 14, starter: 12, ranger: 11, explorer: 10, scholar: 9, master: 8,
}
export const frogSeconds = (level: string) => FROG_SECONDS[level] ?? 12

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

/** A missed question coming back: same 3 pads, but the right one moves to another spot — so the
 *  child has to listen again instead of remembering where the hint lit up. */
export function retryFrogQuestion(q: FrogQuestion): FrogQuestion {
  const was = q.pads.findIndex((p) => p.word === q.target.word)
  const decoys = shuffle(q.pads.filter((p) => p.word !== q.target.word))
  if (!decoys.length) return q
  const spots = q.pads.map((_, i) => i).filter((i) => i !== was)
  const at = spots[Math.floor(Math.random() * spots.length)]
  const pads = [...decoys]
  pads.splice(at, 0, q.target)
  return { ...q, pads }
}

/** `total` = questions this game really has (a topic with fewer than 10 words asks fewer). */
export const frogScorePct = (correct: number, heartsLost: number, total = FROG_QUESTIONS) => heartScorePct(correct, total, heartsLost)
