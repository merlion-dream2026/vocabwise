'use client'
import { useState } from 'react'
import type { WordFormItem } from './types'

type Props = {
  instruction: string
  items: WordFormItem[]
  onDone: (score: number) => void
}

export default function E6WordForms({ instruction, items, onDone }: Props) {
  const [idx, setIdx]         = useState(0)
  const [typed, setTyped]     = useState('')
  const [checked, setChecked] = useState(false)
  const [scores, setScores]   = useState<boolean[]>([])

  const current = items[idx]
  const total   = items.length
  // Sentence: base word is in CAPS at end like "(TIDY)" — split display
  const sentenceDisplay = current.sentence.replace(`(${current.base_word})`, '').trim()
  const parts = sentenceDisplay.split('_____')

  const correct = typed.trim().toLowerCase() === current.answer.toLowerCase()

  const handleCheck = () => {
    setChecked(true)
    setScores(s => [...s, correct])
  }

  const goNext = () => {
    if (idx + 1 >= total) {
      onDone(scores.filter(Boolean).length)
    } else {
      setIdx(i => i + 1)
      setTyped('')
      setChecked(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm text-gray-600 leading-relaxed flex-1">{instruction}</p>
        <span className="text-xs font-black text-teal-500 ml-3 flex-shrink-0">{idx + 1}/{total}</span>
      </div>

      {/* Progress dots */}
      <div className="flex gap-1.5 justify-center">
        {items.map((_, i) => (
          <div key={i} className={`w-2 h-2 rounded-full transition-all ${
            i < idx ? 'bg-green-400' : i === idx ? 'bg-teal-500 scale-125' : 'bg-gray-200'
          }`} />
        ))}
      </div>

      {/* Base word badge */}
      <div className="text-center">
        <span className="bg-teal-100 text-teal-700 font-black text-sm px-4 py-1.5 rounded-full tracking-widest">
          {current.base_word}
        </span>
        <p className="text-xs text-gray-400 mt-1">Dùng dạng đúng của từ trên</p>
      </div>

      {/* Sentence */}
      <div className="bg-white border-2 border-teal-100 rounded-2xl p-4 shadow-sm">
        <p className="text-base font-bold text-gray-800 leading-relaxed text-center">
          {parts[0]}
          <span className={`inline-block mx-1 px-2 py-0.5 rounded-lg font-black min-w-[60px] text-center transition-all ${
            !checked
              ? 'bg-teal-50 text-teal-400 border-2 border-dashed border-teal-200'
              : correct
              ? 'bg-green-100 text-green-700 border-2 border-green-400'
              : 'bg-red-100 text-red-600 border-2 border-red-400'
          }`}>
            {checked ? (correct ? typed : typed || '?') : (typed || '_____')}
          </span>
          {parts[1] ?? ''}
        </p>
        {checked && !correct && (
          <p className="text-center text-xs text-green-600 font-bold mt-2">
            ✓ Đúng: <em>{current.answer}</em>
          </p>
        )}
      </div>

      {/* Input */}
      {!checked && (
        <input
          type="text"
          value={typed}
          onChange={e => setTyped(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && typed.trim() && handleCheck()}
          placeholder="Nhập dạng từ đúng..."
          className="w-full border-2 border-teal-200 rounded-xl px-4 py-3 text-base font-bold text-gray-800 outline-none focus:border-teal-400 text-center"
          autoCapitalize="none"
          autoCorrect="off"
        />
      )}

      {!checked ? (
        <button onClick={handleCheck} disabled={!typed.trim()}
          className={`w-full font-black py-3 rounded-2xl shadow transition-all active:scale-95 ${
            typed.trim() ? 'bg-teal-500 text-white' : 'bg-teal-100 text-teal-300 cursor-not-allowed'
          }`}>
          Kiểm tra
        </button>
      ) : (
        <button onClick={goNext}
          className="w-full bg-gradient-to-r from-teal-500 to-cyan-400 text-white font-black py-3 rounded-2xl shadow active:scale-95 transition-all">
          {idx + 1 >= total ? '✅ Xác nhận — Tiếp theo →' : 'Tiếp →'}
        </button>
      )}
    </div>
  )
}
