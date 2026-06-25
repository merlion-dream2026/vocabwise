'use client'
import { useState } from 'react'
import type { ErrorFixItem } from './types'
import HintButton from './HintButton'

type Props = {
  instruction: string
  items: ErrorFixItem[]
  onDone: (score: number) => void
}

export default function E8ErrorFix({ instruction, items, onDone }: Props) {
  const [idx, setIdx]           = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [scores, setScores]     = useState<boolean[]>([])

  const current = items[idx]
  const total   = items.length

  // Highlight the error in the sentence
  const renderSentence = () => {
    const before      = current.sentence.split('[')[0]
    const after       = current.sentence.split(']')[1] ?? ''
    const correctWord = current.options[current.answer as keyof typeof current.options]

    return (
      <p className="text-base font-bold text-gray-800 leading-relaxed text-center">
        {before}
        {selected === null ? (
          <span className="inline mx-1 px-2 py-0.5 rounded font-black underline decoration-wavy decoration-red-400 bg-orange-50 text-orange-600">
            {current.highlighted}
          </span>
        ) : (
          <>
            <span className="inline mx-1 px-1.5 py-0.5 rounded font-black line-through text-red-500 bg-red-50">
              {current.highlighted}
            </span>
            <span className="inline mx-1 px-2 py-0.5 rounded font-black text-green-700 bg-green-100 border border-green-300">
              {correctWord}
            </span>
          </>
        )}
        {after}
      </p>
    )
  }

  const handleSelect = (key: string) => {
    if (selected !== null) return
    setSelected(key)
    setScores(s => [...s, key === current.answer])
  }

  const goNext = () => {
    if (idx + 1 >= total) {
      onDone(scores.filter(Boolean).length)
    } else {
      setIdx(i => i + 1)
      setSelected(null)
    }
  }

  const optCls = (key: string) => {
    if (selected === null) return 'bg-white border-gray-200 text-gray-800 hover:border-orange-300 hover:bg-orange-50 active:scale-95'
    if (key === current.answer) return 'bg-green-100 border-green-500 text-green-800'
    if (key === selected) return 'bg-red-100 border-red-400 text-red-700'
    return 'bg-white border-gray-100 text-gray-400'
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between mb-1">
        <p className="text-base text-gray-600 leading-relaxed flex-1">{instruction}</p>
        <span className="text-xs font-black text-orange-400 ml-3 flex-shrink-0">{idx + 1}/{total}</span>
      </div>

      {/* Progress dots */}
      <div className="flex gap-1.5 justify-center">
        {items.map((_, i) => (
          <div key={i} className={`w-2 h-2 rounded-full transition-all ${
            i < idx ? 'bg-green-400' : i === idx ? 'bg-orange-400 scale-125' : 'bg-gray-200'
          }`} />
        ))}
      </div>

      {/* Sentence with highlighted error */}
      <div className="bg-orange-50 border-2 border-orange-100 rounded-2xl p-4 shadow-sm">
        {renderSentence()}
        <p className="text-center text-xs text-orange-400 mt-2">
          ↑ Từ/cụm gạch chân bị sai — chọn cách sửa đúng
        </p>
      </div>

      {/* Hint */}
      {selected === null && (
        <HintButton
          key={idx}
          exerciseType="E8"
          question={current.sentence}
          options={Object.values(current.options)}
        />
      )}

      {/* Options A / B / C */}
      <div className="flex flex-col gap-2">
        {(['A', 'B', 'C'] as const).map(key => (
          <button key={key} onClick={() => handleSelect(key)}
            disabled={selected !== null}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 font-bold text-sm transition-all duration-150 ${optCls(key)}`}>
            <span className="w-7 h-7 rounded-full bg-gray-100 text-gray-600 font-black text-xs flex items-center justify-center flex-shrink-0">
              {key}
            </span>
            <span className="text-left">{current.options[key]}</span>
            {selected !== null && key === current.answer && <span className="ml-auto text-green-500 font-black">✓</span>}
            {selected !== null && key === selected && key !== current.answer && <span className="ml-auto text-red-500 font-black">✗</span>}
          </button>
        ))}
      </div>

      {/* Screen-reader feedback */}
      <div role="alert" aria-live="assertive" className="sr-only">
        {selected !== null && (selected === current.answer ? 'Chính xác!' : 'Sai rồi.')}
      </div>

      {/* Explanation after answer */}
      {selected !== null && current.explanation && (
        <div className="bg-blue-50 border-2 border-blue-100 rounded-xl p-3">
          <p className="text-sm text-blue-700 leading-relaxed">
            <span className="font-black">💡 Giải thích: </span>{current.explanation_vi ?? current.explanation}
          </p>
        </div>
      )}

      {selected !== null && (
        <button onClick={goNext}
          className="w-full bg-gradient-to-r from-orange-400 to-amber-400 text-white font-black py-3 rounded-2xl shadow active:scale-95 transition-all">
          {idx + 1 >= total ? '✅ Xác nhận — Tiếp theo →' : 'Tiếp →'}
        </button>
      )}
    </div>
  )
}
