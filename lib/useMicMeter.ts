'use client'

// Live mic level + silence auto-stop for the "Phát âm cùng AI" games (SpeakGame, PhonicsSpeak).
// start(stream) when the mic opens; markRecording() when the real recording begins
// (silence during the get-ready second doesn't count); onSilence fires once after
// the kid has spoken and then gone quiet for SILENCE_MS.
// "Speaking" = louder than this room's noise floor, measured during the get-ready second
// (same rule as lib/vad.ts). The old fixed bar (0.04) took a softly spoken last word
// ("brown… shoes") for silence and cut it off — Azure then scored that word ~0–30.

import { useCallback, useEffect, useRef, useState } from 'react'
import { speechThreshold } from './vad'

const SILENCE_MS = 1500
const MIN_REC_MS = 800

export function useMicMeter(onSilence: () => void) {
  const [level, setLevel] = useState(0)
  const ctxRef = useRef<AudioContext | null>(null)
  const rafRef = useRef<number | null>(null)
  const sinceRef = useRef<number | null>(null)
  const onSilenceRef = useRef(onSilence)
  onSilenceRef.current = onSilence

  const stop = useCallback(() => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null }
    ctxRef.current?.close().catch(() => {})
    ctxRef.current = null
    sinceRef.current = null
    setLevel(0)
  }, [])

  const start = useCallback((stream: MediaStream) => {
    stop()
    try {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const ctx = new Ctx()
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 512
      ctx.createMediaStreamSource(stream).connect(analyser)
      ctxRef.current = ctx
      const buf = new Float32Array(analyser.fftSize)
      let heard = false
      let lastLoud = 0
      let floor = Infinity // quietest live frame before recording starts = the room
      let lastLvl = 0
      const tick = () => {
        analyser.getFloatTimeDomainData(buf)
        let sum = 0
        for (const v of buf) sum += v * v
        const rms = Math.sqrt(sum / buf.length)
        // 0.1 steps → re-render only when the bars visibly change, not every frame
        const lvl = Math.round(Math.min(1, rms / 0.2) * 10) / 10
        if (lvl !== lastLvl) { lastLvl = lvl; setLevel(lvl) }
        const since = sinceRef.current
        const now = performance.now()
        if (since === null) {
          if (rms > 1e-5) floor = Math.min(floor, rms) // all-zero frames = mic not live yet
        } else {
          if (rms > speechThreshold(Number.isFinite(floor) ? floor : 0)) { heard = true; lastLoud = now }
          else if (heard && now - lastLoud > SILENCE_MS && now - since > MIN_REC_MS) {
            rafRef.current = null
            onSilenceRef.current()
            return
          }
        }
        rafRef.current = requestAnimationFrame(tick)
      }
      rafRef.current = requestAnimationFrame(tick)
    } catch { /* no Web Audio → fixed-length recording as before */ }
  }, [stop])

  const markRecording = useCallback(() => { sinceRef.current = performance.now() }, [])
  /** ms since markRecording() (0 before) — logged with each score to spot cut-off clips. */
  const elapsed = useCallback(() => (sinceRef.current === null ? 0 : Math.round(performance.now() - sinceRef.current)), [])

  useEffect(() => stop, [stop])

  return { level, start, markRecording, stop, elapsed }
}
