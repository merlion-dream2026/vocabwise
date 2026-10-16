// Voice-activity detection for kid recordings — pure logic, fed one mic loudness (RMS) sample per
// frame by useVoiceRecorder. The first CALIBRATE_MS learn the room's noise floor, so "speaking" means
// clearly louder than this room (works in a noisy class and for a quiet kid alike), clamped so a
// silent room isn't hair-trigger and a loud one stays reachable.

export type VadConfig = {
  /** Quiet this long after the child has spoken → stop. */
  silenceMs: number
  /** Nothing heard this long after the start → stop (nothing to score). */
  noSpeechMs: number
  /** Never stop on silence before this — a slow starter isn't cut off. */
  minMs: number
}
export type VadVerdict = 'continue' | 'silence' | 'no-speech'
export type Vad = { step: (rms: number, now: number) => VadVerdict; heard: () => boolean }

export const CALIBRATE_MS = 250
const FLOOR_FACTOR = 2.5
const MIN_THRESHOLD = 0.02
const MAX_THRESHOLD = 0.08

/** Loudness that counts as speech for a given room noise floor. */
export const speechThreshold = (floor: number) => Math.min(MAX_THRESHOLD, Math.max(MIN_THRESHOLD, floor * FLOOR_FACTOR))

export function createVad(cfg: VadConfig, startedAt: number): Vad {
  let floor = Infinity // the quietest frame while calibrating — speech has gaps, so min ≈ the room
  let heard = false
  let lastLoud = startedAt
  return {
    heard: () => heard,
    step(rms, now) {
      const t = now - startedAt
      if (t < CALIBRATE_MS) { floor = Math.min(floor, rms); return 'continue' }
      if (rms > speechThreshold(Number.isFinite(floor) ? floor : 0)) { heard = true; lastLoud = now; return 'continue' }
      if (!heard) return t > cfg.noSpeechMs ? 'no-speech' : 'continue'
      return now - lastLoud > cfg.silenceMs && t > cfg.minMs ? 'silence' : 'continue'
    },
  }
}
