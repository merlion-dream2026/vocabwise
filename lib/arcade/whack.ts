import { shuffle, distractors, heartScorePct, type ArcadeWord } from './shared'

// ─── 🔨 Whack-a-mole ───────────────────────────────────────────────────────────────────────────
// 8 questions: a Vietnamese meaning on the sign board, critters pop out of 6 holes holding English
// words — 4 words per question (the answer + 3 decoys), up to 4 critters out at once — whack the right
// one. 3 hearts for the whole game: a wrong whack or a question's 15s running out costs one. A
// timed-out question goes to the back of the queue — 8 right answers clear it.

export const WHACK_QUESTIONS = 8
export const WHACK_DECOYS = 3
export const WHACK_HEARTS = 3
export const WHACK_SECONDS = 15
export const WHACK_HOLES = 6

/** How long a critter stays up, the pause between pops, and how many can be up at once. */
export type WhackPace = { upMs: number; gapMs: number; maxUp: number }
export const WHACK_PACE: Record<string, WhackPace> = {
  seeker:   { upMs: 2800, gapMs: 650, maxUp: 4 },
  starter:  { upMs: 2600, gapMs: 600, maxUp: 4 },
  ranger:   { upMs: 2400, gapMs: 550, maxUp: 4 },
  explorer: { upMs: 2200, gapMs: 500, maxUp: 4 },
  scholar:  { upMs: 2000, gapMs: 450, maxUp: 4 },
  master:   { upMs: 1800, gapMs: 400, maxUp: 4 },
}
export const whackPace = (level: string) => WHACK_PACE[level] ?? WHACK_PACE.starter

export type WhackQuestion = { target: ArcadeWord; decoys: ArcadeWord[] }

export function buildWhackQuestions(words: ArcadeWord[]): WhackQuestion[] {
  return shuffle(words).slice(0, WHACK_QUESTIONS).map((target) => ({ target, decoys: distractors(words, target, WHACK_DECOYS) }))
}

/**
 * Word for the next critter. The target is guaranteed at least every 3rd pop (so nobody waits long)
 * and never shown twice at once; decoys already up are skipped so the holes show different words.
 */
export function nextWhackWord(q: WhackQuestion, popsSinceTarget: number, upWords: string[]): ArcadeWord {
  const targetUp = upWords.includes(q.target.word)
  if (!targetUp && (popsSinceTarget >= 2 || Math.random() < 0.35)) return q.target
  const free = q.decoys.filter((d) => !upWords.includes(d.word))
  const pool = free.length ? free : q.decoys
  return pool.length ? pool[Math.floor(Math.random() * pool.length)] : q.target
}

/** 12.5 points per right answer, −15 per heart lost. 8/8 with one slip = 85% (3★), two slips = 70% (2★). */
export const whackScorePct = (correct: number, heartsLost: number) => heartScorePct(correct, WHACK_QUESTIONS, heartsLost)
