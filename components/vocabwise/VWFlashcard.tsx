'use client'
import { useState, useCallback } from 'react'
import { speak } from '@/lib/speak'

type GlossaryItem = {
  id: number
  type?: string
  word?: string
  ipa?: string
  pos?: string
  collocation?: string
  meaning_vi: string
  example_en: string
  example_vi: string
}

type Props = {
  glossary: GlossaryItem[]
  onExit: () => void
}

export default function VWFlashcard({ glossary, onExit }: Props) {
  const cards = glossary.filter(i => i.type !== 'collocation' && i.word)
  const total  = cards.length

  const [idx,     setIdx]     = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [results, setResults] = useState<boolean[]>([])
  const [done,    setDone]    = useState(false)

  const current     = cards[idx]
  const displayWord = current?.word ?? ''

  const handleFlip = useCallback(() => {
    if (!flipped) speak(displayWord)
    setFlipped(f => !f)
  }, [flipped, displayWord])

  const handleAnswer = (knew: boolean) => {
    const next = [...results, knew]
    setResults(next)
    if (idx + 1 >= total) {
      setDone(true)
    } else {
      setIdx(i => i + 1)
      setFlipped(false)
    }
  }

  if (done) {
    const knewCount = results.filter(Boolean).length
    const pct = Math.round((knewCount / total) * 100)
    return (
      <div className="flex flex-col items-center gap-5 py-6">
        <div className="text-5xl">{pct === 100 ? '🏆' : pct >= 70 ? '⭐' : '💪'}</div>
        <div className="text-center">
          <p className="text-xl font-black text-gray-800">Hoàn thành tự kiểm tra!</p>
          <p className="text-gray-500 text-sm mt-1">
            Bạn nhớ <span className="font-black text-green-600">{knewCount}/{total}</span> từ ({pct}%)
          </p>
        </div>

        <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="w-full space-y-2">
          {cards.map((c, i) => (
            <div key={c.id} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border-2 ${
              results[i] ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            }`}>
              <span className="text-sm">{results[i] ? '✅' : '❌'}</span>
              <span className="font-black text-sm text-gray-800 flex-1">{c.word}</span>
              <span className="text-xs text-gray-500 truncate max-w-[140px]">{c.meaning_vi.split(';')[0]}</span>
            </div>
          ))}
        </div>

        <button
          onClick={onExit}
          className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-black py-3 rounded-2xl shadow active:scale-95 transition-all"
        >
          ← Quay lại từ vựng
        </button>
      </div>
    )
  }

  const progress = idx / total

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={onExit} className="text-gray-400 text-sm font-bold hover:text-gray-600">
          ← Thoát
        </button>
        <span className="text-xs font-black text-purple-400">{idx + 1}/{total}</span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
        <div
          className="h-full bg-purple-400 rounded-full transition-all duration-300"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {/* Card */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Lật thẻ từ vựng"
        onClick={handleFlip}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleFlip() } }}
        className="relative cursor-pointer select-none"
        style={{ perspective: '1000px', minHeight: 220 }}
      >
        <div
          className="relative w-full transition-transform duration-500"
          style={{
            transformStyle: 'preserve-3d',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            minHeight: 220,
          }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 bg-white border-2 border-indigo-100 rounded-3xl flex flex-col items-center justify-center gap-3 p-6 shadow-sm"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <span className="text-3xl font-black text-gray-800">{displayWord}</span>
            {current.ipa && <span className="text-gray-400 text-sm font-mono">{current.ipa}</span>}
            {current.pos && (
              <span className="text-xs bg-blue-50 text-blue-500 font-bold px-2 py-0.5 rounded-full">
                {current.pos}
              </span>
            )}
            <button
              onClick={e => { e.stopPropagation(); speak(displayWord) }}
              className="text-gray-300 hover:text-blue-500 transition-colors text-xl mt-1"
              aria-label="Phát âm"
            >
              🔊
            </button>
            <p className="text-gray-400 text-xs mt-2">Nhấn thẻ để xem nghĩa</p>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 bg-indigo-50 border-2 border-indigo-200 rounded-3xl flex flex-col items-center justify-center gap-3 p-6 shadow-sm"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <span className="text-xl font-black text-indigo-700 text-center">{current.meaning_vi}</span>
            <p className="text-sm text-gray-600 italic text-center leading-relaxed">"{current.example_en}"</p>
            <p className="text-xs text-gray-400 italic text-center">{current.example_vi}</p>
          </div>
        </div>
      </div>

      {/* Know / Don't know buttons — only show after flip */}
      {flipped ? (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleAnswer(false)}
            className="py-3.5 rounded-2xl border-2 border-red-200 bg-red-50 text-red-600 font-black text-sm active:scale-95 transition-all"
          >
            ❌ Chưa nhớ
          </button>
          <button
            onClick={() => handleAnswer(true)}
            className="py-3.5 rounded-2xl border-2 border-green-200 bg-green-50 text-green-700 font-black text-sm active:scale-95 transition-all"
          >
            ✅ Nhớ rồi
          </button>
        </div>
      ) : (
        <p className="text-center text-gray-400 text-xs py-2">
          Nhớ rồi thì nhấn ✅ · Chưa nhớ thì nhấn ❌
        </p>
      )}

      {/* Progress dots */}
      <div className="flex gap-1 justify-center flex-wrap">
        {cards.map((_, i) => (
          <div key={i} className={`w-2 h-2 rounded-full transition-all ${
            i < results.length
              ? results[i] ? 'bg-green-400' : 'bg-red-400'
              : i === idx ? 'bg-purple-500 scale-125' : 'bg-gray-200'
          }`} />
        ))}
      </div>
    </div>
  )
}
