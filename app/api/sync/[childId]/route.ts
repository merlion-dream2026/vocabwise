import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSession } from '@/lib/auth'
import { triggerSignupReward } from '@/lib/referralUtils'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function verifyOwnership(childId: string, familyId: string) {
  const { data } = await supabase
    .from('children')
    .select('id, level')
    .eq('id', childId)
    .eq('family_id', familyId)
    .single()
  return data
}

// GET /api/sync/[childId]?level=xxx — single level's sync data
// GET /api/sync/[childId]          — all levels as { level: syncData }
export async function GET(req: NextRequest, { params }: { params: { childId: string } }) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const child = await verifyOwnership(params.childId, session.familyId)
  if (!child) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const level = new URL(req.url).searchParams.get('level')

  const cacheHeaders = { 'Cache-Control': 'private, max-age=10, stale-while-revalidate=30' }

  if (level) {
    const { data } = await supabase
      .from('vocab_sync')
      .select('seen, weak_words, streak, battle, mastery, history, srs, reset_at, revision_scores')
      .eq('child_id', params.childId)
      .eq('level', level)
      .single()
    return NextResponse.json(data ?? null, { headers: cacheHeaders })
  }

  // No level param → return all levels as { [level]: syncData }
  const { data } = await supabase
    .from('vocab_sync')
    .select('level, seen, weak_words, streak, battle, mastery, history, srs, reset_at, revision_scores')
    .eq('child_id', params.childId)

  const byLevel: Record<string, unknown> = {}
  for (const row of data ?? []) {
    const { level: lvl, ...rest } = row
    byLevel[lvl] = rest
  }
  return NextResponse.json(byLevel, { headers: cacheHeaders })
}

