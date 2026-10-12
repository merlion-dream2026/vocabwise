// Plan prices + per-plan limits — the one place these numbers live. lib/planUtils.ts enforces the
// limits; the landing page, UpgradeModal and the JSON-LD offers in app/layout.tsx display them.
// Change a price or a quota here and every screen follows.
//
// What separates the plans (Andie, 2026-10-12): price per day, number of kids, and how much AI a
// child can use. Everything that helps a family learn — all content incl. Word Stress, progress
// screens, email reports, reminders, stickers — is the same on every paid plan.

export type PaidPlanKey = '1month' | '3months' | '6months'

export const TRIAL_DAYS = 7

/** AI quotas are per CHILD per day. Pro 3/6 tháng = unlimited on paper, AI_FAIR_USE_CAP in practice. */
export const AI_SPEAK_LIMIT = { trial: 20, pro1: 40 } as const   // pronunciation scoring (1 call per word tried)
export const AI_TEXT_LIMIT = { trial: 10, pro1: 40 } as const    // Giải nghĩa / gợi ý / ghi chú ngữ pháp / đặt câu
/** Silent ceiling behind "không giới hạn" — stops scripted abuse, never reached by a real child. */
export const AI_FAIR_USE_CAP = 300
/** IELTS Speaking Coach tries per day during the trial (any Pro = unlimited). */
export const IELTS_SPEAKING_TRIAL_LIMIT = 5
/** My Words / SRS cap on the trial (Pro = unlimited). */
export const FREE_WORD_CAP = 20
/** Child profiles on the trial (and after it ends). */
export const FREE_KIDS = 1

export type PaidPlan = {
  key: PaidPlanKey
  label: string
  months: number
  amount: number     // VND
  kids: number       // enforced by /api/children (families.max_kids overrides)
  savingPct: number  // vs paying month by month
  badge: string | null
  tagline: string
}

export const PAID_PLANS: readonly PaidPlan[] = [
  { key: '1month',  label: '1 tháng', months: 1, amount: 59000,  kids: 1, savingPct: 0,  badge: null,           tagline: 'Cho bé làm quen' },
  { key: '3months', label: '3 tháng', months: 3, amount: 159000, kids: 2, savingPct: 10, badge: 'PHỔ BIẾN',     tagline: 'Trọn một mùa hè' },
  { key: '6months', label: '6 tháng', months: 6, amount: 299000, kids: 3, savingPct: 16, badge: 'GIÁ TỐT NHẤT', tagline: 'Trọn một học kỳ, rẻ nhất' },
]

export const kidsForPlan = (plan: string): number => PAID_PLANS.find(p => p.key === plan)?.kids ?? FREE_KIDS

/** 59000 → "59.000đ" */
export const vnd = (n: number) => `${n.toLocaleString('vi-VN')}đ`
/** 59000 → "59k" */
export const kVnd = (n: number) => `${Math.round(n / 1000)}k`
/** Price per month, rounded to the nearest 1k: 159000 / 3 → "53k" */
export const perMonth = (p: PaidPlan) => kVnd(Math.round(p.amount / p.months / 1000) * 1000)
/** Price per day, rounded to the nearest 100đ: 159000 / 90 → "1.800đ" */
export const perDay = (p: PaidPlan) => vnd(Math.round(p.amount / (p.months * 30) / 100) * 100)
/** Cheapest price per day across plans: "1.700đ" */
export const cheapestPerDay = () => perDay(PAID_PLANS[PAID_PLANS.length - 1])

const ai = (n: number | null) => (n === null ? 'không giới hạn' : `${n} lượt/ngày`)

/** One-line summary of the trial, used on the pricing strip and in the FAQ. */
export const TRIAL_SUMMARY = `${FREE_KIDS} bé · chủ đề đầu tiên mỗi level · 1 bài Phonics · AI chấm phát âm ${ai(AI_SPEAK_LIMIT.trial)} · không cần thẻ`

/** Plan card bullets: each plan lists only what it adds over the one before. */
export const PLAN_PERKS: Record<PaidPlanKey, readonly string[]> = {
  '1month': [
    '✅ Toàn bộ 360 chủ đề + 58 bài phát âm',
    `✅ ${PAID_PLANS[0].kids} hồ sơ bé`,
    `✅ AI chấm phát âm & giải nghĩa ${ai(AI_SPEAK_LIMIT.pro1)}`,
  ],
  '3months': [
    '✨ Mọi thứ của gói 1 tháng, thêm:',
    `✅ ${PAID_PLANS[1].kids} hồ sơ bé`,
    `✅ AI ${ai(null)}`,
  ],
  '6months': [
    '✨ Mọi thứ của gói 3 tháng, thêm:',
    `✅ ${PAID_PLANS[2].kids} hồ sơ bé`,
    '🎁 Tặng 1 người bạn 14 ngày Pro',
  ],
}

/** Shared by every plan — the strip under the pricing cards. */
export const ALL_PLANS_INCLUDE = [
  '📈 Theo dõi tiến độ', '📬 Báo cáo email tuần & tháng', '🔔 Nhắc học theo lịch', '📝 Kiểm tra level & module',
  '⭐ Từ của tôi không giới hạn', '🔁 Ôn SRS không giới hạn', '🎨 Sticker & đổi quà', '📱 Mọi thiết bị',
] as const

/** Feature × plan comparison (UpgradeModal): [feature, trial, 1T, 3T, 6T]. AI numbers are per child. */
export const PLAN_TABLE: readonly (readonly [string, string, string, string, string])[] = [
  ['Giá mỗi ngày', '0đ', ...PAID_PLANS.map(p => `≈${perDay(p)}`)] as [string, string, string, string, string],
  ['Hồ sơ bé', String(FREE_KIDS), ...PAID_PLANS.map(p => String(p.kids))] as [string, string, string, string, string],
  ['Chủ đề Daily & Academic', 'Chủ đề đầu', '✅', '✅', '✅'],
  ['Phát âm IPA & trọng âm', '1 bài', '✅', '✅', '✅'],
  ['AI chấm phát âm (mỗi bé)', `${AI_SPEAK_LIMIT.trial}/ngày`, `${AI_SPEAK_LIMIT.pro1}/ngày`, '∞', '∞'],
  ['AI giải nghĩa & gợi ý (mỗi bé)', `${AI_TEXT_LIMIT.trial}/ngày`, `${AI_TEXT_LIMIT.pro1}/ngày`, '∞', '∞'],
  ['Từ của tôi & ôn SRS', `${FREE_WORD_CAP} từ`, '✅', '✅', '✅'],
  ['Tiến độ & nhắc học', '✅', '✅', '✅', '✅'],
  ['Báo cáo email tuần & tháng', '❌', '✅', '✅', '✅'],
  ['🎁 Tặng bạn bè 14 ngày Pro', '❌', '❌', '❌', '✅'],
]
