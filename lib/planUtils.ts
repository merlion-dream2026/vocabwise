import { AI_SPEAK_LIMIT, AI_TEXT_LIMIT, FREE_KIDS, FREE_WORD_CAP, IELTS_SPEAKING_TRIAL_LIMIT, kidsForPlan } from './plans'

export interface FamilyPlanData {
  plan: string
  plan_end_date?: string | null
  free_trial_expires_at?: string | null
  bonus_pro_expires_at?: string | null
  bonus_features?: string[] | null
}

export interface EffectivePlanResult {
  /** User đang có Pro access (paid plan hoặc bonus days) */
  isProActive: boolean
  /** User đang trong free trial (chưa hết 7 ngày) */
  isTrialActive: boolean
  /**
   * Ngày hết hạn Pro thực tế:
   * - Nếu có cả paid plan + bonus → lấy ngày sau hơn
   * - Nếu chỉ có bonus → bonus_pro_expires_at
   * - Nếu chỉ có paid → plan_end_date
   * - Nếu không có gì → null
   */
  effectiveEndDate: string | null
}

/**
 * Tính plan thực tế của user, tính cả bonus Pro days từ referral.
 * Dùng thay cho việc check `plan` trực tiếp khi cần biết có Pro access không.
 */
export function getEffectivePlan(family: FamilyPlanData): EffectivePlanResult {
  const now = new Date()

  const isPaidPlanActive =
    family.plan !== 'free' &&
    !!family.plan_end_date &&
    new Date(family.plan_end_date) > now

  const isBonusProActive =
    !!family.bonus_pro_expires_at &&
    new Date(family.bonus_pro_expires_at) > now

  const isTrialActive =
    family.plan === 'free' &&
    !!family.free_trial_expires_at &&
    new Date(family.free_trial_expires_at) > now

  const isProActive = isPaidPlanActive || isBonusProActive

  let effectiveEndDate: string | null = null
  if (isPaidPlanActive && isBonusProActive) {
    // Lấy ngày sau hơn
    effectiveEndDate =
      new Date(family.plan_end_date!) >= new Date(family.bonus_pro_expires_at!)
        ? family.plan_end_date!
        : family.bonus_pro_expires_at!
  } else if (isPaidPlanActive) {
    effectiveEndDate = family.plan_end_date!
  } else if (isBonusProActive) {
    effectiveEndDate = family.bonus_pro_expires_at!
  }

  return { isProActive, isTrialActive, effectiveEndDate }
}

// ─── Plan tier ──────────────────────────────────────────────────────────────

export type PlanTier = 'free' | 'pro1' | 'pro3' | 'pro6'

/** Trả về tier thực tế (tính cả bonus Pro, nhưng tier dựa vào plan field). Trial KHÔNG nâng tier — chỉ mở vài giới hạn cụ thể (xem getKidsTopicLimit/getAcademicTopicLimit/getAISpeakLimit). */
export function getPlanTier(family: FamilyPlanData): PlanTier {
  const { isProActive } = getEffectivePlan(family)
  if (!isProActive) return 'free'
  if (family.plan === '6months') return 'pro6'
  if (family.plan === '3months') return 'pro3'
  return 'pro1'
}

/** Child-profile cap: families.max_kids (admin override) wins, else by tier — trial/free 1, Pro 1T/3T/6T per PAID_PLANS (1/2/3). */
export function getMaxKids(family: FamilyPlanData & { max_kids?: number | null }): number {
  if (family.max_kids != null) return family.max_kids
  const tier = getPlanTier(family)
  if (tier === 'pro6') return kidsForPlan('6months')
  if (tier === 'pro3') return kidsForPlan('3months')
  if (tier === 'pro1') return kidsForPlan('1month')
  return FREE_KIDS
}

// ─── Feature access gates ────────────────────────────────────────────────────

/**
 * Phonics: trong trial, đúng 1 bài đầu (vowels-short idx 0) — giống Free.
 * Hết trial mà chưa nâng cấp: khoá hoàn toàn (chống scrape nội dung sau khi hết hạn dùng thử).
 */
export function canAccessPhonicsLesson(family: FamilyPlanData, levelId: string, lessonIdx: number): boolean {
  if (getEffectivePlan(family).isProActive) return true
  if (family.bonus_features?.includes('phonics_full')) return true
  if (getEffectivePlan(family).isTrialActive) return levelId === 'vowels-short' && lessonIdx === 0
  return false
}

/** Word Stress: mọi gói Pro (hoặc bonus grant). Was Pro 3 tháng+ until 2026-10-12. */
export function canAccessWordStress(family: FamilyPlanData): boolean {
  if (family.bonus_features?.includes('word_stress')) return true
  return getEffectivePlan(family).isProActive
}

/** My Words: tất cả users (Free giới hạn 20 từ, Pro không giới hạn). */
export function canAccessMyWords(_family: FamilyPlanData): boolean {
  return true
}

/** My Words word limit: null = unlimited (Pro), 20 = Free/Trial cap. */
export function getMyWordsLimit(family: FamilyPlanData): number | null {
  if (family.bonus_features?.includes('my_words')) return null
  if (getEffectivePlan(family).isProActive) return null
  return FREE_WORD_CAP
}

/** SRS ôn từ yếu: tất cả users (Free giới hạn 20 từ/phiên, Pro không giới hạn). */
export function canAccessSRS(_family: FamilyPlanData): boolean {
  return true
}

