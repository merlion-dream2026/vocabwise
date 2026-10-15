import { shuffle, type ArcadeWord } from './shared'

// ─── 🚂 Train ──────────────────────────────────────────────────────────────────────────────────
// Spelling: 8 words, one train each. The picture + meaning is on the board and the word is read
// out; letter crates (the word's letters + 1–2 spare consonants) wait on the platform — load them
// into the wagons in order. No hearts and no clock: a wrong crate just wobbles and counts a slip;
// after 2 slips on a word the next crate glows. A full train toots off and the next one pulls in.

export const TRAIN_QUESTIONS = 8
export const TRAIN_HINT_AFTER = 2
/** Words longer than this make wagons too small on a phone — used only when a topic has too few short ones. */
export const TRAIN_MAX_LETTERS = 10

/** Letters to load, in order (lower case a–z only; spaces, hyphens and apostrophes are not wagons). */
export const trainLetters = (word: string) => word.toLowerCase().replace(/[^a-z]/g, '').split('')

export type TrainCrate = { id: string; letter: string }
export type TrainQuestion = { target: ArcadeWord; letters: string[]; crates: TrainCrate[] }

export function buildTrainQuestions(words: ArcadeWord[]): TrainQuestion[] {
  const usable = words.filter((w) => trainLetters(w.word).length >= 2)
  const short = shuffle(usable.filter((w) => trainLetters(w.word).length <= TRAIN_MAX_LETTERS))
  const long = shuffle(usable.filter((w) => trainLetters(w.word).length > TRAIN_MAX_LETTERS))
  return [...short, ...long].slice(0, TRAIN_QUESTIONS).map((target) => {
    const letters = trainLetters(target.word)
    const spare = shuffle('bcdfghjklmnpqrstvwxyz'.split('').filter((c) => !letters.includes(c))).slice(0, letters.length >= 7 ? 1 : 2)
    return { target, letters, crates: shuffle([...letters, ...spare]).map((letter, i) => ({ id: `${letter}${i}`, letter })) }
  })
}

/** A word's worth: 1 when spelled without a slip, −0.2 per slip, never below 0.4 (it was finished). */
export const trainWordPts = (slips: number) => Math.max(0.4, 1 - 0.2 * Math.max(0, slips))
/** Average word worth as a percentage. Two single slips across 8 words still earn 3★. */
export function trainScorePct(slipsPerWord: number[], total = TRAIN_QUESTIONS): number {
  if (!(total > 0)) return 0
  return Math.round((100 * slipsPerWord.reduce((s, n) => s + trainWordPts(n), 0)) / total)
}
