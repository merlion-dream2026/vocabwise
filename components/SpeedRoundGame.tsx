'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useGameSync } from '@/lib/GameSyncContext'
import { playCorrectSound, playWrongSound } from '@/lib/gameSound'
import Confetti from '@/components/Confetti'
import { speak as speakWord } from '@/lib/speak'
import WordIcon from '@/components/WordIcon'

type Word = { word: string; meaning: string; emoji: string; examples?: { en: string; vi: string }[] }
type Topic = { id: string; name: string; emoji: string; color: string; words: Word[] }
type Props = { topic: Topic; level: string; backUrl: string }

const TIME_PER_WORD = 8 // seconds — faster than Typing Sprint (15s)

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

export default function SpeedRoundGame({ topic, level, backUrl }: Props) {
  const router = useRouter()
  const { recordAnswer, recordActivity, addScore, recordPerfectGame, flush } = useGameSync()
  const [words] = useState(() => shuffle(topic.words))
  const [idx, setIdx] = useState(0)
  const [input, setInput] = useState('')
  const [result, setResult] = useState<'idle' | 'correct' | 'wrong' | 'timeout'>('idle')
  const [timeLeft, setTimeLeft] = useState(TIME_PER_WORD)
  const [score, setScore] = useState(0)
  const [wrongWords, setWrongWords] = useState<string[]>([])
  const [done, setDone] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  const word = words[idx]
  const total = words.length
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (done) {
      addScore(level, score * 2)
      if (score === total) recordPerfectGame(level, topic.id, 'speedround')
      if (score === total) setShowConfetti(true)
      flush()
    }
  }, [done])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const speak = useCallback((text: string) => speakWord(text, { rate: 1.0, pitch: 1.0 }), [])

  const clearTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
  }, [])

  const startTimer = useCallback(() => {
    clearTimer()
    setTimeLeft(TIME_PER_WORD)
    timerRef.current = setInterval(() => setTimeLeft((t) => t - 1), 1000)
  }, [clearTimer])

  useEffect(() => {
    if (done) return
    const t = setTimeout(() => speak(word.word), 300)
    startTimer()
    setTimeout(() => inputRef.current?.focus(), 100)
    return () => clearTimeout(t)
  }, [idx, done])

  useEffect(() => {
    if (timeLeft <= 0 && result === 'idle' && !done) {
      clearTimer()
      setResult('timeout')
      recordAnswer(level, topic.id, word, false)
      setWrongWords((ww) => (ww.includes(word.word) ? ww : [...ww, word.word]))
      playWrongSound()
      setTimeout(() => advance(idx), 1500)
    }
  }, [timeLeft])

  useEffect(() => () => clearTimer(), [clearTimer])

  const advance = (currentIdx: number) => {
    const next = currentIdx + 1
    if (next >= total) {
      recordActivity(level)
      setDone(true)
    } else {
      setIdx(next)
      setInput('')
      setResult('idle')
    }
  }

  const handleSubmit = () => {
    if (result !== 'idle' || !input.trim()) return
    clearTimer()
    const typed = input.trim().toLowerCase()
    if (typed === word.word.toLowerCase()) {
      setResult('correct')
      setScore((s) => s + 1)
      recordAnswer(level, topic.id, word, true)
      speak(word.word)
      playCorrectSound()
      setTimeout(() => advance(idx), 800)
    } else {
      setResult('wrong')
      recordAnswer(level, topic.id, word, false)
      setWrongWords((ww) => (ww.includes(word.word) ? ww : [...ww, word.word]))
      playWrongSound()
      setTimeout(() => advance(idx), 1500)
    }
  }

  const restart = () => {
    clearTimer()
    setIdx(0)
    setInput('')
    setResult('idle')
    setScore(0)
    setWrongWords([])
    setDone(false)
    setShowConfetti(false)
  }

  if (done) {
    const pct = Math.round((score / total) * 100)
    const xpEarned = score * 2
    return (
      <div className="flex flex-col min-h-screen">
        {showConfetti && <Confetti onDone={() => setShowConfetti(false)} />}
        <div className="bg-gradient-to-br from-violet-500 to-purple-600 px-4 pt-12 pb-8 text-white">
          <button onClick={() => router.push(backUrl)} className="text-violet-100 font-bold text-sm flex items-center gap-1 mb-4 opacity-90">← {topic.name}</button>
          <h1 className="text-2xl font-black">⚡ Speed Round</h1>
        </div>
        <div className="flex-1 bg-gradient-to-b from-violet-50 to-purple-50 flex flex-col items-center justify-center px-4 py-8">
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
                {wrongWords.map((w) => (
                  <span
                    key={w}
                    className="bg-orange-100 text-orange-700 font-bold text-sm px-3 py-1 rounded-full"
                  >
                    {w}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div className="w-full space-y-3">
            <button
              onClick={restart}
              className="w-full bg-violet-500 hover:bg-violet-600 text-white font-black text-xl py-4 rounded-2xl shadow-lg transition-colors"
            >
              🔄 Chơi lại
            </button>
            <button onClick={() => router.push(backUrl)} className="w-full bg-white border-2 border-gray-200 text-gray-600 font-bold text-xl py-4 rounded-2xl text-center">← Chọn chế độ khác</button>
          </div>
        </div>
      </div>
    )
  }

  const timerPct = (timeLeft / TIME_PER_WORD) * 100
  const timerColor =
    timeLeft > 5 ? 'bg-violet-400' : timeLeft > 2 ? 'bg-yellow-400' : 'bg-red-400'
  const inputStyle =
    result === 'correct'
      ? 'border-green-400 bg-green-50'
      : result === 'wrong' || result === 'timeout'
      ? 'border-red-400 bg-red-50'
      : 'border-violet-300 bg-white'

  return (
    <div className="flex flex-col min-h-screen">
      <div className="bg-gradient-to-br from-violet-500 to-purple-600 px-4 pt-12 pb-4 text-white">
        <button onClick={() => router.push(backUrl)} className="text-violet-100 font-bold text-sm flex items-center gap-1 mb-3 opacity-90">← {topic.name}</button>
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-black">⚡ Speed Round</h1>
          <span className="bg-white/20 px-3 py-1 rounded-full font-black text-sm">
            {idx + 1}/{total}
          </span>
        </div>
        <div className="h-1.5 bg-violet-400/40 rounded-full overflow-hidden mb-2">
          <div
            className="h-full bg-white/70 rounded-full transition-all duration-500"
            style={{ width: `${((idx + 1) / total) * 100}%` }}
          />
        </div>
        <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
          <div
            className={`h-full ${timerColor} rounded-full transition-all duration-1000 ease-linear`}
            style={{ width: `${timerPct}%` }}
          />
        </div>
        <p
          className={`text-right text-xs font-black mt-1 transition-colors ${
            timeLeft <= 2 ? 'text-red-200' : 'text-white/50'
          }`}
        >
          {timeLeft}s
        </p>
      </div>

      <div className="flex-1 bg-gradient-to-b from-violet-50 to-purple-50 px-4 py-6 flex flex-col items-center">
        <div className="mb-2 flex justify-center"><WordIcon word={word.word} emoji={word.emoji} emojiClass="text-7xl leading-none select-none" iconSize={88} /></div>
        <p className="text-gray-700 font-bold text-2xl mb-1 text-center">{word.meaning}</p>
        <button
          onClick={() => speak(word.word)}
          className="bg-violet-500 text-white w-11 h-11 rounded-xl text-xl flex items-center justify-center shadow-md active:scale-90 transition-all mb-4"
        >
          🔊
        </button>

        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => {
            if (result === 'idle') setInput(e.target.value)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSubmit()
          }}
          disabled={result !== 'idle'}
          placeholder="Gõ từ tiếng Anh..."
          aria-label="Gõ từ tiếng Anh"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          className={`w-full border-2 rounded-2xl px-4 py-4 text-2xl font-bold outline-none transition-colors duration-200 mb-3
            ${inputStyle} placeholder:text-gray-300 text-gray-800`}
        />

        <div role="status" aria-live="polite">
          {result === 'correct' && (
            <p className="text-green-500 font-black text-xl mb-4">✅ Chính xác!</p>
          )}
          {result === 'wrong' && (
            <p className="text-red-500 font-black text-xl mb-4">
              ❌ Đáp án: <span className="underline">{word.word}</span>
            </p>
          )}
          {result === 'timeout' && (
            <p className="text-orange-500 font-black text-xl mb-4">
              ⏰ Hết giờ! Đáp án: <span className="underline">{word.word}</span>
            </p>
          )}
        </div>

        {result === 'idle' && (
          <button
            onClick={handleSubmit}
            disabled={!input.trim()}
            className="w-full bg-violet-500 hover:bg-violet-600 disabled:bg-violet-200 text-white font-black text-xl py-4 rounded-2xl shadow-md transition-colors active:scale-95"
          >
            Kiểm tra ✓
          </button>
        )}

        <div className="flex justify-center gap-1.5 mt-6 flex-wrap">
          {words.map((_, i) => (
            <div
              key={i}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-200
                ${i === idx ? 'bg-violet-500 scale-125' : i < idx ? 'bg-violet-300' : 'bg-violet-100'}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
