'use client'
import { useState } from 'react'
import type { MatchingItem, MatchingOption } from './types'

type Props = {
  instruction: string
  items: MatchingItem[]
  options: MatchingOption[]
  answerKey: Record<string, string>      // {"1":"C","2":"D",...}
  onDone: (score: number) => void
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

export default function E1Matching({ instruction, items, options, answerKey, onDone }: Props) {
  const [shuffledOpts] = useState(() => shuffle(options))
  const [selectedWord, setSelectedWord]     = useState<number | null>(null)
  const [matched, setMatched]               = useState<Record<number, string>>({})   // wordId → optId
  const [wrongPair, setWrongPair]           = useState<{ wordId: number; optId: string } | null>(null)
  const [mistakes, setMistakes]             = useState(0)
  const [submitted, setSubmitted]           = useState(false)

  const matchedWordIds = Object.keys(matched).map(Number)
  const matchedOptIds  = Object.values(matched)
  const allDone        = matchedWordIds.length === items.length

  const handleWordTap = (id: number) => {
    if (matched[id] !== undefined || submitted) return
    setSelectedWord(id === selectedWord ? null : id)
    setWrongPair(null)
  }

  const handleOptTap = (optId: string) => {
    if (matchedOptIds.includes(optId) || submitted) return
    if (selectedWord === null) return

    const correct = answerKey[String(selectedWord)] === optId
    if (correct) {
      setMatched(m => ({ ...m, [selectedWord]: optId }))
      setSelectedWord(null)
    } else {
      setMistakes(m => m + 1)
      setWrongPair({ wordId: selectedWord, optId })
      setTimeout(() => { setWrongPair(null); setSelectedWord(null) }, 700)
    }
  }

  const handleSubmit = () => {
    const score = Math.max(0, items.length - mistakes)
    setSubmitted(true)
    onDone(score)
  }

  const wordState = (id: number) => {
    if (matched[id])                         return 'matched'
    if (wrongPair?.wordId === id)            return 'wrong'
    if (selectedWord === id)                 return 'selected'
    return 'idle'
  }

  const optState = (optId: string) => {
    if (matchedOptIds.includes(optId))       return 'matched'
    if (wrongPair?.optId === optId)          return 'wrong'
    return 'idle'
  }

  const wordCls = (s: string) =>
    s === 'matched'  ? 'bg-green-100 border-green-400 text-green-800' :
    s === 'wrong'    ? 'bg-red-100 border-red-400 text-red-700 animate-pulse' :
    s === 'selected' ? 'bg-purple-100 border-purple-500 text-purple-800 ring-2 ring-purple-300' :
                       'bg-white border-gray-200 text-gray-800 hover:border-purple-300 active:scale-95'

  const optCls = (s: string) =>
    s === 'matched'  ? 'bg-green-100 border-green-400 text-green-800' :
    s === 'wrong'    ? 'bg-red-100 border-red-400 text-red-700 animate-pulse' :
    selectedWord !== null
      ? 'bg-white border-purple-200 text-gray-700 hover:border-purple-400 hover:bg-purple-50 cursor-pointer active:scale-95'
      : 'bg-white border-gray-200 text-gray-500'

  return (
    <div className="flex flex-col gap-4">
      <p className="text-base text-gray-600 leading-relaxed">{instruction}</p>

      <div className="grid grid-cols-2 gap-3">
        {/* Left: numbered words */}
        <div className="flex flex-col gap-2">
          {items.map(item => {
            const s = wordState(item.id)
            return (
              <button key={item.id} onClick={() => handleWordTap(item.id)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 font-bold text-sm transition-all duration-150 ${wordCls(s)}`}>
                <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-600 font-black text-xs flex items-center justify-center flex-shrink-0">
                  {item.id}
                </span>
                <span>{item.word}</span>
                {s === 'matched' && <span className="ml-auto text-green-500 text-xs font-black">{matched[item.id]}</span>}
              </button>
            )
          })}
        </div>

        {/* Right: lettered definitions */}
        <div className="flex flex-col gap-2">
          {shuffledOpts.map(opt => {
            const s = optState(opt.id)
            return (
              <button key={opt.id} onClick={() => handleOptTap(opt.id)}
                className={`flex items-start gap-2 px-3 py-2.5 rounded-xl border-2 text-sm leading-snug transition-all duration-150 ${optCls(s)}`}>
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 font-black text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                  {opt.id}
                </span>
                <span>{opt.text}</span>
              </button>
            )
          })}
        </div>
      </div>

      {selectedWord !== null && (
        <p className="text-center text-xs text-purple-500 font-bold">
          Đã chọn: <em>{items.find(i => i.id === selectedWord)?.word}</em> — bây giờ chọn định nghĩa →
        </p>
      )}

      {allDone && !submitted && (
        <button onClick={handleSubmit}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-black py-3 rounded-2xl shadow active:scale-95 transition-all">
          ✅ Xác nhận — Tiếp theo →
        </button>
      )}

      {mistakes > 0 && !submitted && (
        <p className="text-center text-xs text-orange-500">⚠️ {mistakes} lần chọn sai</p>
      )}
    </div>
  )
}
