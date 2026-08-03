'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

type Phase = 'idle' | 'recording' | 'transcribing' | 'error'

type Props = {
  question: string
  disabled?: boolean
  maxSeconds?: number
  onTranscript: (transcript: string) => void
}

function getBestMime(): string {
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/mp4',
    'audio/ogg;codecs=opus',
    'audio/webm',
    'audio/ogg',
  ]
  for (const candidate of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(candidate)) {
      return candidate
    }
  }
  return ''
}

function extensionForMime(mime: string): string {
  if (mime.includes('mp4')) return 'm4a'
  if (mime.includes('ogg')) return 'ogg'
  return 'webm'
}

export default function RecordAnswerButton({
  question,
  disabled = false,
  maxSeconds = 75,
  onTranscript,
}: Props) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [elapsed, setElapsed] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimers = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach(track => track.stop())
    streamRef.current = null
  }, [])

  useEffect(() => () => {
    clearTimers()
    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.onstop = null
      recorderRef.current.stop()
    }
    stopStream()
  }, [clearTimers, stopStream])

  const uploadAudio = async (blob: Blob, mimeType: string) => {
    setPhase('transcribing')
    setError(null)
    try {
      const formData = new FormData()
      formData.append(
        'audio',
        new File([blob], `ielts-answer.${extensionForMime(mimeType)}`, { type: mimeType || 'audio/webm' }),
      )
      formData.append('question', question)

      const response = await fetch('/api/ielts-speaking/transcribe', {
        method: 'POST',
        body: formData,
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data?.error || 'Không thể chuyển giọng nói thành văn bản.')
      const transcript = typeof data.transcript === 'string' ? data.transcript.trim() : ''
      if (!transcript) throw new Error('Không nhận diện được lời nói. Hãy thử lại.')
      onTranscript(transcript)
      setPhase('idle')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Không thể xử lý bản ghi âm.')
      setPhase('error')
    }
  }

  const startRecording = async () => {
    if (disabled || phase === 'recording' || phase === 'transcribing') return
    clearTimers()
    setError(null)
    setElapsed(0)

    try {
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
        throw new Error('Trình duyệt này chưa hỗ trợ ghi âm. Bạn vẫn có thể nhập câu trả lời.')
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      chunksRef.current = []
      const mimeType = getBestMime()
      const recorderOptions: MediaRecorderOptions = {
        audioBitsPerSecond: 64_000,
        ...(mimeType ? { mimeType } : {}),
      }
      const recorder = new MediaRecorder(stream, recorderOptions)
      recorderRef.current = recorder

      recorder.ondataavailable = event => {
        if (event.data.size > 0) chunksRef.current.push(event.data)
      }
      recorder.onerror = () => {
        clearTimers()
        stopStream()
        setError('Ghi âm bị gián đoạn. Hãy thử lại.')
        setPhase('error')
      }
      recorder.onstop = () => {
        clearTimers()
        stopStream()
        const actualMime = recorder.mimeType || mimeType || 'audio/webm'
        const blob = new Blob(chunksRef.current, { type: actualMime })
        void uploadAudio(blob, actualMime)
      }

      recorder.start(500)
      setPhase('recording')
      intervalRef.current = setInterval(() => setElapsed(previous => previous + 1), 1000)
      timeoutRef.current = setTimeout(() => {
        if (recorderRef.current?.state === 'recording') recorderRef.current.stop()
      }, maxSeconds * 1000)
    } catch (caught) {
      stopStream()
      setError(caught instanceof Error ? caught.message : 'Không thể truy cập micro.')
      setPhase('error')
    }
  }

  const stopRecording = () => {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop()
  }

  if (phase === 'recording') {
    return (
      <button
        type="button"
        onClick={stopRecording}
        className="w-full rounded-2xl border-2 border-red-300 bg-red-50 px-4 py-3 font-black text-red-600 transition-all active:scale-[0.98]"
      >
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 animate-pulse rounded-full bg-red-500" />
          Dừng ghi âm · {elapsed}s / {maxSeconds}s
        </span>
      </button>
    )
  }

  if (phase === 'transcribing') {
    return (
      <div className="w-full rounded-2xl border-2 border-indigo-100 bg-indigo-50 px-4 py-3 text-center font-bold text-indigo-600">
        <span className="inline-flex items-center gap-2">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          Đang tạo transcript...
        </span>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={startRecording}
        disabled={disabled}
        className={`w-full rounded-2xl border-2 px-4 py-3 font-black transition-all active:scale-[0.98] ${
          disabled
            ? 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400'
            : 'border-rose-200 bg-rose-50 text-rose-600 hover:border-rose-300 hover:bg-rose-100'
        }`}
      >
        🎤 Ghi âm câu trả lời
      </button>
      {error && (
        <div className="flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          <span>{error}</span>
          <button type="button" onClick={() => { setError(null); setPhase('idle') }} className="font-black">
            Đóng
          </button>
        </div>
      )}
    </div>
  )
}
