// Topic mastery for the Daily topic hub — ported from the AXANH app so both apps share one rule:
//   flashcard done
//   + at least 3 of the 4 Round-1 (recognition) games at 3★
//   + at least 2 of the 3 Round-2 (production) games at 3★
// A game's stars come from its MOST RECENT attempt (not the best ever), so mastery reflects current
// retention: a weaker replay can take a topic back below the bar. Stars: ≤50% 1★, ≤80% 2★, >80% 3★.
//
// Storage: vocab_sync.mastery[topicId] = { flashcard, games, modes?, legacyDone?, video? }
//   games       – keys of games finished with a perfect score (the pre-hub format; still maintained)
//   modes       – per-game { best, last, at } as percentages, written by recordGameResult()
//   legacyDone  – set once when a topic that was ALREADY complete under the old rule
//                 (flashcard + 3 perfect games) is first replayed, so no child loses a trophy
//                 they had earned before this rule existed.
//   video       – watched one of the topic's videos to the end (an optional hub stop; never
//                 counts toward mastery)
export type GameResult = { best: number; last: number; at: string }
export type MasteryEntry = {
  flashcard: boolean
  games: string[]
  modes?: Record<string, GameResult>
  legacyDone?: boolean
  video?: boolean
}
export type GameDef = { key: string; label: string; emoji: string }

// Andie's star scale (shared with AXANH): 0% → 0★, up to 50% → 1★, up to 80% → 2★, above 80% → 3★.
export function starsFor(pct: number): number {
  if (pct > 80) return 3
  if (pct > 50) return 2
  if (pct > 0) return 1
  return 0
}

// Which games count toward each round. Every game a level offers belongs to one round (started
// from AXANH's 4 + 3 layout; since 2026-10 the Daily rule differs from AXANH's). Round 1 = recognise
// (see/hear a word, pick it); round 2 = recall fast, spell, say or write it. The 10 arcade games
// (shown in "Khu vui chơi") count too, split by the same skill line: round 1 gets the pick-the-answer
// ones (Đập chuột, Câu cá, Ếch nhảy: listening, Hứng táo), round 2 the timed recall + production ones
// (Phóng tên lửa, Máy bay, Đua xe, Tàu chở chữ: spelling, Đào kho báu: missing letter, Hô to: speaking).
// Guard: a round also needs at least 1 of its core (non-arcade) games at 3★, so arcade alone never
// passes it. Rounds need 3 games at 3★ (Seeker round 1: 2).
export type RoundSpec = { r1: readonly string[]; r2: readonly string[] }
export const ARCADE_R1 = ['whack', 'fishing', 'frog', 'basket'] as const
export const ARCADE_R2 = ['rocket', 'plane', 'race', 'train', 'treasure', 'jump'] as const
const ARCADE: readonly string[] = [...ARCADE_R1, ...ARCADE_R2]
export const isArcade = (key: string) => ARCADE.includes(key)
const STARTER_SPEC: RoundSpec = {            // Seeker / Starter / Ranger
  r1: ['truefalse', 'listen', 'match', 'memory', 'fillletter', 'bubble', ...ARCADE_R1],
  r2: ['sentenceorder', 'speak', 'spell', ...ARCADE_R2],
}
const EXPLORER_SPEC: RoundSpec = {           // Explorer / Scholar / Master
  r1: ['truefalse', 'listen', 'quiz', 'definitionmatch', 'gapfill', ...ARCADE_R1],
  r2: ['sentenceorder', 'speak', 'speedround', 'typing', 'sentence', ...ARCADE_R2],
}
/** A round's core (non-arcade) game needed at 3★ before it can pass. */
export const CORE_NEEDED = 1
export const ROUND1_NEEDED = 3
export const ROUND2_NEEDED = 3

/** 3★ games needed per round. Seeker (Pre-A1, the youngest beginners) needs 2 in round 1 so the
 *  first trophies come sooner; the 3★ bar itself stays the same everywhere. */
export function roundNeeds(level?: string): { r1: number; r2: number } {
  return { r1: level === 'seeker' ? 2 : ROUND1_NEEDED, r2: ROUND2_NEEDED }
}

export function roundSpec(level: string): RoundSpec {
  return ['explorer', 'scholar', 'master'].includes(level) ? EXPLORER_SPEC : STARTER_SPEC
}
// Without a level (a few aggregate callers don't have one) judge by whichever level group's games
// the child actually has — a child can only play their own level's games, so at most one passes.
const specsFor = (level?: string) => (level ? [roundSpec(level)] : [STARTER_SPEC, EXPLORER_SPEC])

/** The level's arcade games (all shown in "Khu vui chơi"), each tagged with the round it counts for. */
export function arcadeGames(games: GameDef[], level: string): (GameDef & { round: 1 | 2 })[] {
  const s = roundSpec(level)
  return games.filter((g) => isArcade(g.key)).map((g) => ({ ...g, round: s.r1.includes(g.key) ? 1 : 2 }))
}

/** Live star count (0-3) for one game: latest attempt; old perfect-only data counts as 3★. */
export function gameStars(entry: MasteryEntry, key: string): number {
  const r = entry.modes?.[key]
  if (r) return starsFor(r.last)
  return entry.games.includes(key) ? 3 : 0
}

