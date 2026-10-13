'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useGameSync } from '@/lib/GameSyncContext'
import { playSfx, playCorrectSound, playWrongSound } from '@/lib/gameSound'
import { speak as speakWord } from '@/lib/speak'
import GameResultScreen from '@/components/GameResultScreen'
import Confetti from '@/components/Confetti'
import WordIcon from '@/components/WordIcon'
import { memoryScorePct, starsFor } from '@/lib/topicMastery'
import { buzz } from '@/components/ChunkyUI'
import { ArcadeStage, StageHud, StageModal, TimerDial } from '@/components/games/ArcadeStage'

// 🃏 Lật thẻ, full screen: 6 picture/word pairs face down on a play mat (4×3 wide, 3×4 upright).
// Cards turn over in 3D; a match glows and says the word. Score is unchanged — memoryScorePct from
// flips and time — so existing stars stay comparable.

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

export default function MemoryGame({ topic, level, backUrl }: Props) {
  const router = useRouter()
  const { markSeen, recordActivity, addScore, recordGameResult, flush } = useGameSync()
  const [cards, setCards] = useState<Card[]>(() => buildCards(topic.words))
  const [firstId, setFirstId] = useState<string | null>(null)
  const [isLocked, setIsLocked] = useState(false)
  const [moves, setMoves] = useState(0)
  const startedAt = useRef<number | null>(null) // set on the first flip
  const [seconds, setSeconds] = useState(0)       // completion time, set when the last pair matches
  const [elapsed, setElapsed] = useState(0)       // live clock for the HUD
  const [done, setDone] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  const matchedCount = cards.filter((c) => c.isMatched && c.type === 'emoji').length
  const total = cards.length / 2

  useEffect(() => {
    if (cards.length > 0 && cards.every((c) => c.isMatched)) {
      setSeconds(Math.max(1, Math.round((Date.now() - (startedAt.current ?? Date.now())) / 1000)))
      setTimeout(() => setDone(true), 900)
    }
  }, [cards])

  useEffect(() => {
    if (done) {
      recordActivity(level)
      addScore(level, total)
      // No right/wrong count here: the score comes from flips (moves) and completion time.
      recordGameResult(level, topic.id, 'memory', scorePct, 100)
      setShowConfetti(true)
      playSfx('trophy')
      flush()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done])

  // Live clock from the first flip until the last pair.
  useEffect(() => {
    if (done) return
    const t = setInterval(() => { if (startedAt.current !== null) setElapsed(Math.round((Date.now() - startedAt.current) / 1000)) }, 500)
    return () => clearInterval(t)
  }, [done])

  const handleFlip = (id: string) => {
    if (isLocked) return
    const card = cards.find((c) => c.id === id)!
    if (card.isFlipped || card.isMatched || id === firstId) return
    if (startedAt.current === null) startedAt.current = Date.now()
    buzz()
    playSfx('flip')

    if (firstId === null) {
      setCards((prev) => prev.map((c) => (c.id === id ? { ...c, isFlipped: true } : c)))
      setFirstId(id)
    } else {
      const first = cards.find((c) => c.id === firstId)!
      setIsLocked(true)
      setMoves((m) => m + 1)
      setCards((prev) => prev.map((c) => (c.id === id ? { ...c, isFlipped: true } : c)))

      if (first.wordKey === card.wordKey) {
        markSeen(level, topic.id, first.wordKey)
        // Let the second card finish turning before it lights up and the word is said.
        setTimeout(() => {
          playCorrectSound()
          speakWord(first.wordKey, { rate: 0.85 })
          setCards((prev) => prev.map((c) => (c.wordKey === first.wordKey ? { ...c, isFlipped: true, isMatched: true } : c)))
          setFirstId(null)
          setIsLocked(false)
        }, 450)
      } else {
        const fId = firstId
        setTimeout(playWrongSound, 450)
        setTimeout(() => {
          setCards((prev) => prev.map((c) => (c.id === fId || c.id === id ? { ...c, isFlipped: false } : c)))
          setFirstId(null)
          setIsLocked(false)
        }, 1100)
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
    setElapsed(0)
    setDone(false)
    setShowConfetti(false)
  }

  const scorePct = memoryScorePct(total, moves, seconds)
  const stars = starsFor(scorePct)
  const exit = () => router.push(backUrl)

  return (
    <ArcadeStage>
      <style>{`
        .mm-card { perspective: 900px }
        .mm-inner { transition: transform .45s cubic-bezier(.3,1.2,.5,1); transform-style: preserve-3d }
        .mm-face { backface-visibility: hidden; -webkit-backface-visibility: hidden }
        @keyframes mmGlow { 0%,100% { box-shadow: 0 0 0 4px #34D399, 0 0 18px 4px rgba(52,211,153,.6) } 50% { box-shadow: 0 0 0 4px #34D399, 0 0 30px 10px rgba(52,211,153,.35) } }
        .mm-glow { animation: mmGlow 1.6s ease-in-out infinite }
      `}</style>
      {showConfetti && <Confetti onDone={() => setShowConfetti(false)} />}

      {/* play mat */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500" aria-hidden>
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#fff 1.5px, transparent 1.5px)', backgroundSize: '26px 26px' }} />
      </div>

      <StageHud
        tone="space" onExit={exit}
        dial={<TimerDial tone="space" icon="⏱" pct={100} seconds={done ? seconds : elapsed} />}
        cards={[
          { label: 'Cặp', value: `${matchedCount}/${total}` },
          { label: 'Lượt', value: moves },
        ]}
      />

      <p className="absolute inset-x-0 top-[5%] z-10 text-center text-[clamp(14px,2.8vmin,26px)] font-black text-white drop-shadow portrait:top-[24%] [@media(min-aspect-ratio:1/1)]:pl-[18vmin] [@media(max-height:500px)]:hidden">
        <span className="rounded-full bg-black/20 px-3 py-1">🃏 Lật 2 thẻ: tìm hình và từ giống nhau</span>
      </p>

      {/* The board: as big as fits, 4×3 on a wide screen, 3×4 upright */}
      <div className="absolute inset-x-[3%] bottom-[3%] top-[17%] flex items-center justify-center portrait:top-[30%] [@media(max-height:500px)]:top-[27%]">
        <div className="grid aspect-[4/3] max-h-full w-full max-w-[min(100%,calc((100vh*0.78)*4/3))] grid-cols-4 gap-[1.6vmin] portrait:aspect-[3/4] portrait:max-w-[min(100%,calc((100vh*0.66)*3/4))] portrait:grid-cols-3">
          {cards.map((card) => {
            const up = card.isFlipped || card.isMatched
            return (
              <button key={card.id} type="button" onClick={() => handleFlip(card.id)} aria-label={up ? card.word.word : 'Thẻ úp'}
                className="mm-card relative h-full w-full">
                <div className="mm-inner relative h-full w-full" style={{ transform: up ? 'rotateY(180deg)' : 'none' }}>
                  {/* back */}
                  <div className="mm-face absolute inset-0 flex items-center justify-center rounded-2xl border-[3px] border-white/80 border-b-[6px] bg-gradient-to-br from-amber-300 to-orange-400 shadow-lg">
                    <span className="flex h-[46%] w-[46%] items-center justify-center rounded-full bg-white/30 text-[clamp(22px,6vmin,56px)] font-black text-white">?</span>
                  </div>
                  {/* front */}
                  <div className={`mm-face absolute inset-0 flex flex-col items-center justify-center rounded-2xl border-[3px] border-b-[6px] bg-white p-1 shadow-lg ${card.isMatched ? 'mm-glow border-emerald-300' : 'border-indigo-200'}`}
                    style={{ transform: 'rotateY(180deg)' }}>
                    {card.type === 'emoji'
                      ? <WordIcon word={card.word.word} emoji={card.word.emoji} emojiClass="text-[clamp(32px,9vmin,84px)] leading-none" iconSize={72} />
                      : <span className="px-1 text-center text-[clamp(15px,3.6vmin,34px)] font-black leading-tight text-indigo-900">{card.word.word}</span>}
                    {card.isMatched && <span className="absolute right-1.5 top-1 text-[clamp(14px,2.6vmin,24px)] text-emerald-500">✓</span>}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {done && (
        <StageModal tone="space">
          {/* GameResultScreen is a fragment; its callers centre it */}
          <div className="flex flex-col items-center">
            <GameResultScreen
              score={scorePct} total={100} xpEarned={total} stars={stars}
              scoreLine={`Ghép đúng ${total} cặp`}
              extra={<>{moves} lượt lật thẻ · ⏱ {seconds} giây<br />Lật ít lượt và nhanh hơn để được 3 sao!</>}
              onRestart={restart} onExit={exit}
            />
          </div>
        </StageModal>
      )}
    </ArcadeStage>
  )
}
