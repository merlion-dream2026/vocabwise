'use client'
import { useState } from 'react'
import type { TFNGItem } from './types'
import HintButton from './HintButton'

type Choice = 'True' | 'False' | 'Not Given'
type Props = {
  instruction: string
  items: TFNGItem[]
  onDone: (score: number) => void
}

export default function E5TFNG({ instruction, items, onDone }: Props) {
  const [idx, setIdx]           = useState(0)
  const [selected, setSelected] = useState<Choice | null>(null)
  const [scores, setScores]     = useState<boolean[]>([])

  const current = items[idx]
  const total   = items.length
  const correct = selected === current.answer

  const handleSelect = (choice: Choice) => {
    if (selected !== null) return
    setSelected(choice)
    setScores(s => [...s, choice === current.answer])
  }

  const goNext = () => {
    if (idx + 1 >= total) {
      onDone(scores.filter(Boolean).length)
    } else {
      setIdx(i => i + 1)
      setSelected(null)
    }
  }

  const btnCls = (choice: Choice) => {
    if (selected === null) {
      const base = 'border-gray-200 text-gray-700 hover:active:scale-95'
      if (choice === 'True')      return `${base} hover:border-green-400 hover:bg-green-50`
      if (choice === 'False')     return `${base} hover:border-red-400 hover:bg-red-50`
      return `${base} hover:border-gray-400 hover:bg-gray-50`
    }
    if (choice === current.answer)  return 'bg-green-100 border-green-500 text-green-800'
    if (choice === selected)        return 'bg-red-100 border-red-400 text-red-700'
    return 'bg-white border-gray-100 text-gray-400'
  }

  const btnEmoji = { True: '✅', False: '❌', 'Not Given': '❓' }
  const btnLabel = { True: 'True', False: 'False', 'Not Given': 'Not Given' }
  const choices: Choice[] = ['True', 'False', 'Not Given']

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between mb-1">
        <p className="text-base text-gray-600 leading-relaxed flex-1">{instruction}</p>
        <span className="text-xs font-black text-green-500 ml-3 flex-shrink-0">{idx + 1}/{total}</span>
      </div>

      {/* Progress dots */}
      <div className="flex gap-1.5 justify-center">
        {items.map((_, i) => (
          <div key={i} className={`w-2 h-2 rounded-full transition-all ${
            i < idx ? 'bg-green-400' : i === idx ? 'bg-green-500 scale-125' : 'bg-gray-200'
          }`} />
        ))}
      </div>

      {/* Statement card */}
      <div className={`bg-white border-2 rounded-2xl p-5 shadow-sm transition-all ${
        selected === null ? 'border-green-100'
        : correct ? 'border-green-400 bg-green-50'
        : 'border-red-300 bg-red-50'
      }`}>
        <p className="text-xs text-gray-500 font-bold uppercase tracking-wide mb-2 text-center">Câu phát biểu</p>
        <p className="text-base font-bold text-gray-800 leading-relaxed text-center">
          {current.statement}
        </p>
        {selected !== null && (
          <p role="status" aria-live="polite" className={`text-center text-sm font-black mt-3 ${correct ? 'text-green-600' : 'text-red-500'}`}>
            {correct ? '✅ Chính xác!' : `❌ Đáp án đúng: ${current.answer}`}
          </p>
        )}
      </div>

      {/* Hint */}
      {selected === null && (
        <HintButton key={idx} exerciseType="E5" question={current.statement} />
      )}

      {/* T / F / NG buttons */}
      <div className="flex gap-2">
        {choices.map(c => (
          <button key={c} onClick={() => handleSelect(c)} disabled={selected !== null}
            className={`flex-1 flex flex-col items-center gap-1 py-4 rounded-2xl border-2 font-black text-xs transition-all duration-150 bg-white ${btnCls(c)}`}>
            <span className="text-xl">{btnEmoji[c]}</span>
            <span>{btnLabel[c]}</span>
          </button>
        ))}
      </div>

      {selected !== null && (
        <button onClick={goNext}
          className="w-full bg-gradient-to-r from-green-500 to-emerald-400 text-white font-black py-3 rounded-2xl shadow active:scale-95 transition-all">
          {idx + 1 >= total ? '✅ Xác nhận — Tiếp theo →' : 'Tiếp →'}
        </button>
      )}
    </div>
  )
}
