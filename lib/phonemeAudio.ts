// Phoneme audio playback.
// - wikiAudio: isolated phoneme (Wikimedia CC BY-SA) — used in games for clean discrimination
// - learnAudio: native speaker with examples (SpeechActive) — used in learn cards
// - pairAudio: native speaker demonstrating a contrast pair (SpeechActive) — used on pair open

import { speak } from '@/lib/speak'

// ── Static map: IPA symbol → Wikimedia isolated-phoneme audio file ────────────
const P = '/audio/phonemes/'
const WIKI_MAP: Record<string, string> = {
  // Monophthong vowels
  'iː': P + 'Close_front_unrounded_vowel.ogg.mp3',
  'ɪ':  P + 'Near-close_near-front_unrounded_vowel.ogg.mp3',
  'uː': P + 'Close_back_rounded_vowel.ogg.mp3',
  'ʊ':  P + 'Near-close_near-back_rounded_vowel.ogg.mp3',
  'ɑː': P + 'Open_back_unrounded_vowel.ogg.mp3',
  'ʌ':  P + 'PR-open-mid_back_unrounded_vowel2.ogg.mp3',
  'ɒ':  P + 'PR-open_back_rounded_vowel.ogg.mp3',
  'ɔː': P + 'PR-open-mid_back_rounded_vowel.ogg.mp3',
  'e':  P + 'Open-mid_front_unrounded_vowel.ogg.mp3',
  'æ':  P + 'Near-open_front_unrounded_vowel.ogg.mp3',
  'ɜː': P + 'Open-mid_central_unrounded_vowel.ogg.mp3',
  'ə':  P + 'Mid-central_vowel.ogg.mp3',
  // Diphthongs
  'eɪ': P + 'En-us-day.ogg.mp3',
  'aɪ': P + 'En-us-fly.ogg.mp3',
  'əʊ': P + 'En-us-go.ogg.mp3',
  'aʊ': P + 'En-us-cow.ogg.mp3',
  'ɔɪ': P + 'En-us-boy.ogg.mp3',
  'ɪə': P + 'En-uk-ear.ogg.mp3',
  'eə': P + 'En-uk-air.ogg.mp3',
  'ʊə': P + 'En-us-pure.ogg.mp3',
  // Consonants
  'p':  P + 'Voiceless_bilabial_plosive.ogg.mp3',
  'b':  P + 'Voiced_bilabial_plosive.ogg.mp3',
  't':  P + 'Voiceless_alveolar_plosive.ogg.mp3',
  'd':  P + 'Voiced_alveolar_plosive.ogg.mp3',
  'k':  P + 'Voiceless_velar_plosive.ogg.mp3',
  'g':  P + 'Voiced_velar_plosive_02.ogg.mp3',
  'f':  P + 'Voiceless_labio-dental_fricative.ogg.mp3',
  'v':  P + 'Voiced_labio-dental_fricative.ogg.mp3',
  'θ':  P + 'Voiceless_dental_fricative.ogg.mp3',
  'ð':  P + 'Voiced_dental_fricative.ogg.mp3',
  's':  P + 'Voiceless_alveolar_sibilant.ogg.mp3',
  'z':  P + 'Voiced_alveolar_sibilant.ogg.mp3',
  'ʃ':  P + 'Voiceless_palato-alveolar_sibilant.ogg.mp3',
  'ʒ':  P + 'Voiced_palato-alveolar_sibilant.ogg.mp3',
  'tʃ': P + 'Voiceless_palato-alveolar_affricate.ogg.mp3',
  'dʒ': P + 'Voiced_palato-alveolar_affricate.ogg.mp3',
  'm':  P + 'Bilabial_nasal.ogg.mp3',
  'n':  P + 'Alveolar_nasal.ogg.mp3',
  'ŋ':  P + 'Velar_nasal.ogg.mp3',
  'h':  P + 'Voiceless_glottal_fricative.ogg.mp3',
  'w':  P + 'Voiced_labio-velar_approximant.ogg.mp3',
  'j':  P + 'Palatal_approximant.ogg.mp3',
  'l':  P + 'Alveolar_lateral_approximant.ogg.mp3',
  'r':  P + 'En-us-r.ogg.mp3',
}

