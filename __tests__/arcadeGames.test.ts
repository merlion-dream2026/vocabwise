import { describe, it, expect } from 'vitest'
import {
  distractors, buildRocketQuestions, rocketScorePct, buildWhackQuestions, nextWhackWord, whackScorePct,
  buildFishQuestions, fishScorePct, buildPlaneQuestions, planeScorePct, heartScorePct, buildFrogQuestions, retryFrogQuestion, frogSeconds, FROG_SECONDS, questionCount, frogScorePct, buildRaceQuestions, raceScorePct, RACE_QUESTIONS, buildTrainQuestions, trainLetters, trainScorePct, TRAIN_QUESTIONS, buildTreasureQuestions, treasureGap, TREASURE_QUESTIONS, basketScorePct, freeLane, speechMatches, editDistance, jumpScorePct, buildJumpQuestions, JUMP_QUESTIONS,
  ROCKET_PARTS, WHACK_QUESTIONS, FISH_QUESTIONS, PLANE_QUESTIONS, PLANE_LANES, FROG_QUESTIONS, FROG_PADS, type ArcadeWord,
} from '@/lib/arcadeGames'
import { starsFor } from '@/lib/topicMastery'

const W = (word: string, meaning = `nghĩa ${word}`): ArcadeWord => ({ word, meaning, emoji: '🔤' })
const words = (n: number) => Array.from({ length: n }, (_, i) => W(`w${i}`))

describe('distractors', () => {
  it('never offers the target or a word sharing its meaning, nor two words with one meaning', () => {
    const list = [W('big', 'to'), W('large', 'to'), W('small', 'nhỏ'), W('tiny', 'nhỏ'), W('red', 'đỏ')]
    for (let i = 0; i < 20; i++) {
      const d = distractors(list, list[0], 3)
      expect(d.map((x) => x.meaning).sort()).toEqual(['nhỏ', 'đỏ'])
    }
  })
})

describe('buildRocketQuestions', () => {
  it('asks 10 different words with 4 choices including the answer, mixing the 3 kinds', () => {
    const qs = buildRocketQuestions(words(15))
    expect(qs).toHaveLength(ROCKET_PARTS)
    expect(new Set(qs.map((q) => q.target.word)).size).toBe(ROCKET_PARTS)
    for (const q of qs) {
      expect(q.choices).toHaveLength(4)
      expect(q.choices.filter((c) => c.word === q.target.word)).toHaveLength(1)
    }
    expect(new Set(qs.map((q) => q.kind))).toEqual(new Set(['vi', 'listen', 'en']))
  })
})

describe('rocketScorePct', () => {
  it('gives 3★ for a clean launch with fuel left, fewer for many slips, ≤1★ when fuel runs out', () => {
    expect(rocketScorePct(10, 0, 60, 120)).toBe(100)
    expect(starsFor(rocketScorePct(10, 3, 40, 120))).toBe(3)
    expect(starsFor(rocketScorePct(10, 5, 40, 120))).toBe(2)
    expect(starsFor(rocketScorePct(7, 2, 0, 120))).toBe(1)
    expect(rocketScorePct(0, 4, 0, 120)).toBe(0)
  })
})

describe('whack', () => {
  it('builds 8 questions of 4 words each (answer + 3 decoys that exclude it)', () => {
    const qs = buildWhackQuestions(words(12))
    expect(qs).toHaveLength(WHACK_QUESTIONS)
    expect(WHACK_QUESTIONS).toBe(8)
    for (const q of qs) {
      expect(q.decoys).toHaveLength(3)
      expect(q.decoys.some((d) => d.word === q.target.word)).toBe(false)
    }
  })

  it('shows the target by the 3rd pop and never twice at once', () => {
    const q = { target: W('cat'), decoys: [W('dog'), W('pig')] }
    for (let i = 0; i < 30; i++) {
      expect(nextWhackWord(q, 2, []).word).toBe('cat')
      expect(nextWhackWord(q, 5, ['cat']).word).not.toBe('cat')
    }
  })

  it('scores 12.5 per right answer minus 15 per heart lost', () => {
    expect(whackScorePct(8, 0)).toBe(100)
    expect(starsFor(whackScorePct(8, 1))).toBe(3)
    expect(starsFor(whackScorePct(8, 2))).toBe(2)
    expect(whackScorePct(1, 3)).toBe(0)
  })
})

