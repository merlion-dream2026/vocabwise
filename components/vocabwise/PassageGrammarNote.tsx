'use client'
import { useState } from 'react'

type Props = {
  textEn: string    // raw text, may include **bold** markdown and watermark chars
  textVi?: string
  showVI: boolean
  cefr: string
}

function renderInline(text: string) {
  return (text ?? '').replace(/\*\*(.+?)\*\*/g, '<strong class="text-blue-700 font-black">$1</strong>')
}

function splitSentences(text: string): string[] {
  const result: string[] = []
  // Split on . ? ! followed by space + uppercase or end-of-string
  const raw = text.split(/(?<=[.?!])\s+(?=[A-Z"'])/g)
  for (let i = 0; i < raw.length; i++) {
    const s = raw[i].trimEnd()
    if (!s) continue
    // Add trailing space for all except last
    result.push(i < raw.length - 1 ? s + ' ' : s)
  }
  return result.length ? result : [text]
}

export default function PassageGrammarNote({ textEn, textVi, showVI, cefr }: Props) {
  const [selected, setSelected] = useState<string | null>(null)
  const [notes, setNotes]       = useState<Record<string, string>>({})
  const [loading, setLoading]   = useState(false)

  const handleClick = async (sentence: string) => {
    const clean = sentence.trim()
    if (selected === clean) {
      setSelected(null)
      return
    }
    setSelected(clean)
    if (notes[clean]) return

    setLoading(true)
    try {
      const res = await fetch('/api/vocabwise/grammar-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sentence: clean, cefr }),
      })
      const d = await res.json()
      if (d.note) setNotes(prev => ({ ...prev, [clean]: d.note }))
    } catch {
      setNotes(prev => ({ ...prev, [clean]: 'Không thể phân tích. Thử lại sau.' }))
    } finally {
      setLoading(false)
    }
  }

  const sentences = splitSentences(textEn)
  const activeNote = selected ? notes[selected] : null

  return (
    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
      <p className="text-gray-800 leading-relaxed text-sm">
        {sentences.map((s, i) => {
          const clean = s.trim()
          const isActive = selected === clean
          return (
            <span
              key={i}
              role="button"
              tabIndex={0}
              onClick={() => handleClick(s)}
              onKeyDown={e => e.key === 'Enter' && handleClick(s)}
              className={`cursor-pointer rounded-sm transition-colors duration-150 hover:bg-amber-100 ${isActive ? 'bg-amber-200' : ''}`}
              dangerouslySetInnerHTML={{ __html: renderInline(s) }}
            />
          )
        })}
      </p>

      {selected && (
        <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-3">
          {loading && !activeNote ? (
            <p className="text-xs text-amber-600 flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
              Đang phân tích ngữ pháp...
            </p>
          ) : activeNote ? (
            <>
              <p className="text-xs font-black text-amber-700 mb-1.5">📖 Phân tích ngữ pháp</p>
              <p className="text-xs text-amber-900 leading-relaxed whitespace-pre-line">{activeNote}</p>
            </>
          ) : null}
        </div>
      )}

      {showVI && textVi && (
        <p
          className="text-gray-500 text-xs leading-relaxed mt-3 pt-3 border-t border-gray-200 italic"
          dangerouslySetInnerHTML={{ __html: renderInline(textVi) }}
        />
      )}
    </div>
  )
}
