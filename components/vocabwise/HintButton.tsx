'use client'
import { useState } from 'react'

type Props = {
  exerciseType: string
  question: string
  options?: string[]
  baseWord?: string
}

export default function HintButton({ exerciseType, question, options, baseWord }: Props) {
  const [loading, setLoading] = useState(false)
  const [hint, setHint]       = useState<string | null>(null)

  const fetchHint = async () => {
    if (hint || loading) return
    setLoading(true)
    try {
      const res = await fetch('/api/vocabwise/hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exerciseType, question, options, baseWord }),
      })
      const d = await res.json()
      setHint(d.hint ?? d.error ?? 'Không có gợi ý.')
    } catch {
      setHint('Không thể tải gợi ý. Thử lại sau.')
    } finally {
      setLoading(false)
    }
  }

  if (hint) {
    return (
      <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 text-sm text-amber-800">
        <span className="flex-shrink-0 mt-0.5">💡</span>
        <p className="leading-snug">{hint}</p>
      </div>
    )
  }

  return (
    <button
      onClick={fetchHint}
      disabled={loading}
      className="flex items-center gap-1.5 text-xs text-amber-600 hover:text-amber-700 font-bold py-1 px-2.5 rounded-lg hover:bg-amber-50 border border-transparent hover:border-amber-200 transition-all disabled:opacity-50 self-start"
    >
      {loading
        ? <span className="inline-block w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
        : <span>💡</span>}
      {loading ? 'Đang tải...' : 'Gợi ý'}
    </button>
  )
}
