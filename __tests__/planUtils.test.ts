import { describe, it, expect } from 'vitest'
import { getEffectivePlan, addBonusDays } from '@/lib/planUtils'

function daysFromNow(n: number) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString()
}

describe('getEffectivePlan', () => {
  it('free user with active trial → isTrialActive, not isProActive', () => {
    const result = getEffectivePlan({
      plan: 'free',
      free_trial_expires_at: daysFromNow(3),
    })
    expect(result.isTrialActive).toBe(true)
    expect(result.isProActive).toBe(false)
    expect(result.effectiveEndDate).toBeNull()
  })

  it('free user with expired trial → neither active', () => {
    const result = getEffectivePlan({
      plan: 'free',
      free_trial_expires_at: daysFromNow(-1),
    })
    expect(result.isTrialActive).toBe(false)
    expect(result.isProActive).toBe(false)
  })

  it('paid plan with future end date → isProActive', () => {
    const result = getEffectivePlan({
      plan: '1month',
      plan_end_date: daysFromNow(20),
    })
    expect(result.isProActive).toBe(true)
    expect(result.isTrialActive).toBe(false)
    expect(result.effectiveEndDate).toBeTruthy()
  })

  it('paid plan expired → not isProActive', () => {
    const result = getEffectivePlan({
      plan: '1month',
      plan_end_date: daysFromNow(-5),
    })
    expect(result.isProActive).toBe(false)
  })

  it('bonus Pro active → isProActive even if base plan free', () => {
    const result = getEffectivePlan({
      plan: 'free',
      free_trial_expires_at: daysFromNow(-1),
      bonus_pro_expires_at: daysFromNow(7),
    })
    expect(result.isProActive).toBe(true)
    expect(result.isTrialActive).toBe(false)
  })

  it('both paid + bonus active → effectiveEndDate is the later one', () => {
    const paidEnd = daysFromNow(10)
    const bonusEnd = daysFromNow(20)
    const result = getEffectivePlan({
      plan: '6months',
      plan_end_date: paidEnd,
      bonus_pro_expires_at: bonusEnd,
    })
    expect(result.isProActive).toBe(true)
    expect(result.effectiveEndDate).toBe(bonusEnd)
  })

  it('both paid + bonus active, paid later → effectiveEndDate is paid', () => {
    const paidEnd = daysFromNow(30)
    const bonusEnd = daysFromNow(7)
    const result = getEffectivePlan({
      plan: '6months',
      plan_end_date: paidEnd,
      bonus_pro_expires_at: bonusEnd,
    })
    expect(result.effectiveEndDate).toBe(paidEnd)
  })
})

describe('addBonusDays', () => {
  it('no existing bonus → adds from now', () => {
    const result = addBonusDays(null, 14)
    const expected = new Date()
    expected.setDate(expected.getDate() + 14)
    const diff = Math.abs(new Date(result).getTime() - expected.getTime())
    expect(diff).toBeLessThan(5000)
  })

  it('existing future bonus → stacks from that date', () => {
    const existingExpiry = daysFromNow(10)
    const result = addBonusDays(existingExpiry, 7)
    const expected = new Date(existingExpiry)
    expected.setDate(expected.getDate() + 7)
    const diff = Math.abs(new Date(result).getTime() - expected.getTime())
    expect(diff).toBeLessThan(5000)
  })

  it('expired bonus → adds from now, not from past', () => {
    const expiredBonus = daysFromNow(-5)
    const result = addBonusDays(expiredBonus, 14)
    const expected = new Date()
    expected.setDate(expected.getDate() + 14)
    const diff = Math.abs(new Date(result).getTime() - expected.getTime())
    expect(diff).toBeLessThan(5000)
  })
})
