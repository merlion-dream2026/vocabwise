'use client'
import { useState, useEffect } from 'react'
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

function TopicStatusBadge({ sync }: { sync: AcademicTopicSync | undefined }) {
  if (!sync?.completed) return null
  const total = Object.values(sync.ex_scores).reduce((s, v) => s + v, 0)
  if (sync.mastered) {
    return (
      <span className="text-xs font-black bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0">
        🏆 {total}/25
      </span>
    )
  }
  return (
    <span className="text-xs font-black bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0">
      ✅ {total}/25
    </span>
  )
}

export default function BookPageClient({ book, info, topics, byTheme }: Props) {
  const [syncMap, setSyncMap] = useState<Record<string, AcademicTopicSync>>({})
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const cid = sessionStorage.getItem('vw_active_child')
    if (!cid) { setLoaded(true); return }
    fetch(`/api/sync/${cid}?level=academic`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        setSyncMap(d?.mastery ?? {})
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [])

  const masteredCount = topics.filter(t => syncMap[t.topic_id]?.mastered).length
  const completedCount = topics.filter(t => syncMap[t.topic_id]?.completed).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className={`bg-gradient-to-r ${info.color} px-4 pt-12 pb-6 text-white`}>
        <Link href="/vocabwise" className="text-white/70 font-bold text-sm flex items-center gap-1 mb-4">← Chọn sách</Link>
        <div className="flex items-center gap-3">
          <span className="text-4xl">{info.emoji}</span>
          <div>
            <h1 className="text-2xl font-black">{info.title}</h1>
            <p className="text-white/80 text-sm">{info.cefr} · {topics.length} chủ đề có sẵn</p>
          </div>
        </div>
        {/* Progress summary */}
        {loaded && (completedCount > 0 || masteredCount > 0) && (
          <div className="mt-4 bg-white/10 rounded-2xl px-4 py-3 flex items-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-black text-white">{masteredCount}</div>
              <div className="text-white/70 text-xs font-bold">🏆 Thành thạo</div>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div className="text-center">
              <div className="text-2xl font-black text-white">{completedCount}</div>
              <div className="text-white/70 text-xs font-bold">✅ Đã làm</div>
            </div>
            <div className="flex-1 ml-2">
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-white/80 rounded-full transition-all duration-500"
                  style={{ width: `${topics.length > 0 ? Math.round((masteredCount / topics.length) * 100) : 0}%` }} />
              </div>
              <p className="text-white/60 text-xs mt-1 text-right">
                {topics.length > 0 ? Math.round((masteredCount / topics.length) * 100) : 0}% thành thạo
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {topics.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 font-bold">Chưa có chủ đề nào — đang phát triển...</p>
          </div>
        ) : (
          Object.entries(byTheme).map(([themeKey, themeTopics]) => {
            const [, themeTitle] = themeKey.split('|')
            return (
              <div key={themeKey}>
                <h2 className="font-black text-gray-600 text-sm uppercase tracking-wide mb-3 px-1">
                  {themeTitle}
                </h2>
                <div className="space-y-2">
                  {themeTopics.map(t => {
                    const sync = syncMap[t.topic_id]
                    const numBg = sync?.mastered
                      ? 'bg-green-100 text-green-600 ring-1 ring-green-300'
                      : sync?.completed
                      ? 'bg-yellow-100 text-yellow-600'
                      : 'bg-blue-50 text-blue-500'
                    return (
                      <Link key={t.topic_id} href={`/vocabwise/${book}/${t.topic_id}`}
                        className="flex items-center gap-4 bg-white rounded-2xl px-4 py-3.5 border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 active:scale-[0.99] transition-all">
                        <span className={`w-8 h-8 rounded-xl font-black text-sm flex items-center justify-center flex-shrink-0 transition-colors ${numBg}`}>
                          {t.topic_number}
                        </span>
                        <div className="flex-1">
                          <p className="font-black text-gray-800 text-sm">{t.topic_title}</p>
                          <p className="text-gray-400 text-xs">Combo {t.combo}</p>
                        </div>
                        <TopicStatusBadge sync={sync} />
                        <span className="text-gray-300 font-bold">›</span>
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
