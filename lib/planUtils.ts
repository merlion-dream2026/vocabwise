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

/** Trả về tier thực tế (tính cả bonus Pro, nhưng tier dựa vào plan field). */
export function getPlanTier(family: FamilyPlanData): PlanTier {
  const { isProActive } = getEffectivePlan(family)
  if (!isProActive) return 'free'
  if (family.plan === '6months') return 'pro6'
  if (family.plan === '3months') return 'pro3'
  return 'pro1'
}

// ─── Feature access gates ────────────────────────────────────────────────────

/** Phonics: free chỉ được bài đầu tiên của level đầu tiên (vowels-short, idx 0). */
export function canAccessPhonicsLesson(family: FamilyPlanData, levelId: string, lessonIdx: number): boolean {
  if (getEffectivePlan(family).isProActive) return true
  if (family.bonus_features?.includes('phonics_full')) return true
  return levelId === 'vowels-short' && lessonIdx === 0
}

/** Word Stress: Pro 3 tháng trở lên (hoặc bonus grant). */
export function canAccessWordStress(family: FamilyPlanData): boolean {
  if (family.bonus_features?.includes('word_stress')) return true
  const tier = getPlanTier(family)
  return tier === 'pro3' || tier === 'pro6'
}

/** My Words: Pro bất kỳ (hoặc bonus grant). */
export function canAccessMyWords(family: FamilyPlanData): boolean {
  if (family.bonus_features?.includes('my_words')) return true
  return getEffectivePlan(family).isProActive
}

/** SRS ôn từ yếu: Pro bất kỳ (hoặc bonus grant). */
export function canAccessSRS(family: FamilyPlanData): boolean {
  if (family.bonus_features?.includes('srs')) return true
  return getEffectivePlan(family).isProActive
}

/** Kids content: Pro bất kỳ (hoặc bonus grant). */
export function canAccessKidsFull(family: FamilyPlanData): boolean {
  if (family.bonus_features?.includes('kids_full')) return true
  return getEffectivePlan(family).isProActive
}

/** Academic content: Pro bất kỳ (hoặc bonus grant). */
export function canAccessAcademicFull(family: FamilyPlanData): boolean {
  if (family.bonus_features?.includes('academic_full')) return true
  return getEffectivePlan(family).isProActive
}

/** AI Speak limit: null = unlimited (Pro 3+ hoặc bonus grant), 30 (Pro 1), 5 (Free). */
export function getAISpeakLimit(family: FamilyPlanData): number | null {
  if (family.bonus_features?.includes('ai_speak_unlimited')) return null
  const tier = getPlanTier(family)
  if (tier === 'free')  return 5
  if (tier === 'pro1')  return 30
  return null
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
