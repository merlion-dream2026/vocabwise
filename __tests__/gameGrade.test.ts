import { describe, it, expect } from 'vitest'
import { getGrade } from '@/lib/gameGrade'

describe('getGrade', () => {
  it('grades a perfect score as Xuất sắc', () => {
    expect(getGrade(10, 10)).toEqual({ emoji: '🏆', label: 'Xuất sắc' })
  })

  it('grades exactly 90% as Xuất sắc (boundary)', () => {
    expect(getGrade(9, 10)).toEqual({ emoji: '🏆', label: 'Xuất sắc' })
  })

  it('grades just under 90% as Khá tốt', () => {
    expect(getGrade(8, 9)).toEqual({ emoji: '⭐', label: 'Khá tốt' }) // 88.9%
  })

  it('grades exactly 60% as Khá tốt (boundary)', () => {
    expect(getGrade(6, 10)).toEqual({ emoji: '⭐', label: 'Khá tốt' })
  })

  it('grades just under 60% as Cần ôn tập thêm', () => {
    expect(getGrade(5, 10)).toEqual({ emoji: '📖', label: 'Cần ôn tập thêm' })
  })

  it('grades zero score as Cần ôn tập thêm', () => {
    expect(getGrade(0, 10)).toEqual({ emoji: '📖', label: 'Cần ôn tập thêm' })
  })

  it('handles total=0 without dividing by zero', () => {
    expect(getGrade(0, 0)).toEqual({ emoji: '📖', label: 'Cần ôn tập thêm' })
  })
})
