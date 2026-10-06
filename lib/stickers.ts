import type { SupabaseClient } from '@supabase/supabase-js'
import { isTopicMastered, type MasteryEntry } from '@/lib/topicMastery'

// Topics already complete before this moment get a "legacy" sticker (album only, not redeemable) so
// launching rewards doesn't hand a child a pile of redeemable stickers for past work.
export const STICKER_LAUNCH_AT = '2026-10-06T00:00:00.000Z'

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
