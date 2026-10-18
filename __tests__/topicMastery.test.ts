import { describe, it, expect } from 'vitest'
import {
  starsFor, gameStars, gamePct, isTopicMastered, topicSteps, masteryByRound, nextStep, arcadeGames, memoryScorePct,
  type MasteryEntry, type GameDef,
} from '@/lib/topicMastery'

const at = '2026-10-06T00:00:00Z'
const r = (p: number) => ({ best: p, last: p, at })
const E = (x: Partial<MasteryEntry> = {}): MasteryEntry => ({ flashcard: false, games: [], ...x })
const g = (key: string): GameDef => ({ key, label: key, emoji: '🎮' })
const ARCADE = ['rocket', 'whack', 'fishing', 'plane', 'frog', 'race', 'train', 'treasure', 'basket', 'jump', 'penalty']
const EXPLORER_GAMES = ['flashcard', 'listen', 'truefalse', 'quiz', 'gapfill', 'definitionmatch', 'speak', 'typing', 'sentenceorder', 'speedround', 'sentence', ...ARCADE].map(g)
const STARTER_GAMES = ['flashcard', 'listen', 'truefalse', 'match', 'memory', 'bubble', 'fillletter', 'speak', 'spell', 'sentenceorder', ...ARCADE].map(g)

describe('starsFor', () => {
  it('maps 0 / ≤50 / ≤80 / >80 to 0–3 stars', () => {
    expect([0, 1, 50, 51, 80, 81, 100].map(starsFor)).toEqual([0, 1, 1, 2, 2, 3, 3])
  })
})

