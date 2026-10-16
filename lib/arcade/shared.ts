// Shared pieces of the arcade games' pure logic (one file per game next to this one; import them all
// from '@/lib/arcadeGames'). Question building, pacing per level and the score → stars rules live
// in lib/arcade so they can be unit-tested; the components only animate.

export type ArcadeWord = { word: string; meaning: string; emoji: string }

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Up to `n` other words that can't be mistaken for `target` (different word AND different meaning). */
export function distractors(words: ArcadeWord[], target: ArcadeWord, n: number): ArcadeWord[] {
  const seen = new Set<string>()
  return shuffle(words).filter((w) => {
    if (w.word === target.word || w.meaning === target.meaning || seen.has(w.meaning)) return false
    seen.add(w.meaning)
    return true
  }).slice(0, n)
}

// ─── Four-choice questions (🚀 rocket, 🏎️ race) ─────────────────────────────────────────────────
/** vi: emoji + Vietnamese meaning → pick the English word · listen: hear it → pick the word ·
 *  en: see the English word → pick its meaning. */
export type ChoiceKind = 'vi' | 'listen' | 'en'
export type ChoiceQuestion = { target: ArcadeWord; choices: ArcadeWord[]; kind: ChoiceKind }

const CHOICE_KINDS: ChoiceKind[] = ['vi', 'listen', 'en']

/** `n` four-choice questions cycling vi → listen → en (🚀 rocket, 🏎️ race). */
export function buildChoiceQuestions(words: ArcadeWord[], n: number): ChoiceQuestion[] {
  return shuffle(words).slice(0, n).map((target, i) => ({
    target,
    kind: CHOICE_KINDS[i % CHOICE_KINDS.length],
    choices: shuffle([target, ...distractors(words, target, 3)]),
  }))
}

/** How many questions a game really asks: its usual count, or fewer when the topic is short. */
export const questionCount = (words: ArcadeWord[], n: number) => Math.min(n, words.length)

// ─── Scoring ───────────────────────────────────────────────────────────────────────────────────
/** The rocket rule for any "finish `need` right answers before the clock runs out" game. */
export function clockScorePct(parts: number, need: number, wrong: number, secondsLeft: number, totalSeconds: number): number {
  if (!(parts > 0)) return 0
  if (parts < need) return Math.round(45 * (parts / need))
  const accuracy = parts / (parts + Math.max(0, wrong))
  const fuel = totalSeconds > 0 ? Math.min(1, Math.max(0, secondsLeft) / (0.3 * totalSeconds)) : 1
  return Math.round(100 * (0.8 * accuracy + 0.2 * fuel))
}

/** Shared by the heart-based games: an equal share per right answer, −15 per heart lost. */
export function heartScorePct(correct: number, total: number, heartsLost: number): number {
  if (!(total > 0)) return 0
  return Math.max(0, Math.min(100, Math.round((100 * correct) / total - 15 * heartsLost)))
}
