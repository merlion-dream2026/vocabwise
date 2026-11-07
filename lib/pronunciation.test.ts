import { describe, it, expect } from 'vitest'
import { isKeyWord, isPronunciationCorrect, sameWord } from './pronunciation'

const check = (transcript: string, target: string, word: string, contrast: string[] = []) =>
  isPronunciationCorrect(transcript, target, word, contrast, 0.7)

describe('sameWord', () => {
  it.each([['portion', 'portions'], ['unwind', 'unwinding'], ['stop', 'stopped'], ['study', 'studies'], ['slice', 'sliced']])('%s = %s', (a, b) => {
    expect(sameWord(a, b)).toBe(true)
  })
  it.each([['need', 'ne'], ['bed', 'bid'], ['pass', 'pas']])('%s ≠ %s', (a, b) => {
    expect(sameWord(a, b)).toBe(false)
  })
})

describe('isKeyWord', () => {
  it('ignores punctuation and splits hyphens', () => {
    expect(isKeyWord('portions.', 'portion')).toBe(true)
    expect(isKeyWord('sugar-free', 'sugar free drink')).toBe(true)
    expect(isKeyWord('anything', '')).toBe(false)
  })
})

describe('isPronunciationCorrect (Whisper fallback)', () => {
  it('accepts inflected key words, which must still be heard', () => {
    expect(check('the restaurant serves generous portions at lunch time', 'The restaurant serves generous portions at lunch.', 'portion')).toBe(true)
    expect(check('they spend the evening unwinding at home', 'They spent the evening unwinding at home.', 'unwind')).toBe(true)
    expect(check('he always set two alarms on busy day', 'He always sets two alarms on busy days.', 'set an alarm')).toBe(true)
    expect(check('the restaurant serves generous meals at lunch', 'The restaurant serves generous portions at lunch.', 'portion')).toBe(false)
  })

  it('matches multi-word key words word by word', () => {
    expect(check('please put a calendar hold on it', 'Please put a calendar hold on it.', 'calendar hold')).toBe(true)
    expect(check('can you put a meeting on it', 'Can you put a calendar hold on it?', 'calendar hold')).toBe(false)
  })

  it('does not pass a single-word target that was not heard when the key word is elsewhere', () => {
    expect(check('banana', 'bought', 'buy')).toBe(false)
    expect(check('bought', 'bought', 'buy')).toBe(true)
  })

  it('does not treat part of a word as the target', () => {
    expect(check('start', 'art', 'art')).toBe(false)
  })

  it('rejects a contrast word', () => {
    expect(check('sheep', 'ship', 'ship', ['sheep'])).toBe(false)
  })
})
