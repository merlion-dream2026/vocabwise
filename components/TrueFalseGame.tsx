'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useGameSync } from '@/lib/GameSyncContext'
import { playCorrectSound, playWrongSound } from '@/lib/gameSound'
import Confetti from '@/components/Confetti'
import { speak as speakWord } from '@/lib/speak'
import GameResultScreen from '@/components/GameResultScreen'


type Word = { word: string; meaning: string; emoji: string }
type Topic = { id: string; name: string; emoji: string; color: string; words: Word[] }
type Props = { topic: Topic; level: string; backUrl: string }

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
  const { recordAnswer, recordActivity, addScore, recordPerfectGame, flush } = useGameSync()
  const [rounds] = useState(() => buildRounds(topic.words))
  const [idx, setIdx] = useState(0)
  const [selected, setSelected] = useState<boolean | null>(null)
  const [result, setResult] = useState<'idle' | 'correct' | 'wrong'>('idle')
  const [score, setScore] = useState(0)
  const [wrongWords, setWrongWords] = useState<string[]>([])
  const [done, setDone] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  const round = rounds[idx]
  const total = rounds.length

  const speak = useCallback((text: string) => speakWord(text, { rate: 0.9 }), [])

  useEffect(() => {
    if (done) { addScore(level, Math.round(score * 1.5)); if (score === total) { recordPerfectGame(level, topic.id, 'truefalse'); setShowConfetti(true) }; flush() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done])

  useEffect(() => {
    if (done) return
    const t = setTimeout(() => speak(round.word.word), 300)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, done])

  const advance = (curIdx: number) => {
    const next = curIdx + 1
    if (next >= total) { recordActivity(level); setDone(true) }
    else { setIdx(next); setSelected(null); setResult('idle') }
  }

  const pick = (userSaysTrue: boolean) => {
    if (result !== 'idle') return
    setSelected(userSaysTrue)
  }

  const checkAnswer = () => {
    if (selected === null || result !== 'idle') return
    const correct = selected === round.isCorrect
    setResult(correct ? 'correct' : 'wrong')
    if (correct) { setScore(s => s + 1); recordAnswer(level, topic.id, round.word, true); speak(round.word.word); playCorrectSound(); setTimeout(() => advance(idx), 1100) }
    else {
      recordAnswer(level, topic.id, round.word, false)
      setWrongWords(ww => ww.includes(round.word.word) ? ww : [...ww, round.word.word])
      playWrongSound()
      // No auto-advance here — let the learner read the correct answer, then tap "Tiếp theo →" themselves.
    }
  }

  const restart = () => { setIdx(0); setSelected(null); setResult('idle'); setScore(0); setWrongWords([]); setDone(false); setShowConfetti(false) }

  if (done) {
    const xpEarned = Math.round(score * 1.5)
    return (
      <div className="flex flex-col min-h-screen">
        {showConfetti && <Confetti onDone={() => setShowConfetti(false)} />}
        <div className="bg-gradient-to-br from-green-400 to-emerald-500 px-4 pt-6 pb-4 text-white">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push(backUrl)} aria-label="Quay lại" className="text-green-100 text-xl flex-shrink-0">←</button>
            <div className="flex-1 min-w-0">
              <p className="text-green-100 text-[11px] font-bold uppercase tracking-wide leading-none mb-0.5">{topic.name}</p>
              <h1 className="text-lg font-black leading-tight truncate">✅ Đúng / Sai</h1>
            </div>
          </div>
        </div>
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

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-br from-green-400 to-emerald-500 px-4 pt-6 pb-4 text-white">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => router.push(backUrl)} aria-label="Quay lại" className="text-green-100 text-xl flex-shrink-0">←</button>
          <div className="flex-1 min-w-0">
            <p className="text-green-100 text-[11px] font-bold uppercase tracking-wide leading-none mb-0.5">{topic.name}</p>
            <h1 className="text-lg font-black leading-tight truncate">✅ Đúng / Sai</h1>
          </div>
          <span className="bg-white/20 px-3 py-1 rounded-full font-black text-sm flex-shrink-0">{idx + 1}/{total}</span>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 bg-gradient-to-b from-green-50 to-emerald-50 flex flex-col px-4 py-5 gap-4">

        {/* Question card */}
        <div className={`
          bg-white rounded-3xl shadow-lg border-2 px-6 py-6 flex flex-col items-center text-center
          transition-all duration-200
          ${result === 'idle' ? 'border-gray-100' : isCorrectResult ? 'border-green-400 bg-green-50' : 'border-red-400 bg-red-50'}
        `}>
          {/* English word */}
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

        {/* Answer buttons — select first (highlighted), then tap Kiểm tra to submit */}
        {result === 'idle' && (
          <div className="flex gap-3">
            <button
              onClick={() => pick(false)}
              className={`flex-1 active:scale-95 text-white font-black text-2xl py-5 rounded-2xl shadow-md transition-all flex flex-col items-center gap-1 ${
                selected === false ? 'bg-red-600 ring-4 ring-red-200' : 'bg-red-500 hover:bg-red-600'
              }`}
            >
              <span>❌</span>
              <span className="text-lg">SAI</span>
            </button>
            <button
              onClick={() => pick(true)}
              className={`flex-1 active:scale-95 text-white font-black text-2xl py-5 rounded-2xl shadow-md transition-all flex flex-col items-center gap-1 ${
                selected === true ? 'bg-green-600 ring-4 ring-green-200' : 'bg-green-500 hover:bg-green-600'
              }`}
            >
              <span>✅</span>
              <span className="text-lg">ĐÚNG</span>
            </button>
          </div>
        )}
        {result === 'idle' && (
          <button
            onClick={checkAnswer}
            disabled={selected === null}
            className="w-full bg-emerald-600 disabled:bg-emerald-200 text-white font-black text-lg py-4 rounded-2xl shadow-md active:scale-95 transition-all"
          >
            Kiểm tra ✓
          </button>
        )}

        {/* Wrong answer: no auto-advance — learner reviews, then taps Tiếp theo themselves */}
        {result === 'wrong' && (
          <button
            onClick={() => advance(idx)}
            className="w-full bg-emerald-600 text-white font-black text-lg py-4 rounded-2xl shadow-md active:scale-95 transition-all"
          >
            {idx + 1 >= total ? 'Xem kết quả →' : 'Tiếp theo →'}
          </button>
        )}
      </div>
    </div>
  )
}
