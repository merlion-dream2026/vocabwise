'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useGameSync } from '@/lib/GameSyncContext'
import { saveStepScore } from '@/lib/stepScores'
import { playCorrectSound, playWrongSound } from '@/lib/gameSound'
import Confetti from '@/components/Confetti'
import { speak as speakWord } from '@/lib/speak'
import WordIcon from '@/components/WordIcon'
import GameResultScreen from '@/components/GameResultScreen'

type Word = { word: string; meaning: string; emoji: string; examples: { en: string; vi: string }[] }
type Topic = { id: string; name: string; emoji: string; color: string; words: Word[] }
type Props = { topic: Topic; level: string; backUrl: string }
type Tile = { id: string; letter: string; used: boolean }

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

function buildTiles(word: string): Tile[] {
  const letters = word.toLowerCase().replace(/\s+/g, '').split('')
  const consonants = 'bcdfghjklmnpqrstvwxyz'.split('')
  const extrasCount = letters.length >= 7 ? 1 : 2
  const pool = shuffle(consonants.filter((c) => !letters.includes(c))).slice(0, extrasCount)
  return shuffle([...letters, ...pool]).map((l, i) => ({ id: `${l}-${i}`, letter: l, used: false }))
}

export default function SpellGame({ topic, level, backUrl }: Props) {
  const { childId } = useParams<{ childId: string }>()
  const router = useRouter()
  const { recordAnswer, recordActivity, addScore, recordGameResult, flush } = useGameSync()
  const [words, setWords] = useState(() => shuffle(topic.words))
  const [idx, setIdx] = useState(0)
  const [tiles, setTiles] = useState<Tile[]>(() => buildTiles(words[0]?.word ?? ''))
  const [answer, setAnswer] = useState<{ id: string; letter: string }[]>([])
  const [result, setResult] = useState<'idle' | 'correct' | 'wrong'>('idle')
  const [score, setScore] = useState(0)
  const [wrongWords, setWrongWords] = useState<string[]>([])
  const [done, setDone] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  const word = words[idx]
  const target = word.word.toLowerCase().replace(/\s+/g, '')
  const total = words.length

  useEffect(() => {
    if (done) {
      addScore(level, score * 2) // 🔴 production tier — 2x XP (see FAQ "XP theo độ khó")
      recordGameResult(level, topic.id, 'spell', score, total)
      saveStepScore(childId, topic.id, 'spell', score, total)
      if (score === total) setShowConfetti(true)
      flush()
    }
  }, [done])

  const speak = useCallback((text: string) => speakWord(text, { rate: 0.85, pitch: 1.2 }), [])

  useEffect(() => {
    if (done) return
    const t = setTimeout(() => speak(word.word), 400)
    return () => clearTimeout(t)
  }, [idx, done])

  const advance = (currentIdx: number, currentWords: Word[]) => {
    const next = currentIdx + 1
    if (next >= total) {
      recordActivity(level)
      setDone(true)
    } else {
      setIdx(next)
      setTiles(buildTiles(currentWords[next].word))
      setAnswer([])
      setResult('idle')
    }
  }

  const tapTile = (tile: Tile) => {
    if (tile.used || result !== 'idle' || answer.length >= target.length) return
    setAnswer((prev) => [...prev, { id: tile.id, letter: tile.letter }])
    setTiles((prev) => prev.map((t) => (t.id === tile.id ? { ...t, used: true } : t)))
  }

  // Tap any filled slot to send that specific letter back to the tile bank — replaces the old
  // "Xóa" (delete-last-only) button, which only let you undo in strict reverse order.
  const tapSlot = (slotIdx: number) => {
    if (result !== 'idle' || slotIdx >= answer.length) return
    const removed = answer[slotIdx]
    setAnswer((prev) => prev.filter((_, i) => i !== slotIdx))
    setTiles((prev) => prev.map((t) => (t.id === removed.id ? { ...t, used: false } : t)))
  }

  const checkAnswer = () => {
    if (result !== 'idle' || answer.length < target.length) return
    const typed = answer.map((a) => a.letter).join('')
    if (typed === target) {
      setResult('correct')
      setScore((s) => s + 1)
      recordAnswer(level, topic.id, word, true)
      speak(word.word)
      playCorrectSound()
      setTimeout(() => advance(idx, words), 1200)
    } else {
      setResult('wrong')
      recordAnswer(level, topic.id, word, false)
      setWrongWords((ww) => (ww.includes(word.word) ? ww : [...ww, word.word]))
      playWrongSound()
      // No auto-retry/auto-advance — reveal the correct spelling, learner taps "Tiếp theo →" themselves.
    }
  }

  const restart = () => {
    const newWords = shuffle(topic.words)
    setWords(newWords)
    setIdx(0)
    setTiles(buildTiles(newWords[0].word))
    setAnswer([])
    setResult('idle')
    setScore(0)
    setWrongWords([])
    setDone(false)
    setShowConfetti(false)
  }

  if (done) {
    const xpEarned = score * 2
    return (
      <div className="flex flex-col min-h-screen">
        {showConfetti && <Confetti onDone={() => setShowConfetti(false)} />}
        <div className="bg-gradient-to-br from-pink-400 to-rose-400 px-4 pt-6 pb-4 text-white">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push(backUrl)} aria-label="Quay lại" className="text-pink-100 text-xl flex-shrink-0 opacity-90 hover:opacity-100">←</button>
            <div className="flex-1 min-w-0">
              <p className="text-pink-100 text-[11px] font-bold uppercase tracking-wide leading-none mb-0.5 opacity-90 truncate">{topic.name}</p>
              <h1 className="text-lg font-black leading-tight truncate">✍️ Ghép Chữ</h1>
            </div>
          </div>
        </div>
        <div className="flex-1 bg-gradient-to-b from-purple-50 to-pink-50 flex flex-col items-center justify-center px-4 py-8">
          <GameResultScreen
            score={score} total={total} xpEarned={xpEarned} wrongWords={wrongWords}
            accentCls="bg-pink-500 hover:bg-pink-600" onRestart={restart} onExit={() => router.push(backUrl)}
          />
        </div>
      </div>
    )
  }

  const slotStyle =
    result === 'correct' ? 'bg-green-100 border-green-400 text-green-600' :
    result === 'wrong'   ? 'bg-red-100 border-red-400 text-red-500' :
                           'bg-white border-pink-200 text-pink-600'

  return (
    <>
      <style>{`
        @keyframes shake {
          0%,100% { transform: translateX(0) }
          20%      { transform: translateX(-7px) }
          40%      { transform: translateX(7px) }
          60%      { transform: translateX(-4px) }
          80%      { transform: translateX(4px) }
        }
        .shake { animation: shake 0.45s ease-in-out; }
      `}</style>

      <div className="flex flex-col min-h-screen">
        {/* Header */}
        <div className="bg-gradient-to-br from-pink-400 to-rose-400 px-4 pt-6 pb-4 text-white">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push(backUrl)} aria-label="Quay lại" className="text-pink-100 text-xl flex-shrink-0 opacity-90 hover:opacity-100">←</button>
            <div className="flex-1 min-w-0">
              <p className="text-pink-100 text-[11px] font-bold uppercase tracking-wide leading-none mb-0.5 opacity-90 truncate">{topic.name}</p>
              <h1 className="text-lg font-black leading-tight truncate">✍️ Ghép Chữ</h1>
            </div>
            <span className="bg-white/20 px-3 py-1 rounded-full font-black text-sm flex-shrink-0">{idx + 1}/{total}</span>
          </div>
          <div className="mt-2 h-2 bg-pink-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-white/70 rounded-full transition-all duration-500"
              style={{ width: `${((idx + 1) / total) * 100}%` }}
            />
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 bg-gradient-to-b from-purple-50 to-pink-50 px-4 py-6 flex flex-col items-center">
          {/* Emoji + meaning */}
          <div className="mb-2 flex justify-center"><WordIcon word={word.word} emoji={word.emoji} emojiClass="text-7xl leading-none select-none" iconSize={88} /></div>
          <p className="text-gray-600 font-bold text-xl mb-3">{word.meaning}</p>

          {/* Speak button */}
          <button
            onClick={() => speak(word.word)}
            className="bg-pink-500 text-white w-12 h-12 rounded-2xl text-2xl flex items-center justify-center shadow-md active:scale-90 transition-all mb-7"
            aria-label="Nghe lại"
          >
            🔊
          </button>

          {/* Answer slots — tap a filled slot to send that letter back to the tile bank */}
          <div className={`flex gap-2 mb-7 flex-wrap justify-center ${result === 'wrong' ? 'shake' : ''}`}>
            {target.split('').map((_, i) => (
              <button
                key={i}
                onClick={() => tapSlot(i)}
                disabled={!answer[i] || result !== 'idle'}
                className={`w-11 h-11 rounded-xl border-2 flex items-center justify-center font-black text-lg transition-all duration-200 ${slotStyle}`}
              >
                {answer[i]?.letter ?? ''}
              </button>
            ))}
          </div>

          {/* Letter tiles */}
          <div className="flex flex-wrap gap-3 justify-center mb-5">
            {tiles.map((tile) => (
              <button
                key={tile.id}
                onClick={() => tapTile(tile)}
                disabled={tile.used || result !== 'idle'}
                className={`w-12 h-12 rounded-2xl font-black text-xl shadow-md transition-all duration-150 active:scale-90
                  ${tile.used
                    ? 'bg-gray-100 border-2 border-gray-100 text-transparent shadow-none'
                    : 'bg-white border-2 border-pink-200 text-pink-600 hover:border-pink-400'
                  }`}
              >
                {tile.used ? '' : tile.letter}
              </button>
            ))}
          </div>

          {result === 'idle' && (
            <button
              onClick={checkAnswer}
              disabled={answer.length < target.length}
              className="bg-pink-600 disabled:bg-pink-200 text-white font-black px-8 py-3 rounded-2xl text-base shadow-md active:scale-95 transition-all"
            >
              Kiểm tra ✓
            </button>
          )}

          <div role="status" aria-live="polite">
            {result === 'correct' && <p className="mt-5 text-green-500 font-black text-2xl">✅ Đúng rồi!</p>}
            {result === 'wrong'   && (
              <p className="mt-5 text-red-500 font-black text-xl">❌ Đáp án đúng: <span className="underline">{word.word}</span></p>
            )}
          </div>

          {/* Wrong answer: no auto-retry — learner reviews the correct spelling above, then taps Tiếp theo */}
          {result === 'wrong' && (
            <button
              onClick={() => advance(idx, words)}
              className="mt-3 bg-pink-600 text-white font-black px-8 py-3 rounded-2xl text-base shadow-md active:scale-95 transition-all"
            >
              {idx + 1 >= total ? 'Xem kết quả →' : 'Tiếp theo →'}
            </button>
          )}

          {/* Dots */}
          <div className="flex justify-center gap-1.5 mt-6 flex-wrap">
            {words.map((_, i) => (
              <div
                key={i}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-200
                  ${i === idx ? 'bg-pink-500 scale-125' : i < idx ? 'bg-pink-300' : 'bg-pink-100'}`}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
