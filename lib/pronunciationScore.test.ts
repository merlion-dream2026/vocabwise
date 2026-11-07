import { describe, it, expect } from 'vitest'
import { parseAzure, passes, keywordHits, keywordScore, phonicsVerdict, type Assessment } from './pronunciationScore'

const LEVEL = 'explorer' // bars: pron 65, word 55, completeness 65
const sample = (words: [string, number, string?][], pron = 90, completeness = 100): Assessment => parseAzure({
  RecognitionStatus: 'Success',
  NBest: [{ Display: '', PronScore: pron, AccuracyScore: pron, FluencyScore: 90, CompletenessScore: completeness,
    Words: words.map(([Word, AccuracyScore, ErrorType]) => ({ Word, AccuracyScore, ErrorType: ErrorType ?? 'None' })) }],
})!

describe('passes: inflected key words', () => {
  it.each([
    ['portion', 'portions'], ['unwind', 'unwinding'], ['unwind', 'unwinds'], ['slice', 'sliced'], ['delay', 'delays'],
    ['stop', 'stopped'], ['study', 'studies'], ['apologize', 'apologized'], ['watch', 'watches'],
  ])('%s / %s is found and judged', (keyword, said) => {
    expect(passes(sample([['the', 90], [said, 85]]), keyword, LEVEL)).toBe(true)
    expect(passes(sample([['the', 95], [said, 30, 'Mispronunciation']]), keyword, LEVEL)).toBe(false)
  })

  it('reports the inflected word score', () => {
    expect(keywordScore(sample([['generous', 90], ['portions', 72]]), 'portion')).toBe(72)
  })

  it('judges each word of an inflected phrase', () => {
    expect(passes(sample([['he', 90], ['sets', 85], ['two', 90], ['alarms', 85]]), 'set an alarm', LEVEL)).toBe(true)
    expect(passes(sample([['he', 90], ['sets', 85], ['two', 90], ['alarms', 30, 'Mispronunciation']]), 'set an alarm', LEVEL)).toBe(false)
  })

  it('matches hyphenated words whichever way Azure splits them', () => {
    expect(keywordHits(sample([['sugar-free', 80], ['drinks', 85]]), 'sugar-free drink')).toHaveLength(2)
    expect(keywordHits(sample([['sugar', 80], ['free', 80]]), 'sugar-free')).toHaveLength(2)
  })

  it('lets the overall score decide when the key word cannot be located (irregular form)', () => {
    expect(passes(sample([['she', 90], ['bought', 85]]), 'buy', LEVEL)).toBe(true)
    expect(passes(sample([['she', 60], ['bought', 60]], 60), 'buy', LEVEL)).toBe(false)
  })

  it('still fails a skipped key word and low overall scores', () => {
    expect(passes(sample([['generous', 95], ['portions', 0, 'Omission']]), 'portion', LEVEL)).toBe(false)
    expect(passes(sample([['portions', 90]], 50), 'portion', LEVEL)).toBe(false)
    expect(passes(sample([['portions', 90]], 90, 40), 'portion', LEVEL)).toBe(false)
  })

  it.each([['need', 'ne'], ['sing', 's'], ['bed', 'bid'], ['pass', 'pas'], ['bring', 'br']])('%s does not match %s by accident', (keyword, said) => {
    expect(keywordHits(sample([[said, 90]]), keyword)).toHaveLength(0)
  })

  it('applies the level bar', () => {
    const a = sample([['portions', 57]], 68)
    expect(passes(a, 'portion', 'explorer')).toBe(true)
    expect(passes(a, 'portion', 'master')).toBe(false)
  })
})

describe('phonicsVerdict stays exact', () => {
  it('does not treat an inflected form as the highlighted word', () => {
    const a = sample([['ships', 90]])
    expect(phonicsVerdict(a, ['ship'], ['ɪ']).words).toHaveLength(0)
  })
})