/** SRS session limit: null = unlimited (Pro), 20 = Free/Trial cap. */
export function getSRSLimit(family: FamilyPlanData): number | null {
  if (family.bonus_features?.includes('srs')) return null
  if (getEffectivePlan(family).isProActive) return null
  return FREE_WORD_CAP
}

/**
 * Số topic Daily (Kids) được mở, tính từ đầu level (0-indexed idx < limit được mở).
 * null = unlimited (Pro/bonus). Trial: 1 topic/level (giống Free). Hết trial: 0 (khoá hoàn toàn).
 */
export function getKidsTopicLimit(family: FamilyPlanData): number | null {
  if (family.bonus_features?.includes('kids_full')) return null
  const { isProActive, isTrialActive } = getEffectivePlan(family)
  if (isProActive) return null
  return isTrialActive ? 1 : 0
}

/** Kids content: Pro bất kỳ, trial, hoặc bonus grant — dùng cho UI (badge, ẩn giới hạn...). */
export function canAccessKidsFull(family: FamilyPlanData): boolean {
  return getKidsTopicLimit(family) === null
}

/**
 * Số topic Academic được mở, tính từ đầu book (0-indexed idx < limit được mở).
 * null = unlimited (Pro/bonus). Trial: 1 topic/book (giống Free). Hết trial: 0 (khoá hoàn toàn).
 */
export function getAcademicTopicLimit(family: FamilyPlanData): number | null {
  if (family.bonus_features?.includes('academic_full')) return null
  const { isProActive, isTrialActive } = getEffectivePlan(family)
  if (isProActive) return null
  return isTrialActive ? 1 : 0
}

/** Academic content: Pro bất kỳ, trial, hoặc bonus grant — dùng cho UI (badge, ẩn giới hạn...). */
export function canAccessAcademicFull(family: FamilyPlanData): boolean {
  return getAcademicTopicLimit(family) === null
}

/**
 * Số revision test được mở (Daily lẫn Academic dùng chung policy — revision test là bộ
 * đề ôn tổng hợp 5 topic/lần, đánh số từ 1). null = unlimited (Pro/bonus). Trial: chỉ
 * revision đầu tiên. Hết trial: 0 (khoá hoàn toàn).
 */
export function getRevisionLimit(family: FamilyPlanData): number | null {
  if (family.bonus_features?.includes('kids_full') || family.bonus_features?.includes('academic_full')) return null
  const { isProActive, isTrialActive } = getEffectivePlan(family)
  if (isProActive) return null
  return isTrialActive ? 1 : 0
}

/** AI Speak limit PER CHILD per day: null = unlimited (Pro 3+ or bonus grant; still capped by AI_FAIR_USE_CAP in lib/aiQuota.ts), else AI_SPEAK_LIMIT, 0 after the trial. */
export function getAISpeakLimit(family: FamilyPlanData): number | null {
  if (family.bonus_features?.includes('ai_speak_unlimited')) return null
  const { isProActive, isTrialActive } = getEffectivePlan(family)
  if (isProActive) {
    const tier = getPlanTier(family)
    return tier === 'pro1' ? AI_SPEAK_LIMIT.pro1 : null
  }
  return isTrialActive ? AI_SPEAK_LIMIT.trial : 0
}

/**
 * AI text-helper daily limit — shared pool across Giải nghĩa (explain) / Hint / Grammar Note /
 * Generate Exercises / Đặt câu, per child per day. null = unlimited (Pro 3+ or bonus grant; AI_FAIR_USE_CAP applies), else AI_TEXT_LIMIT, 0 after the trial.
 * Mirrors getAISpeakLimit's tiering — these text calls are cheaper per-call than AI Speak's audio
 * transcription, but kept on the same tier shape for consistency until usage data says otherwise.
 */
export function getAITextLimit(family: FamilyPlanData): number | null {
  if (family.bonus_features?.includes('ai_text_unlimited')) return null
  const { isProActive, isTrialActive } = getEffectivePlan(family)
  if (isProActive) {
    const tier = getPlanTier(family)
    return tier === 'pro1' ? AI_TEXT_LIMIT.pro1 : null
  }
  return isTrialActive ? AI_TEXT_LIMIT.trial : 0
}

/**
 * IELTS Speaking Coach (bottom-nav tab "AI Speak" — distinct feature from the pronunciation-check
 * "AI Speak" quota above, unfortunate naming overlap) daily limit for both evaluate and transcribe.
 * null = unlimited (any Pro tier or bonus grant), 5 = trial nếm thử, 0 = Free hết trial / chưa có gói.
 */
export function getIeltsSpeakingLimit(family: FamilyPlanData): number | null {
  if (family.bonus_features?.includes('ielts_speaking_unlimited')) return null
  const { isProActive, isTrialActive } = getEffectivePlan(family)
  if (isProActive) return null
  return isTrialActive ? IELTS_SPEAKING_TRIAL_LIMIT : 0
}

// ─── Bonus days ──────────────────────────────────────────────────────────────

/**
 * Tính bonus_pro_expires_at mới sau khi cộng thêm ngày.
 * Nếu user đã có bonus chưa hết → cộng tiếp từ ngày đó.
 * Nếu chưa có hoặc đã hết → cộng từ now.
 */
export function addBonusDays(
  currentBonusExpiresAt: string | null | undefined,
  days: number
): string {
  const now = new Date()
  const base =
    currentBonusExpiresAt && new Date(currentBonusExpiresAt) > now
      ? new Date(currentBonusExpiresAt)
      : now
  base.setDate(base.getDate() + days)
  return base.toISOString()
}
