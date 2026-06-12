'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import UpgradeModal from '@/components/UpgradeModal'

type Session = { plan: string; username: string; bonus_pro_expires_at?: string | null; plan_end_date?: string | null; free_trial_expires_at?: string | null }
type AcademicTopicSync = { completed: boolean; mastered: boolean; ex_scores: Record<string, number>; read?: boolean }
type SrsEntry = { due: string; interval: number }

type BookInfo = { title: string; cefr: string; color: string; emoji: string }
type TopicMeta = {
  topic_id: string; topic_number: number; topic_title: string; topic_title_vi?: string
  theme_number: number; theme_title: string; theme_title_vi?: string
  emoji?: string; status: string; combo: string
}
type Props = { book: string; info: BookInfo; topics: TopicMeta[]; byTheme: Record<string, TopicMeta[]> }

const FREE_TOPIC_LIMIT = 1

const FLAT_COLOR: Record<string, string> = {
  book1: 'bg-emerald-500',
  book2: 'bg-blue-500',
  book3: 'bg-violet-600',
}
const NUM_GRAD: Record<string, string> = {
  book1: 'from-green-400 to-emerald-500',
  book2: 'from-blue-500 to-cyan-500',
  book3: 'from-purple-600 to-violet-600',
}

export default function BookPageClient({ book, info, topics, byTheme }: Props) {
  const router = useRouter()
  const [session, setSession]   = useState<Session | null>(null)
  const [syncMap, setSyncMap]   = useState<Record<string, AcademicTopicSync>>({})
  const [srsMap, setSrsMap]     = useState<Record<string, SrsEntry>>({})
  const [loaded, setLoaded]     = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showUpgrade, setShowUpgrade] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('academicViewMode') as 'grid' | 'list' | null
    if (saved) setViewMode(saved)
  }, [])

  function toggleView() {
    setViewMode(v => {
      const next = v === 'grid' ? 'list' : 'grid'
      localStorage.setItem('academicViewMode', next)
      return next
    })
  }

  useEffect(() => {
    const cid = localStorage.getItem('vw_active_child')
    Promise.all([
      fetch('/api/auth/me').then(r => r.ok ? r.json() : null),
      cid
        ? fetch(`/api/sync/${cid}?level=academic`).then(r => r.ok ? r.json() : null)
        : Promise.resolve(null),
    ]).then(([sess, syncData]) => {
      setSession(sess)
      setSyncMap(syncData?.mastery ?? {})
      setSrsMap(syncData?.srs ?? {})
      setLoaded(true)
    }).catch(() => setLoaded(true))
  }, [])

  // ─── Skeleton ───────────────────────────────────────────────────────────────
  if (!loaded) {
    const flatCls = FLAT_COLOR[book] ?? 'bg-blue-500'
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 animate-pulse">
        <div className={`${flatCls} px-4 py-4 flex items-center gap-3`}>
          <div className="w-6 h-6 rounded bg-white/30" />
          <div className="w-8 h-8 rounded-xl bg-white/30" />
          <div className="space-y-1.5">
            <div className="h-4 w-32 bg-white/30 rounded-full" />
            <div className="h-3 w-20 bg-white/20 rounded-full" />
          </div>
        </div>
        <div className="max-w-2xl mx-auto px-4 pt-4 space-y-3">
          <div className="h-24 bg-white/60 rounded-2xl" />
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-24 bg-white/60 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ─── Derived state ──────────────────────────────────────────────────────────
  const isPaid = !session || session.plan !== 'free' ||
    (!!session.bonus_pro_expires_at && new Date(session.bonus_pro_expires_at) > new Date())

  const flatCls  = FLAT_COLOR[book] ?? 'bg-blue-500'
  const numGrad  = NUM_GRAD[book]   ?? 'from-blue-400 to-indigo-500'

  const masteredCount  = topics.filter(t => syncMap[t.topic_id]?.mastered).length
  const completedCount = topics.filter(t => syncMap[t.topic_id]?.completed).length
  const needsReviewCount = topics.filter(t => syncMap[t.topic_id]?.completed && !syncMap[t.topic_id]?.mastered).length
  const pct = topics.length > 0 ? Math.round((masteredCount / topics.length) * 100) : 0

  const today = new Date().toISOString().split('T')[0]
  const srsDueCount = Object.values(srsMap).filter(e => e.due <= today).length

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {showUpgrade && (
        <UpgradeModal onClose={() => setShowUpgrade(false)} username={session?.username ?? ''} />
      )}

      {/* Compact flat header — mirrors Daily */}
      <div className={`${flatCls} text-white`}>
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => router.back()} className="text-white/70 hover:text-white text-xl flex-shrink-0">←</button>
          <span className="text-2xl flex-shrink-0">{info.emoji}</span>
          <div className="min-w-0">
            <h1 className="font-bold text-lg leading-tight">{info.title}</h1>
            <p className="text-white/70 text-xs">{info.cefr} · {topics.length} chủ đề</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-3 space-y-3">

        {/* Progress summary card */}
        <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-sm p-4">
          <div className="flex items-center gap-4 mb-3">
            <div className="text-center flex-1">
              <div className="text-xl font-black text-gray-800">{masteredCount}</div>
              <div className="text-xs text-gray-400 font-bold mt-0.5">🏆 Thành thạo</div>
            </div>
            <div className="w-px h-10 bg-gray-100" />
            <div className="text-center flex-1">
              <div className="text-xl font-black text-gray-800">{completedCount}</div>
              <div className="text-xs text-gray-400 font-bold mt-0.5">✅ Đã làm</div>
            </div>
            <div className="w-px h-10 bg-gray-100" />
            <div className="text-center flex-1">
              <div className="text-xl font-black text-gray-800">{topics.length - completedCount}</div>
              <div className="text-xs text-gray-400 font-bold mt-0.5">📘 Chưa học</div>
            </div>
            <div className="w-px h-10 bg-gray-100" />
            <div className="text-center flex-shrink-0">
              <div className="text-xl font-black text-gray-300">{pct}%</div>
              <div className="text-xs text-gray-400 font-bold mt-0.5">Tiến độ</div>
            </div>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full bg-gradient-to-r ${numGrad} rounded-full transition-all duration-500`}
              style={{ width: `${Math.max(pct, masteredCount > 0 ? 2 : 0)}%` }} />
          </div>
        </div>

        {/* SRS due banner — Group 2: populated once TopicViewer writes SRS data */}
        {srsDueCount > 0 && (
          <div className="bg-teal-50 border-2 border-teal-200 rounded-2xl px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">📅</span>
              <div>
                <p className="text-sm font-black text-teal-700">Ôn lại hôm nay</p>
                <p className="text-xs text-teal-500">{srsDueCount} chủ đề cần ôn theo lịch</p>
              </div>
            </div>
            <span className="text-teal-400 font-black text-sm">{srsDueCount} chủ đề</span>
          </div>
        )}

        {/* Needs-review banner */}
        {needsReviewCount > 0 && (
          <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">⚠️</span>
              <div>
                <p className="text-sm font-black text-orange-700">Cần cải thiện</p>
                <p className="text-xs text-orange-500">{needsReviewCount} chủ đề chưa thành thạo</p>
              </div>
            </div>
            <span className="text-orange-400 font-black text-sm">Ôn thêm</span>
          </div>
        )}

        {/* Free plan banner */}
        {!isPaid && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-center justify-between">
            <p className="text-sm text-amber-700">
              🔒 Gói Free: <strong>1/{topics.length}</strong> chủ đề miễn phí
            </p>
            <button onClick={() => setShowUpgrade(true)}
              className="text-xs bg-amber-500 text-white px-3 py-1.5 rounded-full font-medium active:scale-95 transition-transform">
              Nâng cấp
            </button>
          </div>
        )}

        {/* Section header + toggle */}
        <div className="flex items-center justify-between pt-1">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            📚 TOPICS ({topics.length})
          </p>
          <button onClick={toggleView}
            className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-bold text-gray-500 shadow-sm active:scale-95 transition-transform">
            {viewMode === 'grid' ? <><span>☰</span> List</> : <><span>⊞</span> Grid</>}
          </button>
        </div>

        {/* Empty state */}
        {topics.length === 0 && (
          <div className="text-center py-12 pb-5">
            <div className="text-5xl mb-3">🚧</div>
            <p className="text-gray-400 font-bold">Chưa có chủ đề nào — đang phát triển...</p>
          </div>
        )}

        {/* Grid view */}
        {topics.length > 0 && viewMode === 'grid' && (
          <div className="space-y-6 pb-5">
            {Object.entries(byTheme).map(([themeKey, themeTopics]) => {
              const [, themeTitle] = themeKey.split('|')
              const themeViTitle = themeTopics[0]?.theme_title_vi
              return (
                <div key={themeKey}>
                  <h2 className="font-black text-gray-500 text-xs uppercase tracking-widest mb-3">
                    📂 {themeViTitle ?? themeTitle}
                  </h2>
                  <div className="grid grid-cols-2 gap-3">
                    {themeTopics.map(t => {
                      const globalIdx  = topics.findIndex(x => x.topic_id === t.topic_id)
                      const locked     = !isPaid && globalIdx >= FREE_TOPIC_LIMIT
                      const sync       = syncMap[t.topic_id]
                      const isMastered = !!sync?.mastered
                      const needsWork  = !!sync?.completed && !isMastered

                      const cardCls = locked
                        ? 'bg-white opacity-60 border-gray-100'
                        : isMastered ? 'bg-green-50 border-green-200'
                        : needsWork  ? 'bg-orange-50 border-orange-200'
                        : sync?.completed ? 'bg-yellow-50 border-yellow-100'
                        : 'bg-white border-gray-100'

                      const numCls = isMastered ? 'bg-green-500 text-white'
                        : needsWork             ? 'bg-orange-400 text-white'
                        : sync?.completed       ? 'bg-yellow-400 text-white'
                        : `bg-gradient-to-br ${numGrad} text-white`

                      if (locked) {
                        return (
                          <button key={t.topic_id} onClick={() => setShowUpgrade(true)}
                            className={`${cardCls} border-2 rounded-2xl p-3.5 flex flex-col gap-2 shadow-sm relative`}>
                            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${numGrad} flex items-center justify-center text-base font-black shadow-sm opacity-30`}>
                              {t.emoji ?? t.topic_number}
                            </div>
                            <p className="font-black text-gray-400 text-sm leading-snug">{t.topic_title_vi ?? t.topic_title}</p>
                            <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/50">
                              <span className="text-2xl">🔒</span>
                            </div>
                          </button>
                        )
                      }

                      return (
                        <Link key={t.topic_id} href={`/vocabwise/${book}/${t.topic_id}`}
                          className={`${cardCls} border-2 rounded-2xl p-3.5 flex flex-col gap-2 shadow-sm active:scale-95 transition-all duration-150`}>
                          <div className={`w-11 h-11 rounded-xl ${numCls} flex items-center justify-center text-base font-black shadow-sm flex-shrink-0`}>
                            {isMastered ? '🏆' : (t.emoji ?? t.topic_number)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-black text-gray-800 text-sm leading-snug">{t.topic_title_vi ?? t.topic_title}</p>
                            {t.topic_title_vi && <p className="text-xs text-gray-400 leading-tight mt-0.5">{t.topic_title}</p>}
                          </div>
                          {isMastered ? (
                            <span className="text-xs font-black text-green-600">🏆 Xong</span>
                          ) : needsWork ? (
                            <span className="text-xs font-black text-orange-600">⚠️ Ôn thêm</span>
                          ) : sync?.completed ? (
                            <span className="text-xs font-black text-yellow-600">✅ Đã làm</span>
                          ) : (
                            <span className="text-xs font-semibold text-gray-400">Bài {t.topic_number}</span>
                          )}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* List view */}
        {topics.length > 0 && viewMode === 'list' && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-100 mb-5">
            {topics.map((t, globalIdx) => {
              const locked     = !isPaid && globalIdx >= FREE_TOPIC_LIMIT
              const sync       = syncMap[t.topic_id]
              const isMastered = !!sync?.mastered
              const needsWork  = !!sync?.completed && !isMastered

              return (
                <button key={t.topic_id}
                  onClick={() => {
                    if (locked) { setShowUpgrade(true); return }
                    router.push(`/vocabwise/${book}/${t.topic_id}`)
                  }}
                  className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${
                    locked ? 'opacity-50' : 'hover:bg-gray-50 active:bg-gray-100'
                  }`}>
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black flex-shrink-0 ${
                    isMastered   ? 'bg-green-100 text-green-600'
                    : needsWork  ? 'bg-orange-100 text-orange-500'
                    : sync?.completed ? 'bg-yellow-100 text-yellow-600'
                    : 'bg-gray-100 text-gray-500'
                  }`}>
                    {isMastered ? '🏆' : (t.emoji ?? t.topic_number)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-800 text-sm truncate">{t.topic_title_vi ?? t.topic_title}</p>
                      {locked && <span className="text-sm flex-shrink-0">🔒</span>}
                      {!locked && isMastered && (
                        <span className="text-xs bg-green-100 text-green-600 px-1.5 py-0.5 rounded-full font-medium flex-shrink-0">🏆 Xong</span>
                      )}
                      {!locked && needsWork && (
                        <span className="text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full font-medium flex-shrink-0">⚠️ Ôn</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{t.topic_title_vi ? t.topic_title : (t.theme_title_vi ?? t.theme_title)}</p>
                  </div>
                  <span className="text-gray-300 text-sm flex-shrink-0">›</span>
                </button>
              )
            })}
          </div>
        )}

      </div>
    </div>
  )
}
