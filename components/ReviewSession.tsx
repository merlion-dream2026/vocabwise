'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { speak as speakWord } from '@/lib/speak'
import { useGameSync } from '@/lib/GameSyncContext'
import Confetti from '@/components/Confetti'
import WordIcon from '@/components/WordIcon'

export type ReviewWord = {
  word: string
  meaning: string
  emoji: string
  wrong: number
  correctStreak: number
  lastWrong: string
}

type Props = {
  words: ReviewWord[]
  level: string
  backUrl: string
  onSessionDone: (masteredCount: number) => void
}

type Choice = { word: string; meaning: string; emoji: string }

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

function daysSince(dateStr: string): number | null {
  if (!dateStr) return null
  const diff = Date.now() - new Date(dateStr).getTime()
  return Math.floor(diff / 86400000)
}

// Typing (active recall) questions only for levels where the topic-game menu already
// offers "Gõ từ" (explorer/scholar/master) — seeker/starter/ranger stay pure MCQ,
// matching the age-appropriateness cutoff used there.
const TYPING_LEVELS = new Set(['explorer', 'scholar', 'master'])
const TYPING_RATIO = 0.4

export default function ReviewSession({ words, level, backUrl, onSessionDone }: Props) {
  const router = useRouter()
  const { recordReviewAnswer, recordActivity, flush } = useGameSync()
  const isStarter = level === 'starter'
  const headerBg = isStarter
    ? 'bg-gradient-to-br from-pink-400 to-rose-400'
    : 'bg-gradient-to-br from-blue-500 to-cyan-400'
  const accentBtn = isStarter ? 'bg-pink-500 hover:bg-pink-600' : 'bg-blue-500 hover:bg-blue-600'

  // distractor pool: all words from this level (fetched async, not bundled)
  const [distPool, setDistPool] = useState<Choice[]>([])
  const fetchedLevel = useRef<string>('')
  useEffect(() => {
    if (fetchedLevel.current === level) return
    fetchedLevel.current = level
    fetch(`/api/words/${level}`)
      .then(r => r.json())
      .then((data: { topics: { words: Choice[] }[] }) => {
        setDistPool(data.topics.flatMap(t => t.words.map(w => ({ word: w.word, meaning: (w as { meaning: string }).meaning, emoji: (w as { emoji: string }).emoji }))))
      })
      .catch(() => {})
  }, [level])

  const canType = TYPING_LEVELS.has(level)
  const questions = useMemo(() => {
    return words.map(entry => {
      const others = shuffle(distPool.filter(w => w.word !== entry.word))
      const choices = shuffle<Choice>([
        { word: entry.word, meaning: entry.meaning, emoji: entry.emoji },
        ...others.slice(0, 3),
      ])
      const mode: 'mcq' | 'type' = canType && Math.random() < TYPING_RATIO ? 'type' : 'mcq'
      return { entry, choices, mode }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [words, distPool])

  const [idx, setIdx] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [typedInput, setTypedInput] = useState('')
  const typeInputRef = useRef<HTMLInputElement>(null)
  const [streaks, setStreaks] = useState<Record<string, number>>(() =>
    Object.fromEntries(words.map(w => [w.word, w.correctStreak]))
  )
  const [mastered, setMastered] = useState<Set<string>>(new Set())
  const [showMasteredFlash, setShowMasteredFlash] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [done, setDone] = useState(false)

  const current = questions[idx]
  const total = questions.length

  const speak = useCallback(
    (text: string) => speakWord(text, { rate: isStarter ? 0.8 : 1.0, pitch: isStarter ? 1.2 : 1.0 }),
    [isStarter]
  )

  useEffect(() => {
    if (done || !current) return
    const t = setTimeout(() => speak(current.entry.word), 350)
    return () => clearTimeout(t)
  }, [idx, done, current, speak])

  useEffect(() => {
    if (!done) return
    recordActivity(level)
    flush()
  }, [done])

  // Focus the typing input when a new typing-mode question comes up.
  useEffect(() => {
    if (done || !current || current.mode !== 'type' || selected !== null) return
    const t = setTimeout(() => typeInputRef.current?.focus(), 150)
    return () => clearTimeout(t)
  }, [idx, done, current, selected])

  // `word` is either an MCQ choice (exact match already) or raw typed text —
  // normalize so a typed answer isn't marked wrong over case/whitespace.
  const handleSelect = (word: string) => {
    if (selected !== null) return
    setSelected(word)
    const isCorrect = word.trim().toLowerCase() === current.entry.word.trim().toLowerCase()
    const mastered_ = recordReviewAnswer(current.entry.word, isCorrect)

    let newStreak = streaks[current.entry.word] ?? 0
    if (isCorrect) {
      newStreak = newStreak + 1
      if (mastered_ || newStreak >= 3) {
        newStreak = 3
        setMastered(prev => { const s = new Set(prev); s.add(current.entry.word); return s })
        setShowMasteredFlash(true)
        setShowConfetti(true)
        setTimeout(() => setShowMasteredFlash(false), 1200)
      }
    } else {
      newStreak = 0
    }
    setStreaks(prev => ({ ...prev, [current.entry.word]: newStreak }))

    setTimeout(() => {
      if (idx + 1 >= total) {
        setDone(true)
      } else {
        setIdx(i => i + 1)
        setSelected(null)
        setTypedInput('')
      }
    }, isCorrect ? 900 : 1400)
  }

  const handleTypeSubmit = () => {
    if (!typedInput.trim()) return
    handleSelect(typedInput)
  }

  if (done) {
    const masteredCount = mastered.size
    const remaining = total - masteredCount
    return (
      <div className="flex flex-col min-h-screen">
        {showConfetti && <Confetti onDone={() => setShowConfetti(false)} />}
        <div className={`${headerBg} px-4 pt-12 pb-8 text-white`}>
          <button onClick={() => router.push(backUrl)}
            className="text-white/80 font-bold text-sm flex items-center gap-1 mb-4">
            ← Quay lại
          </button>
          <h1 className="text-2xl font-black">📚 Ôn Từ Yếu</h1>
        </div>
        <div className="flex-1 bg-gradient-to-b from-purple-50 to-pink-50 flex flex-col items-center justify-center px-4 py-8">
          <div className="text-7xl mb-4">
            {masteredCount === total ? '🏆' : masteredCount >= Math.ceil(total * 0.6) ? '⭐' : '💪'}
          </div>
          <h2 className="text-3xl font-black text-gray-800 mb-6">Xong phiên ôn!</h2>
          <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-sm p-5 w-full mb-6 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-bold">Đã thuộc</span>
              <span className="text-green-600 font-black text-xl">{masteredCount} từ ✓</span>
            </div>
            <div className="h-px bg-gray-100" />
            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-bold">Còn cần ôn</span>
              <span className="text-orange-500 font-black text-xl">{remaining} từ</span>
            </div>
          </div>
          <div className="w-full space-y-3">
            {remaining > 0 && (
              <button onClick={() => onSessionDone(masteredCount)}
                className={`w-full ${accentBtn} text-white font-black text-xl py-4 rounded-2xl shadow-lg transition-colors`}>
                📚 Ôn Tiếp ({remaining} từ)
              </button>
            )}
            <button onClick={() => router.push(backUrl)}
              className="w-full bg-white border-2 border-gray-200 text-gray-600 font-bold text-xl py-4 rounded-2xl">
              ← Quay lại
            </button>
          </div>
        </div>
      </div>
    )
  }

  const currentStreak = streaks[current.entry.word] ?? 0
  const days = daysSince(current.entry.lastWrong)

  return (
    <div className="flex flex-col min-h-screen">
      {showConfetti && <Confetti onDone={() => setShowConfetti(false)} />}

      {/* Mastered flash */}
      {showMasteredFlash && (
        <div className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none">
          <div className="bg-green-500 text-white font-black text-2xl px-8 py-4 rounded-3xl shadow-2xl animate-bounce">
            🎉 Nhớ rồi!
          </div>
        </div>
      )}

      <div className={`${headerBg} px-4 pt-12 pb-5 text-white`}>
        <button onClick={() => router.push(backUrl)}
          className="text-white/80 font-bold text-sm flex items-center gap-1 mb-3">
          ← Quay lại
        </button>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black">📚 Ôn Từ Yếu</h1>
          <span className="bg-white/20 px-3 py-1 rounded-full font-black text-sm">
            {idx + 1}/{total}
          </span>
        </div>
        <div className="mt-3 h-2.5 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white/70 rounded-full transition-all duration-500"
            style={{ width: `${((idx + 1) / total) * 100}%` }}
          />
        </div>
      </div>

      <div className="flex-1 bg-gradient-to-b from-purple-50 to-pink-50 px-4 py-5 flex flex-col">
        {/* Word card */}
        <div className="bg-white rounded-3xl border-2 border-gray-100 shadow-xl p-5 flex flex-col items-center text-center mb-4">
          <div className="mb-3 flex justify-center leading-none"><WordIcon word={current.entry.word} emoji={current.entry.emoji} emojiClass="text-7xl" iconSize={88} /></div>
          <p className="text-gray-500 font-bold text-xs uppercase tracking-wider mb-1">Nghĩa tiếng Việt</p>
          <h2 className="text-2xl font-black text-gray-800 mb-3">{current.entry.meaning}</h2>
          <button onClick={() => speak(current.entry.word)}
            className={`${accentBtn} text-white w-12 h-12 rounded-2xl text-xl flex items-center justify-center shadow-md active:scale-90 transition-all mb-3`}>
            🔊
          </button>

          {/* Stats row */}
          <div className="flex items-center gap-4 text-xs font-bold">
            <span className="text-orange-500">⚠️ Sai {current.entry.wrong} lần</span>
            {days !== null && (
              <span className="text-gray-500">
                {days === 0 ? 'Hôm nay' : `${days} ngày trước`}
              </span>
            )}
          </div>

          {/* Streak progress dots */}
          <div className="flex items-center gap-1.5 mt-2">
            <span className="text-xs text-gray-500 font-semibold mr-1">Thuộc:</span>
            {[0, 1, 2].map(i => (
              <div key={i} className={`w-3 h-3 rounded-full transition-all ${
                i < currentStreak ? 'bg-green-400 scale-110' : 'bg-gray-200'
              }`} />
            ))}
            <span className="text-xs text-gray-500 font-semibold ml-1">{currentStreak}/3</span>
          </div>
        </div>

        {/* Choices */}
        {current.mode === 'type' ? (
          <div className="flex-1 flex flex-col">
            <input
              ref={typeInputRef}
              type="text"
              value={typedInput}
              onChange={e => { if (selected === null) setTypedInput(e.target.value) }}
              onKeyDown={e => { if (e.key === 'Enter') handleTypeSubmit() }}
              disabled={selected !== null}
              placeholder="Gõ từ tiếng Anh..."
              aria-label="Gõ từ tiếng Anh"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              className={`w-full border-2 rounded-2xl px-4 py-4 text-2xl font-bold outline-none transition-colors duration-200 mb-3 text-gray-800 placeholder:text-gray-300 ${
                selected === null ? 'border-gray-200 bg-white' :
                selected.trim().toLowerCase() === current.entry.word.trim().toLowerCase() ? 'border-green-400 bg-green-50' : 'border-red-400 bg-red-50'
              }`}
            />
            <div role="status" aria-live="polite" className="min-h-[1.75rem] mb-3">
              {selected !== null && (
                selected.trim().toLowerCase() === current.entry.word.trim().toLowerCase()
                  ? <p className="text-green-500 font-black text-lg">✅ Chính xác!</p>
                  : <p className="text-red-500 font-black text-lg">❌ Đáp án đúng: <span className="underline">{current.entry.word}</span></p>
              )}
            </div>
            {selected === null && (
              <button onClick={handleTypeSubmit} disabled={!typedInput.trim()}
                className={`w-full ${accentBtn} disabled:opacity-40 text-white font-black text-xl py-4 rounded-2xl shadow-md transition-colors active:scale-95`}>
                Kiểm tra ✓
              </button>
            )}
          </div>
        ) : isStarter ? (
          <div className="grid grid-cols-2 gap-3 flex-1">
            {current.choices.map(choice => {
              const isSelected = selected === choice.word
              const isCorrect = choice.word === current.entry.word
              const showResult = selected !== null
              let cellClass = 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md'
              if (showResult && isCorrect) cellClass = 'bg-green-400 border-green-500'
              else if (showResult && isSelected && !isCorrect) cellClass = 'bg-red-400 border-red-500'
              const textWhite = showResult && (isCorrect || isSelected)
              return (
                <button key={choice.word} onClick={() => handleSelect(choice.word)}
                  disabled={selected !== null}
                  className={`${cellClass} border-2 rounded-2xl flex flex-col items-center justify-center gap-2 shadow-md transition-all duration-200 active:scale-95 min-h-[120px] p-4`}>
                  <span className={`font-black text-xl leading-tight text-center ${textWhite ? 'text-white' : 'text-gray-800'}`}>
                    {choice.word}
                  </span>
                  {showResult && (
                    <WordIcon word={choice.word} emoji={choice.emoji} emojiClass="text-3xl leading-none select-none" iconSize={40} />
                  )}
                </button>
              )
            })}
          </div>
        ) : (
          <div className="space-y-3">
            {current.choices.map((choice, i) => {
              const isSelected = selected === choice.word
              const isCorrect = choice.word === current.entry.word
              let style = 'bg-white border-gray-200 text-gray-800'
              if (selected !== null) {
                if (isCorrect) style = 'bg-green-100 border-green-400 text-green-800'
                else if (isSelected) style = 'bg-red-100 border-red-400 text-red-700'
                else style = 'bg-white border-gray-100 text-gray-400'
              }
              return (
                <button key={choice.word} onClick={() => handleSelect(choice.word)}
                  disabled={selected !== null}
                  className={`w-full flex items-center gap-4 border-2 rounded-2xl px-5 py-4 font-bold text-lg transition-all duration-150 active:scale-95 ${style}`}>
                  <span className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 font-black text-base flex items-center justify-center flex-shrink-0">
                    {selected !== null && isCorrect ? '✓' : selected !== null && isSelected ? '✗' : ['A', 'B', 'C', 'D'][i]}
                  </span>
                  <span>{choice.word}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
