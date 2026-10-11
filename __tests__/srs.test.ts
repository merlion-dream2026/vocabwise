import { describe, it, expect } from 'vitest'
import { applySrsAnswer as applyAnswer, type SrsEntry } from '@/lib/GameSyncContext'
import { vnDate } from '@/lib/srsSchedule'

// Imports the real SM-2-style step from lib/GameSyncContext.tsx (recordSrsAnswer
// delegates to it) instead of a hand-copied reimplementation, so this suite can't
// silently drift from the production algorithm.

const today = vnDate()
const tomorrow = vnDate(1)

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

describe('vnDate (SRS calendar day, Vietnam time)', () => {
  it('is UTC+7: 18:00 UTC is already the next day in Vietnam', () => {
    const realNow = Date.now
    Date.now = () => Date.parse('2026-10-11T18:00:00Z')
    try {
      expect(vnDate()).toBe('2026-10-12')
      expect(vnDate(1)).toBe('2026-10-13')
    } finally { Date.now = realNow }
  })

  it('a correct answer schedules `interval` VN days ahead', () => {
    const result = applyAnswer({ interval: 3, due: today, ef: 2.5 }, true, today)
    expect(result.due).toBe(vnDate(result.interval))
  })
})
