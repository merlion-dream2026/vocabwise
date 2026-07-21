'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useGameSync } from '@/lib/GameSyncContext'
import { playCorrectSound, playWrongSound } from '@/lib/gameSound'
import Confetti from '@/components/Confetti'
import { speak as speakWord } from '@/lib/speak'
import WordIcon from '@/components/WordIcon'

type Word = { word: string; meaning: string; emoji: string; examples?: { en: string; vi: string }[] }
type Topic = { id: string; name: string; emoji: string; words: Word[] }
type Props = { topic: Topic; level: string; backUrl: string; isStarter?: boolean }

function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5) }

function getBestMime() {
  for (const t of ['audio/webm', 'audio/mp4', 'audio/ogg']) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)) return t
  }
  return 'audio/webm'
}

const MAX_SECS = 8
type Phase = 'idle' | 'countdown' | 'recording' | 'processing' | 'done'

export default function SpeakGame({ topic, level, backUrl }: Props) {
  const router = useRouter()
  const { recordAnswer, recordActivity, addScore, recordPerfectGame, flush } = useGameSync()
  const [questions] = useState(() => shuffle(topic.words))
  const [idx, setIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [wrongWords, setWrongWords] = useState<string[]>([])
  const [gameDone, setGameDone] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  const [phase, setPhase] = useState<Phase>('idle')
  const [countdown, setCountdown] = useState(3)
  const [transcript, setTranscript] = useState('')
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [unclear, setUnclear] = useState(false)
  const [micError, setMicError] = useState<string | null>(null)
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState(MAX_SECS)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const autoStopRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const answeredRef = useRef(false)
  const autoSpeakCancelRef = useRef(false)
  const speak = useCallback((t: string) => speakWord(t, { rate: 0.85 }), [])

  const q = questions[idx]
  const total = questions.length
  const maxWords = level === 'seeker' ? 7 : level === 'starter' ? 9 : 15
  const rawExample = q.examples?.[0]?.en ?? ''
  const exampleOk = rawExample && rawExample.split(' ').length <= maxWords
  // Use example sentence if available + within limit; else fall back to word
  const speakTarget = exampleOk ? rawExample : q.word
  const isSentence = speakTarget !== q.word

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
  }, [])

  const clearTimers = useCallback(() => {
    if (timerRef.current)    { clearInterval(timerRef.current);   timerRef.current = null }
    if (autoStopRef.current) { clearTimeout(autoStopRef.current); autoStopRef.current = null }
    if (countdownRef.current){ clearInterval(countdownRef.current); countdownRef.current = null }
  }, [])

  useEffect(() => {
    if (gameDone) {
      addScore(level, Math.round(score * 1.5))
      if (score === total) { recordPerfectGame(level, topic.id, 'speak'); setShowConfetti(true) }
      flush()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameDone])

  useEffect(() => {
    if (gameDone) return
    setPhase('idle')
    setTranscript('')
    setIsCorrect(null)
    setUnclear(false)
    setMicError(null)
    setTimeLeft(MAX_SECS)
    answeredRef.current = false
    if (playbackUrl) { URL.revokeObjectURL(playbackUrl); setPlaybackUrl(null) }
    autoSpeakCancelRef.current = false
    const t = setTimeout(() => {
      speakWord(q.word, {
        rate: 0.85,
        onEnd: () => {
          if (autoSpeakCancelRef.current || !isSentence) return
          setTimeout(() => {
            if (!autoSpeakCancelRef.current) speakWord(speakTarget, { rate: 0.85 })
          }, 400)
        }
      })
    }, 300)
    return () => {
      autoSpeakCancelRef.current = true
      clearTimeout(t)
      clearTimers()
      window.speechSynthesis?.cancel()
      if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop()
      stopStream()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, gameDone])

  const startRecording = async () => {
    setMicError(null)
    if (playbackUrl) { URL.revokeObjectURL(playbackUrl); setPlaybackUrl(null) }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const mimeType = getBestMime()
      chunksRef.current = []

      const mr = new MediaRecorder(stream, { mimeType })
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.onstop = async () => {
        stopStream()
        const blob = new Blob(chunksRef.current, { type: mimeType })
        setPlaybackUrl(URL.createObjectURL(blob))
        await scoreAudio(blob, mimeType)
      }
      mr.start()
      mediaRecorderRef.current = mr

      // Countdown 3-2-1: MediaRecorder warms up during this time
      setPhase('countdown')
      setCountdown(3)
      let count = 3
      countdownRef.current = setInterval(() => {
        count--
        if (count > 0) {
          setCountdown(count)
        } else {
          clearInterval(countdownRef.current!)
          countdownRef.current = null
          setPhase('recording')
          setTimeLeft(MAX_SECS)
          timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
              if (prev <= 1) { clearTimers(); return 0 }
              return prev - 1
            })
          }, 1000)
          autoStopRef.current = setTimeout(() => {
            if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop()
            clearTimers()
          }, MAX_SECS * 1000)
        }
      }, 1000)

    } catch (e: unknown) {
      const name = (e as { name?: string }).name
      if (name === 'NotAllowedError') setMicError('Chưa cấp quyền micro. Vào Settings → cho phép Microphone.')
      else setMicError('Không thể mở micro. Thử lại nhé.')
    }
  }

  const stopRecording = () => {
    clearTimers()
    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop()
  }

  const scoreAudio = async (blob: Blob, mimeType: string) => {
    setPhase('processing')
    try {
      const ext = mimeType.includes('mp4') ? 'm4a' : mimeType.includes('ogg') ? 'ogg' : 'webm'
      const fd = new FormData()
      fd.append('audio', new File([blob], `rec.${ext}`, { type: mimeType }))
      fd.append('target', speakTarget)
      fd.append('word', q.word)

      const res = await fetch('/api/score-pronunciation', { method: 'POST', body: fd })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()

      const correct  = !!data.correct
      const isUnclear = !!data.unclear   // Whisper hallucinated → không phải lỗi của bé
      setTranscript(data.transcript ?? '')
      setIsCorrect(correct)
      setUnclear(isUnclear)
      setPhase('done')
      if (!isUnclear) {
        recordAnswer(level, topic.id, q, correct)
        if (correct && !answeredRef.current) { answeredRef.current = true; setScore(s => s + 1) }
        if (!correct) setWrongWords(ww => ww.includes(q.word) ? ww : [...ww, q.word])
        if (correct) playCorrectSound(); else playWrongSound()
      }
    } catch {
      setMicError('Lỗi kết nối. Bấm Thử lại.')
      setPhase('idle')
    }
  }

  const retry = () => {
    clearTimers()
    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop()
    stopStream()
    if (playbackUrl) { URL.revokeObjectURL(playbackUrl); setPlaybackUrl(null) }
    setTranscript('')
    setIsCorrect(null)
    setUnclear(false)
    setMicError(null)
    setTimeLeft(MAX_SECS)
    setPhase('idle')
  }

  const advance = (delta = 1) => {
    clearTimers()
    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop()
    stopStream()
    const next = idx + delta
    if (next < 0) return
    if (next >= total) { recordActivity(level); setGameDone(true) }
    else setIdx(next)
  }

  const restart = () => {
    clearTimers()
    stopStream()
    if (playbackUrl) URL.revokeObjectURL(playbackUrl)
    setIdx(0); setScore(0); setWrongWords([]); setGameDone(false); setShowConfetti(false)
    setPhase('idle'); setTranscript(''); setIsCorrect(null); setMicError(null)
    answeredRef.current = false; setPlaybackUrl(null); setTimeLeft(MAX_SECS)
  }

  if (gameDone) {
    const pct = Math.round((score / total) * 100)
    const xpEarned = Math.round(score * 1.5)
    return (
      <div className="flex flex-col min-h-screen">
        {showConfetti && <Confetti />}
        <div className="bg-gradient-to-br from-rose-400 to-pink-500 px-4 pt-6 pb-4 text-white">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push(backUrl)} aria-label="Quay lại" className="text-rose-100 text-xl flex-shrink-0">←</button>
            <div className="flex-1 min-w-0">
              <p className="text-rose-100 text-[11px] font-bold uppercase tracking-wide leading-none mb-0.5">{topic.name}</p>
              <h1 className="text-lg font-black leading-tight truncate">🎤 Phát âm cùng AI ✨</h1>
            </div>
          </div>
        </div>
        <div className="flex-1 bg-gradient-to-b from-rose-50 to-pink-50 flex flex-col items-center justify-center px-4 py-8">
          <div className="text-7xl mb-4">{score === total ? '🏆' : score >= total * 0.7 ? '⭐' : '💪'}</div>
          <h2 className="text-3xl font-black text-gray-800 mb-1">{score}/{total} chính xác</h2>
          <p className="text-gray-500 font-bold text-xl mb-2">{pct}%</p>
          <div className="inline-flex items-center gap-1.5 bg-yellow-50 border border-yellow-200 rounded-full px-4 py-1.5 mb-4">
            <span className="text-base">⭐</span>
            <span className="text-yellow-700 font-black text-sm">+{xpEarned} XP</span>
          </div>
          {wrongWords.length > 0 && (
            <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl px-4 py-3 mb-6 w-full">
              <p className="text-orange-700 font-bold text-sm mb-2">📝 Cần ôn thêm:</p>
              <div className="flex flex-wrap gap-2">
                {wrongWords.map(w => <span key={w} className="bg-orange-100 text-orange-700 font-bold text-sm px-3 py-1 rounded-full">{w}</span>)}
              </div>
            </div>
          )}
          <div className="w-full space-y-3">
            <button onClick={restart} className="w-full bg-rose-500 text-white font-black text-xl py-4 rounded-2xl shadow-lg">🔄 Chơi lại</button>
            <button onClick={() => router.push(backUrl)} className="w-full bg-white border-2 border-gray-200 text-gray-600 font-bold text-xl py-4 rounded-2xl">← Chọn chế độ khác</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-rose-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-rose-400 to-pink-500 px-4 pt-6 pb-4 text-white">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => router.push(backUrl)} aria-label="Quay lại" className="text-rose-100 text-xl flex-shrink-0">←</button>
          <div className="flex-1 min-w-0">
            <p className="text-rose-100 text-[11px] font-bold uppercase tracking-wide leading-none mb-0.5">{topic.name}</p>
            <h1 className="text-lg font-black leading-tight truncate">🎤 Phát âm cùng AI</h1>
          </div>
          <span className="bg-white/20 px-3 py-1 rounded-full font-black text-sm flex-shrink-0">{idx + 1}/{total}</span>
        </div>
        <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full bg-white/70 rounded-full transition-all" style={{ width: `${((idx + 1) / total) * 100}%` }} />
        </div>
      </div>

      <div className="flex-1 flex flex-col px-4 py-4 gap-4">
        {/* Target card — word + sentence unified */}
        <div className="bg-white rounded-3xl p-5 shadow-md w-full">
          <div className="flex flex-col items-center text-center">
            <div className="mb-2 flex justify-center">
              <WordIcon word={q.word} emoji={q.emoji} emojiClass="text-5xl" iconSize={60} />
            </div>
            <p className="text-3xl font-black text-gray-800">{q.word}</p>
            <p className="text-base text-gray-400 font-semibold mt-0.5">{q.meaning}</p>
          </div>

          {isSentence ? (
            <>
              <div className="my-3 border-t border-gray-100" />
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-base font-bold text-gray-700 leading-snug">&ldquo;{speakTarget}&rdquo;</p>
                  {q.examples?.[0]?.vi && (
                    <p className="text-sm text-gray-400 font-medium mt-1">{q.examples[0].vi}</p>
                  )}
                </div>
                <button onClick={() => speak(speakTarget)}
                  className="flex-shrink-0 w-9 h-9 rounded-full bg-rose-50 flex items-center justify-center text-lg active:scale-90 transition-all">
                  🔊
                </button>
              </div>
            </>
          ) : (
            <div className="flex justify-center mt-3">
              <button onClick={() => speak(speakTarget)}
                className="bg-rose-50 text-rose-400 font-bold px-5 py-2 rounded-xl text-sm flex items-center gap-1.5 active:scale-90 transition-all">
                🔊 Nghe phát âm
              </button>
            </div>
          )}
        </div>

        {/* Action zone */}
        <div className="flex-1 flex flex-col items-center justify-center gap-4">

          {phase === 'idle' && (
            <>
              <button onClick={startRecording}
                className="w-20 h-20 rounded-full bg-rose-400 shadow-xl flex items-center justify-center text-4xl active:scale-90 hover:bg-rose-500 transition-all">
                🎤
              </button>
              {micError
                ? <p className="text-red-500 font-semibold text-sm text-center max-w-xs">{micError}</p>
                : <p className="text-gray-400 font-semibold text-sm">Bấm để đọc</p>
              }
            </>
          )}

          {phase === 'countdown' && (
            <>
              <div className="w-20 h-20 rounded-full bg-rose-100 border-4 border-rose-300 flex items-center justify-center animate-pulse">
                <span className="text-5xl font-black text-rose-500">{countdown}</span>
              </div>
              <p className="text-rose-400 font-bold text-sm">Chuẩn bị đọc...</p>
              <button onClick={retry} className="text-gray-300 text-xs font-semibold underline active:scale-95 transition-all">Huỷ</button>
            </>
          )}

          {phase === 'recording' && (
            <>
              <button onClick={stopRecording}
                className="w-20 h-20 rounded-full bg-rose-600 shadow-xl flex items-center justify-center text-3xl animate-pulse active:scale-95 transition-all">
                ⏹️
              </button>
              <p className="text-rose-500 font-bold text-sm animate-pulse">Đang thu âm...</p>
              <div className="w-full">
                <div className="w-full bg-rose-100 rounded-full h-2 overflow-hidden">
                  <div className="h-full bg-rose-400 rounded-full transition-all duration-1000"
                    style={{ width: `${(timeLeft / MAX_SECS) * 100}%` }} />
                </div>
                <p className="text-rose-300 text-xs font-semibold text-center mt-1">{timeLeft}s · bấm ⏹️ để dừng</p>
              </div>
            </>
          )}

          {phase === 'processing' && (
            <>
              <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center text-3xl animate-spin">⏳</div>
              <p className="text-indigo-400 font-bold text-sm">Đang chấm điểm...</p>
            </>
          )}

          {phase === 'done' && unclear && (
            <div className="w-full flex flex-col gap-3">
              <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 text-center">
                <p className="text-2xl mb-1">🔄</p>
                <p className="font-black text-amber-700">Chưa nghe rõ tiếng Anh</p>
                <p className="text-amber-500 text-sm mt-1">Đọc to hơn và gần micro hơn nhé!</p>
              </div>
              {playbackUrl && (
                <button onClick={() => new Audio(playbackUrl).play()}
                  className="w-full bg-white border-2 border-rose-100 text-rose-500 font-bold text-sm py-2.5 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all">
                  ▶️ Nghe lại giọng của bạn
                </button>
              )}
              <div className="flex gap-3">
                <button onClick={retry} className="flex-1 bg-rose-500 text-white font-black py-3 rounded-2xl shadow-md active:scale-95 transition-all">🎤 Thử lại</button>
                <button onClick={() => advance(1)} className="flex-1 bg-white border-2 border-gray-100 text-gray-400 font-bold py-3 rounded-2xl active:scale-95 transition-all">Bỏ qua →</button>
              </div>
            </div>
          )}

          {phase === 'done' && !unclear && (
            <div className="w-full flex flex-col gap-3">
              <div className={`rounded-2xl p-4 text-center border-2 ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <p className="text-2xl mb-1">{isCorrect ? '✅' : '❌'}</p>
                {transcript && (
                  <p className="font-bold text-gray-600 text-sm">Bạn đọc: <span className="italic">&ldquo;{transcript}&rdquo;</span></p>
                )}
                {!isCorrect && (
                  <p className="text-green-600 font-bold text-sm mt-1">Đáp án: &ldquo;{speakTarget}&rdquo;</p>
                )}
              </div>
              {playbackUrl && (
                <button onClick={() => new Audio(playbackUrl).play()}
                  className="w-full bg-white border-2 border-rose-100 text-rose-500 font-bold text-sm py-2.5 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all">
                  ▶️ Nghe lại giọng của bạn
                </button>
              )}
              <div className="flex gap-3">
                <button onClick={retry} className="flex-1 bg-white border-2 border-gray-100 text-gray-500 font-bold py-3 rounded-2xl active:scale-95 transition-all">🔄 Thử lại</button>
                <button onClick={() => advance(1)} className={`flex-1 font-black py-3 rounded-2xl shadow-md text-white active:scale-95 transition-all ${isCorrect ? 'bg-green-500' : 'bg-rose-500'}`}>
                  {idx + 1 >= total ? 'Kết quả →' : 'Tiếp theo →'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Prev / Next nav */}
        {(phase === 'idle' || phase === 'countdown' || phase === 'done') && (
          <div className="flex justify-between w-full pb-2">
            <button onClick={() => advance(-1)} disabled={idx === 0}
              className="text-gray-300 disabled:opacity-30 font-bold text-sm flex items-center gap-1 active:scale-95 transition-all">
              ← Từ trước
            </button>
            <button onClick={() => advance(1)}
              className="text-gray-300 font-bold text-sm flex items-center gap-1 active:scale-95 transition-all">
              Từ sau →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
