// Azure Pronunciation Assessment → VocabWise verdicts. Pure (no I/O): shared by the scoring API
// (parse + Daily/Academic verdict), the Phonics game (sound-level verdict) and the result UI.
// Thresholds are a first guess, kinder for young levels (Azure is tuned on adult voices) — every
// Azure result is logged with its scores (pronunciation_log) so they can be recalibrated.
import { normalize } from './pronunciation'

export type PhonemeScore = { p: string; score: number; heard: string[] } // heard = Azure's top guesses (NBest)
export type WordScore = { word: string; accuracy: number; error: string; phonemes: PhonemeScore[] }
export type Assessment = {
  transcript: string; pronScore: number; accuracy: number; fluency: number; completeness: number; words: WordScore[]
}

type Num = { AccuracyScore?: number; FluencyScore?: number; CompletenessScore?: number; PronScore?: number; ErrorType?: string; NBestPhonemes?: { Phoneme?: string }[] }
type AzurePhoneme = Num & { Phoneme?: string; PronunciationAssessment?: Num }
type AzureWord = Num & { Word?: string; PronunciationAssessment?: Num; Phonemes?: AzurePhoneme[] }
type AzureBest = Num & { Display?: string; Lexical?: string; PronunciationAssessment?: Num; Words?: AzureWord[] }

/** Parse the REST short-audio response (`format=detailed`). Scores sit either directly on each
 *  node or under PronunciationAssessment depending on API version — both are read. */
export function parseAzure(json: unknown): Assessment | null {
  const r = json as { RecognitionStatus?: string; NBest?: AzureBest[] }
  const best = r?.RecognitionStatus === 'Success' ? r.NBest?.[0] : undefined
  if (!best) return null
  const pa = best.PronunciationAssessment ?? {}
  const num = (a?: number, b?: number) => Math.round(a ?? b ?? 0)
  return {
    transcript: best.Display ?? best.Lexical ?? '',
    pronScore: num(best.PronScore, pa.PronScore),
    accuracy: num(best.AccuracyScore, pa.AccuracyScore),
    fluency: num(best.FluencyScore, pa.FluencyScore),
    completeness: num(best.CompletenessScore, pa.CompletenessScore),
    words: (best.Words ?? []).map((w) => ({
      word: w.Word ?? '',
      accuracy: num(w.AccuracyScore, w.PronunciationAssessment?.AccuracyScore),
      error: w.ErrorType ?? w.PronunciationAssessment?.ErrorType ?? 'None',
      phonemes: (w.Phonemes ?? []).map((p) => ({
        p: p.Phoneme ?? '',
        score: num(p.AccuracyScore, p.PronunciationAssessment?.AccuracyScore),
        heard: (p.PronunciationAssessment?.NBestPhonemes ?? p.NBestPhonemes ?? []).map((x) => x.Phoneme ?? '').filter(Boolean),
      })),
    })),
  }
}

// ── Daily / Academic "Phát âm cùng AI" ───────────────────────────────────────
type Bar = { pron: number; word: number; completeness: number }
const BARS: Record<'young' | 'mid' | 'ielts', Bar> = {
  young: { pron: 60, word: 50, completeness: 60 }, // Seeker/Starter/Ranger + Phonics
  mid: { pron: 65, word: 55, completeness: 65 },   // Explorer (and callers without a level)
  ielts: { pron: 70, word: 60, completeness: 70 }, // Scholar/Master — same bar as AXANH adults
}
export function barFor(level: string): Bar {
  if (['seeker', 'starter', 'ranger', 'phonics'].includes(level)) return BARS.young
  if (['scholar', 'master'].includes(level)) return BARS.ielts
  return BARS.mid
}

/** Pass = good overall score, phrase (almost) fully read, and every word of the key word itself
 *  acceptable — the word being learned can't be carried by the rest of the sentence. */
export function passes(a: Assessment, keyword: string, level: string): boolean {
  const bar = barFor(level)
  if (a.pronScore < bar.pron || a.completeness < bar.completeness) return false
  const target = new Set(normalize(keyword).split(' ').filter(Boolean))
  const hits = a.words.filter((w) => target.has(normalize(w.word)) && w.error !== 'Insertion')
  if (hits.length === 0) return false
  return hits.every((w) => w.accuracy >= bar.word && w.error !== 'Omission')
}

/** Chip colour per word: bad = mispronounced/omitted, weak = borderline, good. */
export function wordLevel(w: { accuracy: number; error: string }, level: string): 'bad' | 'weak' | 'good' {
  if (w.error === 'Omission' || w.error === 'Mispronunciation' || w.accuracy < barFor(level).word) return 'bad'
  return w.accuracy < 80 ? 'weak' : 'good'
}

