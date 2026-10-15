import { shuffle, distractors, heartScorePct, type ArcadeWord } from './shared'

// ─── 🎣 Fishing ────────────────────────────────────────────────────────────────────────────────
// 8 fish to catch. Each question: 4 fish (answer + 3 decoys) swim across the sea at different
// depths; tap where the right fish is and the hook drops there — it's a timing game, the fish keep
// swimming. Catching a wrong fish costs a heart (it wriggles free); an empty cast costs nothing.
// A question's 20s running out costs a heart and sends it to the back of the queue.

export const FISH_QUESTIONS = 8
export const FISH_HEARTS = 3
export const FISH_SECONDS = 20
/** Seconds for a fish to cross the screen (slower = easier). */
export const FISH_SWIM_SECONDS: Record<string, number> = {
  seeker: 16, starter: 14, ranger: 12, explorer: 11, scholar: 10, master: 9,
}
export const fishSwimSeconds = (level: string) => FISH_SWIM_SECONDS[level] ?? 13

/** vi: emoji + Vietnamese meaning on the sign · listen: only the spoken English word. */
export type FishKind = 'vi' | 'listen'
export type FishQuestion = { target: ArcadeWord; choices: ArcadeWord[]; kind: FishKind }

export function buildFishQuestions(words: ArcadeWord[]): FishQuestion[] {
  return shuffle(words).slice(0, FISH_QUESTIONS).map((target, i) => ({
    target,
    kind: i % 2 ? 'listen' : 'vi',
    choices: shuffle([target, ...distractors(words, target, 3)]),
  }))
}

export const fishScorePct = (correct: number, heartsLost: number) => heartScorePct(correct, FISH_QUESTIONS, heartsLost)
