'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type TopicMeta = {
  topic_id: string; topic_number: number; topic_title: string
  theme_number: number; theme_title: string; status: string; combo: string
}
type BookInfo = { title: string; cefr: string; color: string; emoji: string }
type AcademicTopicSync = { completed: boolean; mastered: boolean; ex_scores: Record<string, number> }

type Props = {
  book: string
  info: BookInfo
  topics: TopicMeta[]
  byTheme: Record<string, TopicMeta[]>
}

const BOOK_NUM_GRAD: Record<string, string> = {
  book1: 'from-green-400 to-emerald-500',
  book2: 'from-blue-500 to-cyan-500',
  book3: 'from-purple-600 to-violet-600',
}

export default function BookPageClient({ book, info, topics, byTheme }: Props) {
  const router = useRouter()
  const [syncMap, setSyncMap] = useState<Record<string, AcademicTopicSync>>({})
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const cid = sessionStorage.getItem('vw_active_child')
    if (!cid) { setLoaded(true); return }
    fetch(`/api/sync/${cid}?level=academic`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { setSyncMap(d?.mastery ?? {}); setLoaded(true) })
      .catch(() => setLoaded(true))
  }, [])

  const masteredCount  = topics.filter(t => syncMap[t.topic_id]?.mastered).length
  const completedCount = topics.filter(t => syncMap[t.topic_id]?.completed).length
  const numGrad = BOOK_NUM_GRAD[book] ?? 'from-blue-400 to-indigo-500'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className={`bg-gradient-to-r ${info.color} px-4 pt-12 pb-6 text-white`}>
        <button onClick={() => router.back()}
          className="text-white/70 font-bold text-sm flex items-center gap-1 mb-4">
          ← Chọn module
        </button>
        <div className="flex items-center gap-3 mb-3">
          <span className="text-4xl">{info.emoji}</span>
          <div>
            <h1 className="text-2xl font-black">{info.title}</h1>
            <p className="text-white/80 text-sm">{info.cefr} · {topics.length} chủ đề có sẵn</p>
          </div>
        </div>
        {/* Progress summary */}
        {loaded && (completedCount > 0 || masteredCount > 0) && (
          <div className="bg-white/15 rounded-2xl px-4 py-3 flex items-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-black">{masteredCount}</div>
              <div className="text-white/70 text-xs font-bold">🏆 Thành thạo</div>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div className="text-center">
              <div className="text-2xl font-black">{completedCount}</div>
              <div className="text-white/70 text-xs font-bold">✅ Đã làm</div>
            </div>
            <div className="flex-1 ml-2">
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-white/80 rounded-full transition-all duration-500"
                  style={{ width: `${topics.length > 0 ? Math.round(masteredCount / topics.length * 100) : 0}%` }} />
              </div>
              <p className="text-white/60 text-xs mt-1 text-right">
                {topics.length > 0 ? Math.round(masteredCount / topics.length * 100) : 0}%
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-6">
        {topics.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-3">🚧</div>
            <p className="text-gray-400 font-bold">Chưa có chủ đề nào — đang phát triển...</p>
          </div>
        ) : (
          Object.entries(byTheme).map(([themeKey, themeTopics]) => {
            const [, themeTitle] = themeKey.split('|')
            return (
              <div key={themeKey}>
                {/* Theme header */}
                <h2 className="font-black text-gray-500 text-xs uppercase tracking-widest mb-3 px-0.5">
                  📂 {themeTitle}
                </h2>

                {/* 2-column topic grid — mirrors Daily topic page */}
                <div className="grid grid-cols-2 gap-3">
                  {themeTopics.map(t => {
                    const sync       = syncMap[t.topic_id]
                    const isMastered  = !!sync?.mastered
                    const isCompleted = !!sync?.completed

                    const cardCls = isMastered
                      ? 'bg-green-50 border-green-200'
                      : isCompleted
                      ? 'bg-yellow-50 border-yellow-100'
                      : 'bg-white border-gray-100'

                    const numCls = isMastered
                      ? 'bg-green-500 text-white'
                      : isCompleted
                      ? 'bg-yellow-400 text-white'
                      : `bg-gradient-to-br ${numGrad} text-white`

                    return (
                      <Link
                        key={t.topic_id}
                        href={`/vocabwise/${book}/${t.topic_id}`}
                        className={`${cardCls} border-2 rounded-2xl p-3.5 flex flex-col gap-2 shadow-sm active:scale-95 transition-all duration-150`}
                      >
                        {/* Number / trophy badge */}
                        <div className={`w-11 h-11 rounded-xl ${numCls} flex items-center justify-center text-base font-black shadow-sm flex-shrink-0`}>
                          {isMastered ? '🏆' : t.topic_number}
                        </div>

                        {/* Topic title */}
                        <p className="font-black text-gray-800 text-sm leading-snug flex-1">
                          {t.topic_title}
                        </p>

                        {/* Status badge */}
                        {isMastered ? (
                          <span className="text-xs font-black text-green-600">🏆 Xong</span>
                        ) : isCompleted ? (
                          <span className="text-xs font-black text-yellow-600">✅ Đã làm</span>
                        ) : (
                          <span className="text-xs font-semibold text-gray-400">Combo {t.combo}</span>
                        )}
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
