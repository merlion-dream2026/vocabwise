import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSession } from '@/lib/auth'
import { awardStickers } from '@/lib/stickers'
import type { MasteryEntry } from '@/lib/topicMastery'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/stickers/[childId] — every sticker the child owns (all levels), newest first.
export async function GET(req: NextRequest, props: { params: Promise<{ childId: string }> }) {
  const { childId } = await props.params
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: child } = await supabase
    .from('children').select('id').eq('id', childId).eq('family_id', session.familyId).single()
  if (!child) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Backfill: award stickers for any mastered topic that doesn't have one yet (covers topics finished
  // before stickers existed, and any sync that failed to award). Idempotent; never throws.
  const { data: syncRows } = await supabase.from('vocab_sync').select('level, mastery').eq('child_id', childId)
  await Promise.all((syncRows ?? []).map((r: { level: string; mastery: Record<string, MasteryEntry> | null }) =>
    awardStickers(supabase, childId, r.level, r.mastery ?? {})))

  const { data, error } = await supabase
    .from('child_stickers')
    .select('collection, level, topic_id, earned_at, legacy, redemption_id')
    .eq('child_id', childId)
    .order('earned_at', { ascending: false })
  // Table missing (migration not applied yet) or any DB error: behave as "no stickers", never break the UI.
  if (error) return NextResponse.json([], { headers: { 'Cache-Control': 'private, no-store' } })
  return NextResponse.json(data ?? [], { headers: { 'Cache-Control': 'private, no-store' } })
}
