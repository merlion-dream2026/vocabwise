'use client'
import { useState } from 'react'
import type { MCQItem } from './types'
import E3MCQContext from './E3MCQContext'

type GlossaryEntry = { word: string; meaning_vi: string }

type Props = {
  glossary: GlossaryEntry[]
  topicTitle: string
  cefr: string
}

type Status = 'idle' | 'loading' | 'running' | 'done'

export default function PracticeMore({ glossary, topicTitle, cefr }: Props) {
  const [status, setStatus]   = useState<Status>('idle')
  const [items, setItems]     = useState<MCQItem[]>([])
  const [score, setScore]     = useState<number | null>(null)
  const [error, setError]     = useState<string | null>(null)
  const [round, setRound]     = useState(0)

  const generate = async () => {
    setStatus('loading')
    setError(null)
    setScore(null)
    try {
      const res = await fetch('/api/vocabwise/generate-exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ glossary, topicTitle, cefr }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'error')
      if (!d.items?.length) throw new Error('empty')
      setItems(d.items)
      setRound(r => r + 1)
      setStatus('running')
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      setError(msg === 'error' || msg === 'empty' || !msg ? 'Không thể tạo bài tập. Thử lại sau.' : msg)
      setStatus('idle')
    }
  }

  const handleDone = (s: number) => {
    setScore(s)
    setStatus('done')
  }

  if (status === 'idle') {
    return (
      <button
        onClick={generate}
        className="w-full flex items-center justify-center gap-2 bg-white border-2 border-emerald-200 text-emerald-600 font-black py-3 rounded-2xl text-sm active:scale-95 transition-all hover:bg-emerald-50"
      >
        🔄 Luyện tập thêm
        {error && <span className="text-red-400 font-normal text-xs ml-1">{error}</span>}
      </button>
    )
  }

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center gap-2 py-4 text-emerald-600">
        <span className="inline-block w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-bold">Đang tạo bài tập mới...</span>
      </div>
    )
  }

  if (status === 'done') {
    const pct = Math.round(((score ?? 0) / items.length) * 100)
    return (
      <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-4 space-y-3">
        <div className="text-center">
          <p className="text-emerald-700 font-black text-sm">Vòng luyện {round} hoàn thành!</p>
          <p className="text-emerald-600 text-2xl font-black mt-1">
            {score}/{items.length} · {pct}%
          </p>
        </div>
        <button
          onClick={generate}
          className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black py-2.5 rounded-2xl text-sm active:scale-95 transition-all shadow"
        >
          🔄 Vòng tiếp theo →
        </button>
      </div>
    )
  }

  // running
  return (
    <div className="border-2 border-emerald-200 rounded-2xl overflow-hidden">
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2.5">
        <p className="text-white font-black text-sm">🔄 Luyện tập thêm · Vòng {round}</p>
      </div>
      <div className="p-4">
        <E3MCQContext
          instruction="Chọn từ đúng để hoàn thành câu."
          items={items}
          onDone={handleDone}
        />
      </div>
    </div>
  )
}
