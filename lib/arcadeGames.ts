// Pure logic for the two arcade games in "Thử thách thêm": 🚀 Phóng tên lửa (rocket) and
// 🔨 Đập chuột chũi (whack). Question building, pacing per level and the score → stars rule live
// here so they can be unit-tested; the components only animate.

export type ArcadeWord = { word: string; meaning: string; emoji: string }

function shuffle<T>(arr: T[]): T[] {
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

// ─── 🚀 Rocket ────────────────────────────────────────────────────────────────────────────────
// 10 right answers = 10 rocket parts. A wrong answer sends the question to the back of the queue,
// so the rocket is only finished when every part's word has been answered correctly — against one
// shared fuel clock for the whole flight (no per-question timer, less pressure on young kids).

export const ROCKET_PARTS = 10
export const ROCKET_SECONDS: Record<string, number> = {
  seeker: 150, starter: 130, ranger: 110, explorer: 110, scholar: 100, master: 90,
}
export const rocketSeconds = (level: string) => ROCKET_SECONDS[level] ?? 120

/** vi: emoji + Vietnamese meaning → pick the English word · listen: hear it → pick the word ·
 *  en: see the English word → pick its meaning. */
export type RocketKind = 'vi' | 'listen' | 'en'
export type RocketQuestion = { target: ArcadeWord; choices: ArcadeWord[]; kind: RocketKind }

const ROCKET_KINDS: RocketKind[] = ['vi', 'listen', 'en']

export function buildRocketQuestions(words: ArcadeWord[]): RocketQuestion[] {
  return shuffle(words).slice(0, ROCKET_PARTS).map((target, i) => ({
    target,
    kind: ROCKET_KINDS[i % ROCKET_KINDS.length],
    choices: shuffle([target, ...distractors(words, target, 3)]),
  }))
}

/**
 * 80% accuracy (parts ÷ answers given) + 20% fuel left (full marks with ≥30% of the tank still
 * there). A launch with up to 3 slips and fuel to spare is 3★, 4–6 slips 2★. A rocket that runs out of
 * fuel only earns credit for the parts built, capped under 50% (1★ at most).
 */
export function rocketScorePct(parts: number, wrong: number, secondsLeft: number, totalSeconds: number): number {
  if (!(parts > 0)) return 0
  if (parts < ROCKET_PARTS) return Math.round(45 * (parts / ROCKET_PARTS))
  const accuracy = parts / (parts + Math.max(0, wrong))
  const fuel = totalSeconds > 0 ? Math.min(1, Math.max(0, secondsLeft) / (0.3 * totalSeconds)) : 1
  return Math.round(100 * (0.8 * accuracy + 0.2 * fuel))
}

// ─── 🔨 Whack-a-mole ───────────────────────────────────────────────────────────────────────────
// 5 questions: a Vietnamese meaning on the sign board, critters pop out of 6 holes holding English
// words, whack the right one. 3 hearts for the whole game: a wrong whack or a question's 15s running
// out costs one. A timed-out question goes to the back of the queue — 5 right answers clear it.

export const WHACK_QUESTIONS = 5
export const WHACK_HEARTS = 3
export const WHACK_SECONDS = 15
export const WHACK_HOLES = 6

/** How long a critter stays up, the pause between pops, and how many can be up at once. */
export type WhackPace = { upMs: number; gapMs: number; maxUp: number }
export const WHACK_PACE: Record<string, WhackPace> = {
  seeker:   { upMs: 2400, gapMs: 750, maxUp: 2 },
  starter:  { upMs: 2200, gapMs: 700, maxUp: 2 },
  ranger:   { upMs: 2000, gapMs: 650, maxUp: 2 },
  explorer: { upMs: 1900, gapMs: 600, maxUp: 3 },
  scholar:  { upMs: 1700, gapMs: 550, maxUp: 3 },
  master:   { upMs: 1500, gapMs: 500, maxUp: 3 },
}
export const whackPace = (level: string) => WHACK_PACE[level] ?? WHACK_PACE.starter

export type WhackQuestion = { target: ArcadeWord; decoys: ArcadeWord[] }

export function buildWhackQuestions(words: ArcadeWord[]): WhackQuestion[] {
  return shuffle(words).slice(0, WHACK_QUESTIONS).map((target) => ({ target, decoys: distractors(words, target, 4) }))
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

/** 20 points per right answer, −15 per heart lost. 5/5 with one slip = 85% (3★), two slips = 70% (2★). */
export function whackScorePct(correct: number, heartsLost: number): number {
  return Math.max(0, Math.min(100, Math.round((100 * correct) / WHACK_QUESTIONS - 15 * heartsLost)))
}
