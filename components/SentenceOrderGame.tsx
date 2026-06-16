'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { recordAnswer, recordActivity, addScore, recordPerfectGame, flush } from '@/lib/gameSync'
import Confetti from '@/components/Confetti'
import { speak as speakWord } from '@/lib/speak'
import WordIcon from '@/components/WordIcon'

type Word = { word: string; meaning: string; emoji: string; examples?: { en: string; vi: string }[] }
type Topic = { id: string; name: string; emoji: string; words: Word[] }
type Props = { topic: Topic; level: string; backUrl: string; isStarter?: boolean } // isStarter kept for API compat

function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5) }

type Token = { id: number; text: string }
type Question = { word: Word; tokens: Token[]; answer: string; viHint: string }

function buildQuestions(words: Word[]): Question[] {
  const valid = words.filter(w => w.examples && w.examples.length > 0)
  return shuffle(valid).map(word => {
    const ex = word.examples![0]
    const sentence = ex.en.replace(/[.!?]$/, '').trim()
    const rawTokens = sentence.split(/\s+/)
    // Use index-based IDs to handle duplicate words
    const tokens: Token[] = shuffle(rawTokens.map((text, i) => ({ id: i, text })))
    return { word, tokens, answer: sentence, viHint: ex.vi }
  })
}

