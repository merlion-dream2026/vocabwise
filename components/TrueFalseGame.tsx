'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useGameSync } from '@/lib/GameSyncContext'
import { playCorrectSound, playWrongSound } from '@/lib/gameSound'
import Confetti from '@/components/Confetti'
import { speak as speakWord } from '@/lib/speak'
import GameResultScreen from '@/components/GameResultScreen'
import { GameHeader, cta } from '@/components/ChunkyUI'
import { PRESS } from '@/components/TopicHub'


type Word = { word: string; meaning: string; emoji: string }
type Topic = { id: string; name: string; emoji: string; color: string; words: Word[] }
type Props = { topic: Topic; level: string; backUrl: string }

const ROUNDS = 16
const TIME_PER_Q = 10

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
  const { recordAnswer, recordActivity, addScore, recordGameResult, flush } = useGameSync()
  const [rounds] = useState(() => buildRounds(topic.words))
  const [idx, setIdx] = useState(0)
  const [result, setResult] = useState<'idle' | 'correct' | 'wrong'>('idle')
  const [score, setScore] = useState(0)
  const [wrongWords, setWrongWords] = useState<string[]>([])
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
    // 🟢 recognition tier — 1x XP (see FAQ "XP theo độ khó")
    if (done) { addScore(level, score); recordGameResult(level, topic.id, 'truefalse', score, total); if (score === total) { setShowConfetti(true) }; flush() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done])

  useEffect(() => {
    if (done) return
    const t = setTimeout(() => speak(round.word.word), 300)
    startTimer()
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, done])

  // Time runs out before an answer is picked — auto-count as wrong, same reveal + manual
  // advance as a regular wrong answer (no separate "timeout" state needed).
  useEffect(() => {
    if (timeLeft <= 0 && result === 'idle' && !done) {
      clearTimer()
      setResult('wrong')
      recordAnswer(level, topic.id, round.word, false)
      setWrongWords(ww => ww.includes(round.word.word) ? ww : [...ww, round.word.word])
      playWrongSound()
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
    if (correct) { setScore(s => s + 1); recordAnswer(level, topic.id, round.word, true); speak(round.word.word); playCorrectSound(); setTimeout(() => advance(idx), 1100) }
    else {
      recordAnswer(level, topic.id, round.word, false)
      setWrongWords(ww => ww.includes(round.word.word) ? ww : [...ww, round.word.word])
      playWrongSound()
      // No auto-advance here — let the learner read the correct answer, then tap "Tiếp theo →" themselves.
    }
  }

  const restart = () => { setIdx(0); setResult('idle'); setScore(0); setWrongWords([]); setDone(false); setShowConfetti(false) }

  if (done) {
    const xpEarned = score
    return (
      <div className="flex flex-col min-h-screen">
        {showConfetti && <Confetti onDone={() => setShowConfetti(false)} />}
        <GameHeader colorCls="bg-gradient-to-br from-green-400 to-emerald-500" title="✅ Đúng / Sai" subtitle={topic.name} onBack={() => router.push(backUrl)} />
        <div className="flex-1 bg-gradient-to-b from-green-50 to-emerald-50 flex flex-col items-center justify-center px-4 py-8">
          <GameResultScreen
            score={score} total={total} xpEarned={xpEarned} wrongWords={wrongWords}
            accentCls="bg-green-500" onRestart={restart} onExit={() => router.push(backUrl)}
          />
        </div>
      </div>
    )
  }

  const isCorrectResult = result === 'correct'
  const timerPct = (timeLeft / TIME_PER_Q) * 100

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <GameHeader colorCls="bg-gradient-to-br from-green-400 to-emerald-500" title="✅ Đúng / Sai" subtitle={topic.name} onBack={() => router.push(backUrl)} right={<>{idx + 1}/{total}</>} timer={{ pct: timerPct, secondsLeft: Math.max(0, timeLeft), urgent: timeLeft <= 3 }} />

      {/* Main content */}
      <div className="flex-1 bg-gradient-to-b from-green-50 to-emerald-50 flex flex-col px-4 py-5 gap-4">

        {/* Question card */}
        <div className={`
          bg-white rounded-3xl border-2 border-b-[4px] px-6 py-6 flex flex-col items-center text-center
          transition-all duration-200
          ${result === 'idle' ? 'border-slate-200 border-b-slate-300' : isCorrectResult ? 'border-green-300 border-b-green-500 bg-green-50' : 'border-red-300 border-b-red-500 bg-red-50 ax-shake'}
        `}>
          {/* English word */}
          <p className="text-4xl font-bold text-gray-800 mb-1">{round.word.word}</p>
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
            <p className={`text-3xl font-bold leading-snug
              ${result === 'idle' ? 'text-amber-700' : isCorrectResult ? 'text-green-700' : 'text-red-600'}
            `}>
              {round.shownMeaning}
            </p>
          </div>

          {/* Result feedback */}
          {result !== 'idle' && (
            <p role="status" aria-live="polite" className={`text-xl font-bold mt-2 ${isCorrectResult ? 'text-green-600' : 'text-red-500'}`}>
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

        {/* Answer buttons — tapping answers immediately (no separate confirm step) */}
        {result === 'idle' && (
          <div className="flex gap-3">
            <button
              onClick={() => answer(false)}
              className={`flex-1 flex flex-col items-center gap-1 rounded-2xl border-b-[4px] border-red-700 bg-red-500 py-5 text-2xl font-bold text-white ${PRESS}`}
            >
              <span>❌</span>
              <span className="text-lg">SAI</span>
            </button>
            <button
              onClick={() => answer(true)}
              className={`flex-1 flex flex-col items-center gap-1 rounded-2xl border-b-[4px] border-emerald-700 bg-emerald-500 py-5 text-2xl font-bold text-white ${PRESS}`}
            >
              <span>✅</span>
              <span className="text-lg">ĐÚNG</span>
            </button>
          </div>
        )}

        {/* Wrong answer (or time ran out): no auto-advance — learner reviews, then taps Tiếp theo themselves */}
        {result === 'wrong' && (
          <button
            onClick={() => advance(idx)}
            className={cta('green')}
          >
            {idx + 1 >= total ? 'Xem kết quả →' : 'Tiếp theo →'}
          </button>
        )}
      </div>
    </div>
  )
}