// Strip leading/trailing dash for final/initial consonant symbols (-p → p, str- → no match)
function getWikiUrl(symbol: string): string | null {
  return WIKI_MAP[symbol] ?? WIKI_MAP[symbol.replace(/^-|-$/g, '')] ?? null
}

export type PhonemeSound = {
  symbol: string
  keyword: string
  emoji?: string
  vi?: string
  wikiAudio?: string | null
  learnAudio?: string | null
}

export type PhonemePair = {
  pairAudio?: string | null
  sounds: PhonemeSound[]
}

let _current: HTMLAudioElement | null = null

function stopAll() {
  if (_current) { _current.pause(); _current.onended = null; _current.onerror = null; _current = null }
  if (typeof window !== 'undefined') window.speechSynthesis?.cancel()
}

function playUrl(url: string, opts: { onDone?: () => void; onFail?: () => void }) {
  const audio = new Audio(url)
  _current = audio
  audio.play().catch(() => { _current = null; opts.onFail?.() })
  audio.onended = () => { _current = null; opts.onDone?.() }
  audio.onerror = () => { _current = null; opts.onFail?.() }
}

/** For GAMES: plays wikiAudio (isolated phoneme) → fallback keyword via Web Speech. No keyword follow-up. */
export function playPhonemeOnly(sound: PhonemeSound, opts: { onDone?: () => void } = {}) {
  stopAll()
  const url = sound.wikiAudio || getWikiUrl(sound.symbol)
  if (url) {
    playUrl(url, {
      onDone: opts.onDone,
      onFail: () => speak(sound.keyword, { rate: 0.8, onEnd: opts.onDone, onError: opts.onDone }),
    })
  } else {
    speak(sound.keyword, { rate: 0.8, onEnd: opts.onDone, onError: opts.onDone })
  }
}

/** For LEARN CARDS: plays learnAudio (SA native speaker) → fallback wikiAudio → fallback keyword.
 *  Optionally follows with the keyword via Web Speech for extra reinforcement. */
export function playPhoneme(sound: PhonemeSound, opts: { thenKeyword?: boolean; onDone?: () => void } = {}) {
  stopAll()
  const { thenKeyword = true, onDone } = opts

  const afterAudio = () => {
    if (thenKeyword) {
      setTimeout(() => speak(sound.keyword, { rate: 0.75, onEnd: onDone, onError: onDone }), 600)
    } else {
      onDone?.()
    }
  }

  const url = sound.learnAudio || sound.wikiAudio || getWikiUrl(sound.symbol)
  if (url) {
    playUrl(url, {
      onDone: afterAudio,
      onFail: () => speak(sound.keyword, { rate: 0.75, onEnd: onDone, onError: onDone }),
    })
  } else {
    speak(sound.keyword, { rate: 0.75, onEnd: onDone, onError: onDone })
  }
}

/** For PAIR CARDS: plays pairAudio (SA contrast demo) → fallback to first sound's learnAudio. */
export function playPairContrast(pair: PhonemePair, opts: { onDone?: () => void } = {}) {
  stopAll()
  const url = pair.pairAudio
  if (url) {
    playUrl(url, {
      onDone: opts.onDone,
      onFail: () => {
        // fallback: play first sound then second sound
        const [s1, s2] = pair.sounds
        if (!s1) { opts.onDone?.(); return }
        playPhoneme(s1, {
          thenKeyword: false,
          onDone: s2 ? () => setTimeout(() => playPhoneme(s2, { thenKeyword: false, onDone: opts.onDone }), 400) : opts.onDone,
        })
      },
    })
  } else {
    // No pairAudio: play each sound then say its keyword
    // Sequence: [phoneme audio] → [keyword TTS] → [next phoneme audio] → [keyword TTS]
    const [s1, s2] = pair.sounds
    if (!s1) { opts.onDone?.(); return }
    playPhoneme(s1, {
      thenKeyword: true,
      onDone: s2 ? () => setTimeout(() => playPhoneme(s2, { thenKeyword: true, onDone: opts.onDone }), 400) : opts.onDone,
    })
  }
}

export function stopPhoneme() { stopAll() }