export default function SentenceOrderGame({ topic, level, backUrl }: Props) {
  const router = useRouter()
  const [questions] = useState(() => buildQuestions(topic.words))
  const [idx, setIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [wrongWords, setWrongWords] = useState<string[]>([])
  const [done, setDone] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [showHint, setShowHint] = useState(false)

  // placed: tokens the user has tapped into the answer area (in order)
  const [placed, setPlaced] = useState<Token[]>([])
  // submitted: whether the user clicked Check for this question
  const [submitted, setSubmitted] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)

  const speak = useCallback((t: string) => speakWord(t, { rate: 0.85 }), [])

  const q = questions[idx] ?? null
  const total = questions.length

  useEffect(() => {
    if (done) { addScore(level, Math.round(score * 1.5)); if (score === total) { recordPerfectGame(level, topic.id, 'sentenceorder'); setShowConfetti(true) }; flush() }
  }, [done])

  useEffect(() => {
    if (done || !q) return
    setPlaced([])
    setSubmitted(false)
    setIsCorrect(false)
    setShowHint(false)
    const t = setTimeout(() => speak(q.word.word), 300)
    return () => clearTimeout(t)
  }, [idx, done])

  if (questions.length === 0) { router.push(backUrl); return null }
  if (!q) return null

  // remaining tokens = all tokens minus placed ones
  const remaining = q.tokens.filter(t => !placed.find(p => p.id === t.id))

  const tapToken = (token: Token) => {
    if (submitted) return
    setPlaced(p => [...p, token])
  }

  const removeToken = (token: Token) => {
    if (submitted) return
    setPlaced(p => p.filter(p2 => p2.id !== token.id))
  }

  const handleCheck = () => {
    if (submitted) return
    const userAnswer = placed.map(t => t.text).join(' ')
    const correct = userAnswer.toLowerCase() === q.answer.toLowerCase()
    setIsCorrect(correct)
    setSubmitted(true)
    if (correct) {
      setScore(s => s + 1)
      recordAnswer(level, topic.id, q.word, true)
      speak(q.answer)
    } else {
      recordAnswer(level, topic.id, q.word, false)
      setWrongWords(ww => ww.includes(q.word.word) ? ww : [...ww, q.word.word])
    }
  }

  const advance = () => {
    const next = idx + 1
    if (next >= total) { recordActivity(level); setDone(true) }
    else setIdx(next)
  }

  const restart = () => { setIdx(0); setScore(0); setWrongWords([]); setDone(false); setShowConfetti(false); setPlaced([]); setSubmitted(false); setIsCorrect(false) }

  if (done) {
    const pct = Math.round((score / total) * 100)
    const xpEarned = Math.round(score * 1.5)
    return (
      <div className="flex flex-col min-h-screen">
        {showConfetti && <Confetti />}
        <div className="bg-gradient-to-br from-indigo-500 to-blue-600 px-4 pt-12 pb-8 text-white">
          <button onClick={() => router.push(backUrl)} className="text-indigo-100 font-bold text-sm flex items-center gap-1 mb-4">← {topic.name}</button>
          <h1 className="text-2xl font-black">🔁 Sắp xếp câu</h1>
        </div>
        <div className="flex-1 bg-gradient-to-b from-indigo-50 to-blue-50 flex flex-col items-center justify-center px-4 py-8">
          <div className="text-7xl mb-4">{score === total ? '🏆' : score >= total * 0.7 ? '⭐' : '💪'}</div>
          <h2 className="text-3xl font-black text-gray-800 mb-1">{score}/{total} chính xác</h2>
          <p className="text-gray-500 font-bold text-xl mb-2">{pct}%</p>
          <div className="inline-flex items-center gap-1.5 bg-yellow-50 border border-yellow-200 rounded-full px-4 py-1.5 mb-4">
            <span className="text-base">⭐</span>
            <span className="text-yellow-700 font-black text-sm">+{xpEarned} XP</span>
          </div>
          {wrongWords.length > 0 && (
            <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl px-4 py-3 mb-6 w-full">
              <p className="text-orange-700 font-bold text-sm mb-2">📝 Cần ôn thêm:</p>
              <div className="flex flex-wrap gap-2">{wrongWords.map(w => <span key={w} className="bg-orange-100 text-orange-700 font-bold text-sm px-3 py-1 rounded-full">{w}</span>)}</div>
            </div>
          )}
          <div className="w-full space-y-3">
            <button onClick={restart} className="w-full bg-indigo-500 text-white font-black text-xl py-4 rounded-2xl shadow-lg">🔄 Chơi lại</button>
            <button onClick={() => router.push(backUrl)} className="w-full bg-white border-2 border-gray-200 text-gray-600 font-bold text-xl py-4 rounded-2xl">← Chọn chế độ khác</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="bg-gradient-to-br from-indigo-500 to-blue-600 px-4 pt-12 pb-4 text-white">
        <button onClick={() => router.push(backUrl)} className="text-indigo-100 font-bold text-sm flex items-center gap-1 mb-3">← {topic.name}</button>
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-black">🔁 Sắp xếp câu</h1>
          <span className="bg-white/20 px-3 py-1 rounded-full font-black text-sm">{idx + 1}/{total}</span>
        </div>
        <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full bg-white/70 rounded-full transition-all" style={{ width: `${((idx + 1) / total) * 100}%` }} />
        </div>
      </div>

      <div className="flex-1 bg-gradient-to-b from-indigo-50 to-blue-50 px-4 py-5 flex flex-col gap-4">
        {/* Word prompt */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Sắp xếp câu với từ</p>
          <div className="flex items-center gap-2">
            <WordIcon word={q.word.word} emoji={q.word.emoji} emojiClass="text-3xl" iconSize={36} />
            <div>
              <p className="font-black text-gray-800 text-lg leading-tight">{q.word.word}</p>
              <p className="text-sm text-gray-500">{q.word.meaning}</p>
            </div>
            <button onClick={() => speak(q.word.word)} className="ml-auto bg-indigo-100 text-indigo-600 w-9 h-9 rounded-xl text-lg flex items-center justify-center active:scale-90 transition-all">🔊</button>
          </div>
          <button onClick={() => setShowHint(h => !h)} className="mt-2 text-xs text-indigo-500 font-semibold">
            {showHint ? '🙈 Ẩn gợi ý' : '💡 Xem nghĩa câu'}
          </button>
          {showHint && <p className="mt-1 text-sm text-gray-400 italic">{q.viHint}</p>}
        </div>

        {/* Answer area */}
        <div className={`bg-white rounded-2xl p-4 shadow-sm min-h-[72px] border-2 transition-colors
          ${submitted ? (isCorrect ? 'border-green-400' : 'border-red-400') : 'border-dashed border-indigo-200'}`}>
          <p className="text-xs font-bold text-gray-400 mb-2">Câu của bạn:</p>
          {placed.length === 0
            ? <p className="text-gray-300 text-sm italic">Nhấn vào các từ bên dưới...</p>
            : <div className="flex flex-wrap gap-2">
                {placed.map(token => (
                  <button key={token.id} onClick={() => removeToken(token)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-sm transition-all active:scale-90
                      ${submitted
                        ? isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                        : 'bg-indigo-500 text-white'}`}>
                    {token.text}
                  </button>
                ))}
              </div>
          }
        </div>

        {/* Feedback */}
        {submitted && !isCorrect && (
          <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl px-4 py-3">
            <p className="text-orange-700 font-bold text-sm">✅ Đáp án đúng:</p>
            <p className="text-gray-700 font-semibold mt-1">{q.answer}</p>
          </div>
        )}

        {/* Token pool */}
        {!submitted && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-xs font-bold text-gray-400 mb-2">Các từ:</p>
            <div className="flex flex-wrap gap-2">
              {remaining.map(token => (
                <button key={token.id} onClick={() => tapToken(token)}
                  className="bg-indigo-50 border-2 border-indigo-200 text-indigo-700 px-3 py-1.5 rounded-xl font-bold text-sm transition-all active:scale-90">
                  {token.text}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Action button */}
        {!submitted ? (
          <button onClick={handleCheck} disabled={placed.length === 0}
            className="w-full bg-indigo-500 disabled:bg-indigo-200 text-white font-black text-xl py-4 rounded-2xl shadow-md mt-auto mb-4">
            Kiểm tra ✓
          </button>
        ) : (
          <button onClick={advance}
            className={`w-full font-black text-xl py-4 rounded-2xl shadow-md mt-auto mb-4 text-white
              ${isCorrect ? 'bg-green-500' : 'bg-indigo-500'}`}>
            {idx + 1 >= total ? 'Xem kết quả →' : 'Tiếp theo →'}
          </button>
        )}
      </div>
    </div>
  )
}
