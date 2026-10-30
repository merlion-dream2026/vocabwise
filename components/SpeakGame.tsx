'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useGameSync } from '@/lib/GameSyncContext'
import { playCorrectSound, playWrongSound } from '@/lib/gameSound'
import Confetti from '@/components/Confetti'
import { speak as speakWord } from '@/lib/speak'
import WordIcon from '@/components/WordIcon'
import VoicePlayer from '@/components/VoicePlayer'
import GameResultScreen from '@/components/GameResultScreen'
import { GameHeader } from '@/components/ChunkyUI'
import { matchWords } from '@/lib/pronunciation'
import { markWords, type Assessment } from '@/lib/pronunciationScore'
import { scorePronunciation } from '@/lib/pronounceClient'
import { useMicMeter } from '@/lib/useMicMeter'
import { SLOW_RATE, HINT_AFTER_FAILS, RecordingView, ModelVoiceRow, ResultCard, ScoreTiles, marksFromMatch, UnclearCard, HintCard, ResultButtons } from '@/components/SpeakParts'

type Word = {
  word: string; meaning: string; emoji: string
  examples?: { en: string; vi: string }[]
  collocations?: { phrase: string; meaning: string }[]
}
type Topic = { id: string; name: string; emoji: string; words: Word[] }
type Props = { topic: Topic; level: string; backUrl: string; isStarter?: boolean }

function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5) }

function getBestMime() {
  for (const t of ['audio/webm', 'audio/mp4', 'audio/ogg']) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)) return t
  }
  return 'audio/webm'
}

// Seeker/Starter/Ranger kids practise a short collocation ("red apple", "my mum") from the
// flashcard's "Cụm từ phổ biến" card instead of a full example sentence.
const PHRASE_LEVELS = ['seeker', 'starter', 'ranger']
const MAX_PHRASE_WORDS = 4

function pickPhrase(w: Word): { en: string; vi: string } | null {
  const short = (w.collocations ?? []).filter(c => c.phrase.split(' ').length <= MAX_PHRASE_WORDS)
  if (!short.length) return null
  // Prefer phrases that contain the word itself — the scorer requires the keyword
  const key = w.word.toLowerCase()
  const withKey = short.filter(c => c.phrase.toLowerCase().includes(key))
  const pool = withKey.length ? withKey : short
  const c = pool[Math.floor(Math.random() * pool.length)]
  return { en: c.phrase, vi: c.meaning }
}

const MAX_SECS = 8
type Phase = 'idle' | 'countdown' | 'recording' | 'processing' | 'done'