/** Latest score (%) for one game, or undefined if never played. */
export function gamePct(entry: MasteryEntry, key: string): number | undefined {
  const r = entry.modes?.[key]
  if (r) return r.last
  return entry.games.includes(key) ? 100 : undefined
}

const count3 = (entry: MasteryEntry, keys: readonly string[]) => keys.filter((k) => gameStars(entry, k) === 3).length

/** 3★ games that count toward a round, capped at `need`; without a core game at 3★ it stops one
 *  short, so the round (and its ring) can only complete once a core game is in. */
function roundCount(entry: MasteryEntry, keys: readonly string[], need: number): number {
  const core = count3(entry, keys.filter((k) => !isArcade(k)))
  return Math.min(count3(entry, keys), core >= CORE_NEEDED ? need : need - 1)
}

export function isTopicMastered(entry: MasteryEntry, level?: string): boolean {
  if (entry.legacyDone) return true
  // Completed under the old rule and not replayed since: keep the trophy.
  if (!entry.modes && entry.flashcard && entry.games.length >= 3) return true
  const need = roundNeeds(level)
  return entry.flashcard && specsFor(level).some((s) => roundCount(entry, s.r1, need.r1) >= need.r1 && roundCount(entry, s.r2, need.r2) >= need.r2)
}

/** Steps toward the trophy: flashcard + the Round-1 games + the Round-2 games needed, each at its cap. */
export function topicSteps(entry: MasteryEntry, level?: string): { done: number; total: number } {
  const need = roundNeeds(level)
  const games = Math.max(...specsFor(level).map((s) => roundCount(entry, s.r1, need.r1) + roundCount(entry, s.r2, need.r2)))
  return { done: (entry.flashcard ? 1 : 0) + games, total: 1 + need.r1 + need.r2 }
}

export type RoundMastery = { round: 1 | 2; ringDone: number; ringTotal: number; note: string }

export function masteryByRound(entry: MasteryEntry, level: string): [RoundMastery, RoundMastery] {
  const s = roundSpec(level)
  const need = roundNeeds(level)
  const flash = entry.flashcard ? 1 : 0
  return [
    {
      round: 1, ringDone: flash + roundCount(entry, s.r1, need.r1), ringTotal: 1 + need.r1,
      note: `Qua vòng khi: học xong Flashcard và đạt ⭐⭐⭐ ở ${need.r1} trò của vòng (có ít nhất 1 trò học chính). Trò V1 ở Khu vui chơi cũng được tính.`,
    },
    {
      round: 2, ringDone: flash + roundCount(entry, s.r2, need.r2), ringTotal: 1 + need.r2,
      note: `Qua vòng khi: ôn xong Flashcard và đạt ⭐⭐⭐ ở ${need.r2} trò của vòng (có ít nhất 1 trò học chính). Trò V2 ở Khu vui chơi cũng được tính.`,
    },
  ]
}

export type NextStep =
  | { kind: 'flashcard' }
  | { kind: 'game'; game: GameDef; stars: number; round: 1 | 2 }
  | { kind: 'done' }

// "Next best action": flashcard first, then whichever unfinished game in the current round is
// closest to 3★ (one more try most likely pays off), then Round 2, finally "done". Only core games
// are suggested; the arcade ones (Khu vui chơi) count when played but are the child's own pick.
export function nextStep(entry: MasteryEntry, games: GameDef[], level: string): NextStep {
  if (!entry.flashcard) return { kind: 'flashcard' }
  const s = roundSpec(level)
  const pick = (keys: readonly string[], needed: number, round: 1 | 2): NextStep | null => {
    if (roundCount(entry, keys, needed) >= needed) return null
    let best: { game: GameDef; stars: number } | null = null
    for (const game of games) {
      if (!keys.includes(game.key) || isArcade(game.key)) continue
      const stars = gameStars(entry, game.key)
      if (stars < 3 && (!best || stars > best.stars)) best = { game, stars }
    }
    return best ? { kind: 'game', ...best, round } : null
  }
  const need = roundNeeds(level)
  return pick(s.r1, need.r1, 1) ?? pick(s.r2, need.r2, 2) ?? { kind: 'done' }
}

// Memory (Lật thẻ) has no right/wrong count, so its score is built from how few flips and how
// little time it took: 70% efficiency (pairs ÷ flips; one flip per pair = perfect) + 30% speed
// (full marks within 6s per pair, fading to zero at 3× that). A clean, quick game scores ~100%;
// ~2 wrong flips and a steady pace still reaches 3★; random clicking lands on 1–2★.
export const MEMORY_PAR_SECONDS_PER_PAIR = 6
export function memoryScorePct(pairs: number, flips: number, seconds: number): number {
  if (!(pairs > 0)) return 0
  const efficiency = Math.min(1, pairs / Math.max(flips, pairs))
  const par = pairs * MEMORY_PAR_SECONDS_PER_PAIR
  const speed = Math.min(1, Math.max(0, 1 - (seconds - par) / (2 * par)))
  return Math.round(100 * (0.7 * efficiency + 0.3 * speed))
}
