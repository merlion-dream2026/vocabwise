'use client'
import { useState } from 'react'
import type { SubItem } from './types'

type Props = {
  instruction: string
  items: SubItem[]
  onDone: (score: number) => void
}

export default function ESynSub({ instruction, items, onDone }: Props) {
  const [idx,      setIdx]      = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [scores,   setScores]   = useState<boolean[]>([])

  const current = items[idx]
  const total   = items.length
  const isCorrect = selected === current?.answer

  const handleSelect = (opt: string) => {
    if (selected !== null) return
    setSelected(opt)
    setScores(s => [...s, opt === current.answer])
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

  const optCls = (opt: string) => {
    if (selected === null) return 'bg-white border-gray-200 text-gray-800 hover:border-purple-300 hover:bg-purple-50 active:scale-95'
    if (opt === current.answer) return 'bg-green-100 border-green-500 text-green-800'
    if (opt === selected)       return 'bg-red-100 border-red-400 text-red-700'
    return 'bg-white border-gray-100 text-gray-400'
  }

  // Split sentence around highlighted word
  const parts = current?.sentence.split(`**${current.highlighted}**`)
  const hasSplit = parts && parts.length === 2

  const optLabels = ['A', 'B', 'C', 'D']

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

      {/* Sentence with highlighted word */}
      <div className="bg-white border-2 border-purple-100 rounded-2xl p-4 shadow-sm">
        <p className="text-base text-gray-800 leading-relaxed text-center">
          {hasSplit ? (
            <>
              {parts[0]}
              <span className={`inline-block mx-1 px-2 py-0.5 rounded-lg font-black underline decoration-dashed decoration-purple-400 underline-offset-4 ${
                selected === null
                  ? 'text-purple-700'
                  : isCorrect
                  ? 'text-green-700 bg-green-100'
                  : 'text-red-700 bg-red-100'
              }`}>
                {current.highlighted}
              </span>
              {parts[1]}
            </>
          ) : (
            current?.sentence
          )}
        </p>
      </div>

      <p className="text-xs text-gray-500 text-center">Chọn từ có nghĩa gần nhất với từ gạch chân</p>

      {/* Options */}
      <div className="grid grid-cols-2 gap-2">
        {current?.options.map((opt, i) => (
          <button key={opt} onClick={() => handleSelect(opt)}
            disabled={selected !== null}
            className={`flex items-center gap-2 px-3 py-3 rounded-xl border-2 font-bold text-sm transition-all duration-150 ${optCls(opt)}`}>
            <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-500 font-black text-xs flex items-center justify-center flex-shrink-0">
              {optLabels[i]}
            </span>
            <span className="text-left">{opt}</span>
            {selected !== null && opt === current.answer && <span className="ml-auto text-green-500">✓</span>}
          </button>
        ))}
      </div>

      {/* Screen-reader feedback */}
      <div role="alert" aria-live="assertive" className="sr-only">
        {selected !== null && (isCorrect ? 'Chính xác!' : `Sai rồi. Đáp án đúng là ${current?.answer}.`)}
      </div>

      {selected !== null && (
        <button onClick={goNext}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-black py-3 rounded-2xl shadow active:scale-95 transition-all">
          {idx + 1 >= total ? '✅ Xác nhận — Tiếp theo →' : 'Tiếp →'}
        </button>
      )}
    </div>
  )
}
