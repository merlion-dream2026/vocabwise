'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useGameSync } from '@/lib/GameSyncContext'
import { saveStepScore } from '@/lib/stepScores'
import { playCorrectSound, playWrongSound } from '@/lib/gameSound'
import Confetti from '@/components/Confetti'
import GameResultScreen from '@/components/GameResultScreen'
import { GameHeader, AnswerButton, cta } from '@/components/ChunkyUI'


type Word = { word: string; meaning: string; emoji: string; examples: { en: string; vi: string }[] }
type Topic = { id: string; name: string; emoji: string; color: string; words: Word[] }
type Props = { topic: Topic; level: string; backUrl: string }

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

function buildQuestions(words: Word[]) {
  return shuffle(words).map((word) => {
    const others = words.filter((w) => w.word !== word.word)
    const distractors = shuffle(others).slice(0, 2)
    const choices = shuffle([word, ...distractors])
    return { word, choices }
  })
}

type Question = ReturnType<typeof buildQuestions>[number]

const LABELS = ['A', 'B', 'C']

const levelCfg = {
  starter: {
    headerBg: 'bg-gradient-to-br from-pink-400 to-rose-400',
    backColor: 'text-pink-100',
    progressBg: 'bg-pink-200',
    progressFill: 'bg-pink-600',
    finishBg: 'bg-pink-500 hover:bg-pink-600',
  },
  explorer: {
    headerBg: 'bg-gradient-to-br from-blue-500 to-cyan-400',
    backColor: 'text-blue-100',
    progressBg: 'bg-blue-200',
    progressFill: 'bg-blue-600',
    finishBg: 'bg-blue-500 hover:bg-blue-600',
  },
}

export default function QuizGame({ topic, level, backUrl }: Props) {
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
      recordGameResult(level, topic.id, 'quiz', score, total)
      if (score === total) setShowConfetti(true)
      saveStepScore(childId, topic.id, 'quiz', score, total)
      flush()
    }
  }, [done])

  const handleChoice = (word: string) => {
    if (selected !== null) return
    setSelected(word)
    const correct = word === current.word.word
    recordAnswer(level, topic.id, current.word, correct)
    if (correct) {
      setScore((s) => s + 1)
      playCorrectSound()
    } else {
      setWrongWords((w) => [...w, current.word.word])
      playWrongSound()
    }
  }

  const goNext = () => {
    if (currentIdx + 1 >= total) {
      recordActivity(level)
      setDone(true)
    } else {
      setCurrentIdx((i) => i + 1)
      setSelected(null)
    }
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

  if (done) {
    const xpEarned = Math.round(score * 1.5)
    return (
      <div className="flex flex-col min-h-screen">
        {showConfetti && <Confetti onDone={() => setShowConfetti(false)} />}
        <GameHeader colorCls={styles.headerBg} title="🔤 Chọn Nghĩa Đúng" subtitle={topic.name} onBack={() => router.push(backUrl)} />
        <div className="flex-1 bg-gradient-to-b from-purple-50 to-pink-50 flex flex-col items-center justify-center px-4 py-8">
          <GameResultScreen
            score={score} total={total} xpEarned={xpEarned} wrongWords={wrongWords}
            accentCls={styles.finishBg} onRestart={restart} onExit={() => router.push(backUrl)}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <GameHeader colorCls={styles.headerBg} title="🔤 Chọn Nghĩa Đúng" subtitle={topic.name} onBack={() => router.push(backUrl)} right={<>{currentIdx + 1}/{total}</>} progress={{ value: ((currentIdx + 1) / total) * 100, max: 100 }} />

      <div className="flex-1 bg-gradient-to-b from-purple-50 to-pink-50 flex flex-col px-4 py-6">
        {/* Screen-reader feedback */}
        <div role="alert" aria-live="assertive" className="sr-only">
          {selected !== null && (selected === current.word.word ? 'Chính xác!' : `Sai rồi. Đáp án đúng là ${current.word.word}.`)}
        </div>
        {/* Question card */}
        <div className="bg-white rounded-3xl border-2 border-b-[4px] border-indigo-100 border-b-indigo-300 p-6 flex flex-col items-center text-center mb-6">
          <p className="text-gray-500 font-bold text-sm uppercase tracking-wider mb-2">Nghĩa tiếng Việt là:</p>
          <h2 className="text-3xl font-bold text-gray-800">{current.word.meaning}</h2>
          <p className="text-gray-500 font-semibold text-sm mt-3">Từ tiếng Anh tương ứng là gì?</p>
        </div>

        {/* Choices */}
        <div className="space-y-3">
          {current.choices.map((choice, idx) => {
            const isSelected = selected === choice.word
            const isCorrect = choice.word === current.word.word
            const state = selected === null ? 'idle' : isCorrect ? 'correct' : isSelected ? 'wrong' : 'dim'
            return (
              <AnswerButton key={choice.word} state={state} badge={LABELS[idx]}
                onClick={() => handleChoice(choice.word)} disabled={selected !== null}>
                {choice.word}
              </AnswerButton>
            )
          })}
        </div>
        {/* Example sentence — only on a wrong answer, gives the "why" beyond just the right word */}
        {selected !== null && selected !== current.word.word && current.word.examples?.[0] && (
          <div className="mt-4 bg-blue-50 border-2 border-blue-100 rounded-2xl p-4">
            <p className="text-blue-500 font-bold text-xs uppercase tracking-wide mb-1">💡 Ví dụ</p>
            <p className="text-gray-700 font-semibold text-sm">&quot;{current.word.examples[0].en}&quot;</p>
            <p className="text-gray-400 text-xs mt-0.5">{current.word.examples[0].vi}</p>
          </div>
        )}

        <div className="mt-5">
          <button
            onClick={goNext}
            disabled={selected === null}
            className={cta('blue')}
          >
            {currentIdx === total - 1 ? '🎉 Xong!' : 'Tiếp →'}
          </button>
        </div>

      </div>
    </div>
  )
}
