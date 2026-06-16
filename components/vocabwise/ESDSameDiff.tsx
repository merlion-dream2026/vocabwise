'use client'
import { useState } from 'react'
import type { SDItem } from './types'

type Props = {
  instruction: string
  items: SDItem[]
  onDone: (score: number) => void
}

export default function ESDSameDiff({ instruction, items, onDone }: Props) {
  const [idx,      setIdx]      = useState(0)
  const [selected, setSelected] = useState<'S' | 'D' | null>(null)
  const [scores,   setScores]   = useState<boolean[]>([])

  const current = items[idx]
  const total   = items.length

  const handleSelect = (choice: 'S' | 'D') => {
    if (selected !== null) return
    setSelected(choice)
    setScores(s => [...s, choice === current.answer])
  }

  const goNext = () => {
    const isCorrect = selected === current.answer
    if (idx + 1 >= total) {
      onDone([...scores, isCorrect].filter(Boolean).length)
    } else {
      setIdx(i => i + 1)
      setSelected(null)
    }
  }

  const btnCls = (choice: 'S' | 'D') => {
    if (selected === null)
      return choice === 'S'
        ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 active:scale-95'
        : 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100 active:scale-95'
    if (choice === current.answer) return 'bg-green-100 border-green-500 text-green-800'
    if (choice === selected)       return 'bg-red-100 border-red-400 text-red-700'
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

      {/* Sentence pair */}
      <div className="bg-white border-2 border-gray-100 rounded-2xl p-4 space-y-3 shadow-sm">
        <div className="flex gap-3 items-start">
          <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 font-black text-xs flex items-center justify-center flex-shrink-0 mt-0.5">A</span>
          <p className="text-sm text-gray-800 leading-relaxed">{current.a}</p>
        </div>
        <div className="border-t border-gray-100" />
        <div className="flex gap-3 items-start">
          <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 font-black text-xs flex items-center justify-center flex-shrink-0 mt-0.5">B</span>
          <p className="text-sm text-gray-800 leading-relaxed">{current.b}</p>
        </div>
      </div>

      <p className="text-xs text-gray-400 text-center">Hai câu này có nghĩa giống hay khác nhau?</p>

      {/* S / D buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => handleSelect('S')}
          disabled={selected !== null}
          className={`py-4 rounded-2xl border-2 font-black text-sm transition-all duration-150 ${btnCls('S')}`}
        >
          S — Giống nhau
          {selected !== null && current.answer === 'S' && <span className="ml-1">✓</span>}
        </button>
        <button
          onClick={() => handleSelect('D')}
          disabled={selected !== null}
          className={`py-4 rounded-2xl border-2 font-black text-sm transition-all duration-150 ${btnCls('D')}`}
        >
          D — Khác nhau
          {selected !== null && current.answer === 'D' && <span className="ml-1">✓</span>}
        </button>
      </div>

      {/* Explanation reveal */}
      {selected !== null && (
        <div className={`rounded-2xl p-4 border-2 ${
          selected === current.answer ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
        }`}>
          <p className="text-sm font-black mb-1">
            {selected === current.answer
              ? `✅ Chính xác! Hai câu ${current.answer === 'S' ? 'giống' : 'khác'} nhau.`
              : `❌ Hai câu thực ra ${current.answer === 'S' ? 'giống' : 'khác'} nhau.`}
          </p>
          <p className="text-xs text-gray-600 leading-relaxed">{current.explanation}</p>
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
