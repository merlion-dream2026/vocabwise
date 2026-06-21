/**
 * Single source of truth for child progress computation.
 * All screens (kids card, dashboard module select, parent dashboard) import from here.
 */
import phonicsLevels from '@/data/phonicsLevels.json'

// ─── Constants ────────────────────────────────────────────────────────────────

export const PHONICS_TOTAL_LESSONS: number = phonicsLevels.levels.reduce(
  (s, l) => s + l.lessons.length, 0
) // 31

export const DAILY_LEVEL_ORDER = ['seeker', 'starter', 'ranger', 'explorer', 'scholar', 'master'] as const
export type DailyLevel = typeof DAILY_LEVEL_ORDER[number]

// Actual word counts per level (computed from words.json)
export const DAILY_WORD_COUNTS: Record<string, number> = {
  seeker: 400, starter: 400, ranger: 400, explorer: 400, scholar: 400, master: 400,
}

export const DAILY_TOTAL_TOPICS = 30

export const ACADEMIC_BOOK_META: Record<string, { label: string; cefr: string; total: number }> = {
  'b1': { label: 'Book 1', cefr: 'A1–A2', total: 60 },
  'b2': { label: 'Book 2', cefr: 'B1–B2', total: 60 },
  'b3': { label: 'Book 3', cefr: 'C1–C2', total: 60 },
}

export const ACADEMIC_WORDS_PER_TOPIC = 15

// ─── Types ────────────────────────────────────────────────────────────────────

export type SyncLevel = {
  seen?: string[]
  mastery?: Record<string, { flashcard: boolean; games: string[] }>
  history?: Record<string, { words: number; games: number; xp: number; topics?: number; topicIds?: string[] }>
}

export type SyncAllLevels = Record<string, SyncLevel>

// ─── Phonics ──────────────────────────────────────────────────────────────────

export type PhonicsProgress = {
  seen: number      // lessons with flashcard done
  mastered: number  // lessons with flashcard + ≥3 games done
  total: number     // PHONICS_TOTAL_LESSONS (31)
}

export function getPhonicsProgress(phonicsSync: SyncLevel | undefined): PhonicsProgress {
  const mastery = phonicsSync?.mastery ?? {}
  const vals = Object.values(mastery)
  return {
    seen:     vals.filter(m => m.flashcard).length,
    mastered: vals.filter(m => m.flashcard && m.games.length >= 3).length,
    total:    PHONICS_TOTAL_LESSONS,
  }
}

// ─── Daily ────────────────────────────────────────────────────────────────────

export type DailyProgress = {
  seenWords:        number  // words seen in this level
  totalWords:       number  // actual total words for this level
  topicsCompleted:  number  // topics with flashcard done + ≥3 games (consistent with dashboard)
  totalTopics:      number  // DAILY_TOTAL_TOPICS (30)
}

/** Highest level (in CEFR order) where the child has seen at least 1 word. */
export function getDailyHighestLevel(sync: SyncAllLevels): string | null {
  for (const lv of [...DAILY_LEVEL_ORDER].reverse()) {
    if ((sync[lv]?.seen?.length ?? 0) > 0) return lv
  }
  return null
}

export function getDailyProgress(levelSync: SyncLevel | undefined, level: string): DailyProgress {
  const mastery = levelSync?.mastery ?? {}
  const topicsCompleted = Object.values(mastery).filter(m => m.flashcard && m.games.length >= 3).length
  const totalWords = DAILY_WORD_COUNTS[level] ?? 400
  // All topics done → treat all words as seen (seen array can be 1 short due to edge cases)
  const seenWords = topicsCompleted >= DAILY_TOTAL_TOPICS ? totalWords : (levelSync?.seen?.length ?? 0)
  return { seenWords, totalWords, topicsCompleted, totalTopics: DAILY_TOTAL_TOPICS }
}

// ─── Academic ─────────────────────────────────────────────────────────────────

export type AcademicProgress = {
  book:      string | null  // 'Book 1' | 'Book 2' | 'Book 3' | null
  cefr:      string | null
  completed: number
  total:     number
}

