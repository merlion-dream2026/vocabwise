import { isTopicMastered, type MasteryEntry } from './topicMastery'
export type BadgeDef = {
  id: string
  emoji: string
  name: string
  desc: string
}

export type XpLevel = {
  level: number
  emoji: string
  name: string
  minXp: number
  maxXp: number // -1 = no cap
}

export const XP_LEVELS: XpLevel[] = [
  { level: 1, emoji: '🌱', name: 'Khởi Đầu',        minXp: 0,    maxXp: 99   },
  { level: 2, emoji: '🔍', name: 'Nhà Thám Hiểm',  minXp: 100,  maxXp: 299  },
  { level: 3, emoji: '⚔️', name: 'Chiến Binh',      minXp: 300,  maxXp: 699  },
  { level: 4, emoji: '📜', name: 'Học Giả',         minXp: 700,  maxXp: 1499 },
  { level: 5, emoji: '👑', name: 'Vô Địch',         minXp: 1500, maxXp: -1   },
]

export const ALL_BADGES: BadgeDef[] = [
  // Vocabulary
  { id: 'first_word',  emoji: '🌱', name: 'Mầm Non',     desc: 'Học từ đầu tiên' },
  { id: 'words_50',    emoji: '📚', name: 'Ham Học',      desc: 'Học được 50 từ' },
  { id: 'words_100',   emoji: '🎓', name: 'Học Giỏi',    desc: 'Học được 100 từ' },
  { id: 'words_300',   emoji: '🌟', name: 'Siêu Sao',    desc: 'Học được 300 từ' },
  // Streak
  { id: 'streak_3',    emoji: '🔥', name: 'Học Đều',     desc: 'Streak 3 ngày liên tiếp' },
  { id: 'streak_7',    emoji: '⚡', name: 'Kiên Trì',    desc: 'Streak 7 ngày liên tiếp' },
  { id: 'streak_14',   emoji: '💎', name: 'Bền Bỉ',      desc: 'Streak 14 ngày liên tiếp' },
  { id: 'streak_30',   emoji: '👑', name: 'Sắt Đá',      desc: 'Streak 30 ngày liên tiếp' },
  // Topic mastery
  { id: 'master_1',    emoji: '🏅', name: 'Chinh Phục',  desc: 'Chinh phục 1 chủ đề' },
  { id: 'master_5',    emoji: '🏆', name: 'Xuất Sắc',    desc: 'Chinh phục 5 chủ đề' },
  { id: 'master_10',   emoji: '🌈', name: 'Thiên Tài',   desc: 'Chinh phục 10 chủ đề' },
  // XP
  { id: 'xp_100',      emoji: '⭐', name: 'Chăm Chỉ',   desc: 'Đạt 100 XP' },
  { id: 'xp_500',      emoji: '💫', name: 'Giỏi Giang',  desc: 'Đạt 500 XP' },
  { id: 'xp_1000',     emoji: '🚀', name: 'Huyền Thoại', desc: 'Đạt 1000 XP' },
  // Perfect
  { id: 'perfect',     emoji: '🎯', name: 'Toàn Vẹn',   desc: 'Đạt điểm tuyệt đối lần đầu' },
  // Phonics
  { id: 'phonics_start',  emoji: '🔤', name: 'Học Phát Âm', desc: 'Thành thạo nhóm âm đầu tiên' },
  { id: 'phonics_5',      emoji: '🗣️', name: 'Lưu Loát',    desc: 'Thành thạo 5 nhóm âm IPA' },
  { id: 'phonics_15',     emoji: '🎙️', name: 'Phát Âm Chuẩn', desc: 'Thành thạo 15 nhóm âm IPA' },
]

export type SyncSummary = {
  seenCount: number
  bestStreak: number
  masteredTopics: number
  xp: number
  hasPerfect: boolean
}

export function buildSyncSummary(syncData: {
  seen?: string[]
  streak?: { best?: number }
  battle?: { totalAllTime?: number }
  mastery?: Record<string, MasteryEntry>
} | null, level?: string): SyncSummary {
  const mastery = syncData?.mastery ?? {}
  const masteredTopics = Object.values(mastery)
    .filter(m => isTopicMastered(m, level)).length
  const hasPerfect = Object.values(mastery).some(m => m.games.length > 0)
  return {
    seenCount: syncData?.seen?.length ?? 0,
    bestStreak: syncData?.streak?.best ?? 0,
    masteredTopics,
    xp: syncData?.battle?.totalAllTime ?? 0,
    hasPerfect,
  }
}

