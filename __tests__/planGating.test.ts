import { describe, it, expect } from 'vitest'
import {
  getPlanTier,
  canAccessPhonicsLesson,
  canAccessWordStress,
  canAccessMyWords,
  canAccessSRS,
  canAccessKidsFull,
  canAccessAcademicFull,
  getMyWordsLimit,
  getSRSLimit,
  getAISpeakLimit,
  getIeltsSpeakingLimit,
  type FamilyPlanData,
} from '@/lib/planUtils'

function daysFromNow(n: number) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString()
}

// Plan fixtures with ACTIVE dates so getEffectivePlan considers Pro active.
const freeExpired: FamilyPlanData = { plan: 'free', free_trial_expires_at: daysFromNow(-1) }
const freeTrial: FamilyPlanData = { plan: 'free', free_trial_expires_at: daysFromNow(3) }
const pro1: FamilyPlanData = { plan: '1month', plan_end_date: daysFromNow(20) }
const pro3: FamilyPlanData = { plan: '3months', plan_end_date: daysFromNow(60) }
const pro6: FamilyPlanData = { plan: '6months', plan_end_date: daysFromNow(120) }
const proExpired: FamilyPlanData = { plan: '3months', plan_end_date: daysFromNow(-5) }

describe('getPlanTier', () => {
  it('free (expired trial) → free', () => {
    expect(getPlanTier(freeExpired)).toBe('free')
  })

  it('free with active trial → still free tier (trial ≠ Pro tier)', () => {
    expect(getPlanTier(freeTrial)).toBe('free')
  })

  it('active 1month → pro1', () => {
    expect(getPlanTier(pro1)).toBe('pro1')
  })

  it('active 3months → pro3', () => {
    expect(getPlanTier(pro3)).toBe('pro3')
  })

  it('active 6months → pro6', () => {
    expect(getPlanTier(pro6)).toBe('pro6')
  })

  it('expired paid plan → falls back to free', () => {
    expect(getPlanTier(proExpired)).toBe('free')
  })

  it('paid plan value but no end date → free (not active)', () => {
    expect(getPlanTier({ plan: '6months' })).toBe('free')
  })

  it('bonus Pro active but base free → pro1 (bonus does not raise tier)', () => {
    const fam: FamilyPlanData = {
      plan: 'free',
      free_trial_expires_at: daysFromNow(-1),
      bonus_pro_expires_at: daysFromNow(7),
    }
    expect(getPlanTier(fam)).toBe('pro1')
  })
})

describe('canAccessPhonicsLesson', () => {
  it('active trial: only first lesson of first level (vowels-short, idx 0)', () => {
    expect(canAccessPhonicsLesson(freeTrial, 'vowels-short', 0)).toBe(true)
  })

  it('active trial: lessonIdx 1 of first level → false', () => {
    expect(canAccessPhonicsLesson(freeTrial, 'vowels-short', 1)).toBe(false)
  })

  it('free user with active trial is still gated to that one lesson (trial ≠ Pro)', () => {
    expect(canAccessPhonicsLesson(freeTrial, 'vowels-long', 2)).toBe(false)
  })

  it('expired trial, never upgraded: locked out entirely, even the trial lesson', () => {
    expect(canAccessPhonicsLesson(freeExpired, 'vowels-short', 0)).toBe(false)
  })

  it('expired trial: lessonIdx 1 of first level → false', () => {
    expect(canAccessPhonicsLesson(freeExpired, 'vowels-short', 1)).toBe(false)
  })

  it('expired trial: idx 0 of a non-first level → false', () => {
    expect(canAccessPhonicsLesson(freeExpired, 'vowels-long', 0)).toBe(false)
  })

  it('Pro user: any level / any lesson → true', () => {
    expect(canAccessPhonicsLesson(pro1, 'consonants', 5)).toBe(true)
    expect(canAccessPhonicsLesson(pro3, 'diphthongs', 3)).toBe(true)
    expect(canAccessPhonicsLesson(pro6, 'vowels-long', 9)).toBe(true)
  })

  it('bonus grant phonics_full unlocks all for a free user', () => {
    const fam: FamilyPlanData = {
      plan: 'free',
      free_trial_expires_at: daysFromNow(-1),
      bonus_features: ['phonics_full'],
    }
    expect(canAccessPhonicsLesson(fam, 'consonants', 4)).toBe(true)
  })
})

describe('canAccessWordStress', () => {
  it('free → false', () => {
    expect(canAccessWordStress(freeExpired)).toBe(false)
  })

  it('pro1 → false', () => {
    expect(canAccessWordStress(pro1)).toBe(false)
  })

  it('pro3 → true', () => {
    expect(canAccessWordStress(pro3)).toBe(true)
  })

  it('pro6 → true', () => {
    expect(canAccessWordStress(pro6)).toBe(true)
  })

  it('bonus grant word_stress unlocks for free user', () => {
    const fam: FamilyPlanData = {
      plan: 'free',
      free_trial_expires_at: daysFromNow(-1),
      bonus_features: ['word_stress'],
    }
    expect(canAccessWordStress(fam)).toBe(true)
  })
})

