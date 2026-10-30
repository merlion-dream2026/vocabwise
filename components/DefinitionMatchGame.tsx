'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useGameSync } from '@/lib/GameSyncContext'
import { playCorrectSound, playWrongSound } from '@/lib/gameSound'
import Confetti from '@/components/Confetti'
import { speak as speakWord } from '@/lib/speak'
import GameResultScreen from '@/components/GameResultScreen'
import { GameHeader, cta } from '@/components/ChunkyUI'


type Word = { word: string; meaning: string; emoji: string; examples?: { en: string; vi: string }[] }
type Topic = { id: string; name: string; emoji: string; words: Word[] }
type Props = { topic: Topic; level: string; backUrl: string }

const ROUND_SIZE = 4

function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5) }

type PairState = 'idle' | 'matched' | 'wrong'

// One color per matched pair (+ its number, so it doesn't rely on color alone). No violet: that's the selection color.
const PAIR_STYLES = [
  { tile: 'bg-blue-100 border-blue-400 text-blue-800', badge: 'bg-blue-500' },
  { tile: 'bg-amber-100 border-amber-400 text-amber-800', badge: 'bg-amber-500' },
  { tile: 'bg-pink-100 border-pink-400 text-pink-800', badge: 'bg-pink-500' },
  { tile: 'bg-teal-100 border-teal-400 text-teal-800', badge: 'bg-teal-500' },
  { tile: 'bg-orange-100 border-orange-400 text-orange-800', badge: 'bg-orange-500' },
]
const pairStyle = (n: number) => PAIR_STYLES[(n - 1) % PAIR_STYLES.length]