export function computeEarnedBadges(summary: SyncSummary, phoneticsMastered = 0): BadgeDef[] {
  const { seenCount, bestStreak, masteredTopics, xp, hasPerfect } = summary
  return ALL_BADGES.filter(b => {
    switch (b.id) {
      case 'first_word':     return seenCount >= 1
      case 'words_50':       return seenCount >= 50
      case 'words_100':      return seenCount >= 100
      case 'words_300':      return seenCount >= 300
      case 'streak_3':       return bestStreak >= 3
      case 'streak_7':       return bestStreak >= 7
      case 'streak_14':      return bestStreak >= 14
      case 'streak_30':      return bestStreak >= 30
      case 'master_1':       return masteredTopics >= 1
      case 'master_5':       return masteredTopics >= 5
      case 'master_10':      return masteredTopics >= 10
      case 'xp_100':         return xp >= 100
      case 'xp_500':         return xp >= 500
      case 'xp_1000':        return xp >= 1000
      case 'perfect':        return hasPerfect
      case 'phonics_start':  return phoneticsMastered >= 1
      case 'phonics_5':      return phoneticsMastered >= 5
      case 'phonics_15':     return phoneticsMastered >= 15
      default:               return false
    }
  })
}

export function getXpLevel(xp: number): XpLevel & { pct: number } {
  const lvl = [...XP_LEVELS].reverse().find(l => xp >= l.minXp) ?? XP_LEVELS[0]
  const next = XP_LEVELS.find(l => l.level === lvl.level + 1)
  const pct = next
    ? Math.round(((xp - lvl.minXp) / (next.minXp - lvl.minXp)) * 100)
    : 100
  return { ...lvl, pct }
}

// Longer "how do I get it" line for the badge detail view, plus live progress toward it.
// Thresholds mirror computeEarnedBadges() — keep the two in sync.
const BADGE_TARGET: Record<string, { key: keyof SyncSummary | 'phonics'; target: number; unit: string }> = {
  first_word: { key: 'seenCount', target: 1, unit: 'từ' },
  words_50: { key: 'seenCount', target: 50, unit: 'từ' },
  words_100: { key: 'seenCount', target: 100, unit: 'từ' },
  words_300: { key: 'seenCount', target: 300, unit: 'từ' },
  streak_3: { key: 'bestStreak', target: 3, unit: 'ngày' },
  streak_7: { key: 'bestStreak', target: 7, unit: 'ngày' },
  streak_14: { key: 'bestStreak', target: 14, unit: 'ngày' },
  streak_30: { key: 'bestStreak', target: 30, unit: 'ngày' },
  master_1: { key: 'masteredTopics', target: 1, unit: 'chủ đề' },
  master_5: { key: 'masteredTopics', target: 5, unit: 'chủ đề' },
  master_10: { key: 'masteredTopics', target: 10, unit: 'chủ đề' },
  xp_100: { key: 'xp', target: 100, unit: 'XP' },
  xp_500: { key: 'xp', target: 500, unit: 'XP' },
  xp_1000: { key: 'xp', target: 1000, unit: 'XP' },
  phonics_start: { key: 'phonics', target: 1, unit: 'nhóm âm' },
  phonics_5: { key: 'phonics', target: 5, unit: 'nhóm âm' },
  phonics_15: { key: 'phonics', target: 15, unit: 'nhóm âm' },
}

export function badgeExplain(id: string): string {
  const t = BADGE_TARGET[id]
  if (id === 'first_word') return 'Mở flashcard hoặc chơi một trò bất kỳ để học từ đầu tiên.'
  if (id === 'perfect') return 'Làm đúng tất cả các câu trong một trò chơi.'
  if (!t) return ''
  switch (t.key) {
    case 'seenCount': return `Học được ${t.target} từ khác nhau — mỗi từ bé gặp trong flashcard hoặc trò chơi đều được tính.`
    case 'bestStreak': return `Học mỗi ngày, liên tục ${t.target} ngày không nghỉ. Tính theo chuỗi ngày dài nhất bé từng đạt.`
    case 'masteredTopics': return `Chinh phục ${t.target} chủ đề — đủ sao ở cả Vòng 1 và Vòng 2 để mở quà.`
    case 'xp': return `Tích lũy ${t.target} XP. Trò càng khó, mỗi câu đúng càng được nhiều XP.`
    case 'phonics': return `Thành thạo ${t.target} nhóm âm IPA trong mục Phonics.`
    default: return ''
  }
}

// null when the badge has no countable progress (perfect).
export function badgeProgress(id: string, summary: SyncSummary, phoneticsMastered = 0): { current: number; target: number; unit: string } | null {
  const t = BADGE_TARGET[id]
  if (!t) return null
  const raw = t.key === 'phonics' ? phoneticsMastered : Number(summary[t.key])
  return { current: Math.min(raw, t.target), target: t.target, unit: t.unit }
}
