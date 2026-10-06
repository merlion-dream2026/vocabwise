import type { SupabaseClient } from '@supabase/supabase-js'
import { isTopicMastered, type MasteryEntry } from '@/lib/topicMastery'

// Topics already complete before this moment get a "legacy" sticker (album only, not redeemable) so
// launching rewards doesn't hand a child a pile of redeemable stickers for past work.
export const STICKER_LAUNCH_AT = '2026-10-06T00:00:00.000Z'

// Daily vocab levels. vocab_sync also holds rows for other modules ('phonics', 'academic') whose mastery
// has a different meaning — those must never produce Daily stickers.
export const DAILY_LEVELS = ['seeker', 'starter', 'ranger', 'explorer', 'scholar', 'master'] as const

export type StickerRow = { collection?: string; level: string; topic_id: string; earned_at: string; legacy: boolean; redemption_id: number | null }

// When the child finished the topic: the latest game attempt. Topics with no attempt timestamps
// (pre-hub format) are treated as old.
function completedAt(entry: MasteryEntry): string | null {
  const ats = Object.values(entry.modes ?? {}).map((m) => m.at).filter(Boolean)
  return ats.length ? ats.sort().at(-1)! : null
}

/**
 * Insert a sticker for every mastered topic that doesn't have one yet. Idempotent (unique key +
 * ignoreDuplicates), so calling it on every sync is safe. Never throws — rewards must not break sync.
 * Returns the topic ids that got a NEW non-legacy sticker.
 */
export async function awardStickers(
  supabase: SupabaseClient, childId: string, level: string, mastery: Record<string, MasteryEntry>,
  collection: 'daily' | 'academic' | 'phonics' = 'daily',
): Promise<string[]> {
  if (collection === 'daily' && !(DAILY_LEVELS as readonly string[]).includes(level)) return []
  try {
    const mastered = Object.entries(mastery).filter(([, e]) => isTopicMastered(e, level))
    if (mastered.length === 0) return []
    const { data: have, error } = await supabase.from('child_stickers').select('topic_id').eq('child_id', childId).eq('level', level).eq('collection', collection)
    if (error) return []
    const owned = new Set((have ?? []).map((r: { topic_id: string }) => r.topic_id))
    const fresh = mastered.filter(([id]) => !owned.has(id))
    if (fresh.length === 0) return []
    const rows = fresh.map(([topic_id, e]) => {
      const at = completedAt(e)
      return { child_id: childId, collection, level, topic_id, legacy: !at || at < STICKER_LAUNCH_AT }
    })
    const { error: insErr } = await supabase.from('child_stickers').upsert(rows, { onConflict: 'child_id,collection,level,topic_id', ignoreDuplicates: true })
    if (insErr) return []
    return rows.filter((r) => !r.legacy).map((r) => r.topic_id)
  } catch {
    return []
  }
}

// ── Academic (vocabwise books) ────────────────────────────────────────────────
// Per-child Academic progress (vw_academic_sync_child) is fresh, so a topic mastered (≥20/25) is always
// new → never legacy. Sticker key: collection 'academic', level = 'book1' | 'book2' | 'book3', topic_id = 'b1-t01'.
type AcademicTopic = { mastered?: boolean }

export async function awardAcademicStickers(
  supabase: SupabaseClient, childId: string, mastery: Record<string, AcademicTopic>,
): Promise<string[]> {
  try {
    const mastered = Object.entries(mastery)
      .filter(([id, e]) => e?.mastered && /^b[123]-t\d{2,3}$/.test(id))
      .map(([id]) => ({ id, level: `book${id[1]}` }))
    if (mastered.length === 0) return []
    const { data: have, error } = await supabase.from('child_stickers').select('topic_id').eq('child_id', childId).eq('collection', 'academic')
    if (error) return []
    const owned = new Set((have ?? []).map((r: { topic_id: string }) => r.topic_id))
    const fresh = mastered.filter((m) => !owned.has(m.id))
    if (fresh.length === 0) return []
    const rows = fresh.map((m) => ({ child_id: childId, collection: 'academic', level: m.level, topic_id: m.id, legacy: false }))
    const { error: insErr } = await supabase.from('child_stickers').upsert(rows, { onConflict: 'child_id,collection,level,topic_id', ignoreDuplicates: true })
    return insErr ? [] : fresh.map((m) => m.id)
  } catch {
    return []
  }
}
