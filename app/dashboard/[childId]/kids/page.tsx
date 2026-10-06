'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { DAILY_WORD_COUNTS } from '@/lib/childProgress'
import { cachedFetch } from '@/lib/cachedFetch'
import { isTopicMastered, type MasteryEntry } from '@/lib/topicMastery'
import { PRESS } from '@/components/TopicHub'

const LEVEL_ORDER = ['seeker', 'starter', 'ranger', 'explorer', 'scholar', 'master'] as const
type LevelKey = typeof LEVEL_ORDER[number]

const LEVEL_CONFIG: Record<LevelKey, {
  label: string; cefr: string; emoji: string;
  gradient: string; bg: string; border: string; edge: string; text: string; btn: string; bar: string;
}> = {
  seeker:   { label: 'Seeker',   cefr: 'Pre-A1', emoji: '🌱', gradient: 'from-violet-400 to-purple-500', bg: 'bg-gradient-to-br from-violet-50 to-purple-50',  border: 'border-violet-200', edge: 'border-b-violet-400', text: 'text-violet-700', btn: 'bg-violet-500',  bar: 'from-violet-400 to-purple-400'  },
  starter:  { label: 'Starter',  cefr: 'A1',     emoji: '⭐', gradient: 'from-pink-400 to-rose-400',     bg: 'bg-gradient-to-br from-pink-50 to-rose-50',      border: 'border-pink-200', edge: 'border-b-pink-400',   text: 'text-pink-700',   btn: 'bg-pink-500',    bar: 'from-pink-400 to-rose-400'      },
  ranger:   { label: 'Ranger',   cefr: 'A2',     emoji: '🏕️', gradient: 'from-emerald-400 to-teal-500', bg: 'bg-gradient-to-br from-emerald-50 to-teal-50',   border: 'border-emerald-200', edge: 'border-b-emerald-400',text: 'text-emerald-700',btn: 'bg-emerald-500', bar: 'from-emerald-400 to-teal-400'   },
  explorer: { label: 'Explorer', cefr: 'B1',     emoji: '🔭', gradient: 'from-blue-400 to-cyan-400',     bg: 'bg-gradient-to-br from-blue-50 to-cyan-50',      border: 'border-blue-200', edge: 'border-b-blue-400',   text: 'text-blue-700',   btn: 'bg-blue-500',    bar: 'from-blue-400 to-cyan-400'      },
  scholar:  { label: 'Scholar',  cefr: 'B2',     emoji: '🎓', gradient: 'from-indigo-400 to-violet-500', bg: 'bg-gradient-to-br from-indigo-50 to-violet-50',  border: 'border-indigo-200', edge: 'border-b-indigo-400', text: 'text-indigo-700', btn: 'bg-indigo-500',  bar: 'from-indigo-400 to-violet-400'  },
  master:   { label: 'Master',   cefr: 'C1-C2',  emoji: '🏆', gradient: 'from-gray-600 to-gray-800',     bg: 'bg-gradient-to-br from-gray-50 to-slate-100',    border: 'border-gray-300', edge: 'border-b-gray-500',   text: 'text-gray-700',   btn: 'bg-gray-700',    bar: 'from-gray-500 to-gray-700'      },
}
const WORD_COUNTS = DAILY_WORD_COUNTS

type Child = { id: string; name: string; emoji: string; level: string }
type SyncRow = { seen?: string[]; mastery?: Record<string, MasteryEntry> }

