'use client'

// Recorded voice for Phonics + Word Stress: speakClip() has speak()'s signature, plays the ElevenLabs
// clip for that text when there is one (scripts/gen-audio-phonics.mjs) and falls back to browser TTS
// otherwise — so a screen switches over by changing its import only.
// The text → file map is a code-split chunk (updates on every deploy). It is deliberately not under
// /audio/: the service worker serves /audio/ cache-first forever. Clip names carry a content hash.

import { speak } from './speak'

type SpeakOptions = NonNullable<Parameters<typeof speak>[1]>

/** Same rule as clipKey() in scripts/gen-audio-phonics.mjs — keep them in sync. */
export function clipKey(text: string): string {
  return text.normalize('NFC').replace(/\*\*/g, '').replace(/[‘’]/g, "'").replace(/\s+/g, ' ')
    .trim().toLowerCase().replace(/[.!?,;:]+$/, '')
}

let clips: Record<string, string> | null = null
// Start loading as soon as a Phonics screen imports this, so the map is ready by the first tap
// (iOS only plays audio started inside the tap — no waiting for a fetch there).
if (typeof window !== 'undefined') {
  import('@/data/phonics-audio.json')
    .then((m) => { clips = (m.default ?? m) as Record<string, string> })
    .catch(() => { clips = {} })
}

// One shared element: iOS unlocks an element on its first tap-started play, after which the games'
// auto-play (next question, after a timeout) still works on it — a fresh Audio() each time would not.
let el: HTMLAudioElement | null = null
let token = 0 // bumps on every new clip/stop → late events from the previous clip are ignored

export function stopClip() {
  token++
  if (el && !el.paused) el.pause()
}

export function hasClip(text: string): boolean {
  return !!clips?.[clipKey(text)]
}

export function speakClip(text: string, options: SpeakOptions = {}) {
  const file = clips?.[clipKey(text)]
  if (!file || typeof Audio === 'undefined') { stopClip(); speak(text, options); return }
  stopClip()
  window.speechSynthesis?.cancel()
  const my = token
  const { rate = 0.9, onStart, onEnd } = options
  const audio = (el ??= new Audio())
  audio.src = `/audio/phonics/${encodeURIComponent(file)}`
  // speak() rates are around 0.9 = normal; recordings are natural speed → scale, keep pitch
  audio.playbackRate = Math.min(1.1, Math.max(0.7, rate / 0.9))
  audio.onplaying = () => { if (my === token) onStart?.() }
  audio.onended = () => { if (my === token) { token++; onEnd?.() } }
  // Missing file / blocked autoplay / decode error → browser TTS, as before this file existed
  const fallback = () => { if (my === token) { token++; speak(text, options) } }
  audio.onerror = fallback
  audio.play().catch(fallback)
}
