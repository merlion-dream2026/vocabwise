import type { SyncLevel as _SyncLevel, SyncAllLevels as _SyncAllLevels } from '@/lib/childProgress'

export type Child = { id: string; name: string; emoji: string; level: string; theme?: string | null; pin?: string | null; streak?: { current: number; lastActive?: string } }
export type Session = { familyId: string; username: string; plan: string; free_trial_expires_at?: string | null; plan_end_date?: string | null; plan_start_date?: string | null; bonus_pro_expires_at?: string | null; max_kids?: number | null; gift_token?: string | null }
export type WeakVal = number | { wrong: number; correctStreak: number; lastWrong: string }
export type SyncData = {
  seen?: string[]
  weak_words?: Record<string, WeakVal>
  streak?: { current?: number; best?: number; lastActive?: string }
  mastery?: Record<string, { flashcard: boolean; games: string[] }>
  history?: SyncHistory
}
export type HistEntry = { words: number; games: number; xp: number }
export type SyncHistory = Record<string, HistEntry>
export type SyncAllFull = Record<string, SyncData>
export type ChildStats = { child: Child; syncAll: SyncAllFull }

export type ReportSettings = { enabled: boolean; schedule: 'manual' | 'weekly'; day: number; monthly_recap: boolean }

export type SyncLevel = _SyncLevel
export type SyncAllLevels = _SyncAllLevels