export default function DefinitionMatchGame({ topic, level, backUrl }: Props) {
  const router = useRouter()
  const { recordAnswer, recordActivity, addScore, recordGameResult, flush } = useGameSync()
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
  const [rightSel, setRightSel] = useState<string | null>(null)   // selected meaning tile (keyed by its word)
  const [pairStates, setPairStates] = useState<Record<string, PairState>>({})  // word → state
  const [pairNo, setPairNo] = useState<Record<string, number>>({})  // word → 1-based order it was matched in (color + badge)
  const [wrongRight, setWrongRight] = useState<string | null>(null) // meaning tile the child actually tapped on a miss
  const [rightOrder, setRightOrder] = useState<Word[]>([])

  // Init round
  useEffect(() => {
    setLeftSel(null)
    setRightSel(null)
    setPairStates({})
    setPairNo({})
    setWrongRight(null)
    setRightOrder(shuffle([...roundWords]))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundIdx])

  useEffect(() => {
    if (done) { addScore(level, Math.round(score * 1.5)); recordGameResult(level, topic.id, 'definitionmatch', score, total); if (score === total) { setShowConfetti(true) }; flush() }
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
    setRightSel(word.word)
    // If left already selected, attempt match
    if (leftSel) attemptMatch(leftSel, word.word)
  }

  const attemptMatch = (wordStr: string, rightKey: string) => {
    const word = roundWords.find(w => w.word === wordStr)
    const tapped = roundWords.find(w => w.word === rightKey)
    const correct = !!word && word.meaning === tapped?.meaning
    if (correct && word) {
      speak(word.word)
      recordAnswer(level, topic.id, word, true)
      setScore(s => s + 1)
      setPairStates(ps => ({ ...ps, [wordStr]: 'matched' }))
      setPairNo(pn => ({ ...pn, [wordStr]: Object.keys(pn).length + 1 }))
      setLeftSel(null)
      setRightSel(null)
      playCorrectSound()
    } else {
      // Flash wrong then reset
      if (word) {
        setPairStates(ps => ({ ...ps, [wordStr]: 'wrong' }))
        setWrongRight(rightKey)
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
        setWrongRight(null)
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
        <GameHeader colorCls="bg-gradient-to-br from-violet-500 to-purple-600" title="🔀 Ghép định nghĩa" subtitle={topic.name} onBack={() => router.push(backUrl)} />
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
      <GameHeader colorCls="bg-gradient-to-br from-violet-500 to-purple-600" title="🔀 Ghép định nghĩa" subtitle={topic.name} onBack={() => router.push(backUrl)} right={<>{roundIdx + 1}/{totalRounds}</>} progress={{ value: ((roundIdx + 1) / totalRounds) * 100, max: 100 }} />

      <div className="flex-1 bg-gradient-to-b from-violet-50 to-purple-50 px-4 py-5 flex flex-col gap-3">
        <p className="text-xs font-bold text-gray-500 text-center uppercase tracking-wide">Ghép từ tiếng Anh với nghĩa tiếng Việt</p>

        {allMatchedInRound ? (
          /* Round review: each meaning slides next to its word, in pair color — a quick recap */
          <div className="flex flex-col gap-2">
            <p className="text-center text-xs font-bold text-violet-700">Hoàn thành vòng {roundIdx + 1} · {roundWords.length}/{roundWords.length} cặp</p>
            {[...roundWords].sort((a, b) => (pairNo[a.word] ?? 0) - (pairNo[b.word] ?? 0)).map((word, i) => {
              const ps = pairStyle(pairNo[word.word] ?? i + 1)
              return (
                <div key={word.word} className="grid animate-fade-up grid-cols-[1fr_auto_1fr] items-center gap-1.5" style={{ animationDelay: `${i * 60}ms` }}>
                  <button onClick={() => speak(word.word)} className={`${ps.tile} rounded-2xl border-2 px-3 py-3 text-center text-base font-bold active:scale-95`}>{word.word}</button>
                  <span className="text-gray-400">—</span>
                  <div className={`${ps.tile} rounded-2xl border-2 px-3 py-3 text-center text-sm font-semibold leading-tight`}>{word.meaning}</div>
                </div>
              )
            })}
          </div>
        ) : (
        /* No flex-1: the next-round button sits right under the grid, not pushed below the fold */
        <div className="flex gap-3">
          {/* Left: English words */}
          <div className="flex-1 flex flex-col gap-2">
            {roundWords.map(word => {
              const state = pairStates[word.word]
              const isSelected = leftSel === word.word
              const n = pairNo[word.word]
              let style = 'bg-white border-gray-200 text-gray-700'
              if (state === 'matched' && n) style = pairStyle(n).tile
              else if (state === 'wrong') style = 'bg-red-100 border-red-400 text-red-600'
              else if (isSelected) style = 'bg-violet-500 border-violet-600 text-white'
              return (
                <button key={word.word} onClick={() => handleLeft(word)}
                  disabled={state === 'matched'}
                  className={`${style} border-2 font-bold text-base py-4 px-3 rounded-2xl transition-all active:scale-95 text-center flex items-center justify-center gap-1.5`}>
                  {state === 'matched' && n && <PairBadge n={n} />}
                  <span>{word.word}</span>
                </button>
              )
            })}
          </div>

          {/* Right: Vietnamese meanings (tile keyed by its own word) */}
          <div className="flex-1 flex flex-col gap-2">
            {rightOrder.map(word => {
              const state = pairStates[word.word]
              const isSelected = rightSel === word.word
              const n = pairNo[word.word]
              let style = 'bg-white border-gray-200 text-gray-600'
              if (state === 'matched' && n) style = pairStyle(n).tile
              else if (wrongRight === word.word) style = 'bg-red-100 border-red-400 text-red-600'
              else if (isSelected) style = 'bg-purple-500 border-purple-600 text-white'
              return (
                <button key={word.word} onClick={() => handleRight(word)}
                  disabled={state === 'matched'}
                  className={`${style} border-2 font-semibold text-sm py-4 px-3 rounded-2xl transition-all active:scale-95 text-center leading-tight flex items-center justify-center gap-1.5`}>
                  <span>{word.meaning}</span>
                  {state === 'matched' && n && <PairBadge n={n} />}
                </button>
              )
            })}
          </div>
        </div>
        )}

        {/* Next round button (shown when all matched) */}
        {allMatchedInRound && (
          <button onClick={advanceRound}
            className={cta('violet', 'mt-2 mb-2 animate-fade-up')}>
            {roundIdx + 1 >= totalRounds ? 'Xem kết quả →' : 'Vòng tiếp theo →'}
          </button>
        )}
      </div>
    </div>
  )
}

function PairBadge({ n }: { n: number }) {
  return <span className={`${pairStyle(n).badge} inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-xs font-black text-white`}>{n}</span>
}
