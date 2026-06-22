'use client'
import { useState } from 'react'
import type { CatItem } from './types'

type Props = {
  instruction: string
  categories: string[]
  items: CatItem[]
  onDone: (score: number) => void
}

const CAT_COLORS = [
  { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-700', btn: 'bg-blue-100 border-blue-300 text-blue-700 hover:bg-blue-200' },
  { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-700', btn: 'bg-orange-100 border-orange-300 text-orange-700 hover:bg-orange-200' },
  { bg: 'bg-emerald-50', border: 'border-emerald-300', text: 'text-emerald-700', btn: 'bg-emerald-100 border-emerald-300 text-emerald-700 hover:bg-emerald-200' },
]

export default function ECategorize({ instruction, categories, items, onDone }: Props) {
  const [idx,      setIdx]      = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [scores,   setScores]   = useState<boolean[]>([])

  const current = items[idx]
  const total   = items.length
  const isCorrect = selected === current?.answer

  const handleSelect = (cat: string) => {
    if (selected !== null) return
    setSelected(cat)
    setScores(s => [...s, cat === current.answer])
  }

  const goNext = () => {
    if (idx + 1 >= total) {
      const correct = [...scores, isCorrect].filter(Boolean).length
      onDone(Math.round(correct / total * 5))
    } else {
      setIdx(i => i + 1)
      setSelected(null)
    }
  }

  const catCls = (cat: string, i: number) => {
    const c = CAT_COLORS[i % CAT_COLORS.length]
    if (selected === null) return `${c.btn} active:scale-95`
    if (cat === current.answer) return `bg-green-100 border-green-500 text-green-800`
    if (cat === selected)       return `bg-red-100 border-red-400 text-red-700`
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

      {/* Word card */}
      <div className="bg-white border-2 border-purple-100 rounded-2xl p-8 flex items-center justify-center shadow-sm">
        <span className="text-3xl font-black text-gray-800">{current?.word}</span>
      </div>

      <p className="text-xs text-gray-500 text-center">Từ này thuộc nhóm nào?</p>

      {/* Category buttons */}
      <div className="flex flex-col gap-2">
        {categories.map((cat, i) => (
          <button
            key={cat}
            onClick={() => handleSelect(cat)}
            disabled={selected !== null}
            className={`py-3.5 px-4 rounded-2xl border-2 font-bold text-sm transition-all duration-150 text-left ${catCls(cat, i)}`}
          >
            {selected !== null && cat === current.answer && <span className="mr-2">✓</span>}
            {selected !== null && cat === selected && cat !== current.answer && <span className="mr-2">✗</span>}
            {cat}
          </button>
        ))}
      </div>

      {/* Feedback */}
      {selected !== null && (
        <div role="status" aria-live="polite" className={`rounded-2xl p-3 border-2 ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <p className="text-sm font-black">
            {isCorrect ? '✅ Chính xác!' : `❌ Nhóm đúng: ${current.answer}`}
          </p>
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
