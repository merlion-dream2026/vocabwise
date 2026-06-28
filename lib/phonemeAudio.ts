// Phoneme audio playback.
// - PHONEME_MAP: IPA symbol → /audio/phonemes/american/{symbol}.mp3 (single source of truth)
// - learnAudio: native speaker with examples (SpeechActive) — used in learn cards
// - pairAudio: native speaker demonstrating a contrast pair (SpeechActive) — used on pair open

import { speak } from '@/lib/speak'

// ── Static map: IPA symbol → isolated-phoneme audio file ─────────────────────
const A = '/audio/phonemes/american/'
const PHONEME_MAP: Record<string, string> = {
  // Monophthong vowels
  'iː': A + 'iː.mp3',
  'ɪ':  A + 'ɪ.mp3',
  'uː': A + 'uː.mp3',
  'ʊ':  A + 'ʊ.mp3',
  'ɑː': A + 'ɑː.mp3',
  'ʌ':  A + 'ʌ.mp3',
  'ɒ':  A + 'ɒ.mp3',
  'ɔː': A + 'ɔː.mp3',
  'e':  A + 'e.mp3',
  'æ':  A + 'æ.mp3',
  'ɜː': A + 'ɜː.mp3',
  'ə':  A + 'ə.mp3',
  // Diphthongs
  'eɪ': A + 'eɪ.mp3',
  'aɪ': A + 'aɪ.mp3',
  'əʊ': A + 'əʊ.mp3',
  'aʊ': A + 'aʊ.mp3',
  'ɔɪ': A + 'ɔɪ.mp3',
  'ɪə': A + 'ɪə.mp3',
  'eə': A + 'eə.mp3',
  'ʊə': A + 'ʊə.mp3',
  // Consonants
  'p':  A + 'p.mp3',
  'b':  A + 'b.mp3',
  't':  A + 't.mp3',
  'd':  A + 'd.mp3',
  'k':  A + 'k.mp3',
  'g':  A + 'g.mp3',
  'f':  A + 'f.mp3',
  'v':  A + 'v.mp3',
  'θ':  A + 'θ.mp3',
  'ð':  A + 'ð.mp3',
  's':  A + 's.mp3',
  'z':  A + 'z.mp3',
  'ʃ':  A + 'ʃ.mp3',
  'ʒ':  A + 'ʒ.mp3',
  'tʃ': A + 'tʃ.mp3',
  'dʒ': A + 'dʒ.mp3',
  'm':  A + 'm.mp3',
  'n':  A + 'n.mp3',
  'ŋ':  A + 'ŋ.mp3',
  'h':  A + 'h.mp3',
  'w':  A + 'w.mp3',
  'j':  A + 'j.mp3',
  'l':  A + 'l.mp3',
  'r':  A + 'r.mp3',
}

// Strip leading/trailing dash for final/initial consonant symbols (-p → p)
function getPhonemeUrl(symbol: string): string | null {
  return PHONEME_MAP[symbol] ?? PHONEME_MAP[symbol.replace(/^-|-$/g, '')] ?? null
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

/** For GAMES: plays isolated phoneme audio → fallback keyword via Web Speech. No keyword follow-up. */
export function playPhonemeOnly(sound: PhonemeSound, opts: { onDone?: () => void } = {}) {
  stopAll()
  const url = sound.learnAudio || getPhonemeUrl(sound.symbol)
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

  const url = sound.learnAudio || getPhonemeUrl(sound.symbol)
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
