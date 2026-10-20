import { describe, it, expect } from 'vitest'
import { gradeForStars } from '@/lib/gameGrade'
import { starsFor } from '@/lib/topicMastery'
import { frogScorePct } from '@/lib/arcadeGames'

describe('gradeForStars', () => {
  it('3 stars → Xuất sắc', () => {
    expect(gradeForStars(3)).toEqual({ emoji: '🏆', label: 'Xuất sắc' })
  })

  it('2 stars → Khá tốt', () => {
    expect(gradeForStars(2)).toEqual({ emoji: '⭐', label: 'Khá tốt' })
  })

  it('1 or 0 stars → Cần ôn tập thêm', () => {
    expect(gradeForStars(1)).toEqual({ emoji: '📖', label: 'Cần ôn tập thêm' })
    expect(gradeForStars(0)).toEqual({ emoji: '📖', label: 'Cần ôn tập thêm' })
  })

  it('frog 10/10 with one heart lost (85%) is 3★ and Xuất sắc, not Khá tốt', () => {
    const pct = frogScorePct(10, 1, 10)
    expect(pct).toBe(85)
    expect(gradeForStars(starsFor(pct)).label).toBe('Xuất sắc')
  })
})
