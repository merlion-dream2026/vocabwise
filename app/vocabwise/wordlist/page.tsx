'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { speak } from '@/lib/speak'

type SavedWord = {
  id: number
  word: string
  meaning_vi: string
  pos: string
  ipa: string
  example_en: string
  book_id: string
  topic_id: string
  topic_title: string
  saved_at: string
}

const BOOK_LABEL: Record<string, string> = {
  book1: 'Book 1 · A1–A2',
  book2: 'Book 2 · B1–B2',
  book3: 'Book 3 · C1–C2',
}

export default function WordListPage() {
  const [words, setWords] = useState<SavedWord[]>([])
  const [loading, setLoading] = useState(true)
  const [removing, setRemoving] = useState<Set<number>>(new Set())

  useEffect(() => {
    fetch('/api/vocabwise/wordlist')
      .then(r => r.ok ? r.json() : { saved: [] })
      .then(d => setWords(d.saved ?? []))
      .finally(() => setLoading(false))
  }, [])

  async function remove(w: SavedWord) {
    setRemoving(prev => new Set(prev).add(w.id))
    await fetch('/api/vocabwise/wordlist', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word: w.word, topic_id: w.topic_id }),
    })
    setWords(prev => prev.filter(x => x.id !== w.id))
    setRemoving(prev => { const s = new Set(prev); s.delete(w.id); return s })
  }

  // Group by book → topic
  const grouped: Record<string, Record<string, SavedWord[]>> = {}
  for (const w of words) {
    if (!grouped[w.book_id]) grouped[w.book_id] = {}
    if (!grouped[w.book_id][w.topic_id]) grouped[w.book_id][w.topic_id] = []
    grouped[w.book_id][w.topic_id].push(w)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 pt-12 pb-5 text-white">
        <Link href="/vocabwise" className="inline-flex items-center gap-1.5 mb-3 bg-white/20 hover:bg-white/30 text-white font-bold text-sm px-3 py-1.5 rounded-full transition-all active:scale-95">
          ← Academic
        </Link>
        <h1 className="text-xl font-black">📌 Danh sách từ của tôi</h1>
        {!loading && (
          <p className="text-indigo-200 text-sm mt-1">{words.length} từ đã lưu</p>
        )}
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5 pb-nav">
        {loading && (
          <div className="flex items-center justify-center py-16 text-gray-400 text-sm">Đang tải...</div>
        )}

        {!loading && words.length === 0 && (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">📭</div>
            <p className="text-gray-500 font-bold">Chưa có từ nào được lưu</p>
            <p className="text-gray-400 text-sm mt-1">Nhấn ⭐ cạnh từ trong tab Từ vựng để lưu lại</p>
            <Link href="/vocabwise" className="inline-block mt-5 bg-indigo-600 text-white font-black px-5 py-2.5 rounded-2xl active:scale-95 transition-transform text-sm">
              Vào học ngay
            </Link>
          </div>
        )}

        {Object.entries(grouped).map(([bookId, topics]) => (
          <div key={bookId} className="mb-6">
            <h2 className="text-xs font-black text-indigo-500 uppercase tracking-wider mb-3">
              {BOOK_LABEL[bookId] ?? bookId}
            </h2>
            {Object.entries(topics).map(([topicId, topicWords]) => (
              <div key={topicId} className="mb-4">
                <Link
                  href={`/vocabwise/${bookId}/${topicId}`}
                  className="text-xs font-black text-gray-400 hover:text-indigo-500 transition-colors mb-2 block"
                >
                  📄 {topicWords[0].topic_title} →
                </Link>
                <div className="space-y-2">
                  {topicWords.map(w => (
                    <div key={w.id} className="bg-white border-2 border-gray-100 rounded-2xl px-4 py-3 flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className="font-black text-gray-800 text-sm">{w.word}</span>
                          {w.ipa && <span className="text-gray-400 text-xs">{w.ipa}</span>}
                          {w.pos && <span className="text-gray-400 text-xs italic">{w.pos}</span>}
                          <button onClick={() => speak(w.word)} className="text-gray-300 hover:text-blue-500 transition-colors">🔊</button>
                        </div>
                        <p className="text-blue-700 font-bold text-xs mt-0.5">{w.meaning_vi}</p>
                        {w.example_en && (
                          <p className="text-gray-500 text-xs italic mt-1">{w.example_en}</p>
                        )}
                      </div>
                      <button
                        onClick={() => remove(w)}
                        disabled={removing.has(w.id)}
                        className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0 disabled:opacity-40 p-1 -mr-1 mt-0.5"
                        aria-label="Xóa khỏi danh sách"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
