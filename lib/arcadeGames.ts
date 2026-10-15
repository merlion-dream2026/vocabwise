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

export const buildRocketQuestions = (words: ArcadeWord[]) => buildChoiceQuestions(words, ROCKET_PARTS)

/** `n` four-choice questions cycling vi → listen → en (🚀 rocket, 🏎️ race). */
export function buildChoiceQuestions(words: ArcadeWord[], n: number): RocketQuestion[] {
  return shuffle(words).slice(0, n).map((target, i) => ({
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
export const rocketScorePct = (parts: number, wrong: number, secondsLeft: number, totalSeconds: number) =>
  clockScorePct(parts, ROCKET_PARTS, wrong, secondsLeft, totalSeconds)

/** The rocket rule for any "finish `need` right answers before the clock runs out" game. */
export function clockScorePct(parts: number, need: number, wrong: number, secondsLeft: number, totalSeconds: number): number {
  if (!(parts > 0)) return 0
  if (parts < need) return Math.round(45 * (parts / need))
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

// ─── 🏎️ Race ───────────────────────────────────────────────────────────────────────────────────
// Rocky's car against Bubi's. Same 4-choice questions as the rocket; each right answer pushes Rocky
// a tenth of the track, a wrong one spins him out and the word comes back later. Bubi drives at a
// steady pace and crosses the line after the level's race time — beat him there. Scored like the
// rocket: accuracy + how far ahead Rocky finished (a lost race earns under 50%).

export const RACE_QUESTIONS = 10
export const RACE_SECONDS: Record<string, number> = {
  seeker: 110, starter: 95, ranger: 85, explorer: 80, scholar: 70, master: 60,
}
export const raceSeconds = (level: string) => RACE_SECONDS[level] ?? 90
export const buildRaceQuestions = (words: ArcadeWord[]) => buildChoiceQuestions(words, RACE_QUESTIONS)
export const raceScorePct = (correct: number, wrong: number, secondsLeft: number, totalSeconds: number) =>
  clockScorePct(correct, RACE_QUESTIONS, wrong, secondsLeft, totalSeconds)

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

// ─── 🧺 Basket ─────────────────────────────────────────────────────────────────────────────────
// Catch: the meaning (or just the spoken word) is on the sign; 4 word-apples (answer + 3 decoys)
// keep dropping from the tree — slide Rocky's basket under the right one. Catching a wrong apple
// costs a heart; a question's 20s running out costs one too, and either way the word comes back
// later. Same question set as 🎣 fishing (8 words, vi / listen alternating).

export const BASKET_QUESTIONS = FISH_QUESTIONS
export const BASKET_HEARTS = 3
export const BASKET_SECONDS = 20
/** Seconds for an apple to fall from the tree to the ground (slower = easier). */
export const BASKET_FALL_SECONDS: Record<string, number> = {
  seeker: 7.5, starter: 7, ranger: 6.5, explorer: 6, scholar: 5.5, master: 5,
}
export const basketFallSeconds = (level: string) => BASKET_FALL_SECONDS[level] ?? 6.5
export const buildBasketQuestions = buildFishQuestions
export const basketScorePct = (correct: number, heartsLost: number) => heartScorePct(correct, BASKET_QUESTIONS, heartsLost)

/** Next lane for an apple re-dropping: a random lane no other apple is using near the top. */
export function freeLane(lanes: number, busy: number[], rnd = Math.random): number {
  const free = Array.from({ length: lanes }, (_, i) => i).filter((i) => !busy.includes(i))
  const pool = free.length ? free : Array.from({ length: lanes }, (_, i) => i)
  return pool[Math.floor(rnd() * pool.length)]
}

// ─── 🦘 Jump ───────────────────────────────────────────────────────────────────────────────────
// Speaking: Rocky runs a meadow and stops at 8 obstacles. Each carries a sign (picture + meaning);
// tap 🎤 and say the English word — the browser's own speech recognition (free, no AI quota) hears
// it and Rocky jumps. 3 tries per word ("🔊 Nghe mẫu" plays it any time); a word is worth 1 on the
// first try, 0.7 on the second, 0.4 on the third, 0 if skipped. Matching is lenient on purpose:
// recognisers mishear young voices, and a fail here should mean "not said", not "accent".

export const JUMP_QUESTIONS = 8
export const JUMP_TRIES = 3
const JUMP_TRY_PTS = [1, 0.7, 0.4]

export function buildJumpQuestions(words: ArcadeWord[]): ArcadeWord[] {
  return shuffle(words.filter((w) => /[a-z]/i.test(w.word))).slice(0, JUMP_QUESTIONS)
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim()

/** Edit distance (Levenshtein). */
export function editDistance(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, j) => j)
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0]
    row[0] = i
    for (let j = 1; j <= b.length; j++) {
      const tmp = row[j]
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1))
      prev = tmp
    }
  }
  return row[b.length]
}

/**
 * Did any recogniser alternative say `target`? Yes if an alternative contains the word (or its
 * words, for phrases), or a same-length stretch of it is within 1 edit (2 for words of 7+ letters)
 * — "mum" heard as "mom", "kitchen" as "kitchens" still count; words of 4 letters or fewer must
 * also start with the right letter.
 */
export function speechMatches(alternatives: string[], target: string): boolean {
  const t = norm(target)
  if (!t) return false
  const slack = t.replace(/ /g, '').length >= 7 ? 2 : 1
  return alternatives.some((alt) => {
    const a = norm(alt)
    if (!a) return false
    if (` ${a} `.includes(` ${t} `) || a.replace(/ /g, '') === t.replace(/ /g, '')) return true
    const words = a.split(' ')
    const n = t.split(' ').length
    for (let i = 0; i + n <= words.length; i++) {
      const heard = words.slice(i, i + n).join(' ')
      // Short words must also start right, so "bad" doesn't pass for "dad" (but "mom" does for "mum").
      if (t.length <= 4 && heard[0] !== t[0]) continue
      if (editDistance(heard, t) <= slack) return true
    }
    return false
  })
}

/** Average word worth by tries used (1–3 = solved on that try, 0 = skipped) as a percentage. */
export function jumpScorePct(triesPerWord: number[], total = JUMP_QUESTIONS): number {
  if (!(total > 0)) return 0
  return Math.round((100 * triesPerWord.reduce((s, n) => s + (JUMP_TRY_PTS[n - 1] ?? 0), 0)) / total)
}
