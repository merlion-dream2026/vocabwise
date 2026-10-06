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

function blankSentence(sentence: string, word: string): string {
  const regex = new RegExp(`\\b${word}\\w*`, 'i')
  return sentence.replace(regex, '___')
}

function buildQuestions(words: Word[]) {
  return shuffle(words).map((word) => {
    const ex = word.examples[Math.floor(Math.random() * word.examples.length)]
    const blanked = blankSentence(ex.en, word.word)
    const others = words.filter((w) => w.word !== word.word)
    const distractors = shuffle(others).slice(0, 2)
    return { word, blanked, translation: ex.vi, choices: shuffle([word, ...distractors]) }
  })
}

type Question = ReturnType<typeof buildQuestions>[number]

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

export default function GapFillGame({ topic, level, backUrl }: Props) {
  const { childId } = useParams<{ childId: string }>()
  const router = useRouter()
  const { recordAnswer, recordActivity, addScore, recordGameResult, flush } = useGameSync()
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
      recordGameResult(level, topic.id, 'gapfill', score, total)
      saveStepScore(childId, topic.id, 'gapfill', score, total)
      if (score === total) setShowConfetti(true)
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
        <GameHeader colorCls={styles.headerBg} title="📝 Điền Vào Chỗ Trống" subtitle={topic.name} onBack={() => router.push(backUrl)} />
        <div className="flex-1 bg-gradient-to-b from-purple-50 to-pink-50 flex flex-col items-center justify-center px-4 py-8">
          <GameResultScreen
            score={score} total={total} xpEarned={xpEarned} wrongWords={wrongWords}
            accentCls={styles.finishBg} onRestart={restart} onExit={() => router.push(backUrl)}
          />
        </div>
      </div>
    )
  }

  // Split sentence around ___ for highlighting
  const parts = current.blanked.split('___')

  return (
    <div className="flex flex-col min-h-screen">
      <GameHeader colorCls={styles.headerBg} title="📝 Điền Vào Chỗ Trống" subtitle={topic.name} onBack={() => router.push(backUrl)} right={<>{currentIdx + 1}/{total}</>} progress={{ value: ((currentIdx + 1) / total) * 100, max: 100 }} />

      <div className="flex-1 bg-gradient-to-b from-purple-50 to-pink-50 flex flex-col px-4 py-6">
        {/* Screen-reader feedback */}
        <div role="alert" aria-live="assertive" className="sr-only">
          {selected !== null && (selected === current.word.word ? 'Chính xác!' : `Sai rồi. Đáp án đúng là ${current.word.word}.`)}
        </div>
        {/* Sentence card */}
        <div className="bg-white rounded-3xl border-2 border-teal-100 shadow-xl p-6 mb-6">
          <p className="text-gray-500 font-bold text-xs uppercase tracking-wider mb-4 text-center">Điền từ đúng vào chỗ trống:</p>
          <p className="text-xl font-bold text-gray-800 leading-relaxed text-center">
            {parts[0]}
            <span className={`inline-block mx-1 px-3 py-0.5 rounded-lg font-bold text-xl transition-all ${
              selected === null
                ? 'bg-teal-100 text-teal-400 border-2 border-dashed border-teal-300'
                : selected === current.word.word
                ? 'bg-green-100 text-green-700 border-2 border-green-400'
                : 'bg-red-100 text-red-600 border-2 border-red-400'
            }`}>
              {selected !== null ? (selected === current.word.word ? selected : `${selected} ✗`) : '___'}
            </span>
            {parts[1]}
          </p>
          <p className="text-gray-500 text-sm italic text-center mt-3">{current.translation}</p>
        </div>

        {/* Choices */}
        <div className="space-y-3">
          {current.choices.map((choice) => {
            const isSelected = selected === choice.word
            const isCorrect = choice.word === current.word.word
            const state = selected === null ? 'idle' : isCorrect ? 'correct' : isSelected ? 'wrong' : 'dim'
            return (
              <AnswerButton key={choice.word} state={state}
                onClick={() => handleChoice(choice.word)} disabled={selected !== null}>
                {choice.word}
                {selected !== null && (
                  <span className="block text-sm font-semibold mt-0.5 opacity-80">{choice.meaning}</span>
                )}
              </AnswerButton>
            )
          })}
        </div>
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
