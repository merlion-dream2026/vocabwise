'use client'

import { useEffect, useMemo, useState } from 'react'

type Props = {
  text: string
  language?: string
  compact?: boolean
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

function estimateSpeakingTimeSeconds(wordCount: number): number {
  return Math.max(1, Math.round((wordCount / 125) * 60))
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `~${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const remainder = seconds % 60
  return remainder === 0 ? `~${minutes}m` : `~${minutes}m ${remainder}s`
}

export default function AnswerActions({
  text,
  language = 'en-GB',
  compact = false,
}: Props) {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [copied, setCopied] = useState(false)

  const wordCount = useMemo(() => countWords(text), [text])
  const estimatedDuration = useMemo(
    () => estimateSpeakingTimeSeconds(wordCount),
    [wordCount],
  )

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined') {
        window.speechSynthesis?.cancel()
      }
    }
  }, [])

  const toggleSpeech = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return

    if (isSpeaking) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
      return
    }

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = language
    utterance.rate = 0.92
    utterance.pitch = 1

    const voices = window.speechSynthesis.getVoices()
    const exactVoice = voices.find(voice => voice.lang.toLowerCase() === language.toLowerCase())
    const englishVoice = voices.find(voice => voice.lang.toLowerCase().startsWith('en'))
    if (exactVoice || englishVoice) utterance.voice = exactVoice ?? englishVoice ?? null

    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)
    setIsSpeaking(true)
    window.speechSynthesis.speak(utterance)
  }

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${compact ? 'mt-2' : 'mt-3'}`}>
      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-500">
        {wordCount} từ · {formatDuration(estimatedDuration)}
      </span>
      <button
        type="button"
        onClick={toggleSpeech}
        className="rounded-full border border-indigo-200 bg-white px-3 py-1 text-xs font-black text-indigo-700 transition-colors hover:bg-indigo-50"
        aria-label={isSpeaking ? 'Dừng đọc câu trả lời mẫu' : 'Nghe câu trả lời mẫu'}
      >
        {isSpeaking ? '■ Dừng' : '▶ Nghe'}
      </button>
      <button
        type="button"
        onClick={copyText}
        className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-black text-gray-600 transition-colors hover:bg-gray-50"
      >
        {copied ? '✓ Đã sao chép' : '⧉ Sao chép'}
      </button>
    </div>
  )
}
