'use client'
import { useState, useMemo } from 'react'
import { speak } from '@/lib/speak'

type GlossaryItem = {
  id: number
  type?: string
  word?: string
  pos?: string
  meaning_vi: string
}

type Props = {
  glossary: GlossaryItem[]
  onDone: (score: number) => void
}

const POS_OPTIONS = ['noun', 'verb', 'adjective', 'adverb']
const POS_LABELS: Record<string, string> = {
  noun: 'Danh từ', verb: 'Động từ', adjective: 'Tính từ', adverb: 'Trạng từ',
}

function normalizePos(pos: string): string[] {
  const lower = pos.toLowerCase()
  return POS_OPTIONS.filter(p => lower.includes(p))
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function EWordClass({ glossary, onDone }: Props) {
  const words = useMemo(
    () => shuffle(glossary.filter(i => i.type !== 'collocation' && i.word && i.pos)).slice(0, 8),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )
  const total = words.length

  const [idx,      setIdx]      = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [scores,   setScores]   = useState<boolean[]>([])

  const current    = words[idx]
  const validPos   = normalizePos(current?.pos ?? '')
  const isCorrect  = selected !== null && validPos.includes(selected)

  const handleSelect = (pos: string) => {
    if (selected !== null) return
    setSelected(pos)
    setScores(s => [...s, validPos.includes(pos)])
  }

  const goNext = () => {
    if (idx + 1 >= total) {
      onDone([...scores, isCorrect].filter(Boolean).length)
    } else {
      setIdx(i => i + 1)
      setSelected(null)
    }
  }

  const btnCls = (pos: string) => {
    if (selected === null) return 'bg-white border-gray-200 text-gray-700 hover:border-purple-300 hover:bg-purple-50 active:scale-95'
    if (validPos.includes(pos)) return 'bg-green-100 border-green-500 text-green-800'
    if (pos === selected)       return 'bg-red-100 border-red-400 text-red-700'
    return 'bg-gray-50 border-gray-100 text-gray-400'
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between mb-1">
        <p className="text-base text-gray-600 leading-relaxed flex-1">
          Từ loại của từ sau là gì?
        </p>
        <span className="text-xs font-black text-purple-400 ml-3 flex-shrink-0">{idx + 1}/{total}</span>
      </div>

      {/* Progress dots */}
      <div className="flex gap-1.5 justify-center">
        {words.map((_, i) => (
          <div key={i} className={`w-2 h-2 rounded-full transition-all ${
            i < idx ? 'bg-green-400' : i === idx ? 'bg-purple-500 scale-125' : 'bg-gray-200'
          }`} />
        ))}
      </div>

      {/* Word display */}
      <div className="bg-white border-2 border-purple-100 rounded-2xl p-6 flex flex-col items-center gap-2 shadow-sm">
        <span className="text-3xl font-black text-gray-800">{current?.word}</span>
        <p className="text-xs text-gray-500 italic">{current?.meaning_vi?.split(';')[0]}</p>
        <button
          onClick={() => speak(current?.word ?? '')}
          className="text-gray-300 hover:text-blue-500 transition-colors text-lg mt-1"
          aria-label="Phát âm"
        >
          🔊
        </button>
      </div>

      {/* POS options */}
      <div className="grid grid-cols-2 gap-2">
        {POS_OPTIONS.map(pos => (
          <button
            key={pos}
            onClick={() => handleSelect(pos)}
            disabled={selected !== null}
            className={`py-3.5 rounded-xl border-2 font-bold text-sm transition-all duration-150 ${btnCls(pos)}`}
          >
            {POS_LABELS[pos]}
            {selected !== null && validPos.includes(pos) && <span className="ml-1 text-green-500">✓</span>}
          </button>
        ))}
      </div>

      {/* Result reveal */}
      {selected !== null && (
        <div className={`rounded-2xl p-3 border-2 ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <p className="text-sm font-black">
            {isCorrect ? '✅ Đúng!' : `❌ Từ loại đúng: ${validPos.map(p => POS_LABELS[p]).join(' / ')}`}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            &quot;{current?.word}&quot; — {current?.pos}
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
