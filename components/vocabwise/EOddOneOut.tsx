'use client'
import { useState } from 'react'
import type { OddItem } from './types'

type Props = {
  instruction: string
  items: OddItem[]
  onDone: (score: number) => void
}

const COLORS = [
  'bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100',
  'bg-purple-50 border-purple-200 text-purple-800 hover:bg-purple-100',
  'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100',
  'bg-orange-50 border-orange-200 text-orange-800 hover:bg-orange-100',
]

export default function EOddOneOut({ instruction, items, onDone }: Props) {
  const [idx,      setIdx]      = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [scores,   setScores]   = useState<boolean[]>([])

  const current = items[idx]
  const total   = items.length

  const handleSelect = (word: string) => {
    if (selected !== null) return
    setSelected(word)
    setScores(s => [...s, word === current.answer])
  }

  const goNext = () => {
    const isCorrect = selected === current.answer
    if (idx + 1 >= total) {
      const correct = [...scores, isCorrect].filter(Boolean).length
      onDone(Math.round(correct / total * 5))
    } else {
      setIdx(i => i + 1)
      setSelected(null)
    }
  }

  const wordCls = (word: string, i: number) => {
    if (selected === null) return `${COLORS[i]} active:scale-95`
    if (word === current.answer) return 'bg-green-100 border-green-500 text-green-800'
    if (word === selected && word !== current.answer) return 'bg-red-100 border-red-400 text-red-700'
    return 'bg-gray-50 border-gray-100 text-gray-400'
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between mb-1">
        <p className="text-base text-gray-600 leading-relaxed flex-1">{instruction}</p>
        <span className="text-xs font-black text-purple-400 ml-3 flex-shrink-0">{idx + 1}/{total}</span>
      </div>

      {/* Progress dots */}
      <div className="flex gap-1.5 justify-center">
        {items.map((_, i) => (
          <div key={i} className={`w-2 h-2 rounded-full transition-all ${
            i < idx ? 'bg-green-400' : i === idx ? 'bg-purple-500 scale-125' : 'bg-gray-200'
          }`} />
        ))}
      </div>

      <p className="text-xs text-gray-400 text-center">Ba từ có điểm chung — một từ khác nhóm. Tìm từ đó!</p>

      {/* Word grid */}
      <div className="grid grid-cols-2 gap-3">
        {current.words.map((word, i) => (
          <button
            key={word}
            onClick={() => handleSelect(word)}
            disabled={selected !== null}
            className={`py-4 px-3 rounded-2xl border-2 font-black text-base transition-all duration-150 ${wordCls(word, i)}`}
          >
            {word}
            {selected !== null && word === current.answer && <span className="ml-1 text-green-500"> ✓</span>}
            {selected !== null && word === selected && word !== current.answer && <span className="ml-1 text-red-400"> ✗</span>}
          </button>
        ))}
      </div>

      {/* Reason reveal */}
      {selected !== null && (
        <div className={`rounded-2xl p-4 border-2 ${
          selected === current.answer
            ? 'bg-green-50 border-green-200'
            : 'bg-red-50 border-red-200'
        }`}>
          <p className="text-sm font-black mb-1">
            {selected === current.answer ? '✅ Chính xác!' : `❌ Đáp án đúng: ${current.answer}`}
          </p>
          {current.reason_vi && (
            <p className="text-xs text-gray-700 leading-relaxed font-semibold">{current.reason_vi}</p>
          )}
          <p className="text-xs text-gray-400 leading-relaxed mt-1 italic">{current.reason}</p>
        </div>
      )}

      {selected !== null && (
        <button onClick={goNext}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-black py-3 rounded-2xl shadow active:scale-95 transition-all">
          {idx + 1 >= total ? '✅ Xác nhận — Tiếp theo →' : 'Tiếp →'}
        </button>
      )}
    </div>
  )
}
