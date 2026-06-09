export interface FamilyPlanData {
  plan: string
  plan_end_date?: string | null
  free_trial_expires_at?: string | null
  bonus_pro_expires_at?: string | null
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
