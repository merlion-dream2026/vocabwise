'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { recordAnswer, recordActivity, addScore, recordPerfectGame, flush } from '@/lib/gameSync'
import Confetti from '@/components/Confetti'
import { speak as speakWord } from '@/lib/speak'
import WordIcon from '@/components/WordIcon'

type Word = { word: string; meaning: string; emoji: string }
type Topic = { id: string; name: string; emoji: string; color: string; words: Word[] }
type Props = { topic: Topic; level: string; backUrl: string }

const TIME_PER_Q = 7
const ROUNDS = 16

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

type Round = { word: Word; shownMeaning: string; isCorrect: boolean }

function buildRounds(words: Word[]): Round[] {
  const rounds: Round[] = []
  for (const word of words) {
    rounds.push({ word, shownMeaning: word.meaning, isCorrect: true })
    const others = words.filter(w => w.word !== word.word)
    if (others.length > 0) {
      const wrong = others[Math.floor(Math.random() * others.length)]
      rounds.push({ word, shownMeaning: wrong.meaning, isCorrect: false })
    }
  }
  return shuffle(rounds).slice(0, ROUNDS)
}

export default function TrueFalseGame({ topic, level, backUrl }: Props) {
  const router = useRouter()
  const [rounds] = useState(() => buildRounds(topic.words))
  const [idx, setIdx] = useState(0)
  const [result, setResult] = useState<'idle' | 'correct' | 'wrong'>('idle')
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [timeLeft, setTimeLeft] = useState(TIME_PER_Q)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const round = rounds[idx]
  const total = rounds.length

  const speak = useCallback((text: string) => speakWord(text, { rate: 0.9 }), [])
  const clearTimer = useCallback(() => { if (timerRef.current) clearInterval(timerRef.current) }, [])

  const startTimer = useCallback(() => {
    clearTimer()
    setTimeLeft(TIME_PER_Q)
    timerRef.current = setInterval(() => setTimeLeft(t => t - 1), 1000)
  }, [clearTimer])

  useEffect(() => {
    if (done) { addScore(level, score); if (score === total) { recordPerfectGame(level, topic.id, 'truefalse'); setShowConfetti(true) }; flush() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done])

  useEffect(() => {
    if (done) return
    const t = setTimeout(() => speak(round.word.word), 300)
    startTimer()
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, done])

  useEffect(() => {
    if (timeLeft <= 0 && result === 'idle' && !done) {
      clearTimer()
      setResult('wrong')
      recordAnswer(level, topic.id, round.word, false)
      setTimeout(() => advance(idx), 1200)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft])

  useEffect(() => () => clearTimer(), [clearTimer])

  const advance = (curIdx: number) => {
    const next = curIdx + 1
    if (next >= total) { recordActivity(level); setDone(true) }
    else { setIdx(next); setResult('idle') }
  }

  const answer = (userSaysTrue: boolean) => {
    if (result !== 'idle') return
    clearTimer()
    const correct = userSaysTrue === round.isCorrect
    setResult(correct ? 'correct' : 'wrong')
    if (correct) { setScore(s => s + 1); recordAnswer(level, topic.id, round.word, true); speak(round.word.word) }
    else recordAnswer(level, topic.id, round.word, false)
    setTimeout(() => advance(idx), 1100)
  }

  const restart = () => { clearTimer(); setIdx(0); setResult('idle'); setScore(0); setDone(false); setShowConfetti(false) }

  if (done) {
    const pct = Math.round((score / total) * 100)
    const xpEarned = score
    return (
      <div className="flex flex-col min-h-screen">
        {showConfetti && <Confetti />}
        <div className="bg-gradient-to-br from-green-400 to-emerald-500 px-4 pt-12 pb-8 text-white">
          <button onClick={() => router.push(backUrl)} className="text-green-100 font-bold text-sm flex items-center gap-1 mb-4">← {topic.name}</button>
          <h1 className="text-2xl font-black">✅ Đúng / Sai</h1>
        </div>
        <div className="flex-1 bg-gradient-to-b from-green-50 to-emerald-50 flex flex-col items-center justify-center px-4 py-8">
          <div className="text-7xl mb-4">{score === total ? '🏆' : score >= total * 0.7 ? '⭐' : '💪'}</div>
          <h2 className="text-3xl font-black text-gray-800 mb-1">{score}/{total} chính xác</h2>
          <p className="text-gray-500 font-bold text-xl mb-2">{pct}%</p>
          <div className="inline-flex items-center gap-1.5 bg-yellow-50 border border-yellow-200 rounded-full px-4 py-1.5 mb-6">
            <span className="text-base">⭐</span>
            <span className="text-yellow-700 font-black text-sm">+{xpEarned} XP</span>
          </div>
          <div className="w-full space-y-3">
            <button onClick={restart} className="w-full bg-green-500 text-white font-black text-xl py-4 rounded-2xl shadow-lg">🔄 Chơi lại</button>
            <button onClick={() => router.push(backUrl)} className="w-full bg-white border-2 border-gray-200 text-gray-600 font-bold text-xl py-4 rounded-2xl">← Chọn chế độ khác</button>
          </div>
        </div>
      </div>
    )
  }

  const timerPct = (timeLeft / TIME_PER_Q) * 100
  const isCorrectResult = result === 'correct'
  const isWrongResult = result === 'wrong'

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-br from-green-400 to-emerald-500 px-4 pt-12 pb-4 text-white">
        <button onClick={() => router.push(backUrl)} className="text-green-100 font-bold text-sm flex items-center gap-1 mb-3">← {topic.name}</button>
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-black">✅ Đúng / Sai</h1>
          <span className="bg-white/20 px-3 py-1 rounded-full font-black text-sm">{idx + 1}/{total}</span>
        </div>

        {/* Timer bar */}
        <div className="h-3 bg-white/20 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-linear ${timeLeft <= 2 ? 'bg-red-300' : 'bg-white/70'}`}
            style={{ width: `${timerPct}%` }}
          />
        </div>
        <p className={`text-right text-xs font-black mt-1 ${timeLeft <= 2 ? 'text-red-200' : 'text-white/60'}`}>{timeLeft}s</p>
      </div>

      {/* Main content */}
      <div className="flex-1 bg-gradient-to-b from-green-50 to-emerald-50 flex flex-col px-4 py-5 gap-4">

        {/* Question card */}
        <div className={`
          bg-white rounded-3xl shadow-lg border-2 px-6 py-6 flex flex-col items-center text-center
          transition-all duration-200
          ${result === 'idle' ? 'border-gray-100' : isCorrectResult ? 'border-green-400 bg-green-50' : 'border-red-400 bg-red-50'}
        `}>
          {/* Emoji + English word */}
          <div className="mb-3 flex justify-center select-none"><WordIcon word={round.word.word} emoji={round.word.emoji} emojiClass="text-7xl" iconSize={88} /></div>
          <p className="text-4xl font-black text-gray-800 mb-1">{round.word.word}</p>
          <button
            onClick={() => speak(round.word.word)}
            className="text-gray-500 text-sm font-semibold mb-4 flex items-center gap-1 hover:text-gray-600"
          >
            🔊 nghe lại
          </button>

          {/* Divider label */}
          <div className="flex items-center gap-2 w-full mb-3">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">có nghĩa là</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Vietnamese meaning — large & prominent */}
          <div className={`
            w-full rounded-2xl px-4 py-4 mb-2
            ${result === 'idle'
              ? 'bg-amber-50 border-2 border-amber-200'
              : isCorrectResult
                ? 'bg-green-100 border-2 border-green-300'
                : 'bg-red-100 border-2 border-red-300'
            }
          `}>
            <p className={`text-3xl font-black leading-snug
              ${result === 'idle' ? 'text-amber-700' : isCorrectResult ? 'text-green-700' : 'text-red-600'}
            `}>
              {round.shownMeaning}
            </p>
          </div>

          {/* Result feedback */}
          {result !== 'idle' && (
            <p role="status" aria-live="polite" className={`text-xl font-black mt-2 ${isCorrectResult ? 'text-green-600' : 'text-red-500'}`}>
              {isCorrectResult
                ? '✅ Chính xác!'
                : `❌ Nghĩa này là ${round.isCorrect ? 'ĐÚNG' : 'SAI'}`}
            </p>
          )}
        </div>

        {/* Question prompt */}
        {result === 'idle' && (
          <p className="text-center text-base font-bold text-gray-500">
            Nghĩa tiếng Việt trên có <span className="text-gray-700">đúng</span> không?
          </p>
        )}

        {/* Answer buttons */}
        {result === 'idle' && (
          <div className="flex gap-3 mt-auto">
            <button
              onClick={() => answer(false)}
              className="flex-1 bg-red-500 hover:bg-red-600 active:scale-95 text-white font-black text-2xl py-5 rounded-2xl shadow-md transition-all flex flex-col items-center gap-1"
            >
              <span>❌</span>
              <span className="text-lg">SAI</span>
            </button>
            <button
              onClick={() => answer(true)}
              className="flex-1 bg-green-500 hover:bg-green-600 active:scale-95 text-white font-black text-2xl py-5 rounded-2xl shadow-md transition-all flex flex-col items-center gap-1"
            >
              <span>✅</span>
              <span className="text-lg">ĐÚNG</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
