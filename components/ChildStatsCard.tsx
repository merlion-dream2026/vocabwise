import {
  XP_BADGES,
  getXPAndBadge,
  getAllDailyProgress,
  type SyncAllLevels,
} from '@/lib/childProgress'
import { ALL_BADGES } from '@/lib/badges'

type Child = {
  id: string
  streak?: { current: number; lastActive: string }
}

export default function ChildStatsCard({ child, sync }: { child: Child; sync: SyncAllLevels }) {
  const streakCur = child.streak?.current ?? 0
  const lastActive = child.streak?.lastActive ?? ''
  const todayStr = new Date().toISOString().split('T')[0]
  const yesterStr = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  const streakBadge = streakCur === 0 ? null
    : lastActive === todayStr
      ? { icon: '🔥', label: `${streakCur} ngày`, cls: 'bg-orange-100 text-orange-600' }
      : lastActive === yesterStr
        ? { icon: '⚡', label: `${streakCur} ngày`, cls: 'bg-yellow-100 text-yellow-700' }
        : { icon: '💤', label: 'Đã nghỉ', cls: 'bg-gray-100 text-gray-400' }

  const { totalXP, badge } = getXPAndBadge(sync)
  const allDaily = getAllDailyProgress(sync)

  // XP progress to next badge tier
  const badgeIdx = badge ? XP_BADGES.findIndex(b => b.minXP === badge.minXP) : XP_BADGES.length
  const nextXPBadge = badgeIdx > 0 ? XP_BADGES[badgeIdx - 1] ?? null : null
  const xpPct = nextXPBadge
    ? Math.min(100, Math.round((totalXP - (badge?.minXP ?? 0)) / (nextXPBadge.minXP - (badge?.minXP ?? 0)) * 100))
    : 0

  // Top earned achievement badges (same thresholds as /kids picker)
  const earnedBadgeIds = new Set([
    allDaily.seenWords >= 1   && 'first_word',
    allDaily.seenWords >= 50  && 'words_50',
    allDaily.seenWords >= 100 && 'words_100',
    allDaily.seenWords >= 300 && 'words_300',
    allDaily.topicsCompleted >= 1  && 'master_1',
    allDaily.topicsCompleted >= 5  && 'master_5',
    allDaily.topicsCompleted >= 10 && 'master_10',
    totalXP >= 100  && 'xp_100',
    totalXP >= 500  && 'xp_500',
    totalXP >= 1000 && 'xp_1000',
  ].filter(Boolean) as string[])
  const profileBadges = ALL_BADGES.filter(b => earnedBadgeIds.has(b.id)).slice(-3)

  if (totalXP === 0 && !streakBadge && profileBadges.length === 0) return null

  return (
    <div className="max-w-lg mx-auto mb-4 bg-white/70 backdrop-blur-sm border-2 border-purple-100 rounded-2xl px-4 py-3.5">
      <div className="flex items-center gap-1.5 flex-wrap">
        {totalXP > 0 && (
          <span className="text-xs font-black text-yellow-600">⭐ {totalXP.toLocaleString()} XP</span>
        )}
        {badge && (
          <span className={`text-[11px] font-black px-1.5 py-0.5 rounded-full ${badge.cls}`}>
            {badge.icon} {badge.label}
          </span>
        )}
        {streakBadge && (
          <span className={`inline-flex items-center gap-0.5 text-[11px] font-black px-1.5 py-0.5 rounded-full ${streakBadge.cls}`}>
            {streakBadge.icon} {streakBadge.label}
          </span>
        )}
        {profileBadges.map(b => (
          <span key={b.id} className="text-[11px] font-black px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">
            {b.emoji} {b.name}
          </span>
        ))}
      </div>
      {nextXPBadge && totalXP > 0 && (
        <div className="mt-2">
          <div className="h-1.5 bg-purple-50 rounded-full overflow-hidden">
            <div className="h-full bg-yellow-400 rounded-full transition-all duration-500" style={{ width: `${xpPct}%` }} />
          </div>
          <p className="text-[10px] text-gray-400 font-semibold mt-1">
            {totalXP.toLocaleString()} / {nextXPBadge.minXP.toLocaleString()} XP → {nextXPBadge.icon} {nextXPBadge.label}
          </p>
        </div>
      )}
    </div>
  )
}
