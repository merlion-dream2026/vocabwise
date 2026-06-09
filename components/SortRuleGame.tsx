'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { speak } from '@/lib/speak'
import { recordPairGame, flushPhonics } from '@/lib/phonicsSync'
import Confetti from '@/components/Confetti'

type Bucket = { label: string; condition: string; tip: string; words: string[] }
type Lesson = { id: string; title: string; emoji: string; buckets: Bucket[] }
type Question = { word: string; correctIdx: number }

const BUCKET_STYLES = [
  { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-700', badge: 'bg-green-100 text-green-700' },
  { bg: 'bg-blue-50',  border: 'border-blue-300',  text: 'text-blue-700',  badge: 'bg-blue-100 text-blue-700' },
  { bg: 'bg-rose-50',  border: 'border-rose-300',  text: 'text-rose-700',  badge: 'bg-rose-100 text-rose-700' },
]

function buildQuestions(lesson: Lesson): Question[] {
  const all: Question[] = []
  lesson.buckets.forEach((b, idx) => {
    b.words.forEach(word => all.push({ word, correctIdx: idx }))
  })
  return all.sort(() => Math.random() - 0.5).slice(0, 15)
}

export default function SortRuleGame({ lesson, childId, backUrl }: { lesson: Lesson; childId: string; backUrl: string }) {
  const router = useRouter()
  const [questions] = useState<Question[]>(() => buildQuestions(lesson))
  const [idx, setIdx]     = useState(0)
  const [score, setScore] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [gameDone, setGameDone] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  const q = questions[idx]
  const isResult = selected !== null

  const handleChoose = (bucketIdx: number) => {
    if (isResult) return
    setSelected(bucketIdx)
    const correct = bucketIdx === q.correctIdx
    if (correct) setScore(s => s + 1)
    speak(q.word, { rate: 0.8 })
  }

  const advance = () => {
    const next = idx + 1
    if (next >= questions.length) {
      const finalScore = score + (selected === q.correctIdx ? 1 : 0)
      if (finalScore / questions.length >= 0.7) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recordPairGame(lesson.id as any, 'sort-rule' as any)
        flushPhonics()
      }
      if (finalScore === questions.length) setShowConfetti(true)
      setGameDone(true)
    } else {
      setIdx(next)
      setSelected(null)
    }
  }

  const restart = () => {
    setIdx(0); setScore(0); setSelected(null); setGameDone(false); setShowConfetti(false)
  }

  if (gameDone) {
    const final = score
    const total = questions.length
    const pct = Math.round((final / total) * 100)
    return (
      <div className="flex flex-col min-h-screen">
        {showConfetti && <Confetti />}
        <div className="bg-gradient-to-br from-violet-500 to-purple-600 px-4 pt-12 pb-8 text-white">
          <button onClick={() => router.push(backUrl)} className="text-white/80 font-bold text-sm flex items-center gap-1 mb-4">← {lesson.title}</button>
          <h1 className="text-2xl font-black">📏 Phân loại đuôi -s</h1>
        </div>
        <div className="flex-1 bg-gradient-to-b from-violet-50 to-purple-50 flex flex-col items-center justify-center px-4 py-8">
          <div className="text-7xl mb-4">{final === total ? '🏆' : final >= total * 0.7 ? '⭐' : '💪'}</div>
          <h2 className="text-3xl font-black text-gray-800 mb-1">{final}/{total}</h2>
          <p className="text-gray-500 font-bold text-xl mb-8">{pct}%</p>
          {final < total * 0.7 && (
            <p className="text-sm text-gray-500 font-semibold mb-6 text-center">Cần ≥70% để đánh dấu hoàn thành. Thử lại nhé!</p>
          )}
          <div className="w-full space-y-3">
            <button onClick={restart} className="w-full bg-violet-500 text-white font-black text-xl py-4 rounded-2xl shadow-lg">🔄 Chơi lại</button>
            <button onClick={() => router.push(backUrl)} className="w-full bg-white border-2 border-gray-200 text-gray-600 font-bold text-xl py-4 rounded-2xl">← Xem bài học</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-br from-violet-500 to-purple-600 px-4 pt-12 pb-4 text-white">
        <button onClick={() => router.push(backUrl)} className="text-white/80 font-bold text-sm flex items-center gap-1 mb-3">← {lesson.title}</button>
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-black">📏 Phân loại đuôi -s</h1>
          <span className="bg-white/20 px-3 py-1 rounded-full font-black text-sm">{idx + 1}/{questions.length}</span>
        </div>
        <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full bg-white/70 rounded-full transition-all duration-300"
            style={{ width: `${((idx + 1) / questions.length) * 100}%` }} />
        </div>
      </div>

      <div className="flex-1 bg-gradient-to-b from-violet-50 to-purple-50 flex flex-col items-center justify-center px-4 gap-5">
        {/* Score dots */}
        <div className="flex gap-1.5 flex-wrap justify-center">
          {Array.from({ length: questions.length }).map((_, i) => (
            <div key={i} className={`w-2 h-2 rounded-full ${i < score ? 'bg-green-400' : 'bg-gray-200'}`} />
          ))}
        </div>

        {/* Word card */}
        <div className="bg-white rounded-3xl px-6 py-5 shadow-md w-full text-center">
          <p className="text-xs text-gray-400 font-bold uppercase tracking-wide mb-2">Đuôi -s của từ này phát âm là?</p>
          <p className="text-4xl font-black text-gray-800 mb-3">{q.word}</p>
          <button onClick={() => speak(q.word, { rate: 0.75 })}
            className="bg-violet-100 text-violet-600 font-bold text-sm px-4 py-2 rounded-xl active:scale-90 transition-transform">
            🔊 Nghe từ
          </button>
          {isResult && (
            <div className={`mt-3 rounded-xl p-2.5 border ${selected === q.correctIdx ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <p className="text-sm font-bold text-gray-800">
                {selected === q.correctIdx
                  ? `✅ Đúng! "${q.word}s" → ${lesson.buckets[q.correctIdx].label}`
                  : `❌ Sai! "${q.word}s" → ${lesson.buckets[q.correctIdx].label}`}
              </p>
              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{lesson.buckets[q.correctIdx].condition}</p>
            </div>
          )}
        </div>

        {/* 3 bucket buttons */}
        <div className="w-full space-y-2.5">
          {lesson.buckets.map((bucket, i) => {
            const s = BUCKET_STYLES[i]
            const isCorrect  = i === q.correctIdx
            const isSelected = selected === i
            let cls = `bg-white border-2 ${s.border} active:scale-95`
            if (isResult && isCorrect)               cls = `${s.bg} border-2 border-green-400`
            if (isResult && isSelected && !isCorrect) cls = 'bg-red-50 border-2 border-red-400'
            return (
              <button key={bucket.label} onClick={() => handleChoose(i)} disabled={isResult}
                className={`${cls} rounded-2xl px-4 py-3.5 w-full flex items-center gap-3 transition-all`}>
                <span className={`text-xl font-black ${s.text} font-mono text-center flex-shrink-0 whitespace-nowrap`}>{bucket.label}</span>
                <p className="text-xs text-gray-500 font-semibold text-left flex-1 leading-snug">{bucket.tip}</p>
                {isResult && isCorrect  && <span className="text-green-500 font-black flex-shrink-0">✓</span>}
                {isResult && isSelected && !isCorrect && <span className="text-red-400 font-black flex-shrink-0">✗</span>}
              </button>
            )
          })}
        </div>

        {isResult && (
          <button onClick={advance}
            className={`w-full font-black text-xl py-4 rounded-2xl shadow-md text-white ${selected === q.correctIdx ? 'bg-green-500' : 'bg-violet-500'}`}>
            {idx + 1 >= questions.length ? 'Kết quả →' : 'Tiếp theo →'}
          </button>
        )}
      </div>
    </div>
  )
}