// POST /api/sync/[childId] — push sync data for a specific level
export async function POST(req: NextRequest, { params }: { params: { childId: string } }) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const child = await verifyOwnership(params.childId, session.familyId)
  if (!child) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json().catch(() => ({}))
  const { level, seen, weak_words, streak, battle, mastery, history, srs, srs_log, mastered_words } = body

  const activeLevel = level ?? child.level

  // Merge into the existing row instead of overwriting it — the client's in-memory
  // state can be stale (a failed GET on init, or a replayed offline snapshot), and a
  // blind overwrite would wipe out real progress the server already has. seen/mastery/
  // battle are monotonic (never un-see a word, un-master a topic, or lose XP), so they
  // union/max; srs is last-write-wins per key (never deleted, only rescheduled), which
  // is fine even under a stale init. weak_words is last-write-wins per key too, EXCEPT
  // deletions (a word mastered client-side) — those need the explicit mastered_words
  // list below, since a plain spread merge can't distinguish "omitted because deleted"
  // from "omitted because never touched".
  const { data: current } = await supabase
    .from('vocab_sync')
    .select('seen, weak_words, streak, battle, mastery, history, srs')
    .eq('child_id', params.childId)
    .eq('level', activeLevel)
    .single()

  const mergedSeen = Array.from(new Set([...(current?.seen ?? []), ...(seen ?? [])]))

  const mergedMastery: Record<string, { flashcard: boolean; games: string[] }> = { ...(current?.mastery ?? {}) }
  for (const [topicId, incoming] of Object.entries(mastery ?? {}) as [string, { flashcard: boolean; games: string[] }][]) {
    const existing = mergedMastery[topicId]
    mergedMastery[topicId] = {
      flashcard: (existing?.flashcard ?? false) || incoming.flashcard,
      games: Array.from(new Set([...(existing?.games ?? []), ...incoming.games])),
    }
  }

  const mergedHistory: Record<string, { words: number; games: number; xp: number; topicIds?: string[]; testsDone?: string[] }> = { ...(current?.history ?? {}) }
  for (const [date, incoming] of Object.entries(history ?? {}) as [string, { words: number; games: number; xp: number; topicIds?: string[]; testsDone?: string[] }][]) {
    const existing = mergedHistory[date]
    mergedHistory[date] = {
      words: Math.max(existing?.words ?? 0, incoming.words),
      games: Math.max(existing?.games ?? 0, incoming.games),
      xp: Math.max(existing?.xp ?? 0, incoming.xp),
      topicIds: Array.from(new Set([...(existing?.topicIds ?? []), ...(incoming.topicIds ?? [])])),
      testsDone: Array.from(new Set([...(existing?.testsDone ?? []), ...(incoming.testsDone ?? [])])),
    }
  }

  const currentStreak = current?.streak ?? { current: 0, best: 0, lastActive: '' }
  const incomingStreak = streak ?? currentStreak
  const mergedStreak = (incomingStreak.lastActive ?? '') >= (currentStreak.lastActive ?? '')
    ? {
        current: incomingStreak.current ?? 0,
        best: Math.max(currentStreak.best ?? 0, incomingStreak.best ?? 0),
        lastActive: incomingStreak.lastActive ?? currentStreak.lastActive,
      }
    : currentStreak

  const mergedBattle = { totalAllTime: Math.max(current?.battle?.totalAllTime ?? 0, battle?.totalAllTime ?? 0) }

  // weak_words deletions (a word mastered — 3 correct in a row) can't be expressed by a
  // plain {...current, ...incoming} spread, since an omitted key is indistinguishable
  // from "never touched" and would silently survive from `current`. Apply explicit
  // deletions first, then overlay `incoming` — so if the client also sends a fresh entry
  // for a word it just re-marked wrong (cancelling its own pending deletion), that fresh
  // entry still wins over the stale delete instruction.
  const mergedWeakWords: Record<string, unknown> = { ...(current?.weak_words ?? {}) }
  for (const word of (mastered_words ?? []) as string[]) delete mergedWeakWords[word]
  Object.assign(mergedWeakWords, weak_words ?? {})

  const mergedSrs = { ...(current?.srs ?? {}), ...(srs ?? {}) }

  const { data, error } = await supabase
    .from('vocab_sync')
    .upsert({
      child_id: params.childId,
      level: activeLevel,
      seen: mergedSeen,
      weak_words: mergedWeakWords,
      streak: mergedStreak,
      battle: mergedBattle,
      mastery: mergedMastery,
      history: mergedHistory,
      srs: mergedSrs,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'child_id,level' })
    .select('seen, weak_words, streak, battle, mastery, history, srs, reset_at')
    .single()

  if (error) return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 })

  // Append-only SRS review log — diagnostic only, never blocks the main sync response.
  type SrsLogEntry = { word: string; isCorrect: boolean; intervalBefore: number; intervalAfter: number; efBefore: number; efAfter: number }
  if (Array.isArray(srs_log) && srs_log.length > 0) {
    const rows = (srs_log as SrsLogEntry[]).map(e => ({
      child_id: params.childId,
      level: activeLevel,
      word: e.word,
      is_correct: e.isCorrect,
      interval_before: e.intervalBefore,
      interval_after: e.intervalAfter,
      ef_before: e.efBefore,
      ef_after: e.efAfter,
    }))
    // Awaited (not fire-and-forget) — Vercel can freeze the function once the response
    // is sent, which would silently drop an unawaited insert.
    const { error: logError } = await supabase.from('vocab_srs_log').insert(rows)
    if (logError) console.error('[sync] vocab_srs_log insert error:', logError)
  }

  // Auto-track last active vocab level on child profile (excludes 'phonics')
  const VOCAB_LEVELS = ['seeker', 'starter', 'ranger', 'explorer', 'scholar', 'master']
  if (VOCAB_LEVELS.includes(activeLevel)) {
    await supabase.from('children').update({ level: activeLevel }).eq('id', params.childId)
  }

  // 2A: Trigger signup referral reward nếu bé đã học được gì đó (seen không rỗng)
  // Fire-and-forget — không block response
  if (mergedSeen.length > 0) {
    triggerSignupReward(session.familyId).catch(err =>
      console.error('[sync] referral trigger error:', err)
    )
  }

  return NextResponse.json(data)
}

// PATCH /api/sync/[childId] — merge a single revision score without touching other fields
export async function PATCH(req: NextRequest, { params }: { params: { childId: string } }) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const child = await verifyOwnership(params.childId, session.familyId)
  if (!child) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json().catch(() => ({}))
  const { level, revision_score_key, revision_score_value } = body
  if (!level || !revision_score_key || !revision_score_value) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const { data: current } = await supabase
    .from('vocab_sync')
    .select('revision_scores')
    .eq('child_id', params.childId)
    .eq('level', level)
    .single()

  const merged = { ...(current?.revision_scores ?? {}), [revision_score_key]: revision_score_value }

  if (current) {
    await supabase
      .from('vocab_sync')
      .update({ revision_scores: merged, updated_at: new Date().toISOString() })
      .eq('child_id', params.childId)
      .eq('level', level)
  } else {
    await supabase
      .from('vocab_sync')
      .insert({
        child_id: params.childId,
        level,
        seen: [], weak_words: {}, streak: {}, battle: {}, mastery: {}, history: {}, srs: {},
        revision_scores: merged,
        updated_at: new Date().toISOString(),
      })
  }

  return NextResponse.json({ ok: true })
}
