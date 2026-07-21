'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { speak as speakWord } from '@/lib/speak'
import { useGameSync } from '@/lib/GameSyncContext'
import { saveStepScore } from '@/lib/stepScores'
import { playCorrectSound, playWrongSound } from '@/lib/gameSound'
import Confetti from '@/components/Confetti'
import WordIcon from '@/components/WordIcon'

type Word = { word: string; meaning: string; emoji: string; examples: { en: string; vi: string }[] }
type Topic = { id: string; name: string; emoji: string; color: string; words: Word[] }
type Props = { topic: Topic; level: string; isStarter: boolean; backUrl: string }

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

function buildQuestions(words: Word[]) {
  return shuffle(words).map((word) => {
    const others = words.filter((w) => w.word !== word.word)
    const distractors = shuffle(others).slice(0, 3)
    return { word, choices: shuffle([word, ...distractors]) }
  })
}

type Question = ReturnType<typeof buildQuestions>[number]

const levelCfg = {
  starter: {
    headerBg: 'bg-gradient-to-br from-pink-400 to-rose-400',
    backColor: 'text-pink-100',
    progressBg: 'bg-pink-200',
    progressFill: 'bg-pink-600',
    speakBg: 'bg-pink-500 hover:bg-pink-600 active:bg-pink-700',
    finishBg: 'bg-pink-500 hover:bg-pink-600',
  },
  explorer: {
    headerBg: 'bg-gradient-to-br from-blue-500 to-cyan-400',
    backColor: 'text-blue-100',
    progressBg: 'bg-blue-200',
    progressFill: 'bg-blue-600',
    speakBg: 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700',
    finishBg: 'bg-blue-500 hover:bg-blue-600',
  },
}

