'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { speak as speakWord } from '@/lib/speak'
import { useGameSync } from '@/lib/GameSyncContext'
import { saveStepScore } from '@/lib/stepScores'
import { playCorrectSound, playWrongSound } from '@/lib/gameSound'
import GameResultScreen from '@/components/GameResultScreen'
import Confetti from '@/components/Confetti'
import WordIcon from '@/components/WordIcon'
import { GameHeader } from '@/components/ChunkyUI'
import { PRESS } from '@/components/TopicHub'

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
  const { recordAnswer, recordActivity, addScore, recordGameResult, flush } = useGameSync()
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
      recordGameResult(level, topic.id, 'listen', score, total)
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

  const xpEarned = Math.round(score * 1.5)

  if (done) {
    return (
      <div className="flex flex-col min-h-screen">
        {showConfetti && <Confetti onDone={() => setShowConfetti(false)} />}
        <GameHeader colorCls={styles.headerBg} title="🔊 Nghe &amp; Chọn Hình" subtitle={topic.name} onBack={() => router.push(backUrl)} />
        <div className="flex-1 bg-gradient-to-b from-purple-50 to-pink-50 flex flex-col items-center justify-center px-4 py-8">
          <GameResultScreen
            score={score} total={total} xpEarned={xpEarned} wrongWords={wrongWords}
            onRestart={restart} onExit={() => router.push(backUrl)}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <GameHeader colorCls={styles.headerBg} title="🔊 Nghe &amp; Chọn Hình" subtitle={topic.name} onBack={() => router.push(backUrl)}
        right={<>{currentIdx + 1}/{total}</>} progress={{ value: ((currentIdx + 1) / total) * 100, max: 100 }} />

      {/* Body */}
      <div className="flex-1 bg-gradient-to-b from-purple-50 to-pink-50 px-4 py-3 flex flex-col">
        {/* Screen-reader feedback */}
        <div role="alert" aria-live="assertive" className="sr-only">
          {selected !== null && (selected === current.word.word ? 'Chính xác!' : `Sai rồi. Đáp án đúng là ${current.word.word}.`)}
        </div>
        {/* Speaker */}
        <div className="flex flex-col items-center mb-3">
          <button
            onClick={() => speak(current.word.word)}
            className={`${styles.speakBg} text-white w-16 h-16 rounded-2xl border-b-[4px] border-black/20 text-3xl flex items-center justify-center ${PRESS}`}
            aria-label="Nghe lại"
          >
            🔊
          </button>
          <p className="text-gray-500 text-xs font-semibold mt-1">Bấm để nghe lại</p>
        </div>

        {/* 2×2 choice grid */}
        <div className="grid grid-cols-2 content-center gap-3 flex-1">
          {current.choices.map((choice) => {
            const isCorrect = choice.word === current.word.word
            const isSelected = selected === choice.word
            const showResult = selected !== null

            let cellClass = 'bg-white border-slate-200 border-b-slate-300'
            if (showResult && isCorrect) cellClass = 'bg-green-400 border-green-500 border-b-green-700'
            else if (showResult && isSelected && !isCorrect) cellClass = 'bg-red-400 border-red-500 border-b-red-700 ax-shake'
            else if (showResult) cellClass = 'bg-white border-slate-200 border-b-slate-200 opacity-60'

            const textWhite = showResult && (isCorrect || isSelected)

            return (
              <button
                key={choice.word}
                onClick={() => handleSelect(choice)}
                disabled={selected !== null}
                className={`
                  ${cellClass} border-2 border-b-[4px] rounded-3xl
                  flex flex-col items-center justify-center gap-1
                  ${PRESS}
                  aspect-square overflow-hidden p-2
                `}
              >
                <WordIcon word={choice.word} emoji={choice.emoji} emojiClass="text-4xl leading-none select-none" iconSize={48} />
                {showResult && (
                  <span className={`text-xs font-bold ${textWhite ? 'text-white' : 'text-gray-600'}`}>
                    {choice.word}
                  </span>
                )}
                {showResult && isCorrect && (
                  <span className="text-lg leading-none">✅</span>
                )}
                {showResult && isSelected && !isCorrect && (
                  <span className="text-lg leading-none">❌</span>
                )}
              </button>
            )
          })}
        </div>

        <p className="text-center text-gray-500 text-xs font-medium mt-2">
          Chọn hình đúng với từ bạn vừa nghe
        </p>
      </div>
    </div>
  )
}