export default function KidsLevelPage() {
  const router = useRouter()
  const { childId } = useParams<{ childId: string }>()
  const [child, setChild] = useState<Child | null>(null)
  const [syncByLevel, setSyncByLevel] = useState<Record<string, SyncRow>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      cachedFetch('/api/children').then(r => r.json()),
      fetch(`/api/sync/${childId}`).then(r => r.json()).catch(() => ({})),
    ]).then(([kids, allSync]) => {
      const found = (kids as Child[]).find(k => k.id === childId)
      if (!found) { router.push('/kids'); return }
      setChild(found)
      setSyncByLevel(allSync ?? {})
      setLoading(false)
    })
  }, [childId, router])

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
      <div className="text-4xl animate-pulse">📚</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-violet-600 text-white rounded-b-3xl border-b-[4px] border-black/20">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => router.back()} aria-label="Quay lại" className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border-b-[3px] border-black/20 bg-white/25 text-lg font-bold text-white transition-transform active:translate-y-0.5 active:border-b-2">←</button>
          <span className="text-2xl flex-shrink-0">📚</span>
          <div>
            <h1 className="font-bold text-lg leading-tight">VocabWise Daily</h1>
            <p className="text-purple-200 text-xs">Từ vựng hàng ngày · Pre-A1 → C2</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4">
      {/* My Words card */}
      <div className="max-w-lg mx-auto mb-3">
        <Link href="/my-words"
          className={`block rounded-3xl border-2 border-b-[4px] border-yellow-200 border-b-yellow-400 bg-yellow-50 px-4 py-3 ${PRESS}`}>
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 flex-shrink-0 -rotate-6 items-center justify-center rounded-2xl bg-white text-3xl shadow">⭐</span>
            <div className="flex-1">
              <p className="font-bold text-gray-800 text-sm leading-tight">Từ của tôi — Lưu từ quan trọng</p>
              <p className="text-yellow-700 text-xs mt-0.5">Nhấn ⭐ cạnh từ trong bài học để lưu vào danh sách ôn tập riêng · Free: 20 từ · Pro: không giới hạn</p>
            </div>
            <span className="text-yellow-500 font-bold text-xl flex-shrink-0">›</span>
          </div>
        </Link>
      </div>

      <div className="space-y-3 max-w-lg mx-auto">
        {LEVEL_ORDER.map((level, idx) => {
          const cfg = LEVEL_CONFIG[level]
          const totalWords = WORD_COUNTS[level] ?? 400
          const syncRow = syncByLevel[level]
          const masteredTopics = Object.values(syncRow?.mastery ?? {}).filter(m => isTopicMastered(m, level)).length
          const seenWords = masteredTopics >= 30 ? totalWords : (syncRow?.seen?.length ?? 0)
          const pct = seenWords >= totalWords ? 100 : totalWords > 0 ? Math.floor((seenWords / totalWords) * 100) : 0
          const isNotStarted = seenWords === 0 && masteredTopics === 0
          // Show "Đang học" on the last level the child was active in (auto-tracked, not assigned)
          const isCurrent = level === child!.level && !isNotStarted

          return (
            <button key={level}
              onClick={() => router.push(`/dashboard/${childId}/${level}`)}
              className={`w-full text-left ${cfg.bg} ${cfg.border} ${cfg.edge} rounded-3xl border-2 border-b-[4px] p-3 ${PRESS}`}
            >
              <div className="flex items-center gap-3">
                <div className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${cfg.gradient} text-3xl shadow ring-2 ring-white ${idx % 2 === 0 ? '-rotate-6' : 'rotate-6'}`}>
                  {cfg.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className={`font-bold ${cfg.text} text-base`}>{cfg.label}</span>
                    <span className="text-xs text-gray-500 font-semibold bg-white/70 px-2 py-0.5 rounded-full">{cfg.cefr}</span>
                    {isCurrent && (
                      <span className={`text-xs px-2.5 py-0.5 rounded-full border-b-[3px] border-black/20 font-bold text-white ${cfg.btn}`}>Đang học</span>
                    )}
                  </div>
                  <p className={`text-xs font-semibold ${isNotStarted ? 'text-gray-400' : cfg.text}`}>
                    {isNotStarted
                      ? `30 chủ đề · ${totalWords} từ · Chưa bắt đầu`
                      : `${pct}% · ${seenWords}/${totalWords} từ · ${masteredTopics}/30 chủ đề hoàn thành`}
                  </p>
                  {!isNotStarted && (
                    <div className="mt-2 h-2.5 bg-white/80 rounded-full overflow-hidden">
                      <div className={`h-full bg-gradient-to-r ${cfg.bar} rounded-full transition-all duration-500`}
                        style={{ width: `${Math.max(pct, 1)}%` }} />
                    </div>
                  )}
                </div>
                <span className={`${cfg.text} font-bold text-xl flex-shrink-0`}>→</span>
              </div>
            </button>
          )
        })}
      </div>
      </div>
    </div>
  )
}
