'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { recordAnswer, recordActivity, addScore, recordPerfectGame, flush } from '@/lib/gameSync'
import { saveStepScore } from '@/lib/stepScores'
import Confetti from '@/components/Confetti'


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
      if (score === total) recordPerfectGame(level, topic.id, 'quiz')
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
    } else {
      setWrongWords((w) => [...w, current.word.word])
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
    const pct = Math.round((score / total) * 100)
    const xpEarned = Math.round(score * 1.5)
    return (
      <div className="flex flex-col min-h-screen">
        <div className={`${styles.headerBg} px-4 pt-12 pb-8 text-white`}>
          <button onClick={() => router.push(backUrl)} className={`${styles.backColor} font-bold text-sm flex items-center gap-1 mb-4 opacity-90`}>← {topic.name}</button>
          <h1 className="text-2xl font-black">🔤 Chọn Nghĩa Đúng</h1>
        </div>
        <div className="flex-1 bg-gradient-to-b from-purple-50 to-pink-50 flex flex-col items-center justify-center px-4 py-8">
          <div className="text-7xl mb-4">{score === total ? '🏆' : score >= total * 0.7 ? '⭐' : '💪'}</div>
          <h2 className="text-3xl font-black text-gray-800 mb-2">Hoàn thành!</h2>
          <p className="text-gray-500 font-bold text-lg mb-1">{score}/{total} câu đúng ({pct}%)</p>
          <div className="inline-flex items-center gap-1.5 bg-yellow-50 border border-yellow-200 rounded-full px-4 py-1.5 mb-4">
            <span className="text-base">⭐</span>
            <span className="text-yellow-700 font-black text-sm">+{xpEarned} XP</span>
          </div>
          {wrongWords.length > 0 && (
            <div className="mt-0 w-full bg-white rounded-2xl border-2 border-orange-200 p-4 mb-4">
              <p className="text-orange-600 font-black text-sm mb-2">⚠️ Cần ôn lại:</p>
              <div className="flex flex-wrap gap-2">
                {wrongWords.map((w) => (
                  <span key={w} className="bg-orange-100 text-orange-700 font-bold px-3 py-1 rounded-full text-sm">{w}</span>
                ))}
              </div>
            </div>
          )}
          <div className="w-full space-y-3 mt-2">
            <button onClick={restart} className={`w-full ${styles.finishBg} text-white font-black text-xl py-4 rounded-2xl shadow-lg transition-colors`}>
              🔄 Chơi lại
            </button>
            <button onClick={() => router.push(backUrl)} className="w-full bg-white border-2 border-gray-200 text-gray-600 font-bold text-xl py-4 rounded-2xl text-center">← Chọn chế độ khác</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className={`${styles.headerBg} px-4 pt-12 pb-5 text-white`}>
        <button onClick={() => router.push(backUrl)} className={`${styles.backColor} font-bold text-sm flex items-center gap-1 mb-3 opacity-90`}>← {topic.name}</button>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black">🔤 Chọn Nghĩa Đúng</h1>
          <span className="bg-white/20 px-3 py-1 rounded-full font-black text-sm">{currentIdx + 1}/{total}</span>
        </div>
        <div className={`mt-3 h-2 ${styles.progressBg} rounded-full overflow-hidden`}>
          <div
            className={`h-full ${styles.progressFill} rounded-full transition-all duration-500`}
            style={{ width: `${((currentIdx + 1) / total) * 100}%` }}
          />
        </div>
      </div>

      <div className="flex-1 bg-gradient-to-b from-purple-50 to-pink-50 flex flex-col px-4 py-6">
        {/* Screen-reader feedback */}
        <div role="alert" aria-live="assertive" className="sr-only">
          {selected !== null && (selected === current.word.word ? 'Chính xác!' : `Sai rồi. Đáp án đúng là ${current.word.word}.`)}
        </div>
        {/* Question card */}
        <div className="bg-white rounded-3xl border-2 border-indigo-100 shadow-xl p-6 flex flex-col items-center text-center mb-6">
          <p className="text-gray-500 font-bold text-sm uppercase tracking-wider mb-2">Nghĩa tiếng Việt là:</p>
          <h2 className="text-3xl font-black text-gray-800">{current.word.meaning}</h2>
          <p className="text-gray-500 font-semibold text-sm mt-3">Từ tiếng Anh tương ứng là gì?</p>
        </div>

        {/* Choices */}
        <div className="space-y-3">
          {current.choices.map((choice, idx) => {
            const isSelected = selected === choice.word
            const isCorrect = choice.word === current.word.word
            let style = 'bg-white border-gray-200 text-gray-800'
            if (selected !== null) {
              if (isCorrect) style = 'bg-green-100 border-green-400 text-green-800'
              else if (isSelected) style = 'bg-red-100 border-red-400 text-red-700'
              else style = 'bg-white border-gray-100 text-gray-400'
            }
            return (
              <button
                key={choice.word}
                onClick={() => handleChoice(choice.word)}
                disabled={selected !== null}
                className={`w-full flex items-center gap-4 border-2 rounded-2xl px-5 py-4 font-bold text-lg transition-all duration-150 active:scale-95 ${style}`}
              >
                <span className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 font-black text-base flex items-center justify-center flex-shrink-0">
                  {selected !== null && isCorrect ? '✓' : selected !== null && isSelected ? '✗' : LABELS[idx]}
                </span>
                <span>{choice.word}</span>
              </button>
            )
          })}
        </div>
        {/* Nav */}
        <div className="flex gap-3 mt-5">
          <div className="flex-1 py-4 rounded-2xl bg-gray-100 text-gray-300 font-black text-xl text-center select-none">
            ← Trước
          </div>
          <button
            onClick={goNext}
            disabled={selected === null}
            className={`flex-1 py-4 rounded-2xl font-black text-xl text-white transition-colors shadow-md
              ${selected !== null ? 'bg-blue-500 hover:bg-blue-600 active:scale-95' : 'bg-blue-200 cursor-not-allowed'}`}
          >
            {currentIdx === total - 1 ? '🎉 Xong!' : 'Tiếp →'}
          </button>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-1.5 mt-4 flex-wrap">
          {questions.map((_, idx) => (
            <div
              key={idx}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-200
                ${idx === currentIdx ? 'bg-blue-500 scale-125' : idx < currentIdx ? 'bg-blue-300' : 'bg-blue-100'}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
