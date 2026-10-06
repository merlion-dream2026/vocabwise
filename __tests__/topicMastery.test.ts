import { describe, it, expect } from 'vitest'
import {
  starsFor, gameStars, gamePct, isTopicMastered, topicSteps, masteryByRound, nextStep, bonusGames, memoryScorePct,
  type MasteryEntry, type GameDef,
} from '@/lib/topicMastery'

const at = '2026-10-06T00:00:00Z'
const r = (p: number) => ({ best: p, last: p, at })
const E = (x: Partial<MasteryEntry> = {}): MasteryEntry => ({ flashcard: false, games: [], ...x })
const g = (key: string): GameDef => ({ key, label: key, emoji: '🎮' })
const EXPLORER_GAMES = ['flashcard', 'listen', 'truefalse', 'quiz', 'gapfill', 'definitionmatch', 'speak', 'typing', 'sentenceorder', 'speedround', 'sentence'].map(g)
const STARTER_GAMES = ['flashcard', 'listen', 'truefalse', 'match', 'memory', 'bubble', 'fillletter', 'speak', 'spell', 'sentenceorder'].map(g)

describe('starsFor', () => {
  it('maps 0 / ≤50 / ≤80 / >80 to 0–3 stars', () => {
    expect([0, 1, 50, 51, 80, 81, 100].map(starsFor)).toEqual([0, 1, 1, 2, 2, 3, 3])
  })
})

describe('isTopicMastered (explorer)', () => {
  const full = E({ flashcard: true, modes: { truefalse: r(100), quiz: r(90), gapfill: r(100), speak: r(100), sentenceorder: r(95) } })
  it('needs flashcard + 3/4 round-1 + 2/3 round-2 at 3 stars', () => {
    expect(isTopicMastered(full, 'explorer')).toBe(true)
    expect(isTopicMastered({ ...full, flashcard: false }, 'explorer')).toBe(false)
    expect(isTopicMastered(E({ flashcard: true, modes: { truefalse: r(100), quiz: r(100), gapfill: r(100) } }), 'explorer')).toBe(false) // no round 2
    expect(isTopicMastered(E({ flashcard: true, modes: { truefalse: r(100), quiz: r(100), speak: r(100), sentenceorder: r(100) } }), 'explorer')).toBe(false) // only 2/4 round 1
  })
  it('uses the latest attempt, so a weaker replay loses the trophy', () => {
    const slipped = { ...full, modes: { ...full.modes, speak: { best: 100, last: 60, at } } }
    expect(isTopicMastered(slipped, 'explorer')).toBe(false)
    expect(gameStars(slipped, 'speak')).toBe(2)
  })
  it('does not count games from the other round or bonus games', () => {
    // listen / typing / sentence are bonus for explorer
    expect(isTopicMastered(E({ flashcard: true, modes: { truefalse: r(100), quiz: r(100), listen: r(100), typing: r(100), sentence: r(100), speak: r(100) } }), 'explorer')).toBe(false)
  })
})

describe('isTopicMastered (starter)', () => {
  it('uses the starter games', () => {
    const e = E({ flashcard: true, modes: { truefalse: r(100), listen: r(100), match: r(100), speak: r(100), spell: r(100) } })
    expect(isTopicMastered(e, 'starter')).toBe(true)
    expect(isTopicMastered(e, 'explorer')).toBe(false)
    expect(isTopicMastered(e)).toBe(true) // no level: judged by whichever group's games were played
  })
})

describe('old-rule data keeps working', () => {
  it('keeps the trophy for topics done under the old rule until replayed, then permanently', () => {
    const old = E({ flashcard: true, games: ['listen', 'truefalse', 'bubble'] })
    expect(isTopicMastered(old, 'starter')).toBe(true)
    expect(isTopicMastered({ ...old, modes: { listen: r(50) }, legacyDone: true }, 'starter')).toBe(true)
  })
  it('counts perfect-only games as 3 stars until they are replayed', () => {
    expect(gameStars(E({ games: ['quiz'] }), 'quiz')).toBe(3)
    expect(gamePct(E({ games: ['quiz'] }), 'quiz')).toBe(100)
    expect(gamePct(E(), 'quiz')).toBeUndefined()
  })
})

describe('topicSteps / masteryByRound', () => {
  it('counts toward 6 steps and caps each round', () => {
    expect(topicSteps(E(), 'explorer')).toEqual({ done: 0, total: 6 })
    const e = E({ flashcard: true, modes: { truefalse: r(100), quiz: r(100), gapfill: r(100), definitionmatch: r(100) } })
    expect(topicSteps(e, 'explorer')).toEqual({ done: 4, total: 6 })
    const [r1, r2] = masteryByRound(e, 'explorer')
    expect([r1.ringDone, r1.ringTotal, r2.ringDone, r2.ringTotal]).toEqual([4, 4, 1, 3])
    expect(r1.note).toContain('3/4')
    expect(r2.note).toContain('2/3')
  })
})

describe('nextStep', () => {
  it('goes flashcard → closest-to-3-star game → round 2 → done', () => {
    expect(nextStep(E(), EXPLORER_GAMES, 'explorer').kind).toBe('flashcard')
    const first = nextStep(E({ flashcard: true }), EXPLORER_GAMES, 'explorer')
    expect(first.kind === 'game' && first.game.key).toBe('truefalse')
    const closest = nextStep(E({ flashcard: true, modes: { truefalse: r(40), quiz: r(70) } }), EXPLORER_GAMES, 'explorer')
    expect(closest.kind === 'game' && closest.game.key).toBe('quiz')
    const r2 = nextStep(E({ flashcard: true, modes: { truefalse: r(100), quiz: r(100), gapfill: r(100) } }), EXPLORER_GAMES, 'explorer')
    expect(r2.kind === 'game' && r2.round).toBe(2)
    const done = E({ flashcard: true, modes: { truefalse: r(100), quiz: r(100), gapfill: r(100), speak: r(100), speedround: r(100) } })
    expect(nextStep(done, EXPLORER_GAMES, 'explorer').kind).toBe('done')
  })
})

describe('bonusGames', () => {
  it('lists the level games outside both rounds', () => {
    expect(bonusGames(EXPLORER_GAMES, 'explorer').map((x) => x.key)).toEqual(['listen', 'typing', 'sentence'])
    expect(bonusGames(STARTER_GAMES, 'starter').map((x) => x.key)).toEqual(['memory', 'bubble'])
  })
})

describe('memoryScorePct', () => {
  it('rewards few flips and a quick finish', () => {
    expect(memoryScorePct(6, 6, 30)).toBe(100)       // flawless and fast
    expect(starsFor(memoryScorePct(6, 8, 40))).toBe(3) // 2 wrong flips, steady pace
    expect(starsFor(memoryScorePct(6, 8, 60))).toBe(2) // same flips but slow
    expect(starsFor(memoryScorePct(6, 12, 36))).toBe(2)
    expect(starsFor(memoryScorePct(6, 15, 120))).toBe(1)
    expect(memoryScorePct(0, 0, 0)).toBe(0)
  })
  it('never exceeds 100 or drops below 0', () => {
    expect(memoryScorePct(6, 2, 1)).toBe(100)
    expect(memoryScorePct(6, 500, 9999)).toBeGreaterThanOrEqual(0)
  })
})
