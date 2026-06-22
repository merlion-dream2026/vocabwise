'use client'
import { useState } from 'react'
import type { SentenceItem } from './types'

type Props = {
  instruction: string
  items: SentenceItem[]
  onDone: (score: number) => void
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

export default function E7SentenceBuilding({ instruction, items, onDone }: Props) {
  const [idx, setIdx]             = useState(0)
  const [pool, setPool]           = useState<string[]>(() => shuffle(items[0].words))
  const [built, setBuilt]         = useState<string[]>([])
  const [checked, setChecked]     = useState(false)
  const [scores, setScores]       = useState<boolean[]>([])

  const current = items[idx]
  const total   = items.length
  const builtSentence = built.join(' ')
  const correct = builtSentence.toLowerCase() === current.answer.toLowerCase()

  const pickWord = (word: string, i: number) => {
    if (checked) return
    setBuilt(b => [...b, word])
    setPool(p => { const np = [...p]; np.splice(i, 1); return np })
  }

  const unpickWord = (i: number) => {
    if (checked) return
    const word = built[i]
    setBuilt(b => b.filter((_, j) => j !== i))
    setPool(p => [...p, word])
  }

  const handleCheck = () => {
    setChecked(true)
    setScores(s => [...s, correct])
  }

  const goNext = () => {
    const nextIdx = idx + 1
    if (nextIdx >= total) {
      onDone(scores.filter(Boolean).length)
    } else {
      setIdx(nextIdx)
      setPool(shuffle(items[nextIdx].words))
      setBuilt([])
      setChecked(false)
    }
  }

  const reset = () => {
    setPool(shuffle(current.words))
    setBuilt([])
    setChecked(false)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between mb-1">
        <p className="text-base text-gray-600 leading-relaxed flex-1">{instruction}</p>
        <span className="text-xs font-black text-indigo-400 ml-3 flex-shrink-0">{idx + 1}/{total}</span>
      </div>

      {/* Progress dots */}
      <div className="flex gap-1.5 justify-center">
        {items.map((_, i) => (
          <div key={i} className={`w-2 h-2 rounded-full transition-all ${
            i < idx ? 'bg-green-400' : i === idx ? 'bg-indigo-500 scale-125' : 'bg-gray-200'
          }`} />
        ))}
      </div>

      {/* Built sentence area */}
      <div className={`min-h-[64px] bg-white border-2 rounded-2xl p-3 shadow-sm flex flex-wrap gap-2 items-center transition-all ${
        !checked ? 'border-indigo-100' : correct ? 'border-green-400 bg-green-50' : 'border-red-300 bg-red-50'
      }`}>
        {built.length === 0 ? (
          <p className="text-gray-300 text-sm font-bold w-full text-center">Chọn từ bên dưới để xây câu...</p>
        ) : (
          built.map((word, i) => (
            <button key={`${word}-${i}`} onClick={() => unpickWord(i)} disabled={checked}
              className="bg-indigo-100 text-indigo-700 font-bold text-sm px-3 py-1.5 rounded-lg border-2 border-indigo-200 hover:bg-indigo-200 active:scale-95 transition-all">
              {word}
            </button>
          ))
        )}
      </div>

      {/* Screen-reader feedback */}
      <div role="alert" aria-live="assertive" className="sr-only">
        {checked && (correct ? 'Chính xác!' : `Sai rồi. Câu đúng là ${current.answer}.`)}
      </div>

      {checked && !correct && (
        <div className="bg-green-50 border-2 border-green-200 rounded-xl px-4 py-2">
          <p className="text-xs text-green-700 font-bold text-center">✓ Câu đúng: <em>{current.answer}</em></p>
        </div>
      )}

      {/* Word pool */}
      <div className="flex flex-wrap gap-2 justify-center min-h-[40px]">
        {pool.map((word, i) => (
          <button key={`${word}-${i}`} onClick={() => pickWord(word, i)} disabled={checked}
            className={`bg-white border-2 border-indigo-200 text-indigo-700 font-bold text-sm px-3 py-1.5 rounded-lg transition-all ${
              checked ? 'opacity-40' : 'hover:bg-indigo-50 hover:border-indigo-400 active:scale-95'
            }`}>
            {word}
          </button>
        ))}
      </div>

      {!checked ? (
        <div className="flex gap-2">
          <button onClick={reset}
            className="flex-none bg-gray-100 text-gray-500 font-black px-4 py-3 rounded-2xl active:scale-95 transition-all text-sm">
            🔄 Đặt lại
          </button>
          <button onClick={handleCheck} disabled={built.length === 0}
            className={`flex-1 font-black py-3 rounded-2xl shadow transition-all active:scale-95 ${
              built.length > 0 ? 'bg-indigo-500 text-white' : 'bg-indigo-100 text-indigo-300 cursor-not-allowed'
            }`}>
            Kiểm tra
          </button>
        </div>
      ) : (
        <button onClick={goNext}
          className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-black py-3 rounded-2xl shadow active:scale-95 transition-all">
          {idx + 1 >= total ? '✅ Xác nhận — Tiếp theo →' : 'Tiếp →'}
        </button>
      )}
    </div>
  )
}