describe('canAccessMyWords / canAccessSRS', () => {
  // These features are available to everyone; the gating is via limits.
  it('My Words accessible for all plans', () => {
    for (const fam of [freeExpired, pro1, pro3, pro6]) {
      expect(canAccessMyWords(fam)).toBe(true)
    }
  })

  it('SRS accessible for all plans', () => {
    for (const fam of [freeExpired, pro1, pro3, pro6]) {
      expect(canAccessSRS(fam)).toBe(true)
    }
  })
})

describe('getMyWordsLimit', () => {
  it('free → 20 cap', () => {
    expect(getMyWordsLimit(freeExpired)).toBe(20)
  })

  it('pro1 / pro3 / pro6 → null (unlimited)', () => {
    expect(getMyWordsLimit(pro1)).toBeNull()
    expect(getMyWordsLimit(pro3)).toBeNull()
    expect(getMyWordsLimit(pro6)).toBeNull()
  })

  it('bonus grant my_words → unlimited for free user', () => {
    const fam: FamilyPlanData = {
      plan: 'free',
      free_trial_expires_at: daysFromNow(-1),
      bonus_features: ['my_words'],
    }
    expect(getMyWordsLimit(fam)).toBeNull()
  })
})

describe('getSRSLimit', () => {
  it('free → 20 cap', () => {
    expect(getSRSLimit(freeExpired)).toBe(20)
  })

  it('pro1 / pro3 / pro6 → null (unlimited)', () => {
    expect(getSRSLimit(pro1)).toBeNull()
    expect(getSRSLimit(pro3)).toBeNull()
    expect(getSRSLimit(pro6)).toBeNull()
  })

  it('bonus grant srs → unlimited for free user', () => {
    const fam: FamilyPlanData = {
      plan: 'free',
      free_trial_expires_at: daysFromNow(-1),
      bonus_features: ['srs'],
    }
    expect(getSRSLimit(fam)).toBeNull()
  })
})

describe('getAISpeakLimit', () => {
  it('expired trial, never upgraded → 0 (locked)', () => {
    expect(getAISpeakLimit(freeExpired)).toBe(0)
  })

  it('active trial → 10/day', () => {
    expect(getAISpeakLimit(freeTrial)).toBe(10)
  })

  it('pro1 → 40/day', () => {
    expect(getAISpeakLimit(pro1)).toBe(40)
  })

  it('pro3 → null (unlimited)', () => {
    expect(getAISpeakLimit(pro3)).toBeNull()
  })

  it('pro6 → null (unlimited)', () => {
    expect(getAISpeakLimit(pro6)).toBeNull()
  })

  it('bonus grant ai_speak_unlimited → unlimited for free user', () => {
    const fam: FamilyPlanData = {
      plan: 'free',
      free_trial_expires_at: daysFromNow(-1),
      bonus_features: ['ai_speak_unlimited'],
    }
    expect(getAISpeakLimit(fam)).toBeNull()
  })
})

describe('getIeltsSpeakingLimit (AI Speak tab / IELTS Speaking Coach)', () => {
  it('expired trial, never upgraded → 0 (locked)', () => {
    expect(getIeltsSpeakingLimit(freeExpired)).toBe(0)
  })

  it('active trial → 5/day', () => {
    expect(getIeltsSpeakingLimit(freeTrial)).toBe(5)
  })

  it('pro1 → null (unlimited)', () => {
    expect(getIeltsSpeakingLimit(pro1)).toBeNull()
  })

  it('pro3 → null (unlimited)', () => {
    expect(getIeltsSpeakingLimit(pro3)).toBeNull()
  })

  it('pro6 → null (unlimited)', () => {
    expect(getIeltsSpeakingLimit(pro6)).toBeNull()
  })

  it('expired Pro (past plan_end_date) → 0, same as free', () => {
    expect(getIeltsSpeakingLimit(proExpired)).toBe(0)
  })

  it('bonus grant ielts_speaking_unlimited → unlimited for free user', () => {
    const fam: FamilyPlanData = {
      plan: 'free',
      free_trial_expires_at: daysFromNow(-1),
      bonus_features: ['ielts_speaking_unlimited'],
    }
    expect(getIeltsSpeakingLimit(fam)).toBeNull()
  })
})

describe('Kids / Academic full content gating', () => {
  it('free → no full access', () => {
    expect(canAccessKidsFull(freeExpired)).toBe(false)
    expect(canAccessAcademicFull(freeExpired)).toBe(false)
  })

  it('any Pro → full access', () => {
    for (const fam of [pro1, pro3, pro6]) {
      expect(canAccessKidsFull(fam)).toBe(true)
      expect(canAccessAcademicFull(fam)).toBe(true)
    }
  })

  it('bonus grants unlock content for a free user', () => {
    const kids: FamilyPlanData = {
      plan: 'free',
      free_trial_expires_at: daysFromNow(-1),
      bonus_features: ['kids_full'],
    }
    const academic: FamilyPlanData = {
      plan: 'free',
      free_trial_expires_at: daysFromNow(-1),
      bonus_features: ['academic_full'],
    }
    expect(canAccessKidsFull(kids)).toBe(true)
    expect(canAccessAcademicFull(academic)).toBe(true)
  })
})
