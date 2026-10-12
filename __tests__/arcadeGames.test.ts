import { describe, it, expect } from 'vitest'
import {
  distractors, buildRocketQuestions, rocketScorePct, buildWhackQuestions, nextWhackWord, whackScorePct,
  ROCKET_PARTS, WHACK_QUESTIONS, type ArcadeWord,
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
