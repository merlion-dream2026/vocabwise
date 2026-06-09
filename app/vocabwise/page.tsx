'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type AcademicTopicSync = { completed: boolean; mastered: boolean }

const BOOKS = [
  {
    id: 1, slug: 'book1', title: 'VocabWise Starter',
    cefr: 'A1–A2', maxTopics: 60, color: 'from-green-400 to-emerald-500',
    badge: 'bg-green-100 text-green-700', bar: 'bg-green-500', emoji: '🌱',
    themes: ['Daily Life', 'People & Society', 'Nature & Science', 'Work & Learning', 'Culture & Lifestyle', 'Global Topics'],
  },
  {
    id: 2, slug: 'book2', title: 'VocabWise Progress',
    cefr: 'B1–B2', maxTopics: 60, color: 'from-blue-500 to-cyan-500',
    badge: 'bg-blue-100 text-blue-700', bar: 'bg-blue-500', emoji: '🚀',
    themes: ['Academic Life', 'Science & Technology', 'Society & Culture', 'Economy & Business', 'Health & Medicine', 'Global Issues'],
  },
  {
    id: 3, slug: 'book3', title: 'VocabWise Mastery',
    cefr: 'C1–C2', maxTopics: 30, color: 'from-purple-600 to-violet-600',
    badge: 'bg-purple-100 text-purple-700', bar: 'bg-purple-500', emoji: '🎓',
    themes: ['Advanced Academic', 'Critical & Analytical', 'Leadership & Ethics'],
  },
]

function topicPrefix(slug: string) {
  return slug === 'book1' ? 'b1-' : slug === 'book2' ? 'b2-' : 'b3-'
}

export default function VocabWisePage() {
  const router = useRouter()
  const [syncMap, setSyncMap] = useState<Record<string, AcademicTopicSync>>({})

  useEffect(() => {
    const cid = sessionStorage.getItem('vw_active_child')
    if (!cid) return
    fetch(`/api/sync/${cid}?level=academic`)
      .then(r => r.ok ? r.json() : null)
      .then(d => setSyncMap(d?.mastery ?? {}))
      .catch(() => {})
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 pt-12 pb-6 text-white">
        <button onClick={() => router.back()} className="text-blue-200 font-bold text-sm flex items-center gap-1 mb-4">← Chọn module</button>
        <div className="flex items-center gap-3 mb-1">
          <span className="text-3xl">🎓</span>
          <div>
            <h1 className="text-2xl font-black">VocabWise Academic</h1>
            <p className="text-blue-200 text-sm">Từ vựng học thuật · A1 → C2 · IELTS / SAT</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <p className="text-gray-500 text-sm text-center">Chọn cấp độ phù hợp với bạn</p>

        {BOOKS.map(book => {
          const prefix = topicPrefix(book.slug)
          const allSynced = Object.entries(syncMap).filter(([tid]) => tid.startsWith(prefix))
          const mastered = allSynced.filter(([, s]) => s.mastered).length
          const completed = allSynced.filter(([, s]) => s.completed).length
          const pct = book.maxTopics > 0 ? Math.round((mastered / book.maxTopics) * 100) : 0
          const hasProgress = completed > 0 || mastered > 0

          return (
            <Link key={book.id} href={`/vocabwise/${book.slug}`}
              className="block bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md active:scale-[0.99] transition-all">
              <div className={`bg-gradient-to-r ${book.color} px-5 py-4 flex items-center gap-4`}>
                <span className="text-4xl">{book.emoji}</span>
                <div className="flex-1 text-white">
                  <h2 className="font-black text-lg leading-tight">{book.title}</h2>
                  <p className="text-white/80 text-sm">{book.cefr} · {book.maxTopics} chủ đề</p>
                </div>
                <span className="text-white/70 font-black text-xl">›</span>
              </div>
              <div className="px-5 py-3">
                {hasProgress ? (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex gap-3">
                        <span className="text-xs font-bold text-green-600">🏆 {mastered} thành thạo</span>
                        {completed > mastered && (
                          <span className="text-xs font-bold text-yellow-600">✅ {completed} đã làm</span>
                        )}
                      </div>
                      <span className="text-xs font-black text-gray-400">{pct}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full ${book.bar} rounded-full transition-all duration-500`}
                        style={{ width: `${Math.max(pct, mastered > 0 ? 2 : 0)}%` }} />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {book.themes.map(t => (
                      <span key={t} className={`text-xs font-bold px-2.5 py-1 rounded-full ${book.badge}`}>{t}</span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          )
        })}

        <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 mt-4">
          <p className="text-xs text-amber-700 font-bold text-center">
            🚧 VocabWise Academic đang được phát triển — Book 1 T01 đã sẵn sàng để thử nghiệm
          </p>
        </div>
      </div>
    </div>
  )
}
