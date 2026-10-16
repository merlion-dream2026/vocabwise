'use client'

// One recorder for the "say it" screens (🎶 Nhịp điệu câu, 🎤 Đọc thử, level-test Nói, 🦘 Hô to AI
// mode): opens the mic, records, shows a countdown + live level, and stops by itself — once the child
// has spoken and gone quiet (lib/vad.ts), when nothing was said at all, or at the hard cap. The stop
// button still works. A take with no speech is never handed back for scoring (saves AI quota).
// Leaving the page or hiding the tab drops the take and releases the mic.

import { useCallback, useEffect, useRef, useState } from 'react'
import { createVad, type VadConfig } from '@/lib/vad'
import { micErrorOf, type MicError } from '@/lib/micHelp'

export function pickMime(): string {
  for (const t of ['audio/webm', 'audio/mp4', 'audio/ogg']) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)) return t
  }
  return 'audio/webm'
}
export const extFor = (mime: string) => (mime.includes('mp4') ? 'm4a' : mime.includes('ogg') ? 'ogg' : 'webm')

export type Recording = { blob: Blob; file: File; mimeType: string }
export type VoiceRecorderOptions = VadConfig & {
  maxSecs: number
  onDone: (r: Recording) => void
  /** Nothing was said (or only noise) — nothing to score. */
  onNoSpeech: () => void
}
export type RecorderPhase = 'idle' | 'starting' | 'recording'

type AudioCtor = typeof AudioContext

export function useVoiceRecorder(opts: VoiceRecorderOptions) {
  const [phase, setPhase] = useState<RecorderPhase>('idle')
  const [timeLeft, setTimeLeft] = useState(opts.maxSecs)
  const [level, setLevel] = useState(0)
  const [error, setError] = useState<MicError | null>(null)

  const optsRef = useRef(opts)
  optsRef.current = opts
  const busy = useRef(false)
  const discard = useRef(false)
  const mrRef = useRef<MediaRecorder | null>(null)
  const cleanupRef = useRef<(() => void) | null>(null)

  const stop = useCallback(() => {
    if (mrRef.current?.state === 'recording') mrRef.current.stop()
  }, [])
  const cancel = useCallback(() => {
    discard.current = true
    if (mrRef.current?.state === 'recording') mrRef.current.stop()
    else cleanupRef.current?.()
  }, [])

  const start = useCallback(async (): Promise<boolean> => {
    if (busy.current) return false
    busy.current = true
    discard.current = false
    setError(null)
    setPhase('starting')
    const o = optsRef.current
    // The AudioContext is made inside the tap (before any await): iOS keeps a context made later
    // suspended, and a suspended meter would read silence.
    let ctx: AudioContext | null = null
    try {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: AudioCtor }).webkitAudioContext
      ctx = Ctx ? new Ctx() : null
    } catch { ctx = null }

    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch (e) {
      ctx?.close().catch(() => {})
      busy.current = false
      setPhase('idle')
      setError(micErrorOf(e))
      return false
    }

    const mimeType = pickMime()
    const mr = new MediaRecorder(stream, { mimeType })
    const chunks: BlobPart[] = []
    let raf: number | null = null
    let tick: ReturnType<typeof setInterval> | null = null
    let cap: ReturnType<typeof setTimeout> | null = null
    // live = the meter has read real (non-zero) sound at least once; until then it may be broken
    // (no Web Audio, a suspended context) and we don't trust it to say "nobody spoke".
    let live = false
    const t0 = performance.now()
    const vad = createVad(o, t0)

    const cleanup = () => {
      if (raf !== null) cancelAnimationFrame(raf)
      if (tick) clearInterval(tick)
      if (cap) clearTimeout(cap)
      raf = null; tick = null; cap = null
      ctx?.close().catch(() => {})
      ctx = null
      stream.getTracks().forEach((t) => t.stop())
      cleanupRef.current = null
      mrRef.current = null
      busy.current = false
      setLevel(0)
      setPhase('idle')
    }
    cleanupRef.current = cleanup

    mr.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data) }
    mr.onstop = () => {
      const spoke = !live || vad.heard()
      cleanup()
      if (discard.current) return
      if (!spoke) { optsRef.current.onNoSpeech(); return }
      const blob = new Blob(chunks, { type: mimeType })
      optsRef.current.onDone({ blob, mimeType, file: new File([blob], `rec.${extFor(mimeType)}`, { type: mimeType }) })
    }

    if (ctx) {
      try {
        void ctx.resume().catch(() => {})
        const analyser = ctx.createAnalyser()
        analyser.fftSize = 512
        ctx.createMediaStreamSource(stream).connect(analyser)
        const buf = new Float32Array(analyser.fftSize)
        let lastLvl = 0
        const frame = () => {
          analyser.getFloatTimeDomainData(buf)
          let sum = 0
          for (const v of buf) sum += v * v
          const rms = Math.sqrt(sum / buf.length)
          if (rms > 1e-5) live = true
          // 0.1 steps → re-render only when the bars visibly change
          const lvl = Math.round(Math.min(1, rms / 0.2) * 10) / 10
          if (lvl !== lastLvl) { lastLvl = lvl; setLevel(lvl) }
          const verdict = live ? vad.step(rms, performance.now()) : 'continue'
          if (verdict !== 'continue') { raf = null; stop(); return }
          raf = requestAnimationFrame(frame)
        }
        raf = requestAnimationFrame(frame)
      } catch { /* no meter → the stop button and the cap still end it */ }
    }

    mr.start()
    mrRef.current = mr
    setTimeLeft(o.maxSecs)
    setPhase('recording')
    tick = setInterval(() => setTimeLeft((s) => Math.max(0, s - 1)), 1000)
    cap = setTimeout(stop, o.maxSecs * 1000)
    return true
  }, [stop])

  useEffect(() => {
    const onHide = () => { if (document.visibilityState === 'hidden') cancel() }
    document.addEventListener('visibilitychange', onHide)
    return () => { document.removeEventListener('visibilitychange', onHide); cancel() }
  }, [cancel])

  return { phase, recording: phase === 'recording', timeLeft, level, error, start, stop, cancel }
}
