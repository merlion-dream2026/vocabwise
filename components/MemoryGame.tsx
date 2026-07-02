'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useGameSync } from '@/lib/GameSyncContext'
import Confetti from '@/components/Confetti'
import WordIcon from '@/components/WordIcon'

type Word = { word: string; meaning: string; emoji: string; examples: { en: string; vi: string }[] }
type Topic = { id: string; name: string; emoji: string; color: string; words: Word[] }
type Props = { topic: Topic; level: string; backUrl: string }

type Card = {
  id: string
  wordKey: string
  type: 'emoji' | 'word'
  word: Word
  isFlipped: boolean
  isMatched: boolean
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

function buildCards(words: Word[]): Card[] {
  const selected = shuffle(words).slice(0, 6)
  const pairs: Card[] = []
  selected.forEach((word) => {
    pairs.push({ id: `${word.word}-e`, wordKey: word.word, type: 'emoji', word, isFlipped: false, isMatched: false })
    pairs.push({ id: `${word.word}-w`, wordKey: word.word, type: 'word', word, isFlipped: false, isMatched: false })
  })
  return shuffle(pairs)
}

const levelCfg = {
  starter: {
    headerBg: 'bg-gradient-to-br from-pink-400 to-rose-400',
    backColor: 'text-pink-100',
    cardBack: 'bg-gradient-to-br from-pink-300 to-rose-300',
    finishBg: 'bg-pink-500 hover:bg-pink-600',
  },
  explorer: {
    headerBg: 'bg-gradient-to-br from-blue-500 to-cyan-400',
    backColor: 'text-blue-100',
    cardBack: 'bg-gradient-to-br from-blue-300 to-cyan-300',
    finishBg: 'bg-blue-500 hover:bg-blue-600',
  },
}

export default function MemoryGame({ topic, level, backUrl }: Props) {
  const router = useRouter()
  const { markSeen, recordAnswer, recordActivity, addScore, recordPerfectGame, flush } = useGameSync()
  const styles = levelCfg[level as keyof typeof levelCfg] ?? levelCfg.starter
  const [cards, setCards] = useState<Card[]>(() => buildCards(topic.words))
  const [firstId, setFirstId] = useState<string | null>(null)
  const [isLocked, setIsLocked] = useState(false)
  const [moves, setMoves] = useState(0)
  const [done, setDone] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  const matchedCount = cards.filter((c) => c.isMatched && c.type === 'emoji').length
  const total = cards.length / 2

  useEffect(() => {
    if (cards.length > 0 && cards.every((c) => c.isMatched)) {
      setTimeout(() => setDone(true), 500)
    }
  }, [cards])

  useEffect(() => {
    if (done) {
      recordActivity(level)
      addScore(level, total)
      recordPerfectGame(level, topic.id, 'memory')
      setShowConfetti(true)
      flush()
    }
  }, [done])

  const handleFlip = (id: string) => {
    if (isLocked) return
    const card = cards.find((c) => c.id === id)!
    if (card.isFlipped || card.isMatched || id === firstId) return

    if (firstId === null) {
      setCards((prev) => prev.map((c) => (c.id === id ? { ...c, isFlipped: true } : c)))
      setFirstId(id)
    } else {
      const first = cards.find((c) => c.id === firstId)!
      setIsLocked(true)
      setMoves((m) => m + 1)

      if (first.wordKey === card.wordKey) {
        markSeen(level, topic.id, first.wordKey)
        setCards((prev) =>
          prev.map((c) => (c.wordKey === first.wordKey ? { ...c, isFlipped: true, isMatched: true } : c))
        )
        setFirstId(null)
        setIsLocked(false)
      } else {
        setCards((prev) => prev.map((c) => (c.id === id ? { ...c, isFlipped: true } : c)))
        const fId = firstId
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) => (c.id === fId || c.id === id ? { ...c, isFlipped: false } : c))
          )
          setFirstId(null)
          setIsLocked(false)
        }, 900)
      }
    }
  }

  const restart = () => {
    setCards(buildCards(topic.words))
    setFirstId(null)
    setIsLocked(false)
    setMoves(0)
    setDone(false)
    setShowConfetti(false)
  }

  const starEmoji = moves <= total + 3 ? '🏆' : moves <= total * 2 ? '⭐' : '💪'
  const xpEarned = total

  if (done) {
    return (
      <div className="flex flex-col min-h-screen">
        {showConfetti && <Confetti onDone={() => setShowConfetti(false)} />}
        <div className={`${styles.headerBg} px-4 pt-12 pb-8 text-white`}>
          <button onClick={() => router.push(backUrl)} className={`${styles.backColor} font-bold text-sm flex items-center gap-1 mb-4 opacity-90`}>← {topic.name}</button>
          <h1 className="text-2xl font-black">🃏 Lật Thẻ</h1>
        </div>
        <div className="flex-1 bg-gradient-to-b from-purple-50 to-pink-50 flex flex-col items-center justify-center px-4 py-8">
          <div className="text-7xl mb-4">{starEmoji}</div>
          <h2 className="text-3xl font-black text-gray-800 mb-2">Hoàn thành!</h2>
          <p className="text-gray-500 font-bold text-lg mb-1">Ghép đúng {total} cặp</p>
          <p className="text-gray-500 font-semibold mb-3">{moves} lượt lật thẻ</p>
          <div className="inline-flex items-center gap-1.5 bg-yellow-50 border border-yellow-200 rounded-full px-4 py-1.5 mb-4">
            <span className="text-base">⭐</span>
            <span className="text-yellow-700 font-black text-sm">+{xpEarned} XP</span>
          </div>
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
          <h1 className="text-2xl font-black">🃏 Lật Thẻ</h1>
          <span className="bg-white/20 px-3 py-1 rounded-full font-black text-sm">{matchedCount}/{total} cặp</span>
        </div>
        <p className="text-white/80 text-sm font-semibold mt-1">{moves} lượt · Tìm cặp từ + hình khớp nhau!</p>
      </div>

      <div className="flex-1 bg-gradient-to-b from-purple-50 to-pink-50 px-4 py-6">
        <div className="grid grid-cols-3 gap-3">
          {cards.map((card) => (
            <button
              key={card.id}
              onClick={() => handleFlip(card.id)}
              className={`aspect-square rounded-2xl border-2 shadow-md transition-all duration-200 active:scale-95
                ${card.isMatched
                  ? 'bg-green-100 border-green-400'
                  : card.isFlipped
                  ? 'bg-white border-indigo-300'
                  : `${styles.cardBack} border-transparent`
                }`}
            >
              {card.isFlipped || card.isMatched ? (
                <div className="flex flex-col items-center justify-center h-full p-2">
                  {card.type === 'emoji' ? (
                    <WordIcon word={card.word.word} emoji={card.word.emoji} emojiClass="text-4xl" iconSize={48} />
                  ) : (
                    <span className="text-sm font-black text-gray-800 text-center leading-tight">{card.word.word}</span>
                  )}
                  {card.isMatched && <span className="text-green-500 text-xs mt-0.5">✓</span>}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <span className="text-3xl text-white/70">?</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
