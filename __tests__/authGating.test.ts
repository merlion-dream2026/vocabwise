import { describe, it, expect } from 'vitest'
import { hashPassword, verifyPassword } from '@/lib/auth'
import {
  getPlanTier,
  canAccessWordStress,
  getAISpeakLimit,
  getMyWordsLimit,
  getSRSLimit,
  canAccessPhonicsLesson,
  canAccessKidsFull,
  canAccessAcademicFull,
  type FamilyPlanData,
} from '@/lib/planUtils'

function daysFromNow(n: number) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString()
}

// ─── Password hashing / verification (real bcrypt, no mocks) ──────────────────

describe('verifyPassword (bcrypt)', () => {
  it('verifies the correct password against its hash', async () => {
    const hash = await hashPassword('S3cret!pass')
    expect(await verifyPassword('S3cret!pass', hash)).toBe(true)
  })

  it('rejects an incorrect password', async () => {
    const hash = await hashPassword('S3cret!pass')
    expect(await verifyPassword('wrong-password', hash)).toBe(false)
  })

  it('is case sensitive', async () => {
    const hash = await hashPassword('CaseMatters')
    expect(await verifyPassword('casematters', hash)).toBe(false)
  })

  it('produces distinct salted hashes for the same password', async () => {
    const a = await hashPassword('samePass')
    const b = await hashPassword('samePass')
    expect(a).not.toBe(b)
    // ...but both still verify
    expect(await verifyPassword('samePass', a)).toBe(true)
    expect(await verifyPassword('samePass', b)).toBe(true)
  })

  it('rejects against an unrelated hash', async () => {
    const hash = await hashPassword('alpha')
    expect(await verifyPassword('beta', hash)).toBe(false)
  })
})

// ─── Plan gating matrix — full feature table per CLAUDE.md ─────────────────────

interface FeatureExpectation {
  tier: string
  wordStress: boolean
  aiSpeak: number | null
  myWordsLimit: number | null
  srsLimit: number | null
  fullContent: boolean
  phonicsBeyondFirst: boolean
}

const matrix: Array<{ name: string; fam: FamilyPlanData; expect: FeatureExpectation }> = [
  {
    name: 'free (expired trial)',
    fam: { plan: 'free', free_trial_expires_at: daysFromNow(-1) },
    expect: {
      tier: 'free',
      wordStress: false,
      aiSpeak: 0,
      myWordsLimit: 20,
      srsLimit: 20,
      fullContent: false,
      phonicsBeyondFirst: false,
    },
  },
  {
    name: 'Pro 1 month',
    fam: { plan: '1month', plan_end_date: daysFromNow(20) },
    expect: {
      tier: 'pro1',
      wordStress: false,
      aiSpeak: 30,
      myWordsLimit: null,
      srsLimit: null,
      fullContent: true,
      phonicsBeyondFirst: true,
    },
  },
  {
    name: 'Pro 3 months',
    fam: { plan: '3months', plan_end_date: daysFromNow(60) },
    expect: {
      tier: 'pro3',
      wordStress: true,
      aiSpeak: null,
      myWordsLimit: null,
      srsLimit: null,
      fullContent: true,
      phonicsBeyondFirst: true,
    },
  },
  {
    name: 'Pro 6 months',
    fam: { plan: '6months', plan_end_date: daysFromNow(120) },
    expect: {
      tier: 'pro6',
      wordStress: true,
      aiSpeak: null,
      myWordsLimit: null,
      srsLimit: null,
      fullContent: true,
      phonicsBeyondFirst: true,
    },
  },
]

describe('Feature gating matrix', () => {
  for (const { name, fam, expect: exp } of matrix) {
    describe(name, () => {
      it(`tier = ${exp.tier}`, () => {
        expect(getPlanTier(fam)).toBe(exp.tier)
      })
      it(`Word Stress = ${exp.wordStress}`, () => {
        expect(canAccessWordStress(fam)).toBe(exp.wordStress)
      })
      it(`AI Speak limit = ${exp.aiSpeak}`, () => {
        expect(getAISpeakLimit(fam)).toBe(exp.aiSpeak)
      })
      it(`My Words limit = ${exp.myWordsLimit}`, () => {
        expect(getMyWordsLimit(fam)).toBe(exp.myWordsLimit)
      })
      it(`SRS limit = ${exp.srsLimit}`, () => {
        expect(getSRSLimit(fam)).toBe(exp.srsLimit)
      })
      it(`full content = ${exp.fullContent}`, () => {
        expect(canAccessKidsFull(fam)).toBe(exp.fullContent)
        expect(canAccessAcademicFull(fam)).toBe(exp.fullContent)
      })
      it(`phonics beyond first lesson = ${exp.phonicsBeyondFirst}`, () => {
        expect(canAccessPhonicsLesson(fam, 'consonants', 3)).toBe(exp.phonicsBeyondFirst)
      })
    })
  }
})

// ─── Ownership / expiry edge cases ────────────────────────────────────────────

describe('Plan expiry downgrades access (ownership over time)', () => {
  it('a once-Pro family whose plan_end_date has passed loses all Pro gates', () => {
    const expired: FamilyPlanData = { plan: '6months', plan_end_date: daysFromNow(-1) }
    expect(getPlanTier(expired)).toBe('free')
    expect(canAccessWordStress(expired)).toBe(false)
    expect(getAISpeakLimit(expired)).toBe(0)
    expect(getMyWordsLimit(expired)).toBe(20)
    expect(canAccessAcademicFull(expired)).toBe(false)
  })

  it('bonus Pro days keep access alive even after the paid plan lapses', () => {
    const fam: FamilyPlanData = {
      plan: 'free',
      free_trial_expires_at: daysFromNow(-30),
      bonus_pro_expires_at: daysFromNow(5),
    }
    expect(getPlanTier(fam)).toBe('pro1')
    expect(getAISpeakLimit(fam)).toBe(30)
    expect(canAccessAcademicFull(fam)).toBe(true)
  })
})

/**
 * NOTE: True API-route ownership checks (e.g. a family editing another family's
 * child via /api/children, or superadmin guards in /api/superadmin/*) require a
 * live Supabase client + session cookie and are not unit-testable here.
 * They require an integration env (real DB + JWT). Covered above is the pure
 * gating logic those routes call into.
 */
