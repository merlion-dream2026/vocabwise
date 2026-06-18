import { describe, it, expect, beforeEach } from 'vitest'

// SRS algorithm extracted from lib/gameSync.ts for unit testing
// (gameSync uses module-level state + browser APIs — test the algorithm directly)

type SrsEntry = { interval: number; due: string; ef: number }

function applyAnswer(entry: SrsEntry | undefined, isCorrect: boolean, today: string): SrsEntry {
  const e = entry ?? { interval: 1, due: today, ef: 2.5 }
  if (isCorrect) {
    const newInterval = Math.min(Math.round(e.interval * e.ef), 60)
    const newEf = parseFloat(Math.max(1.3, e.ef + 0.1).toFixed(2))
    const due = new Date()
    due.setDate(due.getDate() + newInterval)
    return { interval: newInterval, due: due.toISOString().split('T')[0], ef: newEf }
  } else {
    const due = new Date()
    due.setDate(due.getDate() + 1)
    return { interval: 1, due: due.toISOString().split('T')[0], ef: parseFloat(Math.max(1.3, e.ef - 0.2).toFixed(2)) }
  }
}

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
