// Features that can be manually granted to individual users
export const BONUS_FEATURES = [
  { key: 'phonics_full',       icon: '🔤', label: 'Phonics đầy đủ',   desc: 'Tất cả bài Phonics (mặc định Free chỉ 1 bài)' },
  { key: 'word_stress',        icon: '📢', label: 'Word Stress',        desc: 'Module trọng âm (thường cần Pro 3T+)' },
  { key: 'my_words',           icon: '⭐', label: 'My Words',           desc: 'Lưu & quản lý từ vựng cá nhân' },
  { key: 'srs',                icon: '📅', label: 'SRS ôn từ',         desc: 'Ôn tập từ yếu theo lịch' },
  { key: 'kids_full',          icon: '📖', label: 'Daily đầy đủ',      desc: 'Tất cả 180 chủ đề Daily' },
  { key: 'academic_full',      icon: '🎓', label: 'Academic đầy đủ',  desc: 'Tất cả 3 books Academic (180 chủ đề)' },
  { key: 'ai_speak_unlimited', icon: '🎤', label: 'AI Speak ∞',        desc: 'Không giới hạn lần chấm phát âm AI' },
] as const

export type BonusFeatureKey = typeof BONUS_FEATURES[number]['key']

// Features already included in each plan (no need to grant manually)
export function getPlanIncludes(plan: string): BonusFeatureKey[] {
  if (plan === 'free') return []
  const base: BonusFeatureKey[] = ['phonics_full', 'my_words', 'srs', 'kids_full', 'academic_full']
  if (plan === '3months' || plan === '6months') return [...base, 'word_stress', 'ai_speak_unlimited']
  return base
}

export const PLAN_OPTIONS = [
  { value: 'free',     label: 'Free (dùng thử 7 ngày)' },
  { value: '2weeks',   label: '🎁 Pro 2 tuần (tặng bạn bè)' },
  { value: '1month',   label: '1 tháng — 59.000đ' },
  { value: '3months',  label: '3 tháng — 159.000đ' },
  { value: '6months',  label: '6 tháng — 299.000đ' },
]

export const PLAN_DURATIONS: Record<string, number> = {
  '2weeks': 14,
  '1month': 30,
  '3months': 90,
  '6months': 180,
}
