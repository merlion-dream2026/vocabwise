'use client'
import { useState } from 'react'
import type { GapFillItem } from './types'

type Props = {
  instruction: string
  wordBank: string[]
  items: GapFillItem[]
  onDone: (score: number) => void
}

export default function E4GapFill({ instruction, wordBank, items, onDone }: Props) {
  const [idx, setIdx]         = useState(0)
  const [filled, setFilled]   = useState<string | null>(null)
  const [scores, setScores]   = useState<boolean[]>([])
  const [used, setUsed]       = useState<string[]>([])

  const current = items[idx]
  const total   = items.length
  const parts   = current.sentence.split('_____')

  const handlePick = (word: string) => {
    if (filled !== null) return
    const correct = word === current.answer
    setFilled(word)
    setScores(s => [...s, correct])
    setUsed(u => [...u, word])
  }

  const goNext = () => {
    if (idx + 1 >= total) {
      onDone(scores.filter(Boolean).length + (filled === current.answer ? 1 : 0))
    } else {
      setIdx(i => i + 1)
      setFilled(null)
    }
  }

  const bankCls = (word: string) => {
    if (used.includes(word))       return 'opacity-30 cursor-not-allowed bg-gray-100 border-gray-200 text-gray-400'
    if (filled !== null)            return 'opacity-50 cursor-not-allowed bg-white border-gray-200 text-gray-400'
    return 'bg-white border-purple-200 text-purple-700 font-bold hover:bg-purple-50 hover:border-purple-400 active:scale-95 cursor-pointer'
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm text-gray-600 leading-relaxed flex-1">{instruction}</p>
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

      {/* Sentence */}
      <div className="bg-white border-2 border-blue-100 rounded-2xl p-4 shadow-sm">
        <p className="text-base font-bold text-gray-800 leading-relaxed text-center">
          {parts[0]}
          <span className={`inline-block mx-1 px-3 py-0.5 rounded-lg font-black transition-all min-w-[60px] text-center ${
            filled === null
              ? 'bg-blue-50 text-blue-300 border-2 border-dashed border-blue-200'
              : filled === current.answer
              ? 'bg-green-100 text-green-700 border-2 border-green-400'
              : 'bg-red-100 text-red-600 border-2 border-red-400'
          }`}>
            {filled ?? '_____'}
          </span>
          {parts[1]}
        </p>
        {filled !== null && filled !== current.answer && (
          <p className="text-center text-xs text-green-600 font-bold mt-2">
            ✓ Đáp án đúng: <em>{current.answer}</em>
          </p>
        )}
      </div>

      {/* Word bank */}
      <div>
        <p className="text-xs text-gray-400 font-bold mb-2 uppercase tracking-wide text-center">Hộp từ</p>
        <div className="flex flex-wrap gap-2 justify-center">
          {wordBank.map(word => (
            <button key={word} onClick={() => handlePick(word)}
              disabled={filled !== null || used.includes(word)}
              className={`px-4 py-2 rounded-xl border-2 text-sm transition-all duration-150 ${bankCls(word)}`}>
              {word}
            </button>
          ))}
        </div>
      </div>

      {filled !== null && (
        <button onClick={goNext}
          className="w-full bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-black py-3 rounded-2xl shadow active:scale-95 transition-all">
          {idx + 1 >= total ? '✅ Xác nhận — Tiếp theo →' : 'Tiếp →'}
        </button>
      )}
    </div>
  )
}
