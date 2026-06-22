'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { recordAnswer, recordActivity, addScore, recordPerfectGame, flush } from '@/lib/gameSync'
import Confetti from '@/components/Confetti'
import { speak as speakWord } from '@/lib/speak'
import WordIcon from '@/components/WordIcon'

type Word = { word: string; meaning: string; emoji: string }
type Topic = { id: string; name: string; emoji: string; color: string; words: Word[] }
type Props = { topic: Topic; level: string; backUrl: string }

const ALPHABET = 'abcdefghijklmnoprstuw'

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

type Question = { word: Word; hiddenIdx: number; options: string[] }

function pickHiddenIdx(word: string): number {
  // Prefer a middle letter; avoid index 0 for words longer than 2 chars
  const chars = word.toLowerCase().split('')
  const candidates = chars.length > 2
    ? chars.map((_, i) => i).slice(1, -1)  // middle only
    : [0]
  return candidates[Math.floor(Math.random() * candidates.length)]
}

function buildQuestions(words: Word[]): Question[] {
  return shuffle(words).map(word => {
    const hiddenIdx = pickHiddenIdx(word.word)
    const correct = word.word[hiddenIdx].toLowerCase()
    const distractors = shuffle(ALPHABET.split('').filter(l => l !== correct)).slice(0, 3)
    return { word, hiddenIdx, options: shuffle([correct, ...distractors]) }
  })
}

export default function FillLetterGame({ topic, level, backUrl }: Props) {
  const router = useRouter()
  const [questions] = useState(() => buildQuestions(topic.words))
  const [idx, setIdx] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [wrongWords, setWrongWords] = useState<string[]>([])
  const [done, setDone] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  const q = questions[idx]
  const total = questions.length
  const speak = useCallback((text: string) => speakWord(text, { rate: 0.9 }), [])

  useEffect(() => {
    if (done) return
    const t = setTimeout(() => speak(q.word.word), 300)
    return () => clearTimeout(t)
  }, [idx, done])

  useEffect(() => {
    if (done) {
      addScore(level, score * 2)
      if (score === total) { recordPerfectGame(level, topic.id, 'fillletter'); setShowConfetti(true) }
      flush()
    }
  }, [done])

  const advance = () => {
    const next = idx + 1
    if (next >= total) { recordActivity(level); setDone(true) }
    else { setIdx(next); setSelected(null) }
  }

  const handleSelect = (letter: string) => {
    if (selected !== null) return
    setSelected(letter)
    const correct = letter === q.word.word[q.hiddenIdx].toLowerCase()
    if (correct) {
      setScore(s => s + 1)
      recordAnswer(level, topic.id, q.word, true)
      speak(q.word.word)
    } else {
      recordAnswer(level, topic.id, q.word, false)
      setWrongWords(ww => ww.includes(q.word.word) ? ww : [...ww, q.word.word])
    }
    setTimeout(() => advance(), 1200)
  }

  const restart = () => { setIdx(0); setSelected(null); setScore(0); setWrongWords([]); setDone(false); setShowConfetti(false) }

  const renderWord = () => {
    const correctLetter = q.word.word[q.hiddenIdx].toLowerCase()
    return q.word.word.split('').map((char, i) => {
      if (i === q.hiddenIdx) {
        const answered = selected !== null
        const isRight = selected === correctLetter
        return (
          <span key={i}
            className={`inline-flex items-center justify-center w-10 h-12 border-b-4 text-2xl font-black mx-0.5 transition-colors
              ${answered
                ? isRight ? 'border-green-400 text-green-600' : 'border-red-400 text-red-500'
                : 'border-orange-400 text-orange-500'}`}>
            {answered ? (isRight ? selected.toUpperCase() : selected.toUpperCase()) : '?'}
          </span>
        )
      }
      return <span key={i} className="text-2xl font-black text-gray-800 leading-none">{char}</span>
    })
  }

  if (done) {
    const pct = Math.round((score / total) * 100)
    const xpEarned = score * 2
    return (
      <div className="flex flex-col min-h-screen">
        {showConfetti && <Confetti />}
        <div className="bg-gradient-to-br from-orange-400 to-amber-500 px-4 pt-12 pb-8 text-white">
          <button onClick={() => router.push(backUrl)} className="text-orange-100 font-bold text-sm flex items-center gap-1 mb-4">← {topic.name}</button>
          <h1 className="text-2xl font-black">🔡 Điền chữ thiếu</h1>
        </div>
        <div className="flex-1 bg-gradient-to-b from-orange-50 to-amber-50 flex flex-col items-center justify-center px-4 py-8">
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
                {wrongWords.map(w => <span key={w} className="bg-orange-100 text-orange-700 font-bold text-sm px-3 py-1 rounded-full">{w}</span>)}
              </div>
            </div>
          )}
          <div className="w-full space-y-3">
            <button onClick={restart} className="w-full bg-orange-500 text-white font-black text-xl py-4 rounded-2xl shadow-lg">🔄 Chơi lại</button>
            <button onClick={() => router.push(backUrl)} className="w-full bg-white border-2 border-gray-200 text-gray-600 font-bold text-xl py-4 rounded-2xl">← Chọn chế độ khác</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="bg-gradient-to-br from-orange-400 to-amber-500 px-4 pt-12 pb-4 text-white">
        <button onClick={() => router.push(backUrl)} className="text-orange-100 font-bold text-sm flex items-center gap-1 mb-3">← {topic.name}</button>
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-black">🔡 Điền chữ thiếu</h1>
          <span className="bg-white/20 px-3 py-1 rounded-full font-black text-sm">{idx + 1}/{total}</span>
        </div>
        <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full bg-white/70 rounded-full transition-all duration-500" style={{ width: `${((idx + 1) / total) * 100}%` }} />
        </div>
      </div>

      <div className="flex-1 bg-gradient-to-b from-orange-50 to-amber-50 flex flex-col items-center justify-center px-4 gap-5">
        {/* Screen-reader feedback */}
        <div role="alert" aria-live="assertive" className="sr-only">
          {selected !== null && (selected === q.word.word[q.hiddenIdx].toLowerCase() ? 'Chính xác!' : `Sai rồi. Chữ đúng là ${q.word.word[q.hiddenIdx]}.`)}
        </div>
        <div className="flex justify-center select-none"><WordIcon word={q.word.word} emoji={q.word.emoji} emojiClass="text-8xl" iconSize={100} /></div>
        <p className="text-xl font-bold text-gray-600 text-center">{q.word.meaning}</p>

        <div className="flex items-center gap-1 py-2">{renderWord()}</div>

        <button onClick={() => speak(q.word.word)}
          className="bg-orange-400 text-white w-11 h-11 rounded-xl text-xl flex items-center justify-center shadow-md active:scale-90 transition-all">
          🔊
        </button>

        <div className="grid grid-cols-4 gap-3 w-full max-w-xs">
          {q.options.map(letter => {
            const answered = selected !== null
            const isSelected = selected === letter
            const isCorrect = letter === q.word.word[q.hiddenIdx].toLowerCase()
            let style = 'bg-white border-2 border-gray-200 text-gray-700 hover:border-orange-300'
            if (answered && isCorrect) style = 'bg-green-100 border-2 border-green-400 text-green-700'
            else if (answered && isSelected) style = 'bg-red-100 border-2 border-red-400 text-red-600'
            else if (answered) style = 'bg-white border-2 border-gray-100 text-gray-300'
            return (
              <button key={letter} onClick={() => handleSelect(letter)}
                className={`${style} font-black text-2xl py-4 rounded-2xl transition-all active:scale-95`}>
                {letter.toUpperCase()}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
