// Plan prices + per-plan limits — the one place these numbers live. lib/planUtils.ts enforces the
// limits; the landing page, UpgradeModal and the JSON-LD offers in app/layout.tsx display them.
// Change a price or a quota here and every screen follows.

export type PaidPlanKey = '1month' | '3months' | '6months'

export const TRIAL_DAYS = 7

/** Daily quota while the 7-day trial runs, and on Pro 1 tháng (Pro 3/6 tháng = unlimited). */
export const AI_DAILY_LIMIT = { trial: 10, pro1: 40 } as const
/** IELTS Speaking Coach tries per day during the trial (any Pro = unlimited). */
export const IELTS_SPEAKING_TRIAL_LIMIT = 5
/** My Words / SRS cap on Free + trial (Pro = unlimited). */
export const FREE_WORD_CAP = 20

export type PaidPlan = {
  key: PaidPlanKey
  label: string
  months: number
  amount: number     // VND
  kids: number
  savingPct: number  // vs paying month by month
  badge: string | null
}

export const PAID_PLANS: readonly PaidPlan[] = [
  { key: '1month',  label: '1 tháng', months: 1, amount: 59000,  kids: 2, savingPct: 0,  badge: null },
  { key: '3months', label: '3 tháng', months: 3, amount: 159000, kids: 3, savingPct: 10, badge: 'PHỔ BIẾN' },
  { key: '6months', label: '6 tháng', months: 6, amount: 299000, kids: 3, savingPct: 16, badge: 'GIÁ TỐT NHẤT' },
]

export const FREE_KIDS = 1

/** 59000 → "59.000đ" */
export const vnd = (n: number) => `${n.toLocaleString('vi-VN')}đ`
/** 59000 → "59k" */
export const kVnd = (n: number) => `${Math.round(n / 1000)}k`
/** Price per month, rounded to the nearest 1k: 159000 / 3 → "53k" */
export const perMonth = (p: PaidPlan) => kVnd(Math.round(p.amount / p.months / 1000) * 1000)
/** Cheapest price per day across plans, rounded up to 100đ: 299000 / 180 → "1.700đ" */
export const cheapestPerDay = () => vnd(Math.ceil(Math.min(...PAID_PLANS.map(p => p.amount / (p.months * 30))) / 100) * 100)

const ai = (n: number | null) => (n === null ? 'không giới hạn' : `${n} lần/ngày`)

/** What each paid plan adds — shown on the landing pricing cards and in UpgradeModal. */
export const PLAN_PERKS: Record<PaidPlanKey, readonly string[]> = {
  '1month': [
    `✅ ${PAID_PLANS[0].kids} hồ sơ bé`, `✅ AI phát âm ${ai(AI_DAILY_LIMIT.pro1)}`, `✅ Giải nghĩa & gợi ý AI ${ai(AI_DAILY_LIMIT.pro1)}`,
    '✅ Nhắc học theo lịch ba mẹ chọn', '✅ Báo cáo email thủ công',
  ],
  '3months': [
    `✅ ${PAID_PLANS[1].kids} hồ sơ bé`, `✅ AI phát âm ${ai(null)}`, `✅ Giải nghĩa & gợi ý AI ${ai(null)}`,
    '✅ Module Trọng âm từ (Word Stress)', '✅ Báo cáo email tự động hàng tuần',
  ],
  '6months': [
    `✅ ${PAID_PLANS[2].kids} hồ sơ bé`, `✅ AI phát âm ${ai(null)}`, `✅ Giải nghĩa & gợi ý AI ${ai(null)}`,
    '✅ Module Trọng âm từ (Word Stress)', '✅ Báo cáo email tự động hàng tuần',
    '🎁 Tặng bạn bè 14 ngày Pro (1 lần)', '📅 Email tổng kết học tập hàng tháng',
  ],
}

/** Feature × plan comparison: [feature, trial, 1T, 3T, 6T]. */
export const PLAN_TABLE: readonly (readonly [string, string, string, string, string])[] = [
  ['Hồ sơ bé', String(FREE_KIDS), ...PAID_PLANS.map(p => String(p.kids))] as [string, string, string, string, string],
  ['Chủ đề Daily', '1/level', '✅', '✅', '✅'],
  ['Chủ đề Academic', '1/book', '✅', '✅', '✅'],
  ['Phát âm IPA', '1 bài', '✅', '✅', '✅'],
  ['Trọng âm từ', '❌', '❌', '✅', '✅'],
  ['Từ của tôi ⭐', `${FREE_WORD_CAP} từ`, '✅', '✅', '✅'],
  ['Ôn SRS từ yếu', `${FREE_WORD_CAP} từ`, '✅', '✅', '✅'],
  ['Luyện phát âm AI', `${AI_DAILY_LIMIT.trial}/ngày`, `${AI_DAILY_LIMIT.pro1}/ngày`, '∞', '∞'],
  ['Giải nghĩa & gợi ý AI', `${AI_DAILY_LIMIT.trial}/ngày`, `${AI_DAILY_LIMIT.pro1}/ngày`, '∞', '∞'],
  ['Nhắc học (Push)', '❌', '✅', '✅', '✅'],
  ['Báo cáo email', '❌', 'Thủ công', 'Auto', 'Auto'],
  ['Tổng kết tháng', '❌', '❌', '❌', '✅'],
  ['🎁 Tặng bạn bè', '❌', '❌', '❌', '✅'],
]