describe('fishing', () => {
  it('asks 8 different words, 4 fish each with exactly one right one, alternating vi / listen', () => {
    const qs = buildFishQuestions(words(14))
    expect(qs).toHaveLength(FISH_QUESTIONS)
    expect(new Set(qs.map((q) => q.target.word)).size).toBe(FISH_QUESTIONS)
    for (const q of qs) {
      expect(q.choices).toHaveLength(4)
      expect(q.choices.filter((c) => c.word === q.target.word)).toHaveLength(1)
    }
    expect(qs.map((q) => q.kind).slice(0, 2)).toEqual(['vi', 'listen'])
  })
  it('scores like whack: 8/8 with one slip is 3★', () => {
    expect(fishScorePct(8, 0)).toBe(100)
    expect(starsFor(fishScorePct(8, 1))).toBe(3)
  })
})

describe('plane', () => {
  it('asks 10 words, 3 lanes each with exactly one right cloud', () => {
    const qs = buildPlaneQuestions(words(12))
    expect(qs).toHaveLength(PLANE_QUESTIONS)
    for (const q of qs) {
      expect(q.lanes).toHaveLength(PLANE_LANES)
      expect(q.lanes.filter((c) => c.word === q.target.word)).toHaveLength(1)
    }
  })
  it('caps at the number of words a topic has', () => {
    expect(buildPlaneQuestions(words(6))).toHaveLength(6)
  })
  it('scores 10 per cloud minus 15 per heart, never below 0', () => {
    expect(planeScorePct(10, 0)).toBe(100)
    expect(planeScorePct(10, 1)).toBe(85)
    expect(heartScorePct(1, 10, 3)).toBe(0)
    expect(heartScorePct(3, 0, 0)).toBe(0)
  })
})

describe('frog', () => {
  it('asks 10 words, 3 pads each with exactly one right pad, alternating word / meaning pads', () => {
    const qs = buildFrogQuestions(words(12))
    expect(qs).toHaveLength(FROG_QUESTIONS)
    for (const q of qs) {
      expect(q.pads).toHaveLength(FROG_PADS)
      expect(q.pads.filter((p) => p.word === q.target.word)).toHaveLength(1)
    }
    expect(qs.map((q) => q.kind).slice(0, 4)).toEqual(['word', 'meaning', 'word', 'meaning'])
  })
  it('caps at the number of words a topic has', () => {
    expect(buildFrogQuestions(words(5))).toHaveLength(5)
  })
  it('scores 10 per pad minus 15 per heart; one slip still earns 3 stars', () => {
    expect(frogScorePct(10, 0)).toBe(100)
    expect(starsFor(frogScorePct(10, 1))).toBe(3)
    expect(starsFor(frogScorePct(10, 2))).toBe(2)
  })
  it('a short topic scores against its real question count', () => {
    expect(questionCount(words(6), FROG_QUESTIONS)).toBe(6)
    expect(questionCount(words(12), FROG_QUESTIONS)).toBe(FROG_QUESTIONS)
    expect(frogScorePct(6, 0, 6)).toBe(100)
    expect(fishScorePct(5, 0, 5)).toBe(100)
  })
  it('gives fewer seconds per pad as the level goes up', () => {
    const order = ['seeker', 'starter', 'ranger', 'explorer', 'scholar', 'master']
    const secs = order.map(frogSeconds)
    expect(secs).toEqual([...secs].sort((a, b) => b - a))
    expect(Object.keys(FROG_SECONDS).sort()).toEqual([...order].sort())
    expect(frogSeconds('unknown')).toBeGreaterThan(0)
  })
  it('a retried question keeps its pads but moves the right one', () => {
    const [q] = buildFrogQuestions(words(12))
    const at = (x: typeof q) => x.pads.findIndex((p) => p.word === x.target.word)
    for (let k = 0; k < 30; k++) {
      const r = retryFrogQuestion(q)
      expect(r.pads.map((p) => p.word).sort()).toEqual(q.pads.map((p) => p.word).sort())
      expect(at(r)).not.toBe(at(q))
    }
  })
})

