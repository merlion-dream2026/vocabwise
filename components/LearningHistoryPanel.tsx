'use client'

import { useState, useEffect } from 'react'
import { cachedFetch } from '@/lib/cachedFetch'

const DAILY_LEVELS = ['seeker', 'starter', 'ranger', 'explorer', 'scholar', 'master']
const DOW = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

type DayEntry = { words?: number; games?: number; xp?: number; topics?: number; topicIds?: string[]; testsDone?: string[] }
type SyncMap = Record<string, { history?: Record<string, DayEntry> } | undefined>
type TopicRef = { level: string; id: string }
type TopicNames = { daily?: Record<string, Record<string, string>>; phonics?: Record<string, string>; academic?: Record<string, string> }

export default function LearningHistoryPanel({ syncByLevel, className }: { syncByLevel: SyncMap; className?: string }) {
  const [open, setOpen] = useState(false)
  const [topicNames, setTopicNames] = useState<TopicNames | null>(null)

  // Fetch on mount (not gated on `open`) so names are already cached by the time the user
  // expands the panel — avoids a flash of raw English topic IDs before the Vietnamese name loads.
  useEffect(() => {
    cachedFetch('/api/topic-names').then(r => r.ok ? r.json() : null).then(d => { if (d) setTopicNames(d as TopicNames) }).catch(() => {})
  }, [])

  const phonicsHist = syncByLevel['phonics']?.history ?? {}
  const acadHist    = syncByLevel['academic']?.history ?? {}

  const dailyHist: Record<string, { words: number; games: number; topicRefs: TopicRef[]; testsDone: string[] }> = {}
  for (const lvl of DAILY_LEVELS) {
    for (const [day, e] of Object.entries(syncByLevel[lvl]?.history ?? {})) {
      if ((e.words ?? 0) + (e.games ?? 0) === 0) continue
      if (!dailyHist[day]) dailyHist[day] = { words: 0, games: 0, topicRefs: [], testsDone: [] }
      dailyHist[day].words += e.words ?? 0
      dailyHist[day].games += e.games ?? 0
      for (const id of e.topicIds ?? []) {
        if (!dailyHist[day].topicRefs.some(r => r.level === lvl && r.id === id)) {
          dailyHist[day].topicRefs.push({ level: lvl, id })
        }
      }
      for (const label of e.testsDone ?? []) {
        if (!dailyHist[day].testsDone.includes(label)) dailyHist[day].testsDone.push(label)
      }
    }
  }

  const dailyTopicName  = (r: TopicRef) => topicNames?.daily?.[r.level]?.[r.id] ?? r.id
  const phonicsTopicName  = (id: string) => topicNames?.phonics?.[id] ?? id
  const academicTopicName = (id: string) => topicNames?.academic?.[id] ?? id

  const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 30)
  const cutoffStr = cutoff.toISOString().split('T')[0]

  const days = Array.from(new Set([...Object.keys(phonicsHist), ...Object.keys(dailyHist), ...Object.keys(acadHist)]))
    .filter(d => d >= cutoffStr)
    .sort((a, b) => b.localeCompare(a))
    .map(date => {
      const [, m, d] = date.split('-')
      const dow = DOW[new Date(date).getDay()]
      const p  = phonicsHist[date]
      const dl = dailyHist[date]
      const ac = acadHist[date]
      return {
        date,
        label: `${dow} ${d}/${m}`,
        phonics:  p && (p.topicIds?.length ?? 0) > 0 ? { topicIds: p.topicIds! } : null,
        daily:    dl && (dl.words + dl.games) > 0 ? dl : null,
        academic: ac && (ac.topics ?? 0) > 0 ? { topics: ac.topics!, topicIds: ac.topicIds ?? [], testsDone: ac.testsDone ?? [] } : null,
      }
    })
    .filter(h => h.phonics || h.daily || h.academic)

  return (
    <div className={`border-t border-gray-100 ${className ?? ''}`}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full px-3 py-2 flex items-center justify-between hover:bg-gray-50 transition-colors">
        <span className="text-sm font-bold text-gray-400">📅 Lịch sử 30 ngày</span>
        <span className={`text-gray-400 text-sm font-black transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>

      {open && (
        <div className="px-3 pb-3 max-h-72 overflow-y-auto space-y-2.5">
          {topicNames === null ? (
            <p className="text-sm text-gray-400 text-center py-1 animate-pulse">Đang tải...</p>
          ) : days.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-1">Chưa có hoạt động trong 30 ngày qua</p>
          ) : days.map(h => (
            <div key={h.date}>
              <p className="text-xs font-black text-gray-400 mb-1">{h.label}</p>
              <div className="space-y-0.5">
                {h.phonics && (
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-amber-500 font-bold text-xs w-20 flex-shrink-0 pt-px whitespace-nowrap">🔤 Phonics</span>
                    <span className="text-gray-500 text-xs">
                      {h.phonics.topicIds.length} bài: {h.phonics.topicIds.map(phonicsTopicName).join(', ')}
                    </span>
                  </div>
                )}
                {h.daily && (
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-purple-500 font-bold text-xs w-20 flex-shrink-0 pt-px whitespace-nowrap">📚 Daily</span>
                    <span className="text-gray-500 text-xs">
                      {[
                        h.daily.words > 0 && `${h.daily.words} từ`,
                        h.daily.games > 0 && `${h.daily.games} game`,
                      ].filter(Boolean).join(' · ')}
                      {h.daily.topicRefs.length > 0 && (
                        <> · {h.daily.topicRefs.length} chủ đề: {h.daily.topicRefs.map(dailyTopicName).join(', ')}</>
                      )}
                      {h.daily.testsDone.length > 0 && (
                        <> · 🏆 {h.daily.testsDone.join(', ')}</>
                      )}
                    </span>
                  </div>
                )}
                {h.academic && (
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-blue-500 font-bold text-xs w-20 flex-shrink-0 pt-px whitespace-nowrap">🎓 Academic</span>
                    <span className="text-gray-500 text-xs">
                      {h.academic.topics} bài tập
                      {h.academic.topicIds.length > 0 && (
                        <> · {h.academic.topicIds.length} chủ đề: {h.academic.topicIds.map(academicTopicName).join(', ')}</>
                      )}
                      {h.academic.testsDone.length > 0 && (
                        <> · 🏆 {h.academic.testsDone.join(', ')}</>
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
