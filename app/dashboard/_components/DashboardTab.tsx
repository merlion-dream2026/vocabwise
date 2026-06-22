'use client'

import { useState, useEffect } from 'react'
import { buildSyncSummary, computeEarnedBadges, getXpLevel } from '@/lib/badges'
import {
  getPhonicsProgress, getDailyHighestLevel, getAllDailyProgress, getAllAcademicProgress, getXPAndBadge,
  getGlobalStreak, getDailyXP, DAILY_XP_GOAL,
} from '@/lib/childProgress'
import OnboardingChecklist from '@/components/OnboardingChecklist'
import { getAvatarSrc } from '@/lib/avatars'
import LearningHistoryPanel from '@/components/LearningHistoryPanel'
import BangThanhTich from '@/components/BangThanhTich'
import LeaderboardCard from '../LeaderboardCard'
import { FaqCard } from './FaqCard'
import type { Child, Session, ChildStats, HistEntry, SyncLevel, SyncAllLevels } from '../_types'
import {
  THEME_COLORS, DEFAULT_COLOR, weakCount, getLast7Days, histDotColor, fmtHistEntry, formatLastActive,
} from '../_utils'

// ── Dashboard tab ─────────────────────────────────────────────────────────────
export function DashboardTab({ stats, loading, onRefresh, onChildClick, onEditChild, session, onAddChild }: {
  stats: ChildStats[]
  loading: boolean
  onRefresh: () => void
  onChildClick: (child: Child) => void
  onEditChild: (child: Child) => void
  session: Session
  onAddChild: () => void
}) {
  const [lastRefresh, setLastRefresh] = useState<string | null>(null)
  const [expandedHistory, setExpandedHistory] = useState<Record<string, boolean>>({})
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null)

  useEffect(() => {
    setSelectedChildId(prev => {
      if (stats.length === 0) return null
      if (prev && stats.find(s => s.child.id === prev)) return prev
      return stats[0].child.id
    })
  }, [stats])

  useEffect(() => {
    if (!loading) {
      const now = new Date()
      setLastRefresh(now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ' + now.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }))
    }
  }, [loading])

  if (loading && stats.length === 0) return <div className="flex justify-center py-16"><p className="text-gray-400 font-bold">Đang tải...</p></div>

  // Onboarding checklist data
  const hasPlayedGame = stats.some(s =>
    Object.values(s.syncAll).some(lv =>
      Object.values(lv.mastery ?? {}).some(m => m.games.length > 0)
    )
  )
  const hasViewedFlashcard = stats.some(s =>
    Object.values(s.syncAll).some(lv =>
      Object.values(lv.mastery ?? {}).some(m => m.flashcard)
    )
  )
  const firstChild = stats[0]?.child

  return (
    <div className="space-y-5">
      {/* Onboarding checklist — hiện cho user mới chưa hoàn thành */}
      <OnboardingChecklist
        familyId={session.familyId}
        hasChildren={stats.length > 0}
        childId={firstChild?.id}
        childLevel={firstChild?.level}
        hasPlayedGame={hasPlayedGame}
        hasViewedFlashcard={hasViewedFlashcard}
      />

      {/* Freemium banner — top so free users always see it */}
      {session.plan === 'free' && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-2xl p-4 text-center">
          <p className="text-sm text-purple-700 font-bold">🔒 Gói Free: tối đa {session.max_kids ?? 1} hồ sơ · 1 chủ đề/level</p>
          <p className="text-xs text-purple-500 mt-1">Nâng cấp Pro để mở toàn bộ 4.500+ từ và 10 game</p>
        </div>
      )}

      {/* Leaderboard */}
      <LeaderboardCard />

      {/* FAQ */}
      <FaqCard />

      {/* Child tabs + add button */}
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {stats.map(({ child }) => {
          const isActive = child.id === selectedChildId
          const c = child.theme && THEME_COLORS[child.theme as 'pink' | 'blue'] ? THEME_COLORS[child.theme as 'pink' | 'blue'] : DEFAULT_COLOR
          return (
            <button key={child.id}
              onClick={() => setSelectedChildId(child.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl font-black text-sm whitespace-nowrap flex-shrink-0 transition-all ${
                isActive ? `${c.bar} text-white shadow-md` : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300'
              }`}>
              <img src={getAvatarSrc(child.emoji)} className="w-6 h-6 rounded-full object-cover flex-shrink-0" alt="" />
              <span>{child.name}</span>
            </button>
          )
        })}
        <button onClick={onAddChild}
          className="flex items-center justify-center w-10 h-10 rounded-2xl font-black text-lg flex-shrink-0 bg-white text-purple-400 border-2 border-dashed border-purple-200 hover:bg-purple-50 transition-all">
          +
        </button>
      </div>

      {/* Selected child card */}
      {stats.length > 0 && (
        <div>
          {stats.filter(s => s.child.id === selectedChildId).map(({ child, syncAll }) => {
            const c = child.theme && THEME_COLORS[child.theme as 'pink' | 'blue']
              ? THEME_COLORS[child.theme as 'pink' | 'blue']
              : DEFAULT_COLOR

            // Progress from shared lib (all modules, consistent with kids card)
            const highestLevel  = getDailyHighestLevel(syncAll as SyncAllLevels)
            const activeLevel   = highestLevel ?? child.level
            const { totalXP, badge: xpBadge } = getXPAndBadge(syncAll as SyncAllLevels)
            const phonics = getPhonicsProgress(syncAll['phonics'] as SyncLevel | undefined)
            const allDaily = getAllDailyProgress(syncAll as SyncAllLevels)
            const allAcad  = getAllAcademicProgress(syncAll['academic'] as SyncLevel | undefined)
            const pf = (a: number, b: number) => b > 0 ? (a >= b ? 100 : Math.floor(a / b * 100)) : 0

            // Global streak computed from combined history across all modules
            const { current: streakCur } = getGlobalStreak(syncAll as SyncAllLevels)
            const lastActive  = formatLastActive(child.streak?.lastActive)
            const todayXP     = getDailyXP(syncAll as SyncAllLevels)
            const xpGoalDone  = todayXP >= DAILY_XP_GOAL

            // Weak words from active Daily level
            const weakEntries = Object.entries(syncAll[activeLevel]?.weak_words ?? {})
              .sort((a, b) => weakCount(b[1]) - weakCount(a[1])).slice(0, 8)

            // Badges from active level
            const summary   = buildSyncSummary(syncAll[activeLevel] as Parameters<typeof buildSyncSummary>[0])
            const xpInfo    = getXpLevel(summary.xp)
            const topBadges = computeEarnedBadges(summary).slice(0, 3)

            // History — combined across all modules
            const hist: Record<string, HistEntry> = {}
            for (const lvData of Object.values(syncAll)) {
              for (const [day, entry] of Object.entries((lvData as { history?: Record<string, HistEntry> }).history ?? {})) {
                if (!hist[day]) hist[day] = { words: 0, games: 0, xp: 0 }
                hist[day].words += entry.words ?? 0
                hist[day].games += entry.games ?? 0
                hist[day].xp   += entry.xp    ?? 0
              }
            }
            const last7         = getLast7Days()
            const childTheme    = child.theme ?? 'pink'
            const isHistExpanded = expandedHistory[child.id] ?? false

            return (
              <div key={child.id} className="bg-white rounded-3xl border-2 border-gray-100 shadow-sm overflow-hidden">

                {/* Header: avatar + name + XP/streak + edit */}
                <div className="flex items-start gap-3 px-4 pt-4 pb-3">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${c.grad} flex items-center justify-center flex-shrink-0 shadow-sm overflow-hidden`}>
                    <img src={getAvatarSrc(child.emoji)} className="w-full h-full object-cover rounded-2xl" alt="" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-gray-800 text-base leading-tight truncate">{child.name}</p>
                    <div className="flex items-center gap-1.5 flex-wrap mt-1">
                      {totalXP > 0 && <span className="text-xs font-black text-yellow-600">⭐ {totalXP.toLocaleString()} XP</span>}
                      {xpBadge && <span className={`text-[11px] font-black px-1.5 py-0.5 rounded-full ${xpBadge.cls}`}>{xpBadge.icon} {xpBadge.label}</span>}
                      {!xpBadge && totalXP === 0 && <span className="text-[11px] text-gray-400 font-semibold">{xpInfo.emoji} {xpInfo.name}</span>}
                      {streakCur > 0 && <span className="text-[11px] font-black text-orange-500">🔥 {streakCur} ngày</span>}
                      <span className={`text-[11px] font-black px-1.5 py-0.5 rounded-full ${xpGoalDone ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {xpGoalDone ? `✅ ${DAILY_XP_GOAL} XP hôm nay` : `⚡ ${todayXP}/${DAILY_XP_GOAL} XP hôm nay`}
                      </span>
                      {lastActive && <span className="text-[11px] text-gray-400 font-semibold">📅 {lastActive}</span>}
                    </div>
                  </div>
                  <button onClick={() => onEditChild(child)}
                    className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-xl text-gray-300 hover:text-purple-500 hover:bg-purple-50 transition-colors mt-0.5">
                    ✏️
                  </button>
                </div>

                {/* Module progress rows (clickable → navigate to child) */}
                <button onClick={() => onChildClick(child)} className="w-full px-4 pb-3 text-left active:bg-gray-50/80 transition-colors">
                  <div className="space-y-1.5">

                    {/* Phonics */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-amber-600 flex-shrink-0">🔤 Phonics</span>
                      <span className="text-gray-500 font-semibold">
                        {phonics.seen}/{phonics.total} bài ({pf(phonics.seen, phonics.total)}%)
                      </span>
                    </div>

                    {/* Daily */}
                    <div className="flex items-center justify-between text-xs">
                      <span className={`font-bold ${c.text} flex-shrink-0`}>📚 Daily</span>
                      <span className="text-gray-500 font-semibold text-right">
                        {allDaily.topicsCompleted}/{allDaily.totalTopics} chủ đề ({pf(allDaily.topicsCompleted, allDaily.totalTopics)}%) · {allDaily.seenWords}/{allDaily.totalWords} từ ({pf(allDaily.seenWords, allDaily.totalWords)}%)
                      </span>
                    </div>

                    {/* Academic */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-blue-600 flex-shrink-0">🎓 Academic</span>
                      <span className="text-gray-500 font-semibold text-right">
                        {allAcad.completed}/{allAcad.total} chủ đề ({pf(allAcad.completed, allAcad.total)}%) · {allAcad.seenWords}/{allAcad.totalWords} từ ({pf(allAcad.seenWords, allAcad.totalWords)}%)
                      </span>
                    </div>
                  </div>

                  {/* Weak words + badges */}
                  <div className="mt-3 space-y-1.5">
                    {weakEntries.length > 0 ? (
                      <div>
                        <p className="text-xs font-bold text-orange-500 mb-1">⚠️ Từ yếu cần ôn</p>
                        <div className="flex flex-wrap gap-1">
                          {weakEntries.map(([word, val]) => (
                            <span key={word} className="bg-orange-50 border border-orange-200 rounded-xl px-2 py-0.5 text-xs font-bold text-orange-700">
                              {word} <span className="text-orange-400">×{weakCount(val)}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs font-bold text-green-500">✨ Không có từ yếu</span>
                    )}
                    {topBadges.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {topBadges.map(b => (
                          <span key={b.id} className="inline-flex items-center gap-0.5 text-xs font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded-full">
                            {b.emoji} {b.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </button>

                {/* History 7 ngày — collapsible, combined across all modules */}
                <div className="border-t border-gray-100">
                  <button
                    onClick={() => setExpandedHistory(prev => ({ ...prev, [child.id]: !isHistExpanded }))}
                    className="w-full px-3 py-2 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-gray-400">📅</span>
                      <div className="flex items-center gap-0.5">
                        {last7.map(d => (
                          <span key={d.key} className={`w-2 h-2 rounded-full ${histDotColor(hist[d.key], childTheme)}`} />
                        ))}
                      </div>
                    </div>
                    <span className={`text-gray-400 text-xs font-black transition-transform duration-200 ${isHistExpanded ? 'rotate-180' : ''}`}>▾</span>
                  </button>

                  {isHistExpanded && (
                    <div className="px-3 pb-3 space-y-1">
                      {last7.filter(d => hist[d.key] && (hist[d.key].words + hist[d.key].games + hist[d.key].xp) > 0)
                        .reverse()
                        .map(d => (
                          <div key={d.key} className="flex items-center justify-between text-xs">
                            <span className="text-gray-400 font-semibold">{d.date} {d.day}</span>
                            <span className="text-gray-600 font-bold">{fmtHistEntry(hist[d.key])}</span>
                          </div>
                        ))
                      }
                      {last7.every(d => !hist[d.key] || hist[d.key].words + hist[d.key].games + hist[d.key].xp === 0) && (
                        <p className="text-xs text-gray-400 font-semibold text-center py-1">Chưa có hoạt động</p>
                      )}
                    </div>
                  )}
                </div>

                {/* History 30 ngày — per module breakdown */}
                <LearningHistoryPanel syncByLevel={syncAll as Record<string, { history?: Record<string, { words: number; games: number; xp: number; topics?: number; topicIds?: string[] }> } | undefined>} />
              </div>
            )
          })}
        </div>
      )}

      {stats.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">👨‍👩‍👧</div>
          <p className="font-bold mb-4">Chưa có hồ sơ nào</p>
          <button onClick={onAddChild}
            className="bg-purple-500 text-white font-black px-6 py-3 rounded-2xl hover:bg-purple-600 active:scale-95 transition-all text-sm">
            + Thêm hồ sơ bé
          </button>
        </div>
      )}

      <BangThanhTich
        entries={stats.map(({ child, syncAll }) => ({ child, syncAll: syncAll as Record<string, { history?: Record<string, { words: number; games: number; xp: number }> }> }))}
      />

      <button onClick={onRefresh} disabled={loading}
        className="w-full bg-white border-2 border-gray-200 rounded-2xl py-3 font-black text-gray-500 active:scale-95 transition-transform disabled:opacity-50">
        {loading ? '⏳ Đang tải...' : '🔄 Tải lại'}
        {lastRefresh && !loading && (
          <span className="block text-xs font-semibold text-gray-400 mt-0.5">Cập nhật lúc {lastRefresh}</span>
        )}
      </button>

    </div>
  )
}