export default function ListenGame({ topic, level, isStarter, backUrl }: Props) {
  const router = useRouter()
  const { recordAnswer, recordActivity, addScore, recordPerfectGame, flush } = useGameSync()
  const { childId } = useParams<{ childId: string }>()
  const styles = levelCfg[level as keyof typeof levelCfg] ?? levelCfg.explorer

  const [questions, setQuestions] = useState<Question[]>(() => buildQuestions(topic.words))
  const [currentIdx, setCurrentIdx] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [wrongWords, setWrongWords] = useState<string[]>([])
  const [done, setDone] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  const current = questions[currentIdx]
  const total = questions.length

  useEffect(() => {
    if (done) {
      addScore(level, Math.round(score * 1.5))
      if (score === total) recordPerfectGame(level, topic.id, 'listen')
      if (score === total) setShowConfetti(true)
      saveStepScore(childId, topic.id, 'listen', score, total)
      flush()
    }
  }, [done])

  const speak = useCallback(
    (text: string) => speakWord(text, { rate: isStarter ? 0.8 : 1.0, pitch: isStarter ? 1.2 : 1.0 }),
    [isStarter]
  )

  // Auto-speak when question changes
  useEffect(() => {
    if (done || !current) return
    const t = setTimeout(() => speak(current.word.word), 350)
    return () => clearTimeout(t)
  }, [currentIdx, done, current, speak])

  const handleSelect = (choice: Word) => {
    if (selected !== null) return
    setSelected(choice.word)
    const correct = choice.word === current.word.word
    recordAnswer(level, topic.id, current.word, correct)
    if (correct) {
      setScore((s) => s + 1)
      playCorrectSound()
    } else {
      setWrongWords((ww) => [...ww, current.word.word])
      playWrongSound()
    }
    setTimeout(() => {
      if (currentIdx < total - 1) {
        setCurrentIdx((i) => i + 1)
        setSelected(null)
      } else {
        recordActivity(level)
        setDone(true)
      }
    }, 1100)
  }

  const restart = () => {
    setQuestions(buildQuestions(topic.words))
    setCurrentIdx(0)
    setSelected(null)
    setScore(0)
    setWrongWords([])
    setDone(false)
    setShowConfetti(false)
  }

  const pct = Math.round((score / total) * 100)
  const xpEarned = Math.round(score * 1.5)

  if (done) {
    return (
      <div className="flex flex-col min-h-screen">
        {showConfetti && <Confetti onDone={() => setShowConfetti(false)} />}
        <div className={`${styles.headerBg} px-4 pt-6 pb-4 text-white`}>
          <div className="flex items-center gap-3">
            <button onClick={() => router.push(backUrl)} aria-label="Quay lại" className={`${styles.backColor} text-xl flex-shrink-0 opacity-90 hover:opacity-100`}>←</button>
            <div className="flex-1 min-w-0">
              <p className={`${styles.backColor} text-[11px] font-bold uppercase tracking-wide leading-none mb-0.5 opacity-90 truncate`}>{topic.name}</p>
              <h1 className="text-lg font-black leading-tight truncate">🔊 Nghe &amp; Chọn Hình</h1>
            </div>
          </div>
        </div>
        <div className="flex-1 bg-gradient-to-b from-purple-50 to-pink-50 flex flex-col items-center justify-center px-4 py-8">
          <div className="text-7xl mb-4">
            {pct >= 90 ? '🏆' : pct >= 70 ? '⭐' : '💪'}
          </div>
          <h2 className="text-4xl font-black text-gray-800 mb-1">
            {score}/{total}
          </h2>
          <p className="text-gray-500 font-bold text-xl mb-2">{pct}% chính xác</p>
          <div className="inline-flex items-center gap-1.5 bg-yellow-50 border border-yellow-200 rounded-full px-4 py-1.5 mb-4">
            <span className="text-base">⭐</span>
            <span className="text-yellow-700 font-black text-sm">+{xpEarned} XP</span>
          </div>

          {wrongWords.length > 0 && (
            <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl px-4 py-3 mb-6 w-full">
              <p className="text-orange-700 font-bold text-sm mb-1.5">📝 Cần ôn thêm:</p>
              <div className="flex flex-wrap gap-2">
                {wrongWords.map((w) => (
                  <span key={w} className="bg-orange-100 text-orange-700 font-bold text-sm px-3 py-1 rounded-full">
                    {w}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="w-full space-y-3">
            <button
              onClick={restart}
              className={`w-full ${styles.finishBg} text-white font-black text-xl py-4 rounded-2xl shadow-lg transition-colors`}
            >
              🔄 Chơi lại
            </button>
            <button
              onClick={() => router.push(backUrl)}
              className="w-full bg-white border-2 border-gray-200 text-gray-600 font-bold text-xl py-4 rounded-2xl text-center"
            >
              ← Chọn chế độ khác
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className={`${styles.headerBg} px-4 pt-6 pb-4 text-white`}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push(backUrl)} aria-label="Quay lại" className={`${styles.backColor} text-xl flex-shrink-0 opacity-90 hover:opacity-100`}>←</button>
          <div className="flex-1 min-w-0">
            <p className={`${styles.backColor} text-[11px] font-bold uppercase tracking-wide leading-none mb-0.5 opacity-90 truncate`}>{topic.name}</p>
            <h1 className="text-lg font-black leading-tight truncate">🔊 Nghe &amp; Chọn Hình</h1>
          </div>
          <span className="bg-white/20 px-3 py-1 rounded-full font-black text-sm flex-shrink-0">
            {currentIdx + 1}/{total}
          </span>
        </div>
        <div className={`mt-2 h-2 ${styles.progressBg} rounded-full overflow-hidden`}>
          <div
            className={`h-full ${styles.progressFill} rounded-full transition-all duration-500`}
            style={{ width: `${((currentIdx + 1) / total) * 100}%` }}
          />
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 bg-gradient-to-b from-purple-50 to-pink-50 px-4 py-5 flex flex-col">
        {/* Screen-reader feedback */}
        <div role="alert" aria-live="assertive" className="sr-only">
          {selected !== null && (selected === current.word.word ? 'Chính xác!' : `Sai rồi. Đáp án đúng là ${current.word.word}.`)}
        </div>
        {/* Speaker */}
        <div className="flex flex-col items-center mb-6">
          <button
            onClick={() => speak(current.word.word)}
            className={`${styles.speakBg} text-white w-24 h-24 rounded-3xl text-5xl flex items-center justify-center shadow-xl active:scale-90 transition-all`}
            aria-label="Nghe lại"
          >
            🔊
          </button>
          <p className="text-gray-500 text-sm font-semibold mt-2">Bấm để nghe lại</p>
        </div>

        {/* 2×2 choice grid */}
        <div className="grid grid-cols-2 gap-3 flex-1">
          {current.choices.map((choice) => {
            const isCorrect = choice.word === current.word.word
            const isSelected = selected === choice.word
            const showResult = selected !== null

            let cellClass = 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md'
            if (showResult && isCorrect) cellClass = 'bg-green-400 border-green-500'
            else if (showResult && isSelected && !isCorrect) cellClass = 'bg-red-400 border-red-500'

            const textWhite = showResult && (isCorrect || isSelected)

            return (
              <button
                key={choice.word}
                onClick={() => handleSelect(choice)}
                disabled={selected !== null}
                className={`
                  ${cellClass} border-2 rounded-2xl
                  flex flex-col items-center justify-center gap-2
                  shadow-md transition-all duration-200 active:scale-95
                  min-h-[130px] p-3
                `}
              >
                <WordIcon word={choice.word} emoji={choice.emoji} emojiClass="text-6xl leading-none select-none" iconSize={72} />
                {showResult && (
                  <span className={`text-sm font-black ${textWhite ? 'text-white' : 'text-gray-600'}`}>
                    {choice.word}
                  </span>
                )}
                {showResult && isCorrect && (
                  <span className="text-xl">✅</span>
                )}
                {showResult && isSelected && !isCorrect && (
                  <span className="text-xl">❌</span>
                )}
              </button>
            )
          })}
        </div>

        <p className="text-center text-gray-500 text-sm font-medium mt-4">
          Chọn hình đúng với từ bạn vừa nghe
        </p>
      </div>
    </div>
  )
}