/** Target phrase as displayed (original casing/punctuation), each word with its Azure score. */
export function markWords(a: Assessment, target: string, level: string): { text: string; level: 'bad' | 'weak' | 'good' }[] {
  const scored = a.words.filter((w) => w.error !== 'Insertion')
  let i = 0
  return target.split(/\s+/).filter(Boolean).map((text) => {
    const n = normalize(text)
    if (!n) return { text, level: 'good' as const }
    const j = scored.findIndex((w, k) => k >= i && normalize(w.word) === n)
    if (j < 0) return { text, level: 'bad' as const }
    i = j + 1
    return { text, level: wordLevel(scored[j], level) }
  })
}

// ── Phonics: judge the sound being taught, not just the word ─────────────────
// Lesson symbols are British IPA (iː, ɜː, əʊ…); Azure en-US scores in American IPA without length
// marks (i, ɝ, oʊ; r → ɹ; ɒ merges into ɑ). Map each lesson symbol to the Azure phonemes that count.
const AZ: Record<string, string[]> = {
  'iː': ['i'], 'ɪ': ['ɪ'], 'uː': ['u'], 'ʊ': ['ʊ'], 'ɑː': ['ɑ'], 'ʌ': ['ʌ'], 'ɒ': ['ɑ', 'ɔ'], 'ɔː': ['ɔ', 'ɑ'],
  'e': ['ɛ'], 'æ': ['æ'], 'ɜː': ['ɝ'], 'ə': ['ə', 'ɚ'], 'əʊ': ['oʊ'], 'ɪə': ['ɪ'], 'eə': ['ɛ'], 'ʊə': ['ʊ'],
  'r': ['ɹ'], 'g': ['g', 'ɡ'],
}
/** Azure phonemes for one lesson symbol ('-p' final, 'str-' cluster, 'tʃ', 'iː'…). */
export function azurePhonemes(symbol: string): string[] {
  const s = symbol.replace(/-/g, '')
  if (AZ[s]) return AZ[s]
  if (s.length > 1 && /^[a-z]+$/.test(s)) return [...s].flatMap((c) => AZ[c] ?? [c]) // clusters: str → s t ɹ
  return [s]
}

export type FocusPhoneme = PhonemeScore & { focus: boolean; heardAs?: string } // heardAs = another lesson sound
export type PhonicsWord = { word: string; accuracy: number; phonemes: FocusPhoneme[] }
export type PhonicsVerdict = {
  ok: boolean
  words: PhonicsWord[]                                                 // the highlighted (practice) words
  weakest?: { symbol: string; score: number; heardAs?: string }        // the lesson sound to work on
}

/** Pass = overall bar for young learners + every lesson-sound phoneme inside the highlighted words
 *  scores ≥ bar.word (a highlighted word without a mapped phoneme falls back to its word score). */
export function phonicsVerdict(a: Assessment, focusWords: string[], symbols: string[]): PhonicsVerdict {
  const bar = barFor('phonics')
  const toSymbol = new Map<string, string>()
  for (const s of symbols) for (const p of azurePhonemes(s)) if (!toSymbol.has(p)) toSymbol.set(p, s)
  const focusSet = new Set(focusWords.map(normalize))
  const words: PhonicsWord[] = a.words
    .filter((w) => focusSet.has(normalize(w.word)) && w.error !== 'Insertion')
    .map((w) => ({
      word: w.word, accuracy: w.accuracy,
      phonemes: w.phonemes.map((ph) => {
        const focus = toSymbol.has(ph.p)
        const top = ph.heard[0]
        const heardAs = focus && top && top !== ph.p && toSymbol.has(top) && toSymbol.get(top) !== toSymbol.get(ph.p) ? toSymbol.get(top) : undefined
        return { ...ph, focus, heardAs }
      }),
    }))

  let weakest: PhonicsVerdict['weakest']
  let ok = a.pronScore >= bar.pron && a.completeness >= bar.completeness && words.length > 0
  for (const w of words) {
    const focus = w.phonemes.filter((p) => p.focus)
    if (!focus.length) { if (w.accuracy < bar.word) ok = false; continue }
    for (const p of focus) {
      if (p.score < bar.word) ok = false
      if (!weakest || p.score < weakest.score) weakest = { symbol: toSymbol.get(p.p)!, score: p.score, heardAs: p.heardAs }
    }
  }
  return { ok, words, weakest }
}