describe('isTopicMastered (explorer)', () => {
  const full = E({ flashcard: true, modes: { truefalse: r(100), quiz: r(90), gapfill: r(100), speak: r(100), sentenceorder: r(95), speedround: r(100) } })
  it('counts all 11 arcade games: whack/fishing/frog/basket/penalty in round 1, the other 6 in round 2', () => {
    const m = { truefalse: r(100), frog: r(90), basket: r(85), speak: r(100), train: r(95), jump: r(85) }
    expect(isTopicMastered(E({ flashcard: true, modes: m }), 'starter')).toBe(true)
    expect(isTopicMastered(E({ flashcard: true, modes: m }), 'explorer')).toBe(true)
    // a round-2 arcade game doesn't fill round 1
    expect(isTopicMastered(E({ flashcard: true, modes: { ...m, frog: r(10), race: r(100) } }), 'starter')).toBe(false)
  })

  it('needs at least 1 core game per round — arcade alone never passes one', () => {
    const arcadeOnly = { whack: r(90), fishing: r(90), frog: r(90), rocket: r(90), plane: r(90), race: r(90) }
    const e = E({ flashcard: true, modes: arcadeOnly })
    expect(isTopicMastered(e, 'starter')).toBe(false)
    const [r1, r2] = masteryByRound(e, 'starter')
    expect([r1.ringDone, r2.ringDone]).toEqual([3, 3])              // stops one short of 4/4
    expect(isTopicMastered(E({ flashcard: true, modes: { ...arcadeOnly, listen: r(100), spell: r(100) } }), 'starter')).toBe(true)
    // the pre-2026-10 rule allowed at most 2 arcade games per round, so nothing mastered then is lost
    expect(isTopicMastered(E({ flashcard: true, modes: { truefalse: r(100), whack: r(90), fishing: r(90), speak: r(100), rocket: r(90), plane: r(90) } }), 'starter')).toBe(true)
  })

  it('lets Seeker pass round 1 with 2 games (3★ bar unchanged); other levels need 3', () => {
    const two = E({ flashcard: true, modes: { truefalse: r(100), listen: r(90), speak: r(100), spell: r(100), sentenceorder: r(100) } })
    expect(isTopicMastered(two, 'seeker')).toBe(true)
    expect(isTopicMastered(two, 'starter')).toBe(false)
    expect(isTopicMastered(E({ flashcard: true, modes: { truefalse: r(100), listen: r(70), speak: r(100), spell: r(100), sentenceorder: r(100) } }), 'seeker')).toBe(false) // 2★ doesn't count
    expect(topicSteps(E(), 'seeker')).toEqual({ done: 0, total: 6 })
    expect(masteryByRound(two, 'seeker')[0].note).toContain('⭐⭐⭐ ở 2 trò')
  })

  it('needs flashcard + 3 round-1 + 3 round-2 games at 3 stars', () => {
    expect(isTopicMastered(E({ flashcard: true, modes: { truefalse: r(100), quiz: r(100), gapfill: r(100), speak: r(100), sentenceorder: r(100) } }), 'explorer')).toBe(false) // only 2 in round 2
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
  it('counts the former bonus games: listen in round 1, typing + sentence in round 2', () => {
    expect(isTopicMastered(E({ flashcard: true, modes: { truefalse: r(100), quiz: r(100), listen: r(100), typing: r(100), sentence: r(100), speak: r(100) } }), 'explorer')).toBe(true)
    // ...but not in the other round
    expect(isTopicMastered(E({ flashcard: true, modes: { truefalse: r(100), quiz: r(100), typing: r(100), sentence: r(100), speak: r(100), gapfill: r(100) } }), 'explorer')).toBe(true)
    expect(isTopicMastered(E({ flashcard: true, modes: { truefalse: r(100), typing: r(100), sentence: r(100), speak: r(100), speedround: r(100) } }), 'explorer')).toBe(false)
  })
})

describe('isTopicMastered (starter)', () => {
  it('uses the starter games', () => {
    const e = E({ flashcard: true, modes: { truefalse: r(100), listen: r(100), match: r(100), speak: r(100), spell: r(100), sentenceorder: r(100) } })
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
  it('counts toward 7 steps and caps each round', () => {
    expect(topicSteps(E(), 'explorer')).toEqual({ done: 0, total: 7 })
    const e = E({ flashcard: true, modes: { truefalse: r(100), quiz: r(100), gapfill: r(100), definitionmatch: r(100) } })
    expect(topicSteps(e, 'explorer')).toEqual({ done: 4, total: 7 })
    const [r1, r2] = masteryByRound(e, 'explorer')
    expect([r1.ringDone, r1.ringTotal, r2.ringDone, r2.ringTotal]).toEqual([4, 4, 1, 4])
    expect(r1.note).toContain('⭐⭐⭐ ở 3 trò')
    expect(r2.note).toContain('Khu vui chơi')
  })
})

describe('nextStep', () => {
  it('goes flashcard → closest-to-3-star game → round 2 → done', () => {
    expect(nextStep(E(), EXPLORER_GAMES, 'explorer').kind).toBe('flashcard')
    const first = nextStep(E({ flashcard: true }), EXPLORER_GAMES, 'explorer')
    expect(first.kind === 'game' && first.game.key).toBe('listen') // easiest round-1 game, first in the list
    const closest = nextStep(E({ flashcard: true, modes: { truefalse: r(40), quiz: r(70) } }), EXPLORER_GAMES, 'explorer')
    expect(closest.kind === 'game' && closest.game.key).toBe('quiz')
    const r2 = nextStep(E({ flashcard: true, modes: { truefalse: r(100), quiz: r(100), gapfill: r(100) } }), EXPLORER_GAMES, 'explorer')
    expect(r2.kind === 'game' && r2.round).toBe(2)
    const done = E({ flashcard: true, modes: { truefalse: r(100), quiz: r(100), gapfill: r(100), speak: r(100), speedround: r(100), sentenceorder: r(100) } })
    expect(nextStep(done, EXPLORER_GAMES, 'explorer').kind).toBe('done')
  })
  it('never suggests an arcade game, even the one closest to 3 stars', () => {
    const s = nextStep(E({ flashcard: true, modes: { whack: r(80), truefalse: r(10) } }), STARTER_GAMES, 'starter')
    expect(s.kind === 'game' && s.game.key).toBe('truefalse')
  })
})

describe('arcadeGames', () => {
  it('lists all 11 arcade games tagged with their round', () => {
    const tags = Object.fromEntries(arcadeGames(STARTER_GAMES, 'starter').map((x) => [x.key, x.round]))
    expect(tags).toEqual({ rocket: 2, whack: 1, fishing: 1, plane: 2, frog: 1, race: 2, train: 2, treasure: 2, basket: 1, jump: 2, penalty: 1 })
    expect(arcadeGames(EXPLORER_GAMES, 'explorer')).toHaveLength(11)
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
