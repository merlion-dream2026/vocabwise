'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useGameSync } from '@/lib/GameSyncContext'
import { saveStepScore } from '@/lib/stepScores'
import { playCorrectSound, playWrongSound, playSfx } from '@/lib/gameSound'
import Confetti from '@/components/Confetti'
import { speak as speakWord } from '@/lib/speak'
import WordIcon from '@/components/WordIcon'
import GameResultScreen from '@/components/GameResultScreen'
import { GameHeader, cta } from '@/components/ChunkyUI'
import TileTray, { type Tile } from '@/components/spell/TileTray'
import SuccessModal from '@/components/spell/SuccessModal'
import { useSpellTheme } from '@/components/spell/themes'

type Word = { word: string; meaning: string; emoji: string; examples: { en: string; vi: string }[] }
type Topic = { id: string; name: string; emoji: string; color: string; words: Word[] }
type Props = { topic: Topic; level: string; backUrl: string }
type Slot = { id: string; letter: string } | null

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

const emptySlots = (w: Word): Slot[] => Array(w.word.replace(/\s+/g, '').length).fill(null)

export default function SpellGame({ topic, level, backUrl }: Props) {
  const { childId } = useParams<{ childId: string }>()
  const router = useRouter()
  const { recordAnswer, recordActivity, addScore, recordGameResult, flush } = useGameSync()
  const [theme, setTheme] = useSpellTheme()
  const [words, setWords] = useState(() => shuffle(topic.words))
  const [idx, setIdx] = useState(0)
  const [tiles, setTiles] = useState<Tile[]>(() => buildTiles(words[0]?.word ?? ''))
  const [answer, setAnswer] = useState<Slot[]>(() => (words[0] ? emptySlots(words[0]) : []))
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

  const advance = (currentIdx: number, currentWords: Word[]) => {
    const next = currentIdx + 1
    if (next >= total) {
      recordActivity(level)
      setDone(true)
    } else {
      setIdx(next)
      setTiles(buildTiles(currentWords[next].word))
      setAnswer(emptySlots(currentWords[next]))
      setResult('idle')
    }
  }

  // Put a tray tile into a slot; a letter already sitting there goes back to the tray.
  const place = (tile: Tile, slotIdx: number) => {
    if (result !== 'idle' || tile.used || slotIdx < 0 || slotIdx >= answer.length) return
    const bumped = answer[slotIdx]
    playSfx('pop')
    setAnswer((prev) => prev.map((s, i) => (i === slotIdx ? { id: tile.id, letter: tile.letter } : s)))
    setTiles((prev) => prev.map((t) =>
      t.id === tile.id ? { ...t, used: true } : bumped && t.id === bumped.id ? { ...t, used: false } : t))
  }

  const tapTile = (tile: Tile) => place(tile, answer.findIndex((s) => s === null))

  // Tap a filled slot to send that letter back to the tile bank.
  const tapSlot = (slotIdx: number) => {
    const removed = answer[slotIdx]
    if (result !== 'idle' || !removed) return
    setAnswer((prev) => prev.map((s, i) => (i === slotIdx ? null : s)))
    setTiles((prev) => prev.map((t) => (t.id === removed.id ? { ...t, used: false } : t)))
  }

  // Auto-check once every slot is filled — the short pause lets the last letter land visibly,
  // and tapping a slot during it cancels the check.
  useEffect(() => {
    if (result !== 'idle' || answer.length === 0 || answer.some((s) => s === null)) return
    const t = setTimeout(() => {
      const typed = answer.map((s) => s!.letter).join('')
      if (typed === target) {
        setResult('correct')
        setScore((s) => s + 1)
        recordAnswer(level, topic.id, word, true)
        playCorrectSound()
        setTimeout(() => speak(word.word), 450) // let the ~0.4s chime finish so the word isn't drowned out
      } else {
        setResult('wrong')
        recordAnswer(level, topic.id, word, false)
        setWrongWords((ww) => (ww.includes(word.word) ? ww : [...ww, word.word]))
        playWrongSound()
        setTimeout(() => speak(word.word), 400) // read the correct word aloud while its spelling is revealed
        // No auto-retry/auto-advance — reveal the correct spelling, learner taps "Tiếp theo →" themselves.
      }
    }, 350)
    return () => clearTimeout(t)
  }, [answer, result])

  const restart = () => {
    const newWords = shuffle(topic.words)
    setWords(newWords)
    setIdx(0)
    setTiles(buildTiles(newWords[0].word))
    setAnswer(emptySlots(newWords[0]))
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
        <GameHeader colorCls="bg-gradient-to-br from-pink-400 to-rose-400" title="✍️ Ghép Chữ" subtitle={topic.name} onBack={() => router.push(backUrl)} />
        <div className="flex-1 bg-gradient-to-b from-purple-50 to-pink-50 flex flex-col items-center justify-center px-4 py-8">
          <GameResultScreen
            score={score} total={total} xpEarned={xpEarned} wrongWords={wrongWords}
            accentCls="bg-pink-500 hover:bg-pink-600" onRestart={restart} onExit={() => router.push(backUrl)}
          />
        </div>
      </div>
    )
  }

  // Long words shrink their slots so the answer row still fits a 320px phone.
  const slotSize =
    target.length <= 6 ? 'w-[46px] h-[52px] text-[28px]' :
    target.length <= 8 ? 'w-10 h-12 text-2xl' :
                         'w-8 h-10 text-xl'

  const slotStyle = (i: number) => {
    const s = answer[i]
    if (result === 'correct') return 'border-solid bg-green-100 border-green-500 text-green-700'
    if (result === 'wrong') return s?.letter === target[i]
      ? 'border-solid bg-green-100 border-green-500 text-green-700'
      : 'border-solid bg-red-100 border-red-500 text-red-600'
    return s ? 'border-solid bg-[#d6efe9] border-[#2f6f6a] text-[#2f6f6a]' : 'border-dashed bg-white border-[#a99ad6]'
  }

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
        <GameHeader colorCls="bg-gradient-to-br from-pink-400 to-rose-400" title="✍️ Ghép Chữ" subtitle={topic.name} onBack={() => router.push(backUrl)} right={<>{idx + 1}/{total}</>} progress={{ value: ((idx + 1) / total) * 100, max: 100 }} />

        {/* Body */}
        <div className="flex-1 bg-gradient-to-b from-[#f3eefc] to-[#faf7ff] px-4 pt-4 flex flex-col items-center">
          <div className="self-stretch flex items-center gap-3">
            <p className="flex-1 text-sm font-extrabold text-[#3b2a8a] leading-snug">Nhìn hình, chạm hoặc kéo chữ để ghép từ!</p>
            <div className="min-w-[56px] text-center bg-[#fffaf0] border-[2.5px] border-b-[5px] border-[#3b2a8a] rounded-xl px-2.5 py-0.5">
              <span className="block text-[10px] font-bold tracking-wider text-[#6b5f4a]">ĐIỂM</span>
              <span className="block text-xl font-black text-[#2b1d0e] leading-tight">{score}</span>
            </div>
          </div>

          {/* Picture card — no Vietnamese meaning or speaker while answering; both appear after */}
          <div className="mt-5 w-40 h-40 bg-white border-[7px] border-[#ecb94f] rounded-[26px] flex items-center justify-center shadow-[0_10px_24px_rgba(59,42,138,0.13)]">
            <WordIcon word={word.word} emoji={word.emoji} emojiClass="text-8xl leading-none select-none" iconSize={96} />
          </div>

          {/* Answer slots — tap a filled slot to send that letter back; tiles can also be dropped here */}
          <div className={`flex gap-1.5 mt-6 flex-wrap justify-center ${result === 'wrong' ? 'shake' : ''}`}>
            {answer.map((s, i) => (
              <button
                key={i}
                data-spell-slot={i}
                onClick={() => tapSlot(i)}
                disabled={result !== 'idle'}
                aria-label={s ? `Bỏ chữ ${s.letter}` : `Ô ${i + 1}`}
                className={`${slotSize} rounded-xl border-[2.5px] flex items-center justify-center font-black transition-colors duration-200 ${slotStyle(i)}`}
              >
                {s?.letter ?? ''}
              </button>
            ))}
          </div>

          <div role="status" aria-live="polite">
            {result === 'wrong' && (
              <p className="mt-3 text-red-600 font-extrabold text-base">
                Đáp án:{' '}
                {target.split('').map((ch, i) => (
                  <span key={i} className={answer[i]?.letter === ch ? '' : 'underline'}>{ch}</span>
                ))}
                <span className="text-[#6b5fa0] font-bold"> · {word.meaning}</span>
              </p>
            )}
          </div>

          {/* Wrong answer: no auto-retry — learner reviews the correct spelling above, then taps Tiếp theo */}
          {result === 'wrong' && (
            <button onClick={() => advance(idx, words)} className={cta('pink', 'mt-3')}>
              {idx + 1 >= total ? 'Xem kết quả →' : 'Tiếp theo →'}
            </button>
          )}

          <TileTray tiles={tiles} theme={theme} onTheme={setTheme} disabled={result !== 'idle'} onTap={tapTile} onDrop={place} />
        </div>
      </div>

      {result === 'correct' && (
        <SuccessModal word={word} isLast={idx + 1 >= total} onHear={() => speak(word.word)} onNext={() => advance(idx, words)} />
      )}
    </>
  )
}