describe('race', () => {
  it('asks 10 four-choice questions with exactly one right answer', () => {
    const qs = buildRaceQuestions(words(12))
    expect(qs).toHaveLength(RACE_QUESTIONS)
    for (const q of qs) expect(q.choices.filter((c) => c.word === q.target.word)).toHaveLength(1)
  })
  it('scores like the rocket: a win with spare time is 3★, a lost race stays under 50%', () => {
    expect(raceScorePct(10, 0, 40, 95)).toBe(100)
    expect(starsFor(raceScorePct(10, 2, 30, 95))).toBe(3)
    expect(raceScorePct(7, 1, 0, 95)).toBeLessThan(50)
  })
})

describe('train', () => {
  it('loads only letters, in order', () => {
    expect(trainLetters('Living room')).toEqual('livingroom'.split(''))
    expect(trainLetters("T-shirt")).toEqual('tshirt'.split(''))
  })
  it('asks 8 words, crates = the letters + 1–2 spares, prefers words of 10 letters or fewer', () => {
    const list = [...['cat', 'dog', 'bird', 'fish', 'lion', 'frog', 'duck', 'goat', 'horse', 'zebra'].map((x) => W(x)), W('extraordinarily')]
    const qs = buildTrainQuestions(list)
    expect(qs).toHaveLength(TRAIN_QUESTIONS)
    expect(qs.some((q) => q.target.word === 'extraordinarily')).toBe(false)
    for (const q of qs) {
      const spare = q.crates.length - q.letters.length
      expect(spare === 1 || spare === 2).toBe(true)
      const left = q.crates.map((c) => c.letter)
      for (const l of q.letters) { expect(left).toContain(l); left.splice(left.indexOf(l), 1) } // every letter has its own crate
      expect(left.every((l) => !q.letters.includes(l))).toBe(true)
    }
  })
  it('still uses long words when a topic has too few short ones', () => {
    expect(buildTrainQuestions([W('aa'), W('extraordinarily')])).toHaveLength(2)
  })
  it('scores 1 per clean word, −0.2 per slip, floor 0.4', () => {
    expect(trainScorePct(Array(8).fill(0))).toBe(100)
    expect(starsFor(trainScorePct([1, 1, 0, 0, 0, 0, 0, 0]))).toBe(3)
    expect(trainScorePct([9])).toBe(5)
  })
})

describe('treasure', () => {
  it('hides a letter (never a space, not the first letter of a longer word), mostly a vowel', () => {
    for (let i = 0; i < 50; i++) {
      const g = treasureGap('living room')
      expect(g).toBeGreaterThan(0)
      expect('living room'[g]).toMatch(/[a-z]/)
    }
    expect(treasureGap('kitchen', () => 0)).toBe(1) // first vowel: i
  })
  it('asks 8 words; 4 stones with the answer once and decoys of the same kind', () => {
    const list = ['kitchen', 'garden', 'sister', 'brother', 'bedroom', 'baby', 'mum', 'dad', 'house'].map((x) => W(x))
    const qs = buildTreasureQuestions(list)
    expect(qs).toHaveLength(TREASURE_QUESTIONS)
    for (const q of qs) {
      expect(q.choices).toHaveLength(4)
      expect(q.choices.filter((c) => c === q.answer)).toHaveLength(1)
      expect(q.target.word[q.gap].toLowerCase()).toBe(q.answer)
      const vowel = 'aeiou'.includes(q.answer)
      for (const c of q.choices) expect('aeiou'.includes(c)).toBe(vowel)
    }
  })
  it('skips words too short to have a gap', () => {
    expect(buildTreasureQuestions([W('ox'), W('cat')])).toHaveLength(1)
  })
})

