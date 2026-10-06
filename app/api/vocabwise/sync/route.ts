import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSession } from '@/lib/auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const CACHE = { headers: { 'Cache-Control': 'private, max-age=10, stale-while-revalidate=30' } }
const TABLE = 'vw_academic_sync_child'

// Academic progress is per child. The child comes from ?childId= (GET) or body.childId (POST/PATCH) and
// must belong to the caller's family. With no childId, a family with exactly one child resolves to it;
// a family with several gets 409 'child_required' (the client sends the learner to /kids to pick).
async function resolveChild(familyId: string, explicit: unknown): Promise<{ childId: string } | { error: NextResponse }> {
  const { data: kids } = await supabase.from('children').select('id').eq('family_id', familyId)
  const ids = (kids ?? []).map((k: { id: string }) => k.id)
  if (typeof explicit === 'string' && explicit) {
    return ids.includes(explicit) ? { childId: explicit } : { error: NextResponse.json({ error: 'Not found' }, { status: 404 }) }
  }
  if (ids.length === 1) return { childId: ids[0] }
  return { error: NextResponse.json({ error: 'child_required' }, { status: 409 }) }
}

// GET /api/vocabwise/sync?childId= — this child's academic progress
export async function GET(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const resolved = await resolveChild(session.familyId, new URL(req.url).searchParams.get('childId'))
  if ('error' in resolved) return resolved.error

  const { data } = await supabase
    .from(TABLE)
    .select('mastery, srs, history, revision_scores')
    .eq('child_id', resolved.childId)
    .single()

  return NextResponse.json(data ?? { mastery: {}, srs: {}, history: {}, revision_scores: {} }, CACHE)
}

type TopicSync = { read?: boolean; completed?: boolean; mastered?: boolean; ex_scores?: Record<string, number> }
type SrsEntry = { due: string; interval: number }
type HistoryEntry = { topics?: number; xp?: number; games?: number; words?: number; topicIds?: string[]; testsDone?: string[] }

// POST /api/vocabwise/sync — save academic mastery/srs/history
export async function POST(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const { mastery, srs, history } = body
  const resolved = await resolveChild(session.familyId, body.childId)
  if ('error' in resolved) return resolved.error
  const childId = resolved.childId

  // Every page (TopicViewer, review queue, module-test, revision test) fetches this
  // family's full mastery/srs/history ONCE on mount, then POSTs that whole snapshot
  // back on every topic/test completion. A blind overwrite here means whichever POST
  // lands last wins outright — if two tabs/devices are progressing different topics,
  // the second POST's stale snapshot erases the first tab's completion. Merge instead,
  // matching the read-current pattern used by /api/sync/[childId].
  const { data: current } = await supabase
    .from(TABLE)
    .select('mastery, srs, history')
    .eq('child_id', childId)
    .single()

  const mergedMastery: Record<string, TopicSync> = { ...(current?.mastery ?? {}) }
  for (const [topicId, incoming] of Object.entries(mastery ?? {}) as [string, TopicSync][]) {
    const existing = mergedMastery[topicId]
    const mergedExScores: Record<string, number> = { ...(existing?.ex_scores ?? {}) }
    for (const [exType, score] of Object.entries(incoming.ex_scores ?? {})) {
      mergedExScores[exType] = Math.max(mergedExScores[exType] ?? 0, score)
    }
    mergedMastery[topicId] = {
      read: (existing?.read ?? false) || !!incoming.read,
      completed: (existing?.completed ?? false) || !!incoming.completed,
      mastered: (existing?.mastered ?? false) || !!incoming.mastered,
      ex_scores: mergedExScores,
    }
  }

  // srs is last-write-wins per topicId — never deleted, only rescheduled, so a stale
  // snapshot can't resurrect anything here the way weak_words deletions could.
  const mergedSrs: Record<string, SrsEntry> = { ...(current?.srs ?? {}), ...(srs ?? {}) }

  const mergedHistory: Record<string, HistoryEntry> = { ...(current?.history ?? {}) }
  for (const [date, incoming] of Object.entries(history ?? {}) as [string, HistoryEntry][]) {
    const existing = mergedHistory[date]
    mergedHistory[date] = {
      topics: Math.max(existing?.topics ?? 0, incoming.topics ?? 0),
      xp: Math.max(existing?.xp ?? 0, incoming.xp ?? 0),
      games: Math.max(existing?.games ?? 0, incoming.games ?? 0),
      words: Math.max(existing?.words ?? 0, incoming.words ?? 0),
      topicIds: Array.from(new Set([...(existing?.topicIds ?? []), ...(incoming.topicIds ?? [])])),
      testsDone: Array.from(new Set([...(existing?.testsDone ?? []), ...(incoming.testsDone ?? [])])),
    }
  }

  const { data, error } = await supabase
    .from(TABLE)
    .upsert(
      { child_id: childId, mastery: mergedMastery, srs: mergedSrs, history: mergedHistory, updated_at: new Date().toISOString() },
      { onConflict: 'child_id' }
    )
    .select('mastery, srs, history, revision_scores')
    .single()

  if (error) return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 })
  return NextResponse.json(data)
}

// PATCH /api/vocabwise/sync — merge a single revision score without touching mastery/srs/history
export async function PATCH(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const { revision_score_key, revision_score_value } = body
  const resolved = await resolveChild(session.familyId, body.childId)
  if ('error' in resolved) return resolved.error
  const childId = resolved.childId
  if (!revision_score_key || !revision_score_value) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const { data: current } = await supabase
    .from(TABLE)
    .select('revision_scores')
    .eq('child_id', childId)
    .single()

  const merged = { ...(current?.revision_scores ?? {}), [revision_score_key]: revision_score_value }

  if (current) {
    await supabase
      .from(TABLE)
      .update({ revision_scores: merged, updated_at: new Date().toISOString() })
      .eq('child_id', childId)
  } else {
    await supabase
      .from(TABLE)
      .insert({ child_id: childId, mastery: {}, srs: {}, history: {}, revision_scores: merged, updated_at: new Date().toISOString() })
  }

  return NextResponse.json({ ok: true })
}