export function getAcademicProgress(academicSync: SyncLevel | undefined): AcademicProgress {
  const mastery = (academicSync?.mastery ?? {}) as Record<string, { completed?: boolean }>
  for (const [prefix, info] of Object.entries(ACADEMIC_BOOK_META).reverse()) {
    const entries = Object.entries(mastery).filter(([k]) => k.startsWith(prefix + '-'))
    if (entries.length > 0) {
      return {
        book:      info.label,
        cefr:      info.cefr,
        completed: entries.filter(([, v]) => v.completed).length,
        total:     info.total,
      }
    }
  }
  return { book: null, cefr: null, completed: 0, total: 0 }
}

// ─── All-levels aggregates (for parent overview card) ────────────────────────

export type AllDailyProgress = {
  seenWords: number; totalWords: number
  topicsCompleted: number; totalTopics: number
}

export function getAllDailyProgress(sync: SyncAllLevels): AllDailyProgress {
  let seenWords = 0, topicsCompleted = 0
  for (const lv of DAILY_LEVEL_ORDER) {
    const lvCompleted = Object.values(sync[lv]?.mastery ?? {}).filter(m => m.flashcard && m.games.length >= 3).length
    const lvTotal = DAILY_WORD_COUNTS[lv] ?? 400
    seenWords += lvCompleted >= DAILY_TOTAL_TOPICS ? lvTotal : (sync[lv]?.seen?.length ?? 0)
    topicsCompleted += lvCompleted
  }
  const totalWords  = DAILY_LEVEL_ORDER.reduce((s, lv) => s + (DAILY_WORD_COUNTS[lv] ?? 400), 0)
  const totalTopics = DAILY_TOTAL_TOPICS * DAILY_LEVEL_ORDER.length
  return { seenWords, totalWords, topicsCompleted, totalTopics }
}

export type AllAcademicProgress = {
  completed: number; total: number
  seenWords: number; totalWords: number
}

export function getAllAcademicProgress(academicSync: SyncLevel | undefined): AllAcademicProgress {
  const mastery = (academicSync?.mastery ?? {}) as Record<string, { completed?: boolean }>
  const total     = Object.values(ACADEMIC_BOOK_META).reduce((s, b) => s + b.total, 0)
  const completed = Object.values(mastery).filter(v => v.completed).length
  return {
    completed,
    total,
    seenWords:  completed * ACADEMIC_WORDS_PER_TOPIC,
    totalWords: total     * ACADEMIC_WORDS_PER_TOPIC,
  }
}

// ─── Global streak (computed from combined history across all modules) ────────

export function getGlobalStreak(sync: SyncAllLevels): { current: number } {
  const activeDates = new Set<string>()
  for (const lv of Object.values(sync)) {
    for (const [date, entry] of Object.entries((lv as SyncLevel).history ?? {})) {
      const e = entry as { words?: number; games?: number; xp?: number }
      if ((e.words ?? 0) + (e.games ?? 0) + (e.xp ?? 0) > 0) activeDates.add(date)
    }
  }
  let current = 0
  const d = new Date()
  while (current < 365) {
    if (!activeDates.has(d.toISOString().split('T')[0])) break
    current++
    d.setDate(d.getDate() - 1)
  }
  return { current }
}

// ─── Daily XP goal ────────────────────────────────────────────────────────────

export const DAILY_XP_GOAL = 20

export function getDailyXP(sync: SyncAllLevels): number {
  const today = new Date().toISOString().split('T')[0]
  let xp = 0
  for (const lv of Object.values(sync)) {
    xp += ((lv as SyncLevel).history?.[today]?.xp ?? 0)
  }
  return xp
}

// ─── XP & Badge ───────────────────────────────────────────────────────────────

export const XP_BADGES = [
  { minXP: 3000, icon: '👑', label: 'Master',    cls: 'bg-yellow-100 text-yellow-700' },
  { minXP: 1000, icon: '🏆', label: 'Champion',  cls: 'bg-orange-100 text-orange-700' },
  { minXP:  300, icon: '🌟', label: 'Rising',    cls: 'bg-sky-100 text-sky-700'       },
  { minXP:   50, icon: '🌱', label: 'Beginner',  cls: 'bg-green-100 text-green-700'   },
] as const

export type XPBadge = typeof XP_BADGES[number]

export function getXPAndBadge(sync: SyncAllLevels): { totalXP: number; badge: XPBadge | null } {
  let totalXP = 0
  for (const lv of DAILY_LEVEL_ORDER) {
    for (const h of Object.values(sync[lv]?.history ?? {})) totalXP += h.xp ?? 0
  }
  return { totalXP, badge: XP_BADGES.find(b => totalXP >= b.minXP) ?? null }
}