describe('basket', () => {
  it('re-drops an apple into a lane nobody near the top is using', () => {
    for (let i = 0; i < 30; i++) expect([1, 3]).toContain(freeLane(4, [0, 2]))
    expect(freeLane(2, [0, 1], () => 0.99)).toBe(1) // all busy → any lane
  })
  it('scores 12.5 per apple minus 15 per heart', () => {
    expect(basketScorePct(8, 0)).toBe(100)
    expect(starsFor(basketScorePct(8, 1))).toBe(3)
  })
})

describe('jump', () => {
  it('edit distance', () => {
    expect(editDistance('mum', 'mom')).toBe(1)
    expect(editDistance('kitchen', 'kitchen')).toBe(0)
    expect(editDistance('', 'abc')).toBe(3)
  })
  it('accepts the word inside a sentence, small mishearings and phrases', () => {
    expect(speechMatches(['I said kitchen'], 'kitchen')).toBe(true)
    expect(speechMatches(['mom'], 'mum')).toBe(true)
    expect(speechMatches(['kitchens'], 'kitchen')).toBe(true)
    expect(speechMatches(['the living room'], 'living room')).toBe(true)
    expect(speechMatches(['livingroom'], 'living room')).toBe(true)
    expect(speechMatches(['Dad!'], 'dad')).toBe(true)
  })
  it('rejects other words and silence', () => {
    expect(speechMatches(['garden'], 'kitchen')).toBe(false)
    expect(speechMatches(['bad'], 'baby')).toBe(false)
    expect(speechMatches([''], 'dad')).toBe(false)
    expect(speechMatches(['sister'], 'brother')).toBe(false)
    expect(speechMatches(['bad'], 'dad')).toBe(false)
  })
  it('checks every alternative the recogniser offers', () => {
    expect(speechMatches(['bad room', 'bedroom'], 'bedroom')).toBe(true)
  })
  it('scores by tries: 1 / 0.7 / 0.4 / skipped 0', () => {
    expect(jumpScorePct(Array(8).fill(1))).toBe(100)
    expect(starsFor(jumpScorePct([1, 1, 1, 1, 1, 1, 2, 2]))).toBe(3)
    expect(jumpScorePct([0, 0, 0, 0, 0, 0, 0, 0])).toBe(0)
    expect(buildJumpQuestions(words(12))).toHaveLength(JUMP_QUESTIONS)
  })
})

describe('penalty', () => {
  const words = Array.from({ length: 12 }, (_, i) => ({ word: `w${i}`, meaning: `m${i}`, emoji: '⚽' }))
  it('10 four-choice kicks (fewer on a short topic), answer always among the corners', async () => {
    const { buildPenaltyQuestions, PENALTY_KICKS } = await import('@/lib/arcadeGames')
    const qs = buildPenaltyQuestions(words)
    expect(qs).toHaveLength(PENALTY_KICKS)
    for (const q of qs) { expect(q.choices).toHaveLength(4); expect(q.choices.map((c) => c.word)).toContain(q.target.word) }
    expect(buildPenaltyQuestions(words.slice(0, 6))).toHaveLength(6)
  })
  it('score = goals / kicks; 9 of 10 is 3★, 8 of 10 is not', async () => {
    const { penaltyScorePct } = await import('@/lib/arcadeGames')
    expect(penaltyScorePct(10, 10)).toBe(100)
    expect(starsFor(penaltyScorePct(9, 10))).toBe(3)
    expect(starsFor(penaltyScorePct(8, 10))).toBe(2)
    expect(penaltyScorePct(0, 0)).toBe(0)
  })
  it('keeper dives to the shot on a save, elsewhere on a goal', async () => {
    const { keeperDive } = await import('@/lib/arcadeGames')
    expect(keeperDive('tl', true)).toBe('tl')
    for (let i = 0; i < 20; i++) expect(keeperDive('br', false)).not.toBe('br')
  })
})
