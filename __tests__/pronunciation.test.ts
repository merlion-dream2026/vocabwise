import { describe, it, expect } from 'vitest'
import { matchWords } from '@/lib/pronunciation'

describe('matchWords', () => {
  it('marks every word heard when transcript matches', () => {
    expect(matchWords('Red apple.', 'red apple')).toEqual([
      { text: 'red', ok: true }, { text: 'apple', ok: true },
    ])
  })

  it('flags the word the AI did not catch', () => {
    expect(matchWords('my', 'my mum').map(m => m.ok)).toEqual([true, false])
  })

  it('accepts Soundex-close words and keeps display text', () => {
    // "mam" ~ "mum" by Soundex; punctuation/casing in the target is preserved
    expect(matchWords('my mam', 'My mum!')).toEqual([
      { text: 'My', ok: true }, { text: 'mum!', ok: true },
    ])
  })

  it('uses each transcript word only once', () => {
    expect(matchWords('the', 'the the').map(m => m.ok)).toEqual([true, false])
  })
})
