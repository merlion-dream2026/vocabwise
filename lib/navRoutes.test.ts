import { describe, it, expect } from 'vitest'
import { shouldShowNav } from './navRoutes'

describe('shouldShowNav', () => {
  it.each([
    '/kids', '/dashboard', '/my-words', '/vocabwise', '/vocabwise/b1', '/vocabwise/b1/t3',
    '/vocabwise/wordlist', '/ielts-speaking', '/dashboard/c1', '/dashboard/c1/kids',
    '/dashboard/c1/starter', '/dashboard/c1/starter/t1', '/dashboard/c1/phonics',
    '/dashboard/c1/phonics/l1', '/dashboard/c1/phonics/l1/s1', '/dashboard/c1/phonics/chart',
    '/dashboard/c1/profile', '/dashboard/c1/stickers',
  ])('shows on %s', p => expect(shouldShowNav(p)).toBe(true))

  it.each([
    '/', '/login', '/superadmin',
    // games — including ones never listed by name (rhythm, sentence, future games)
    '/dashboard/c1/starter/t1/flashcard', '/dashboard/c1/starter/t1/sentence',
    '/dashboard/c1/starter/t1/some-new-game', '/dashboard/c1/phonics/l1/s1/rhythm',
    // focus screens
    '/dashboard/c1/starter/level-test', '/vocabwise/b1/module-test', '/vocabwise/placement',
    '/dashboard/c1/starter/revision/r01', '/vocabwise/b1/revision/rev1',
    '/dashboard/c1/starter/srs', '/dashboard/c1/review', '/vocabwise/b1/review',
    '/dashboard/c1/phonics/stress',
  ])('hides on %s', p => expect(shouldShowNav(p)).toBe(false))
})
