import { describe, it, expect } from 'vitest'
import { createVad, speechThreshold } from '@/lib/vad'

const CFG = { silenceMs: 1000, noSpeechMs: 3000, minMs: 800 }

/** Feeds one RMS value per 20ms frame from t=0 and returns the first non-continue verdict + its time. */
function run(rmsAt: (t: number) => number, cfg = CFG, until = 10000) {
  const vad = createVad(cfg, 0)
  for (let t = 0; t <= until; t += 20) {
    const v = vad.step(rmsAt(t), t)
    if (v !== 'continue') return { v, t, heard: vad.heard() }
  }
  return { v: 'continue' as const, t: until, heard: vad.heard() }
}

describe('vad', () => {
  it('stops once the child has spoken and gone quiet', () => {
    const r = run((t) => (t >= 500 && t < 1500 ? 0.12 : 0.005))
    expect(r.v).toBe('silence')
    expect(r.heard).toBe(true)
    expect(r.t).toBeGreaterThanOrEqual(2500)
    expect(r.t).toBeLessThan(2600)
  })
  it('gives up when nothing is said', () => {
    const r = run(() => 0.005)
    expect(r.v).toBe('no-speech')
    expect(r.heard).toBe(false)
    expect(r.t).toBeGreaterThan(CFG.noSpeechMs)
  })
  it('a short pause mid-sentence does not stop it', () => {
    // speaks, pauses 600ms (< silenceMs), speaks again → stops only after the second burst
    const r = run((t) => ((t >= 300 && t < 900) || (t >= 1500 && t < 2500) ? 0.1 : 0.005))
    expect(r.v).toBe('silence')
    expect(r.t).toBeGreaterThanOrEqual(3500)
  })
  it('adapts to a noisy room: steady background noise is not speech', () => {
    const r = run((t) => (t >= 600 && t < 1400 ? 0.2 : 0.03)) // floor 0.03 → threshold 0.075
    expect(r.v).toBe('silence')
    expect(r.heard).toBe(true)
  })
  it('keeps the threshold within bounds', () => {
    expect(speechThreshold(0)).toBe(0.02)
    expect(speechThreshold(0.01)).toBeCloseTo(0.025)
    expect(speechThreshold(1)).toBe(0.08)
  })
  it('never stops on silence before minMs', () => {
    const r = run((t) => (t >= 260 && t < 300 ? 0.1 : 0.005), { silenceMs: 100, noSpeechMs: 3000, minMs: 1500 })
    expect(r.v).toBe('silence')
    expect(r.t).toBeGreaterThan(1500)
  })
})
