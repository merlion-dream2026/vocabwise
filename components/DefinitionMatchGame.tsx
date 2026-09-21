'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useGameSync } from '@/lib/GameSyncContext'
import { playCorrectSound, playWrongSound } from '@/lib/gameSound'
import Confetti from '@/components/Confetti'
import { speak as speakWord } from '@/lib/speak'
import GameResultScreen from '@/components/GameResultScreen'


type Word = { word: string; meaning: string; emoji: string; examples?: { en: string; vi: string }[] }
type Topic = { id: string; name: string; emoji: string; words: Word[] }
type Props = { topic: Topic; level: string; backUrl: string }

const ROUND_SIZE = 4

function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5) }

type PairState = 'idle' | 'matched' | 'wrong'

export default function DefinitionMatchGame({ topic, level, backUrl }: Props) {
  const router = useRouter()
  const { recordAnswer, recordActivity, addScore, recordPerfectGame, flush } = useGameSync()
  const speak = useCallback((t: string) => speakWord(t, { rate: 0.9 }), [])

  // Shuffle all words once; chunk into rounds of ROUND_SIZE
  const [allWords] = useState(() => shuffle(topic.words))
  const [roundIdx, setRoundIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [wrongWords, setWrongWords] = useState<string[]>([])
  const [done, setDone] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  const totalRounds = Math.ceil(allWords.length / ROUND_SIZE)
  const roundWords = allWords.slice(roundIdx * ROUND_SIZE, (roundIdx + 1) * ROUND_SIZE)
  const total = allWords.length

  // Per-round state
  const [leftSel, setLeftSel] = useState<string | null>(null)     // selected English word
  const [rightSel, setRightSel] = useState<string | null>(null)   // selected Vietnamese meaning
  const [pairStates, setPairStates] = useState<Record<string, PairState>>({})  // word → state
  const [rightOrder, setRightOrder] = useState<Word[]>([])

  // Init round
  useEffect(() => {
    setLeftSel(null)
    setRightSel(null)
    setPairStates({})
    setRightOrder(shuffle([...roundWords]))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundIdx])

  useEffect(() => {
    if (done) { addScore(level, Math.round(score * 1.5)); if (score === total) { recordPerfectGame(level, topic.id, 'definitionmatch'); setShowConfetti(true) }; flush() }
  }, [done])

  if (topic.words.length === 0) { router.push(backUrl); return null }

  // Check if all pairs in current round are matched
  const allMatchedInRound = roundWords.every(w => pairStates[w.word] === 'matched')

  const advanceRound = () => {
    const next = roundIdx + 1
    if (next >= totalRounds) { recordActivity(level); setDone(true) }
    else setRoundIdx(next)
  }

  const handleLeft = (word: Word) => {
    if (pairStates[word.word] === 'matched') return
    speak(word.word)
    setLeftSel(word.word)
    // If right already selected, attempt match
    if (rightSel) attemptMatch(word.word, rightSel)
  }

  const handleRight = (word: Word) => {
    if (pairStates[word.word] === 'matched') return
    setRightSel(word.meaning)
    // If left already selected, attempt match
    if (leftSel) attemptMatch(leftSel, word.meaning)
  }

  const attemptMatch = (wordStr: string, meaning: string) => {
    const word = roundWords.find(w => w.word === wordStr)
    const correct = word?.meaning === meaning
    if (correct && word) {
      speak(word.word)
      recordAnswer(level, topic.id, word, true)
      setScore(s => s + 1)
      setPairStates(ps => ({ ...ps, [wordStr]: 'matched' }))
      setLeftSel(null)
      setRightSel(null)
      playCorrectSound()
    } else {
      // Flash wrong then reset
      if (word) {
        setPairStates(ps => ({ ...ps, [wordStr]: 'wrong' }))
        recordAnswer(level, topic.id, word, false)
        setWrongWords(ww => ww.includes(wordStr) ? ww : [...ww, wordStr])
        playWrongSound()
      }
      setTimeout(() => {
        setPairStates(ps => {
          const next = { ...ps }
          if (next[wordStr] === 'wrong') delete next[wordStr]
          return next
        })
        setLeftSel(null)
        setRightSel(null)
      }, 800)
    }
  }

  const restart = () => { setRoundIdx(0); setScore(0); setWrongWords([]); setDone(false); setShowConfetti(false) }

  if (done) {
    const xpEarned = Math.round(score * 1.5)
    return (
      <div className="flex flex-col min-h-screen">
        {showConfetti && <Confetti onDone={() => setShowConfetti(false)} />}
        <div className="bg-gradient-to-br from-violet-500 to-purple-600 px-4 pt-6 pb-4 text-white">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push(backUrl)} aria-label="Quay lại" className="text-violet-100 text-xl flex-shrink-0">←</button>
            <div className="flex-1 min-w-0">
              <p className="text-violet-100 text-[11px] font-bold uppercase tracking-wide leading-none mb-0.5">{topic.name}</p>
              <h1 className="text-lg font-black leading-tight truncate">🔀 Ghép định nghĩa</h1>
            </div>
          </div>
        </div>
        <div className="flex-1 bg-gradient-to-b from-violet-50 to-purple-50 flex flex-col items-center justify-center px-4 py-8">
          <GameResultScreen
            score={score} total={total} xpEarned={xpEarned} wrongWords={wrongWords}
            accentCls="bg-violet-500" onRestart={restart} onExit={() => router.push(backUrl)}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="bg-gradient-to-br from-violet-500 to-purple-600 px-4 pt-6 pb-4 text-white">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => router.push(backUrl)} aria-label="Quay lại" className="text-violet-100 text-xl flex-shrink-0">←</button>
          <div className="flex-1 min-w-0">
            <p className="text-violet-100 text-[11px] font-bold uppercase tracking-wide leading-none mb-0.5">{topic.name}</p>
            <h1 className="text-lg font-black leading-tight truncate">🔀 Ghép định nghĩa</h1>
          </div>
          <span className="bg-white/20 px-3 py-1 rounded-full font-black text-sm flex-shrink-0">{roundIdx + 1}/{totalRounds}</span>
        </div>
        <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full bg-white/70 rounded-full transition-all" style={{ width: `${((roundIdx + 1) / totalRounds) * 100}%` }} />
        </div>
      </div>

      <div className="flex-1 bg-gradient-to-b from-violet-50 to-purple-50 px-4 py-5 flex flex-col gap-3">
        <p className="text-xs font-bold text-gray-500 text-center uppercase tracking-wide">Ghép từ tiếng Anh với nghĩa tiếng Việt</p>

        {/* Matching grid */}
        <div className="flex gap-3 flex-1">
          {/* Left: English words */}
          <div className="flex-1 flex flex-col gap-2">
            {roundWords.map(word => {
              const state = pairStates[word.word]
              const isSelected = leftSel === word.word
              let style = 'bg-white border-2 border-gray-200 text-gray-700'
              if (state === 'matched') style = 'bg-green-100 border-2 border-green-400 text-green-700 opacity-60'
              else if (state === 'wrong') style = 'bg-red-100 border-2 border-red-400 text-red-600'
              else if (isSelected) style = 'bg-violet-500 border-2 border-violet-600 text-white'
              return (
                <button key={word.word} onClick={() => handleLeft(word)}
                  disabled={state === 'matched'}
                  className={`${style} font-bold text-base py-4 px-3 rounded-2xl transition-all active:scale-95 text-center flex items-center justify-center gap-1.5`}>
                  <span>{word.word}</span>
                  {state === 'matched' && <span className="text-green-500 text-lg">✓</span>}
                </button>
              )
            })}
          </div>

          {/* Right: Vietnamese meanings */}
          <div className="flex-1 flex flex-col gap-2">
            {rightOrder.map(word => {
              const state = pairStates[word.word]
              const isSelected = rightSel === word.meaning
              let style = 'bg-white border-2 border-gray-200 text-gray-600'
              if (state === 'matched') style = 'bg-green-100 border-2 border-green-400 text-green-600 opacity-60'
              else if (state === 'wrong' && leftSel === word.word) style = 'bg-red-100 border-2 border-red-400 text-red-600'
              else if (isSelected) style = 'bg-purple-500 border-2 border-purple-600 text-white'
              return (
                <button key={word.word} onClick={() => handleRight(word)}
                  disabled={state === 'matched'}
                  className={`${style} font-semibold text-sm py-4 px-3 rounded-2xl transition-all active:scale-95 text-center leading-tight`}>
                  {word.meaning}
                  {state === 'matched' && <span className="ml-1 text-green-500 text-base">✓</span>}
                </button>
              )
            })}
          </div>
        </div>

        {/* Next round button (shown when all matched) */}
        {allMatchedInRound && (
          <button onClick={advanceRound}
            className="w-full bg-violet-500 text-white font-black text-xl py-4 rounded-2xl shadow-md mb-2">
            {roundIdx + 1 >= totalRounds ? 'Xem kết quả →' : 'Vòng tiếp theo →'}
          </button>
        )}
      </div>
    </div>
  )
}
