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

/** Shared by the heart-based games: an equal share per right answer, −15 per heart lost. */
export function heartScorePct(correct: number, total: number, heartsLost: number): number {
  if (!(total > 0)) return 0
  return Math.max(0, Math.min(100, Math.round((100 * correct) / total - 15 * heartsLost)))
}

/** 12.5 points per right answer, −15 per heart lost. 8/8 with one slip = 85% (3★), two slips = 70% (2★). */
export const whackScorePct = (correct: number, heartsLost: number) => heartScorePct(correct, WHACK_QUESTIONS, heartsLost)

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
