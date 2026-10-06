'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useGameSync } from '@/lib/GameSyncContext'
import { playCorrectSound, playWrongSound } from '@/lib/gameSound'
import GameResultScreen from '@/components/GameResultScreen'
import Confetti from '@/components/Confetti'
import WordIcon from '@/components/WordIcon'
import { memoryScorePct, starsFor } from '@/lib/topicMastery'
import { PRESS } from '@/components/TopicHub'
import { GameHeader } from '@/components/ChunkyUI'

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
  const { markSeen, recordActivity, addScore, recordGameResult, flush } = useGameSync()
  const styles = levelCfg[level as keyof typeof levelCfg] ?? levelCfg.starter
  const [cards, setCards] = useState<Card[]>(() => buildCards(topic.words))
  const [firstId, setFirstId] = useState<string | null>(null)
  const [isLocked, setIsLocked] = useState(false)
  const [moves, setMoves] = useState(0)
  const startedAt = useRef<number | null>(null) // set on the first flip
  const [seconds, setSeconds] = useState(0)       // completion time, set when the last pair matches
  const [done, setDone] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  const matchedCount = cards.filter((c) => c.isMatched && c.type === 'emoji').length
  const total = cards.length / 2

  useEffect(() => {
    if (cards.length > 0 && cards.every((c) => c.isMatched)) {
      setSeconds(Math.max(1, Math.round((Date.now() - (startedAt.current ?? Date.now())) / 1000)))
      setTimeout(() => setDone(true), 500)
    }
  }, [cards])

  useEffect(() => {
    if (done) {
      recordActivity(level)
      addScore(level, total)
      // No right/wrong count here: the score comes from flips (moves) and completion time.
      recordGameResult(level, topic.id, 'memory', scorePct, 100)
      setShowConfetti(true)
      flush()
    }
  }, [done])

  const handleFlip = (id: string) => {
    if (isLocked) return
    const card = cards.find((c) => c.id === id)!
    if (card.isFlipped || card.isMatched || id === firstId) return
    if (startedAt.current === null) startedAt.current = Date.now()

    if (firstId === null) {
      setCards((prev) => prev.map((c) => (c.id === id ? { ...c, isFlipped: true } : c)))
      setFirstId(id)
    } else {
      const first = cards.find((c) => c.id === firstId)!
      setIsLocked(true)
      setMoves((m) => m + 1)

      if (first.wordKey === card.wordKey) {
        markSeen(level, topic.id, first.wordKey)
        playCorrectSound()
        setCards((prev) =>
          prev.map((c) => (c.wordKey === first.wordKey ? { ...c, isFlipped: true, isMatched: true } : c))
        )
        setFirstId(null)
        setIsLocked(false)
      } else {
        playWrongSound()
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
    startedAt.current = null
    setSeconds(0)
    setDone(false)
    setShowConfetti(false)
  }

  const scorePct = memoryScorePct(total, moves, seconds)
  const stars = starsFor(scorePct)
  const xpEarned = total

  if (done) {
    return (
      <div className="flex flex-col min-h-screen">
        {showConfetti && <Confetti onDone={() => setShowConfetti(false)} />}
        <GameHeader colorCls={styles.headerBg} title="🃏 Lật Thẻ" subtitle={topic.name} onBack={() => router.push(backUrl)} />
        <div className="flex-1 bg-gradient-to-b from-purple-50 to-pink-50 flex flex-col items-center justify-center px-4 py-8">
          <GameResultScreen
            score={scorePct} total={100} xpEarned={xpEarned} stars={stars}
            scoreLine={`Ghép đúng ${total} cặp`}
            extra={<>{moves} lượt lật thẻ · ⏱ {seconds} giây<br />Lật ít lượt và nhanh hơn để được 3 sao!</>}
            onRestart={restart} onExit={() => router.push(backUrl)}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <GameHeader colorCls={styles.headerBg} title="🃏 Lật Thẻ" subtitle={topic.name} onBack={() => router.push(backUrl)} right={<>{matchedCount}/{total} cặp</>} />

      <div className="flex-1 bg-gradient-to-b from-purple-50 to-pink-50 px-4 py-6">
        <div className="grid grid-cols-3 gap-3">
          {cards.map((card) => (
            <button
              key={card.id}
              onClick={() => handleFlip(card.id)}
              className={`aspect-square rounded-2xl border-2 border-b-[4px] ${PRESS}
                ${card.isMatched
                  ? 'bg-green-100 border-green-300 border-b-green-500'
                  : card.isFlipped
                  ? 'bg-white border-indigo-200 border-b-indigo-400'
                  : `${styles.cardBack} border-black/10 border-b-black/25`
                }`}
            >
              {card.isFlipped || card.isMatched ? (
                <div className="flex flex-col items-center justify-center h-full p-2">
                  {card.type === 'emoji' ? (
                    <WordIcon word={card.word.word} emoji={card.word.emoji} emojiClass="text-4xl" iconSize={48} />
                  ) : (
                    <span className="text-sm font-bold text-gray-800 text-center leading-tight">{card.word.word}</span>
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
