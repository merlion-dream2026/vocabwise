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
  const { level, seen, weak_words, streak, battle, mastery, history, srs } = body

  const activeLevel = level ?? child.level
  const { data, error } = await supabase
    .from('vocab_sync')
    .upsert({
      child_id: params.childId,
      level: activeLevel,
      seen: seen ?? [],
      weak_words: weak_words ?? {},
      streak: streak ?? {},
      battle: battle ?? {},
      mastery: mastery ?? {},
      history: history ?? {},
      srs: srs ?? {},
      updated_at: new Date().toISOString(),
    }, { onConflict: 'child_id,level' })
    .select('seen, weak_words, streak, battle, mastery, history, srs, reset_at')
    .single()

  if (error) return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 })

  // Auto-track last active vocab level on child profile (excludes 'phonics')
  const VOCAB_LEVELS = ['seeker', 'starter', 'ranger', 'explorer', 'scholar', 'master']
  if (VOCAB_LEVELS.includes(activeLevel)) {
    await supabase.from('children').update({ level: activeLevel }).eq('id', params.childId)
  }

  // 2A: Trigger signup referral reward nếu bé đã học được gì đó (seen không rỗng)
  // Fire-and-forget — không block response
  if (Array.isArray(seen) && seen.length > 0) {
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
