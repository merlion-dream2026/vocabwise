// Phoneme audio playback.
// - wikiAudio: isolated phoneme (Wikimedia CC BY-SA) — used in games for clean discrimination
// - learnAudio: native speaker with examples (SpeechActive) — used in learn cards
// - pairAudio: native speaker demonstrating a contrast pair (SpeechActive) — used on pair open

import { speak } from '@/lib/speak'

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
  const url = sound.wikiAudio
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

  const url = sound.learnAudio || sound.wikiAudio
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
