'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { markSeen, recordAnswer, recordActivity, addScore, recordPerfectGame, flush } from '@/lib/gameSync'
import Confetti from '@/components/Confetti'
import WordIcon from '@/components/WordIcon'

type Word = { word: string; meaning: string; emoji: string; examples: { en: string; vi: string }[] }
type Topic = { id: string; name: string; emoji: string; color: string; words: Word[] }
type Props = { topic: Topic; level: string; backUrl: string }

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

// 8 distinct colors for matched pairs
const PAIR_COLORS = [
  { matched: 'bg-pink-400 border-pink-400 text-white', ring: 'ring-pink-400' },
  { matched: 'bg-blue-400 border-blue-400 text-white', ring: 'ring-blue-400' },
  { matched: 'bg-green-500 border-green-500 text-white', ring: 'ring-green-400' },
  { matched: 'bg-purple-400 border-purple-400 text-white', ring: 'ring-purple-400' },
  { matched: 'bg-orange-400 border-orange-400 text-white', ring: 'ring-orange-400' },
  { matched: 'bg-teal-500 border-teal-500 text-white', ring: 'ring-teal-400' },
  { matched: 'bg-rose-400 border-rose-400 text-white', ring: 'ring-rose-400' },
  { matched: 'bg-indigo-400 border-indigo-400 text-white', ring: 'ring-indigo-400' },
  { matched: 'bg-amber-400 border-amber-400 text-white', ring: 'ring-amber-400' },
  { matched: 'bg-cyan-500 border-cyan-500 text-white', ring: 'ring-cyan-400' },
]

const levelCfg = {
  starter: {
    headerBg: 'bg-gradient-to-br from-pink-400 to-rose-400',
    backColor: 'text-pink-100',
    finishBg: 'bg-pink-500 hover:bg-pink-600',
    progressBg: 'bg-pink-200',
    progressFill: 'bg-pink-600',
  },
  explorer: {
    headerBg: 'bg-gradient-to-br from-blue-500 to-cyan-400',
    backColor: 'text-blue-100',
    finishBg: 'bg-blue-500 hover:bg-blue-600',
    progressBg: 'bg-blue-200',
    progressFill: 'bg-blue-600',
  },
}

