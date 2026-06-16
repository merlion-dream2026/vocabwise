'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { recordAnswer, recordActivity, addScore, recordPerfectGame, flush } from '@/lib/gameSync'
import Confetti from '@/components/Confetti'
import { speak as speakWord } from '@/lib/speak'
import WordIcon from '@/components/WordIcon'

type Word = { word: string; meaning: string; emoji: string; examples: { en: string; vi: string }[] }
type Topic = { id: string; name: string; emoji: string; color: string; words: Word[] }
type Props = { topic: Topic; level: string; backUrl: string }

type Question = { target: Word; choices: Word[] }

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

function buildQuestions(words: Word[]): Question[] {
  return shuffle(words).map((word) => ({
    target: word,
    choices: shuffle([word, ...shuffle(words.filter((w) => w.word !== word.word)).slice(0, 3)]),
  }))
}

const BUBBLE_GRADIENTS = [
  'from-pink-300 to-rose-400',
  'from-purple-300 to-violet-400',
  'from-sky-300 to-blue-400',
  'from-amber-300 to-orange-400',
]
const FLOAT_DURATIONS = [2.2, 2.6, 1.9, 2.4]
const FLOAT_DELAYS = [0, 0.5, 0.3, 0.7]

export default function BubbleGame({ topic, level, backUrl }: Props) {
  const router = useRouter()
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
      addScore(level, score)
      if (score === total) recordPerfectGame(level, topic.id, 'bubble')
      if (score === total) setShowConfetti(true)
      flush()
    }
  }, [done])

  const speak = (text: string) => speakWord(text, { rate: 0.8, pitch: 1.2 })

  useEffect(() => {
    speak(current.target.word)
  }, [currentIdx])

  const handleChoice = (word: string) => {
    if (selected !== null) return
    setSelected(word)
    const correct = word === current.target.word
    recordAnswer(level, topic.id, current.target, correct)
    if (correct) {
      setScore((s) => s + 1)
    } else {
      setWrongWords((w) => [...w, current.target.word])
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
    const xpEarned = score
    const starEmoji = score === total ? '🏆' : score >= total * 0.7 ? '⭐' : '💪'
    return (
      <div className="flex flex-col min-h-screen">
        <div className="bg-gradient-to-br from-pink-400 to-rose-400 px-4 pt-12 pb-8 text-white">
          <button onClick={() => router.push(backUrl)} className="text-pink-100 font-bold text-sm flex items-center gap-1 mb-4 opacity-90">← {topic.name}</button>
          <h1 className="text-2xl font-black">🫧 Bắt Bong Bóng</h1>
        </div>
        <div className="flex-1 bg-gradient-to-b from-purple-50 to-pink-50 flex flex-col items-center justify-center px-4 py-8">
          <div className="text-7xl mb-4">{starEmoji}</div>
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
            <button onClick={restart} className="w-full bg-pink-500 hover:bg-pink-600 text-white font-black text-xl py-4 rounded-2xl shadow-lg transition-colors">
              🔄 Chơi lại
            </button>
            <button onClick={() => router.push(backUrl)} className="w-full bg-white border-2 border-gray-200 text-gray-600 font-bold text-xl py-4 rounded-2xl text-center">← Chọn chế độ khác</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <style>{`
        @keyframes floatUp {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-16px) scale(1.04); }
        }
      `}</style>
      <div className="flex flex-col min-h-screen">
        <div className="bg-gradient-to-br from-pink-400 to-rose-400 px-4 pt-12 pb-5 text-white">
          <button onClick={() => router.push(backUrl)} className="text-pink-100 font-bold text-sm flex items-center gap-1 mb-3 opacity-90">← {topic.name}</button>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-black">🫧 Bắt Bong Bóng</h1>
            <span className="bg-white/20 px-3 py-1 rounded-full font-black text-sm">{currentIdx + 1}/{total}</span>
          </div>
          <div className="mt-3 h-2 bg-pink-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-pink-600 rounded-full transition-all duration-500"
              style={{ width: `${((currentIdx + 1) / total) * 100}%` }}
            />
          </div>
        </div>

        <div className="flex-1 bg-gradient-to-b from-sky-50 to-purple-50 flex flex-col px-4 py-6">
          {/* Audio prompt */}
          <div className="text-center mb-6">
            <p className="text-gray-500 font-bold text-sm uppercase tracking-wider mb-3">Nghe và chạm đúng bong bóng!</p>
            <button
              onClick={() => speak(current.target.word)}
              className="bg-white border-2 border-pink-200 rounded-2xl px-6 py-3 shadow-md active:scale-95 transition-transform inline-flex items-center gap-2"
            >
              <span className="text-2xl">🔊</span>
              <span className="text-gray-700 font-black text-lg">
                {selected !== null ? current.target.word : '???'}
              </span>
            </button>
          </div>

          {/* Bubbles */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            {current.choices.map((choice, idx) => {
              const isSelected = selected === choice.word
              const isCorrect = choice.word === current.target.word
              let ringClass = ''
              if (selected !== null) {
                if (isCorrect) ringClass = 'ring-4 ring-green-400'
                else if (isSelected) ringClass = 'ring-4 ring-red-400'
              }
              return (
                <button
                  key={choice.word}
                  onClick={() => handleChoice(choice.word)}
                  disabled={selected !== null}
                  style={{
                    animation: selected === null
                      ? `floatUp ${FLOAT_DURATIONS[idx]}s ease-in-out ${FLOAT_DELAYS[idx]}s infinite`
                      : 'none',
                  }}
                  className={`
                    aspect-square rounded-full border-4 border-white/50
                    bg-gradient-to-br ${BUBBLE_GRADIENTS[idx]}
                    flex flex-col items-center justify-center shadow-xl
                    transition-all duration-300 active:scale-95 ${ringClass}
                  `}
                >
                  <WordIcon word={choice.word} emoji={choice.emoji} emojiClass="text-5xl" iconSize={60} className="mb-1" />
                  {selected !== null && (
                    <>
                      <span className="text-white font-black text-sm text-center px-2 leading-tight drop-shadow">
                        {isCorrect ? '✓ ' : isSelected ? '✗ ' : ''}{choice.word}
                      </span>
                      <span className="text-white/90 font-semibold text-xs text-center px-2 leading-tight">
                        {choice.meaning}
                      </span>
                    </>
                  )}
                </button>
              )
            })}
          </div>

          {/* Next */}
          <button
            onClick={goNext}
            disabled={selected === null}
            className={`w-full py-4 rounded-2xl font-black text-xl text-white transition-colors shadow-md
              ${selected !== null ? 'bg-blue-500 hover:bg-blue-600 active:scale-95' : 'bg-blue-200 cursor-not-allowed'}`}
          >
            {currentIdx === total - 1 ? '🎉 Xong!' : 'Tiếp →'}
          </button>

          {/* Dots */}
          <div className="flex justify-center gap-1.5 mt-4 flex-wrap">
            {questions.map((_, idx) => (
              <div
                key={idx}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-200
                  ${idx === currentIdx ? 'bg-pink-500 scale-125' : idx < currentIdx ? 'bg-pink-300' : 'bg-pink-100'}`}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
