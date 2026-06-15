'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import UpgradeModal from '@/components/UpgradeModal'
import UpgradeBanner from '@/components/UpgradeBanner'
import CertificateModal from '@/components/vocabwise/CertificateModal'

type Session = { plan: string; username: string; bonus_pro_expires_at?: string | null; plan_end_date?: string | null; free_trial_expires_at?: string | null }
type AcademicTopicSync = { completed: boolean; mastered: boolean; ex_scores: Record<string, number>; read?: boolean }
type SrsEntry = { due: string; interval: number }

type BookInfo = { title: string; cefr: string; color: string; emoji: string }
type TopicMeta = {
  topic_id: string; topic_number: number; topic_title: string; topic_title_vi?: string
  theme_number: number; theme_title: string; theme_title_vi?: string
  emoji?: string; status: string; combo: string; word_count?: number
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
const BOOK_CARD_DONE: Record<string, string> = {
  book1: 'bg-emerald-50 border-emerald-300',
  book2: 'bg-blue-50 border-blue-300',
  book3: 'bg-purple-50 border-purple-300',
}

export default function BookPageClient({ book, info, topics, byTheme }: Props) {
  const router = useRouter()
  const [session, setSession]   = useState<Session | null>(null)
  const [syncMap, setSyncMap]   = useState<Record<string, AcademicTopicSync>>({})
  const [srsMap, setSrsMap]     = useState<Record<string, SrsEntry>>({})
  const [loaded, setLoaded]     = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [showOverviewDetail, setShowOverviewDetail] = useState(false)
  const [showProgressGuide, setShowProgressGuide] = useState(false)
  const [showCert, setShowCert] = useState(false)

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

  const masteredCount     = topics.filter(t => syncMap[t.topic_id]?.mastered).length
  const completedCount    = topics.filter(t => syncMap[t.topic_id]?.completed).length
  const needsImprovementCount = completedCount - masteredCount
  const needsReviewCount  = needsImprovementCount
  const pct = topics.length > 0 ? Math.round((masteredCount / topics.length) * 100) : 0
  const totalWords = topics.reduce((s, t) => s + (t.word_count ?? 15), 0)

  const today = new Date().toISOString().split('T')[0]
  const srsDueCount = Object.values(srsMap).filter(e => e.due <= today).length

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {showUpgrade && (
        <UpgradeModal onClose={() => setShowUpgrade(false)} username={session?.username ?? ''} />
      )}
      {showCert && (
        <CertificateModal
          book={book}
          bookTitle={info.title}
          cefr={info.cefr}
          emoji={info.emoji}
          color={info.color}
          mastered={masteredCount}
          total={topics.length}
          onClose={() => setShowCert(false)}
        />
      )}
      <UpgradeBanner
        plan={session?.plan ?? 'free'}
        freeTrialExpiresAt={session?.free_trial_expires_at}
        planEndDate={session?.plan_end_date}
        username={session?.username}
      />

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

      <div className="max-w-2xl mx-auto px-4 pt-3 pb-24 space-y-3">

        {/* Module overview card */}
        <button onClick={() => setShowOverviewDetail(v => !v)}
          className="w-full bg-white rounded-2xl border-2 border-gray-100 shadow-sm px-4 py-3 text-left active:scale-[0.99] transition-transform">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={`text-xs font-black px-2 py-0.5 rounded-full bg-gradient-to-r ${numGrad} text-white`}>{info.cefr}</span>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span><strong className="text-gray-800">{Object.keys(byTheme).length}</strong> themes</span>
                <span className="text-gray-200">·</span>
                <span><strong className="text-gray-800">{topics.length}</strong> topics</span>
                <span className="text-gray-200">·</span>
                <span><strong className="text-gray-800">{totalWords.toLocaleString()}</strong> từ</span>
              </div>
            </div>
            <span className={`text-gray-300 text-sm transition-transform duration-200 ${showOverviewDetail ? 'rotate-180' : ''}`}>▾</span>
          </div>

          {showOverviewDetail && (
            <div className="mt-3 pt-3 border-t border-gray-100 divide-y divide-gray-50 -mx-1">
              {Object.entries(byTheme).map(([themeKey, themeTopics]) => {
                const [themeNum, themeTitle] = themeKey.split('|')
                const themeViTitle = themeTopics[0]?.theme_title_vi
                const themeWords = themeTopics.reduce((s, t) => s + (t.word_count ?? 15), 0)
                return (
                  <div key={themeKey} className="flex items-center justify-between px-1 py-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-5 h-5 rounded-full bg-gradient-to-br ${numGrad} flex items-center justify-center text-[10px] font-black text-white flex-shrink-0`}>{themeNum}</span>
                      <span className="text-gray-700 text-sm font-medium truncate">{themeViTitle ?? themeTitle}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-400 flex-shrink-0 ml-2">
                      <span className="font-semibold text-gray-600">{themeTopics.length}</span>
                      <span>topics</span>
                      <span className="text-gray-200 mx-1">·</span>
                      <span className="font-semibold text-gray-600">{themeWords}</span>
                      <span>từ</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </button>

        {/* Progress summary card */}
        <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-gray-400 uppercase tracking-wider">Tiến độ module</span>
              <button onClick={() => setShowProgressGuide(true)}
                className="w-4 h-4 rounded-full bg-gray-100 text-gray-400 text-[10px] font-bold flex items-center justify-center hover:bg-blue-100 hover:text-blue-500 transition-colors">
                ?
              </button>
            </div>
            <span className="text-xs font-bold text-gray-500">{pct}% hoàn thành</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden flex mb-3">
            {masteredCount > 0 && (
              <div className={`h-full bg-gradient-to-r ${numGrad} transition-all duration-500`}
                style={{ width: `${(masteredCount / topics.length) * 100}%` }} />
            )}
            {needsImprovementCount > 0 && (
              <div className="h-full bg-amber-300 transition-all duration-500"
                style={{ width: `${(needsImprovementCount / topics.length) * 100}%` }} />
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
            <span>🏆 <strong className="text-gray-700">{masteredCount}</strong> thành thạo</span>
            <span className="text-gray-200">·</span>
            <span>⚠️ <strong className="text-gray-700">{needsImprovementCount}</strong> cần cải thiện</span>
            <span className="text-gray-200">·</span>
            <span>📘 <strong className="text-gray-700">{topics.length - completedCount}</strong> chưa học</span>
          </div>
          {masteredCount > 0 && (
            <button
              onClick={() => setShowCert(true)}
              className="mt-2 w-full flex items-center justify-center gap-1.5 text-xs font-black text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded-xl py-2 active:scale-[0.98] transition-all"
            >
              🎓 Xem chứng chỉ học tập
            </button>
          )}
        </div>

        {/* Progress guide modal */}
        {showProgressGuide && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center p-4"
            onClick={() => setShowProgressGuide(false)}>
            <div className="bg-white rounded-2xl w-full max-w-sm p-5 space-y-4" onClick={e => e.stopPropagation()}>
              <p className="font-black text-gray-800 text-base">Các mức độ tiến độ</p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-xl mt-0.5">🏆</span>
                  <div>
                    <p className="font-bold text-gray-800 text-sm">Thành thạo</p>
                    <p className="text-xs text-gray-500">Đã làm bài tập và đạt ≥ 80% (20/25 điểm)</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-xl mt-0.5">⚠️</span>
                  <div>
                    <p className="font-bold text-gray-800 text-sm">Cần cải thiện</p>
                    <p className="text-xs text-gray-500">Đã làm bài tập nhưng chưa đạt 80% — làm lại để nâng điểm</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-xl mt-0.5">📘</span>
                  <div>
                    <p className="font-bold text-gray-800 text-sm">Chưa học</p>
                    <p className="text-xs text-gray-500">Chưa làm bài tập lần nào</p>
                  </div>
                </div>
              </div>
              <button onClick={() => setShowProgressGuide(false)}
                className={`w-full bg-gradient-to-r ${numGrad} text-white font-black py-3 rounded-2xl active:scale-95 transition-transform`}>
                Đã hiểu
              </button>
            </div>
          </div>
        )}

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

                      const doneCls  = BOOK_CARD_DONE[book] ?? 'bg-green-50 border-green-300'
                      const cardCls  = locked
                        ? 'bg-white border-transparent'
                        : isMastered  ? doneCls
                        : needsWork   ? 'bg-amber-50 border-amber-300'
                        : 'bg-white border-transparent'

                      if (locked) {
                        return (
                          <button key={t.topic_id} onClick={() => setShowUpgrade(true)}
                            className={`${cardCls} border-2 rounded-2xl p-4 text-left shadow-sm relative opacity-60`}>
                            <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/60">
                              <span className="text-2xl">🔒</span>
                            </div>
                            <div className="flex items-center gap-2.5 mb-2">
                              <span className="text-3xl flex-shrink-0">{t.emoji ?? '📚'}</span>
                              <div className="min-w-0">
                                <p className="font-semibold text-gray-800 text-sm leading-snug">{t.topic_title_vi ?? t.topic_title}</p>
                                <p className="text-xs text-gray-400 mt-0.5">{t.word_count ?? 15} từ</p>
                              </div>
                            </div>
                          </button>
                        )
                      }

                      return (
                        <Link key={t.topic_id} href={`/vocabwise/${book}/${t.topic_id}`}
                          className={`${cardCls} border-2 rounded-2xl p-4 text-left block shadow-sm active:scale-95 transition-all duration-150`}>
                          <div className="flex items-center gap-2.5 mb-2">
                            <span className="text-3xl flex-shrink-0">{isMastered ? '🏆' : (t.emoji ?? '📚')}</span>
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-800 text-sm leading-snug">{t.topic_title_vi ?? t.topic_title}</p>
                              <p className="text-xs text-gray-400 mt-0.5">{t.word_count ?? 15} từ</p>
                            </div>
                          </div>
                          {(isMastered || needsWork) && (
                            <div className="mt-2 space-y-1.5">
                              {isMastered && (
                                <span className="inline-block text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full font-medium">🏆 Xong</span>
                              )}
                              {needsWork && (
                                <span className="inline-block text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-medium">⚠️ Ôn thêm</span>
                              )}
                            </div>
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
                  <span className="text-2xl flex-shrink-0 w-9 text-center">
                    {isMastered ? '🏆' : (t.emoji ?? '📚')}
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
