export type Grade = { emoji: string; label: string }

/** The headline on the result screen follows the stars shown, so a 3★ result is never called just
 *  "Khá tốt" (the old % cut-offs — 90/60 — didn't line up with the stars' 80/50). */
export function gradeForStars(stars: number): Grade {
  if (stars >= 3) return { emoji: '🏆', label: 'Xuất sắc' }
  if (stars === 2) return { emoji: '⭐', label: 'Khá tốt' }
  return { emoji: '📖', label: 'Cần ôn tập thêm' }
}
