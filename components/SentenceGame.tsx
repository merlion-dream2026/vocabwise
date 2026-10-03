'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useGameSync } from '@/lib/GameSyncContext'
import { playCorrectSound, playWrongSound } from '@/lib/gameSound'
import Confetti from '@/components/Confetti'
import { speak as speakWord } from '@/lib/speak'
import WordIcon from '@/components/WordIcon'
import GameResultScreen from '@/components/GameResultScreen'

type Word = { word: string; meaning: string; emoji: string }
type Topic = { id: string; name: string; emoji: string; color: string; words: Word[] }
type Props = { topic: Topic; level: string; backUrl: string }

type Feedback = { used_correctly: boolean; grammar_ok: boolean; feedback_vi: string; improved: string }

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

const MIN_WORDS = 3

export default function SentenceGame({ topic, level, backUrl }: Props) {
  const router = useRouter()
  const { recordAnswer, recordActivity, addScore, recordPerfectGame, flush } = useGameSync()
  const [words, setWords] = useState(() => shuffle(topic.words))
  const [idx, setIdx] = useState(0)
  const [input, setInput] = useState('')
  const [result, setResult] = useState<'idle' | 'checking' | 'correct' | 'wrong'>('idle')
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [validationMsg, setValidationMsg] = useState<string | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [wrongWords, setWrongWords] = useState<string[]>([])
  const [done, setDone] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const word = words[idx]
  const total = words.length
  const speak = useCallback((text: string) => speakWord(text, { rate: 0.9 }), [])

  useEffect(() => {
    if (done) {
      addScore(level, score * 2) // 🔴 production tier — 2x XP (see FAQ "XP theo độ khó")
      if (score === total) recordPerfectGame(level, topic.id, 'sentence')
      if (score === total) setShowConfetti(true)
      flush()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done])

  useEffect(() => {
    if (done) return
    const t = setTimeout(() => speak(word.word), 300)
    setTimeout(() => inputRef.current?.focus(), 150)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, done])

  const advance = (currentIdx: number, currentWords: Word[]) => {
    const next = currentIdx + 1
    if (next >= currentWords.length) {
      recordActivity(level)
      setDone(true)
    } else {
      setIdx(next)
      setInput('')
      setResult('idle')
      setFeedback(null)
      setValidationMsg(null)
      setApiError(null)
    }
  }

  const handleSubmit = async () => {
    if (result !== 'idle') return
    const trimmed = input.trim()
    if (!trimmed) return
    setApiError(null)
    if (trimmed.split(/\s+/).length < MIN_WORDS) {
      setValidationMsg('Hãy viết một câu hoàn chỉnh nhé (ít nhất 3 từ)!')
      return
    }
    setValidationMsg(null)
    setResult('checking')
    try {
      const res = await fetch('/api/sentence-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: word.word, meaning: word.meaning, sentence: trimmed }),
      })
      const data = await res.json()
      if (!res.ok) {
        setApiError(data.error ?? 'Có lỗi xảy ra, thử lại nhé.')
        setResult('idle')
        return
      }
      setFeedback(data)
      const correct = !!data.used_correctly
      setResult(correct ? 'correct' : 'wrong')
      if (correct) {
        setScore((s) => s + 1)
        recordAnswer(level, topic.id, word, true)
        playCorrectSound()
        setTimeout(() => advance(idx, words), 2000)
      } else {
        recordAnswer(level, topic.id, word, false)
        setWrongWords((ww) => (ww.includes(word.word) ? ww : [...ww, word.word]))
        playWrongSound()
        // No auto-advance — learner reads the feedback + improved sentence, then taps
        // "Tiếp theo →" themselves.
      }
    } catch {
      setApiError('Lỗi kết nối. Thử lại nhé.')
      setResult('idle')
    }
  }

  const restart = () => {
    const newWords = shuffle(topic.words)
    setWords(newWords)
    setIdx(0)
    setInput('')
    setResult('idle')
    setFeedback(null)
    setValidationMsg(null)
    setApiError(null)
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
        <div className="bg-gradient-to-br from-teal-500 to-cyan-500 px-4 pt-6 pb-4 text-white">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push(backUrl)} aria-label="Quay lại" className="text-teal-100 text-xl flex-shrink-0 opacity-90 hover:opacity-100">←</button>
            <div className="flex-1 min-w-0">
              <p className="text-teal-100 text-[11px] font-bold uppercase tracking-wide leading-none mb-0.5 opacity-90 truncate">{topic.name}</p>
              <h1 className="text-lg font-black leading-tight truncate">✍️ Đặt câu cùng AI</h1>
            </div>
          </div>
        </div>
        <div className="flex-1 bg-gradient-to-b from-teal-50 to-cyan-50 flex flex-col items-center justify-center px-4 py-8">
          <GameResultScreen
            score={score} total={total} xpEarned={xpEarned} wrongWords={wrongWords}
            accentCls="bg-teal-500 hover:bg-teal-600" onRestart={restart} onExit={() => router.push(backUrl)}
          />
        </div>
      </div>
    )
  }

  const inputStyle =
    result === 'correct' ? 'border-green-400 bg-green-50' :
    result === 'wrong'   ? 'border-red-400 bg-red-50' :
    'border-teal-300 bg-white'

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-br from-teal-500 to-cyan-500 px-4 pt-6 pb-4 text-white">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => router.push(backUrl)} aria-label="Quay lại" className="text-teal-100 text-xl flex-shrink-0 opacity-90 hover:opacity-100">←</button>
          <div className="flex-1 min-w-0">
            <p className="text-teal-100 text-[11px] font-bold uppercase tracking-wide leading-none mb-0.5 opacity-90 truncate">{topic.name}</p>
            <h1 className="text-lg font-black leading-tight truncate">✍️ Đặt câu cùng AI</h1>
          </div>
          <span className="bg-white/20 px-3 py-1 rounded-full font-black text-sm flex-shrink-0">{idx + 1}/{total}</span>
        </div>
        <div className="h-1.5 bg-teal-300/40 rounded-full overflow-hidden">
          <div className="h-full bg-white/70 rounded-full transition-all duration-500" style={{ width: `${((idx + 1) / total) * 100}%` }} />
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 bg-gradient-to-b from-teal-50 to-cyan-50 px-4 py-6 flex flex-col items-center">
        {/* Emoji + meaning */}
        <div className="mb-2 flex justify-center"><WordIcon word={word.word} emoji={word.emoji} emojiClass="text-7xl leading-none select-none" iconSize={88} /></div>
        <div className="flex items-center gap-2 mb-3">
          <p className="text-gray-800 font-black text-2xl">{word.word}</p>
          <button onClick={() => speak(word.word)} className="bg-teal-500 text-white w-8 h-8 rounded-lg text-sm flex items-center justify-center shadow-md active:scale-90 transition-all" aria-label="Nghe lại">🔊</button>
        </div>
        <p className="text-gray-500 font-bold text-base mb-4">{word.meaning}</p>

        <p className="text-center text-sm font-bold text-gray-500 mb-2">Hãy tự đặt 1 câu tiếng Anh có dùng từ này nhé!</p>

        {/* Input */}
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => { if (result === 'idle') setInput(e.target.value) }}
          disabled={result !== 'idle'}
          placeholder={`Viết câu của em có từ "${word.word}"...`}
          rows={3}
          className={`w-full border-2 rounded-2xl px-4 py-3 text-lg font-semibold outline-none transition-colors duration-200 mb-2 resize-none
            ${inputStyle} placeholder:text-gray-300 placeholder:text-base text-gray-800`}
        />

        {validationMsg && <p className="text-amber-600 font-bold text-sm mb-3 text-center">⚠️ {validationMsg}</p>}
        {apiError && (
          <div className="mb-3 text-center">
            <p className="text-red-500 font-bold text-sm mb-1">{apiError}</p>
            <button onClick={handleSubmit} className="text-teal-600 font-bold text-sm underline">Thử lại</button>
          </div>
        )}

        {/* Feedback */}
        <div role="status" aria-live="polite" className="w-full">
          {result === 'correct' && feedback && (
            <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-4 mb-4 text-left">
              <p className="text-green-600 font-black text-base mb-1">✅ Giỏi quá!</p>
              <p className="text-gray-700 text-sm">{feedback.feedback_vi}</p>
            </div>
          )}
          {result === 'wrong' && feedback && (
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 mb-4 text-left">
              <p className="text-red-500 font-black text-base mb-1">💡 Cần cải thiện thêm</p>
              <p className="text-gray-700 text-sm mb-2">{feedback.feedback_vi}</p>
              {feedback.improved && (
                <div className="bg-white rounded-xl px-3 py-2.5 flex items-start gap-2">
                  <button onClick={() => speak(feedback.improved)} className="flex-shrink-0 w-7 h-7 rounded-lg bg-teal-500 text-white text-sm flex items-center justify-center mt-0.5" aria-label="Nghe câu gợi ý">🔊</button>
                  <div>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-wide mb-0.5">Gợi ý câu hay hơn</p>
                    <p className="text-gray-800 font-semibold text-sm italic">&quot;{feedback.improved}&quot;</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Submit */}
        {result === 'idle' && (
          <button
            onClick={handleSubmit}
            disabled={!input.trim()}
            className="w-full bg-teal-500 hover:bg-teal-600 disabled:bg-teal-200 text-white font-black text-xl py-4 rounded-2xl shadow-md transition-colors active:scale-95"
          >
            Kiểm tra ✓
          </button>
        )}
        {result === 'checking' && (
          <div className="w-full bg-teal-100 text-teal-600 font-black text-xl py-4 rounded-2xl flex items-center justify-center gap-2">
            <span className="animate-spin">⏳</span> Đang chấm bài...
          </div>
        )}

        {/* Wrong answer: no auto-advance — learner reviews feedback above, then taps Tiếp theo */}
        {result === 'wrong' && (
          <button
            onClick={() => advance(idx, words)}
            className="w-full bg-teal-500 hover:bg-teal-600 text-white font-black text-xl py-4 rounded-2xl shadow-md transition-colors active:scale-95"
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
                ${i === idx ? 'bg-teal-500 scale-125' : i < idx ? 'bg-teal-300' : 'bg-teal-100'}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
