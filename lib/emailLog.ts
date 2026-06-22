import { createClient } from '@supabase/supabase-js'
import {
  getAllDailyProgress,
  getGlobalStreak,
  DAILY_LEVEL_ORDER,
  type SyncAllLevels,
  type SyncLevel,
} from './childProgress'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ─── Email dedup ──────────────────────────────────────────────────────────────

/** Returns true if this email type was ever sent to this family. */
export async function hasEmailBeenSent(familyId: string, emailType: string): Promise<boolean> {
  const { data } = await supabase
    .from('email_log')
    .select('id')
    .eq('family_id', familyId)
    .eq('email_type', emailType)
    .limit(1)
  return (data?.length ?? 0) > 0
}

/** Returns true if this email type was sent to this family within the last N days. */
export async function hasEmailBeenSentInDays(
  familyId: string,
  emailType: string,
  days: number
): Promise<boolean> {
  const since = new Date(Date.now() - days * 86_400_000).toISOString()
  const { data } = await supabase
    .from('email_log')
    .select('id')
    .eq('family_id', familyId)
    .eq('email_type', emailType)
    .gte('sent_at', since)
    .limit(1)
  return (data?.length ?? 0) > 0
}

/** Log that an email was sent. Fire-and-forget (errors are suppressed). */
export async function logEmail(
  familyId: string,
  emailType: string,
  metadata?: object
): Promise<void> {
  await supabase
    .from('email_log')
    .insert({ family_id: familyId, email_type: emailType, metadata: metadata ?? null })
    .then(({ error }) => {
      if (error) console.error('[emailLog] insert error:', error.message)
    })
}

// ─── Stats aggregation ────────────────────────────────────────────────────────

export type FamilyStats = {
  totalWords: number
  dailyTopics: number
  academicTopics: number
  totalTopics: number
  streak: number          // best current streak across all children
  totalGames: number      // total game sessions across all history
  firstChildName: string
  childCount: number
  /** map childId → their SyncAllLevels (for per-child milestone checks) */
  syncByChild: Record<string, SyncAllLevels>
  /** raw child rows */
  children: { id: string; name: string; level: string }[]
}

/**
 * Fetches and aggregates all learning stats for a family.
 * Used by onboarding, milestone, and lifecycle cron routes.
 */
export async function getFamilyStats(familyId: string): Promise<FamilyStats> {
  const empty: FamilyStats = {
    totalWords: 0, dailyTopics: 0, academicTopics: 0, totalTopics: 0,
    streak: 0, totalGames: 0, firstChildName: '', childCount: 0,
    syncByChild: {}, children: [],
  }

  const { data: children } = await supabase
    .from('children')
    .select('id, name, level')
    .eq('family_id', familyId)

  if (!children?.length) return empty

  const childIds = children.map(c => c.id as string)

  // All vocab_sync rows for these children (all levels)
  const { data: syncRows } = await supabase
    .from('vocab_sync')
    .select('child_id, level, seen, mastery, streak, history')
    .in('child_id', childIds)

  // Build SyncAllLevels per child
  const syncByChild: Record<string, SyncAllLevels> = {}
  for (const row of syncRows ?? []) {
    if (!syncByChild[row.child_id]) syncByChild[row.child_id] = {}
    syncByChild[row.child_id][row.level as string] = {
      seen:    row.seen    ?? [],
      mastery: row.mastery ?? {},
      history: row.history ?? {},
    } as SyncLevel
  }

  let totalWords = 0, dailyTopics = 0, streak = 0, totalGames = 0
  for (const childSync of Object.values(syncByChild)) {
    const daily = getAllDailyProgress(childSync)
    totalWords  += daily.seenWords
    dailyTopics += daily.topicsCompleted
    const s = getGlobalStreak(childSync).current
    if (s > streak) streak = s
    // count all games across history
    for (const lv of Object.values(childSync)) {
      for (const entry of Object.values((lv as SyncLevel).history ?? {})) {
        totalGames += (entry as { games?: number }).games ?? 0
      }
    }
  }

  // Academic topics completed
  const { data: acRows } = await supabase
    .from('vw_user_topic_progress')
    .select('child_id')
    .in('child_id', childIds)
    .not('completed_at', 'is', null)

  const academicTopics = acRows?.length ?? 0

  return {
    totalWords,
    dailyTopics,
    academicTopics,
    totalTopics: dailyTopics + academicTopics,
    streak,
    totalGames,
    firstChildName: (children[0]?.name as string) ?? '',
    childCount: children.length,
    syncByChild,
    children: children as { id: string; name: string; level: string }[],
  }
}

/** Returns the last active date (YYYY-MM-DD) across all children of a family,
 *  or null if no activity exists. */
export async function getFamilyLastActive(familyId: string): Promise<string | null> {
  const { data: children } = await supabase
    .from('children')
    .select('id')
    .eq('family_id', familyId)
  if (!children?.length) return null

  const childIds = children.map(c => c.id as string)
  const { data: syncRows } = await supabase
    .from('vocab_sync')
    .select('streak')
    .in('child_id', childIds)

  let latest: string | null = null
  for (const row of syncRows ?? []) {
    const la = (row.streak as { lastActive?: string } | null)?.lastActive ?? ''
    if (la && (!latest || la > latest)) latest = la
  }
  return latest
}

/** Date string N days ago in YYYY-MM-DD format (UTC). */
export function dateStrDaysAgo(n: number): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - n)
  return d.toISOString().split('T')[0]
}

/** Days since (or until) an ISO date string, floored. Positive = past. */
export function daysSince(isoDate: string): number {
  return Math.floor((Date.now() - new Date(isoDate).getTime()) / 86_400_000)
}

/** Days until an ISO date string, floored. Positive = future. */
export function daysUntil(isoDate: string): number {
  return Math.floor((new Date(isoDate).getTime() - Date.now()) / 86_400_000)
}

/** DAILY_LEVEL_ORDER next level mapping. */
export const NEXT_DAILY_LEVEL: Record<string, { id: string; label: string; desc: string }> = {
  seeker:   { id: 'starter',  label: 'Starter (A1)',   desc: 'Từ vựng cơ bản — Lớp 3–4' },
  starter:  { id: 'ranger',   label: 'Ranger (A2)',    desc: 'Chủ đề phong phú hơn — Lớp 5–6' },
  ranger:   { id: 'explorer', label: 'Explorer (B1)',  desc: 'Từ vựng học thuật — THCS' },
  explorer: { id: 'scholar',  label: 'Scholar (B2)',   desc: 'Nâng cao — THPT' },
  scholar:  { id: 'master',   label: 'Master (C1)',    desc: 'Thành thạo — Luyện thi IELTS/SAT' },
}

export const DAILY_LEVEL_LABELS: Record<string, string> = {
  seeker:   'Seeker (Pre-A1)',
  starter:  'Starter (A1)',
  ranger:   'Ranger (A2)',
  explorer: 'Explorer (B1)',
  scholar:  'Scholar (B2)',
  master:   'Master (C1)',
}
