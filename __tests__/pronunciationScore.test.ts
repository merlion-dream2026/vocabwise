import { describe, it, expect } from 'vitest'
import { parseAzure, passes, markWords, phonicsVerdict, azurePhonemes, barFor } from '@/lib/pronunciationScore'

// Shapes taken from a real Azure response (IPA, NBestPhonemeCount 3): TTS said "ship", reference "sheep".
const ph = (p: string, score: number, heard: string[]) => ({ Phoneme: p, PronunciationAssessment: { AccuracyScore: score, NBestPhonemes: heard.map(x => ({ Phoneme: x })) } })
const word = (w: string, acc: number, phonemes: ReturnType<typeof ph>[], err = 'None') =>
  ({ Word: w, PronunciationAssessment: { AccuracyScore: acc, ErrorType: err }, Phonemes: phonemes })
const azure = (pron: number, words: ReturnType<typeof word>[], completeness = 100) => ({
  RecognitionStatus: 'Success',
  NBest: [{ Display: 'I see a ship.', AccuracyScore: pron, FluencyScore: 95, CompletenessScore: completeness, PronScore: pron, Words: words }],
})

const shipForSheep = azure(78, [
  word('i', 97, [ph('aɪ', 97, ['aɪ'])]),
  word('see', 100, [ph('s', 100, ['s']), ph('i', 100, ['i'])]),
  word('a', 97, [ph('ə', 97, ['ə'])]),
  word('sheep', 70, [ph('ʃ', 100, ['ʃ']), ph('i', 40, ['ɪ', 'p', 'ɛ']), ph('p', 72, ['p'])]),
])

describe('parseAzure', () => {
  it('reads scores, words and phonemes with NBest guesses', () => {
    const a = parseAzure(shipForSheep)!
    expect(a.pronScore).toBe(78)
    expect(a.words[3].phonemes[1]).toEqual({ p: 'i', score: 40, heard: ['ɪ', 'p', 'ɛ'] })
  })
  it('returns null when speech was not recognised', () => {
    expect(parseAzure({ RecognitionStatus: 'NoMatch' })).toBeNull()
  })
})

describe('passes (Phát âm cùng AI)', () => {
  const a = parseAzure(shipForSheep)!
  it('uses kinder bars for young levels', () => {
    expect(barFor('starter').pron).toBeLessThan(barFor('master').pron)
    expect(passes(a, 'sheep', 'starter')).toBe(true)  // 78 ≥ 60, sheep 70 ≥ 50
    expect(passes(a, 'sheep', 'master')).toBe(true)   // 78 ≥ 70, sheep 70 ≥ 60
  })
  it('fails when the key word itself is weak, even if the sentence scores well', () => {
    const weak = parseAzure(azure(90, [word('see', 100, []), word('sheep', 45, [])]))!
    expect(passes(weak, 'sheep', 'starter')).toBe(false)
  })
  it('fails when the key word was skipped', () => {
    const skipped = parseAzure(azure(90, [word('see', 100, []), word('sheep', 0, [], 'Omission')], 60))!
    expect(passes(skipped, 'sheep', 'explorer')).toBe(false)
  })
})

describe('markWords', () => {
  it('colours each displayed word by its score, keeping punctuation', () => {
    const a = parseAzure(azure(80, [word('the', 95, []), word('dog', 40, [], 'Mispronunciation'), word('runs', 72, [])]))!
    expect(markWords(a, 'The dog runs.', 'explorer')).toEqual([
      { text: 'The', level: 'good' }, { text: 'dog', level: 'bad' }, { text: 'runs.', level: 'weak' },
    ])
  })
})

describe('phonicsVerdict', () => {
  it('maps British lesson symbols to Azure IPA', () => {
    expect(azurePhonemes('iː')).toEqual(['i'])
    expect(azurePhonemes('ɜː')).toEqual(['ɝ'])
    expect(azurePhonemes('-p')).toEqual(['p'])
    expect(azurePhonemes('str-')).toEqual(['s', 't', 'ɹ'])
  })
  it('judges the lesson sound and says what it sounded like', () => {
    const v = phonicsVerdict(parseAzure(shipForSheep)!, ['sheep'], ['iː', 'ɪ'])
    expect(v.ok).toBe(false)                                   // /i/ only 40
    expect(v.weakest).toEqual({ symbol: 'iː', score: 40, heardAs: 'ɪ' })
    expect(v.words[0].phonemes.map(p => p.focus)).toEqual([false, true, false])
  })
  it('passes when every lesson sound in the highlighted words is good', () => {
    const good = parseAzure(azure(92, [word('sheep', 95, [ph('ʃ', 100, ['ʃ']), ph('i', 92, ['i']), ph('p', 95, ['p'])])]))!
    const v = phonicsVerdict(good, ['sheep'], ['iː', 'ɪ'])
    expect(v.ok).toBe(true)
    expect(v.weakest?.heardAs).toBeUndefined()
  })
})