export default function MatchGame({ topic, level, backUrl }: Props) {
  const router = useRouter()
  const styles = levelCfg[level as keyof typeof levelCfg] ?? levelCfg.explorer

  // Shuffle both columns independently (use all words in topic)
  const leftWords = useMemo(() => shuffle(topic.words), [topic.words])
  const rightEmojis = useMemo(() => shuffle(topic.words), [topic.words])

  const [selectedWord, setSelectedWord] = useState<string | null>(null)
  // matches: word -> colorIndex
  const [matches, setMatches] = useState<Record<string, number>>({})
  const [wrongFlash, setWrongFlash] = useState<string | null>(null)
  const [mistakes, setMistakes] = useState(0)
  const [done, setDone] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    if (done) {
      recordActivity(level)
      addScore(level, Math.max(0, total - mistakes))
      if (mistakes === 0) recordPerfectGame(level, topic.id, 'match')
      if (mistakes === 0) setShowConfetti(true)
      flush()
    }
  }, [done])

  const total = topic.words.length
  const matchedCount = Object.keys(matches).length
  const nextColor = matchedCount // assign colors in order

  const handleWordTap = (word: string) => {
    if (matches[word] !== undefined) return
    setSelectedWord((prev) => (prev === word ? null : word))
  }

  const handleEmojiTap = (emojiWord: Word) => {
    if (!selectedWord) return
    if (matches[emojiWord.word] !== undefined) return

    if (emojiWord.word === selectedWord) {
      // Correct match
      markSeen(level, topic.id, selectedWord)
      const newMatches = { ...matches, [selectedWord]: nextColor }
      setMatches(newMatches)
      setSelectedWord(null)
      if (Object.keys(newMatches).length === total) {
        setTimeout(() => setDone(true), 500)
      }
    } else {
      // Wrong
      setMistakes((m) => m + 1)
      setWrongFlash(emojiWord.word)
      setTimeout(() => {
        setWrongFlash(null)
        setSelectedWord(null)
      }, 550)
    }
  }

  const restart = () => {
    setSelectedWord(null)
    setMatches({})
    setWrongFlash(null)
    setMistakes(0)
    setDone(false)
    setShowConfetti(false)
  }

  if (done) {
    return (
      <div className="flex flex-col min-h-screen">
        {showConfetti && <Confetti onDone={() => setShowConfetti(false)} />}
        <div className={`${styles.headerBg} px-4 pt-12 pb-8 text-white`}>
          <button onClick={() => router.push(backUrl)} className={`${styles.backColor} font-bold text-sm flex items-center gap-1 mb-4 opacity-90`}>← {topic.name}</button>
          <h1 className="text-2xl font-black">🎯 Nối Từ Với Hình</h1>
        </div>
        <div className="flex-1 bg-gradient-to-b from-purple-50 to-pink-50 flex flex-col items-center justify-center px-4 py-8">
          <div className="text-7xl mb-4">
            {mistakes === 0 ? '🏆' : mistakes <= 3 ? '⭐' : '💪'}
          </div>
          <h2 className="text-3xl font-black text-gray-800 mb-2">Hoàn thành!</h2>
          <p className="text-gray-500 font-bold text-lg mb-1">
            {total}/{total} cặp đúng
          </p>
          <p className="text-gray-400 font-semibold mb-8">
            {mistakes === 0 ? 'Không sai lần nào! 🎉' : `Sai ${mistakes} lần`}
          </p>
          <div className="w-full space-y-3">
            <button
              onClick={restart}
              className={`w-full ${styles.finishBg} text-white font-black text-xl py-4 rounded-2xl shadow-lg transition-colors`}
            >
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
      {/* Header */}
      <div className={`${styles.headerBg} px-4 pt-12 pb-5 text-white`}>
        <button onClick={() => router.push(backUrl)} className={`${styles.backColor} font-bold text-sm flex items-center gap-1 mb-3 opacity-90`}>← {topic.name}</button>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black">🎯 Nối Từ Với Hình</h1>
          <span className="bg-white/20 px-3 py-1 rounded-full font-black text-sm">
            {matchedCount}/{total}
          </span>
        </div>
        <div className={`mt-3 h-2 ${styles.progressBg} rounded-full overflow-hidden`}>
          <div
            className={`h-full ${styles.progressFill} rounded-full transition-all duration-500`}
            style={{ width: `${(matchedCount / total) * 100}%` }}
          />
        </div>
        <p className="text-white/75 text-xs font-semibold mt-1.5">
          {selectedWord
            ? `Đang chọn: "${selectedWord}" — bấm hình tương ứng →`
            : 'Bấm một TỪ bên trái trước'}
        </p>
      </div>

      {/* Two-column game area */}
      <div className="flex-1 bg-gradient-to-b from-purple-50 to-pink-50 px-3 py-4 flex gap-3 overflow-y-auto">
        {/* LEFT: Words */}
        <div className="flex-1 flex flex-col gap-2">
          <p className="text-xs font-black text-gray-400 uppercase tracking-wider text-center mb-1">
            TỪ
          </p>
          {leftWords.map((w) => {
            const colorIdx = matches[w.word]
            const isMatched = colorIdx !== undefined
            const isSelected = selectedWord === w.word
            const color = isMatched ? PAIR_COLORS[colorIdx % PAIR_COLORS.length] : null

            return (
              <button
                key={w.word}
                onClick={() => handleWordTap(w.word)}
                disabled={isMatched}
                className={`
                  w-full py-3 px-3 rounded-xl border-2 font-bold text-base
                  transition-all duration-150 active:scale-95
                  ${isMatched
                    ? `${color!.matched} opacity-90`
                    : isSelected
                    ? 'bg-yellow-300 border-yellow-400 text-gray-900 scale-105 shadow-lg'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:shadow-sm'
                  }
                `}
              >
                {w.word}
                {isMatched && <span className="ml-1 text-sm">✓</span>}
              </button>
            )
          })}
        </div>

        {/* RIGHT: Emojis */}
        <div className="flex-1 flex flex-col gap-2">
          <p className="text-xs font-black text-gray-400 uppercase tracking-wider text-center mb-1">
            HÌNH
          </p>
          {rightEmojis.map((w) => {
            const colorIdx = matches[w.word]
            const isMatched = colorIdx !== undefined
            const isWrong = wrongFlash === w.word
            const color = isMatched ? PAIR_COLORS[colorIdx % PAIR_COLORS.length] : null
            const canTap = selectedWord !== null && !isMatched

            return (
              <button
                key={w.word}
                onClick={() => handleEmojiTap(w)}
                disabled={isMatched}
                className={`
                  w-full py-2.5 rounded-xl border-2
                  flex items-center justify-center text-4xl
                  min-h-[54px] transition-all duration-150 active:scale-95
                  ${isMatched
                    ? `${color!.matched} opacity-90`
                    : isWrong
                    ? 'bg-red-100 border-red-400 scale-95'
                    : canTap
                    ? 'bg-white border-gray-300 hover:border-yellow-400 hover:bg-yellow-50 shadow-sm'
                    : 'bg-white border-gray-200'
                  }
                `}
              >
                <WordIcon word={w.word} emoji={w.emoji} emojiClass="text-4xl" iconSize={48} />
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
