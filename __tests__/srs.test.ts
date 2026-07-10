import { describe, it, expect } from 'vitest'
import { applySrsAnswer as applyAnswer, type SrsEntry } from '@/lib/GameSyncContext'

// Imports the real SM-2-style step from lib/GameSyncContext.tsx (recordSrsAnswer
// delegates to it) instead of a hand-copied reimplementation, so this suite can't
// silently drift from the production algorithm.

const today = new Date().toISOString().split('T')[0]
const tomorrow = (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0] })()

describe('SRS algorithm', () => {
  it('first correct answer: interval grows, ef increases', () => {
    const result = applyAnswer(undefined, true, today)
    expect(result.interval).toBeGreaterThan(1)
    expect(result.ef).toBeGreaterThan(2.5)
    expect(result.due).not.toBe(today)
  })

  it('first wrong answer: interval resets to 1, due is tomorrow', () => {
    const result = applyAnswer(undefined, false, today)
    expect(result.interval).toBe(1)
    expect(result.due).toBe(tomorrow)
    expect(result.ef).toBeLessThan(2.5)
  })

  it('repeated correct: interval grows exponentially (capped at 60)', () => {
    let entry: SrsEntry | undefined
    for (let i = 0; i < 10; i++) {
      entry = applyAnswer(entry, true, today)
    }
    expect(entry!.interval).toBeLessThanOrEqual(60)
    expect(entry!.ef).toBeGreaterThan(2.5)
  })

  it('ef floor is 1.3 after wrong answers', () => {
    let entry: SrsEntry | undefined
    for (let i = 0; i < 20; i++) {
      entry = applyAnswer(entry, false, today)
    }
    expect(entry!.ef).toBe(1.3)
  })

  it('ef ceiling: keeps growing correctly but ef cap not enforced (by design)', () => {
    let entry: SrsEntry | undefined
    for (let i = 0; i < 5; i++) {
      entry = applyAnswer(entry, true, today)
    }
    expect(entry!.ef).toBeGreaterThan(2.5)
  })

  it('wrong answer after long streak: resets interval to 1', () => {
    let entry: SrsEntry | undefined
    for (let i = 0; i < 5; i++) {
      entry = applyAnswer(entry, true, today)
    }
    const afterWrong = applyAnswer(entry, false, today)
    expect(afterWrong.interval).toBe(1)
  })
})
