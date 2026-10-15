import { shuffle, heartScorePct, type ArcadeWord } from './shared'

// ─── 🗺️ Treasure ───────────────────────────────────────────────────────────────────────────────
// Missing letter: Rocky walks a treasure map, 8 X-marks to the chest. Each stop shows a word with
// one letter dug out (picture + meaning beside it) and 4 letter stones — pick the missing one to step
// on. The gap prefers a vowel (where spelling slips most) and decoys match its kind (vowel ↔ vowel),
// so it can't be guessed from the letter's shape. 3 hearts; a wrong stone sends the word to the back.

export const TREASURE_QUESTIONS = 8
export const TREASURE_HEARTS = 3
export const TREASURE_CHOICES = 4
const VOWELS = 'aeiou'
const CONSONANTS = 'bcdfghjklmnpqrstvwxyz'

export type TreasureQuestion = { target: ArcadeWord; gap: number; answer: string; choices: string[] }

/** Which character of `word` to hide: a letter, not the first one when the word is long enough, a vowel 2 times in 3. */
export function treasureGap(word: string, rnd = Math.random): number {
  const lower = word.toLowerCase()
  const letters = [...lower].map((c, i) => ({ c, i })).filter(({ c }) => /[a-z]/.test(c))
  const pool = letters.length > 2 ? letters.slice(1) : letters
  const vowels = pool.filter(({ c }) => VOWELS.includes(c))
  const from = vowels.length && rnd() < 2 / 3 ? vowels : pool
  return from[Math.floor(rnd() * from.length)]?.i ?? 0
}

export function buildTreasureQuestions(words: ArcadeWord[]): TreasureQuestion[] {
  const usable = words.filter((w) => w.word.replace(/[^a-z]/gi, '').length >= 3)
  return shuffle(usable).slice(0, TREASURE_QUESTIONS).map((target) => {
    const gap = treasureGap(target.word)
    const answer = target.word[gap].toLowerCase()
    const kind = VOWELS.includes(answer) ? VOWELS : CONSONANTS
    const decoys = shuffle(kind.split('').filter((c) => c !== answer)).slice(0, TREASURE_CHOICES - 1)
    return { target, gap, answer, choices: shuffle([answer, ...decoys]) }
  })
}

export const treasureScorePct = (correct: number, heartsLost: number, total = TREASURE_QUESTIONS) => heartScorePct(correct, total, heartsLost)