export default function SpeakGame({ topic, level, backUrl }: Props) {
  const router = useRouter()
  const { recordAnswer, recordActivity, addScore, recordGameResult, flush } = useGameSync()
  // Phrase is picked once per session so it doesn't change between re-renders/retries
  const [questions] = useState(() => shuffle(topic.words).map(w => ({
    ...w,
    phrase: PHRASE_LEVELS.includes(level) ? pickPhrase(w) : null,
  })))
  const [idx, setIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [wrongWords, setWrongWords] = useState<string[]>([])
  const [gameDone, setGameDone] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  const [phase, setPhase] = useState<Phase>('idle')
  const [transcript, setTranscript] = useState('')
  const [assessment, setAssessment] = useState<Assessment | null>(null) // Azure scores (null = Whisper path)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [unclear, setUnclear] = useState(false)
  const [micError, setMicError] = useState<string | null>(null)
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState(MAX_SECS)
  const [fails, setFails] = useState(0)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const autoStopRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const countdownRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const answeredRef = useRef(false)
  const autoSpeakCancelRef = useRef(false)
  const speak = useCallback((t: string, rate = 0.85) => speakWord(t, { rate }), [])

  const q = questions[idx]
  const total = questions.length
  const maxWords = level === 'seeker' ? 7 : level === 'starter' ? 9 : 15
  const rawExample = q.examples?.[0]?.en ?? ''
  const exampleOk = rawExample && rawExample.split(' ').length <= maxWords
  // Seeker/Starter/Ranger: collocation phrase; others: example sentence if within limit; else the word
  const speakTarget = q.phrase ? q.phrase.en : exampleOk ? rawExample : q.word
  const targetVi = q.phrase ? q.phrase.vi : q.examples?.[0]?.vi
  const isSentence = speakTarget !== q.word

  // Stop after silence once the kid has spoken (see useMicMeter)
  const meter = useMicMeter(() => {
    if (mediaRecorderRef.current?.state === 'recording') { clearTimers(); mediaRecorderRef.current.stop() }
  })

  const stopStream = useCallback(() => {
    meter.stop()
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
  }, [meter.stop]) // eslint-disable-line react-hooks/exhaustive-deps

  const clearTimers = useCallback(() => {
    if (timerRef.current)    { clearInterval(timerRef.current);   timerRef.current = null }
    if (autoStopRef.current) { clearTimeout(autoStopRef.current); autoStopRef.current = null }
    if (countdownRef.current){ clearTimeout(countdownRef.current);  countdownRef.current = null }
  }, [])

  useEffect(() => {
    if (gameDone) {
      addScore(level, Math.round(score * 1.5))
      recordGameResult(level, topic.id, 'speak', score, total); if (score === total) { setShowConfetti(true) }
      flush()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameDone])

  useEffect(() => {
    if (gameDone) return
    setPhase('idle')
    setTranscript(''); setAssessment(null)
    setIsCorrect(null)
    setUnclear(false)
    setMicError(null)
    setTimeLeft(MAX_SECS)
    setFails(0)
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
      meter.start(stream)

      // Short 1s "get ready" — MediaRecorder warms up during this time
      setPhase('countdown')
      countdownRef.current = setTimeout(() => {
        countdownRef.current = null
        setPhase('recording')
        meter.markRecording()
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
      // Azure-scored when the clip converts to WAV (lib/pronounceClient.ts), else Whisper
      const data = await scorePronunciation(blob, mimeType, { target: speakTarget, word: q.word, level, source: 'speak' })
      setAssessment(data.assessment ?? null)

      const correct  = !!data.correct
      const isUnclear = !!data.unclear   // Whisper hallucinated → không phải lỗi của bé
      setTranscript(data.transcript ?? '')
      setIsCorrect(correct)
      setUnclear(isUnclear)
      setPhase('done')
      if (!isUnclear) {
        recordAnswer(level, topic.id, q, correct)
        if (correct && !answeredRef.current) { answeredRef.current = true; setScore(s => s + 1) }
        if (!correct) {
          setWrongWords(ww => ww.includes(q.word) ? ww : [...ww, q.word])
          const n = fails + 1
          setFails(n)
          if (n === HINT_AFTER_FAILS) setTimeout(() => speak(speakTarget, SLOW_RATE), 700)
        }
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
    setTranscript(''); setAssessment(null)
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
    setPhase('idle'); setTranscript(''); setAssessment(null); setIsCorrect(null); setMicError(null)
    answeredRef.current = false; setPlaybackUrl(null); setTimeLeft(MAX_SECS)
  }

  const wordMarks = phase !== 'done' || unclear ? []
    : assessment ? markWords(assessment, speakTarget, level)
    : transcript ? marksFromMatch(matchWords(transcript, speakTarget)) : []
  const stars = !isCorrect ? 0
    : assessment ? (assessment.pronScore >= 85 ? 3 : 2)
    : wordMarks.length && wordMarks.every(m => m.level === 'good') ? 3 : 2
  const showHint = !isCorrect && fails >= HINT_AFTER_FAILS

  if (gameDone) {
    const xpEarned = Math.round(score * 1.5)
    return (
      <div className="flex flex-col min-h-screen">
        {showConfetti && <Confetti onDone={() => setShowConfetti(false)} />}
        <GameHeader colorCls="bg-gradient-to-br from-rose-400 to-pink-500" title="🎤 Phát âm cùng AI ✨" subtitle={topic.name} onBack={() => router.push(backUrl)} />
        <div className="flex-1 bg-gradient-to-b from-rose-50 to-pink-50 flex flex-col items-center justify-center px-4 py-8">
          <GameResultScreen
            score={score} total={total} xpEarned={xpEarned} wrongWords={wrongWords}
            accentCls="bg-rose-500" onRestart={restart} onExit={() => router.push(backUrl)}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-rose-50">
      {/* Header */}
      <GameHeader colorCls="bg-gradient-to-br from-rose-400 to-pink-500" title="🎤 Phát âm cùng AI" subtitle={topic.name} onBack={() => router.push(backUrl)} right={<>{idx + 1}/{total}</>} progress={{ value: ((idx + 1) / total) * 100, max: 100 }} />

      <div className="flex-1 flex flex-col px-4 py-4 gap-4">
        {/* Target card — word + sentence unified */}
        <div className="bg-white rounded-3xl p-5 w-full border-2 border-b-[4px] border-slate-200 border-b-slate-300">
          <div className="flex flex-col items-center text-center">
            <div className="mb-2 flex justify-center">
              <WordIcon word={q.word} emoji={q.emoji} emojiClass="text-5xl" iconSize={60} />
            </div>
            <p className="text-3xl font-bold text-gray-800">{q.word}</p>
            <p className="text-base text-gray-400 font-semibold mt-0.5">{q.meaning}</p>
          </div>

          <div className="my-3 border-t border-gray-100" />
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              {isSentence ? (
                <>
                  <p className="text-base font-bold text-gray-700 leading-snug">&ldquo;{speakTarget}&rdquo;</p>
                  {targetVi && <p className="text-sm text-gray-400 font-medium mt-1">{targetVi}</p>}
                </>
              ) : (
                <p className="text-sm font-bold text-gray-400">Nghe mẫu rồi đọc theo nhé</p>
              )}
            </div>
            <button onClick={() => speak(speakTarget)} aria-label="Nghe mẫu"
              className="flex-shrink-0 w-11 h-11 rounded-full bg-rose-50 flex items-center justify-center text-xl active:scale-90 transition-all">
              🔊
            </button>
            <button onClick={() => speak(speakTarget, SLOW_RATE)} aria-label="Nghe chậm"
              className="flex-shrink-0 w-11 h-11 rounded-full bg-sky-50 flex items-center justify-center text-xl active:scale-90 transition-all">
              🐢
            </button>
          </div>
        </div>

        {/* Action zone — mic/feedback; result buttons sit at the bottom (thumb zone) */}
        <div className={`flex-1 flex flex-col items-center gap-4 ${phase === 'done' ? 'justify-start' : 'justify-center'}`}>

          {phase === 'idle' && (
            <>
              <button onClick={startRecording} aria-label="Bấm để đọc"
                className="w-20 h-20 rounded-full bg-rose-400 shadow-xl flex items-center justify-center text-4xl active:scale-90 hover:bg-rose-500 transition-all">
                🎤
              </button>
              {micError
                ? <p className="text-red-500 font-semibold text-sm text-center max-w-xs">{micError}</p>
                : <p className="text-gray-400 font-semibold text-sm">Bấm để đọc</p>
              }
              <button onClick={() => advance(1)} className="text-gray-300 font-bold text-sm active:scale-95 transition-all">
                Bỏ qua →
              </button>
            </>
          )}

          {phase === 'countdown' && (
            <>
              <div className="w-20 h-20 rounded-full bg-rose-100 border-4 border-rose-300 flex items-center justify-center animate-pulse">
                <span className="text-4xl">👂</span>
              </div>
              <p className="text-rose-400 font-bold text-sm">Sẵn sàng...</p>
              <button onClick={retry} className="text-gray-300 text-xs font-semibold underline active:scale-95 transition-all">Huỷ</button>
            </>
          )}

          {phase === 'recording' && (
            <RecordingView level={meter.level} timeLeft={timeLeft} maxSecs={MAX_SECS} onStop={stopRecording} />
          )}

          {phase === 'processing' && (
            <>
              <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center text-3xl animate-spin">⏳</div>
              <p className="text-indigo-400 font-bold text-sm">Đang chấm điểm...</p>
            </>
          )}

          {phase === 'done' && unclear && <UnclearCard />}
          {phase === 'done' && !unclear && (
            <>
              <ResultCard correct={!!isCorrect} stars={stars} marks={wordMarks} transcript={transcript}
                scores={assessment ?? undefined} onSpeak={assessment ? t => speak(t, SLOW_RATE) : undefined} />
              {assessment && <ScoreTiles s={assessment} />}
            </>
          )}
          {phase === 'done' && showHint && <HintCard />}

          {phase === 'done' && (
            <div className="w-full flex flex-col gap-2">
              {/* Model vs your voice, back to back — the core self-correction loop */}
              <ModelVoiceRow onPlay={rate => speak(speakTarget, rate)} />
              {playbackUrl && <VoicePlayer src={playbackUrl} />}
            </div>
          )}

          {phase === 'done' && (
            <ResultButtons passed={!!isCorrect && !unclear} showHint={showHint} isLast={idx + 1 >= total}
              onRetry={retry} onNext={() => advance(1)} />
          )}
        </div>
      </div>
    </div>
  )
}
