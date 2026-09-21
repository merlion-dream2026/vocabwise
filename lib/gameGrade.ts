export type Grade = { emoji: string; label: string }

export function getGrade(score: number, total: number): Grade {
  const pct = total > 0 ? (score / total) * 100 : 0
  if (pct >= 90) return { emoji: '🏆', label: 'Xuất sắc' }
  if (pct >= 60) return { emoji: '⭐', label: 'Khá tốt' }
  return { emoji: '📖', label: 'Cần ôn tập thêm' }
}
