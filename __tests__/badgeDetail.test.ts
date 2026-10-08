import { describe, it, expect } from 'vitest'
import { ALL_BADGES, badgeExplain, badgeProgress, computeEarnedBadges, type SyncSummary } from '@/lib/badges'

const summary: SyncSummary = { seenCount: 60, bestStreak: 4, masteredTopics: 2, xp: 120, hasPerfect: false }

describe('badge detail helpers', () => {
  it('every badge has an explanation', () => {
    for (const b of ALL_BADGES) expect(badgeExplain(b.id), b.id).not.toBe('')
  })

  it('progress caps at the target and reads the right stat', () => {
    expect(badgeProgress('words_50', summary)).toEqual({ current: 50, target: 50, unit: 'từ' })
    expect(badgeProgress('streak_7', summary)).toEqual({ current: 4, target: 7, unit: 'ngày' })
    expect(badgeProgress('phonics_5', summary, 2)).toEqual({ current: 2, target: 5, unit: 'nhóm âm' })
    expect(badgeProgress('perfect', summary)).toBeNull()
  })

  it('a badge is earned exactly when its progress is full', () => {
    const earned = new Set(computeEarnedBadges(summary, 2).map(b => b.id))
    for (const b of ALL_BADGES) {
      const p = badgeProgress(b.id, summary, 2)
      if (p) expect(earned.has(b.id), b.id).toBe(p.current >= p.target)
    }
  })
})
