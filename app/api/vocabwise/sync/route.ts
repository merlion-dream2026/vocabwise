import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSession } from '@/lib/auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const CACHE = { headers: { 'Cache-Control': 'private, max-age=10, stale-while-revalidate=30' } }

// GET /api/vocabwise/sync — academic progress for current family (no childId needed)
export async function GET(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const familyId = session.familyId

  const { data } = await supabase
    .from('vw_academic_sync')
    .select('mastery, srs, history, revision_scores')
    .eq('family_id', familyId)
    .single()

  if (data) return NextResponse.json(data, CACHE)

  // Lazy migration: check old vocab_sync rows (level='academic') for any of this family's children
  const { data: children } = await supabase
    .from('children')
    .select('id')
    .eq('family_id', familyId)

  if (children?.length) {
    const childIds = children.map((c: { id: string }) => c.id)
    const { data: oldRows } = await supabase
      .from('vocab_sync')
      .select('mastery, srs, history')
      .in('child_id', childIds)
      .eq('level', 'academic')

    if (oldRows?.length) {
      const mastery: Record<string, unknown> = {}
      const srs: Record<string, unknown> = {}
      const history: Record<string, unknown> = {}
      for (const row of oldRows) {
        Object.assign(mastery, row.mastery ?? {})
        Object.assign(srs, row.srs ?? {})
        Object.assign(history, row.history ?? {})
      }
      // Save migrated data to new table
      await supabase.from('vw_academic_sync').upsert(
        { family_id: familyId, mastery, srs, history, revision_scores: {}, updated_at: new Date().toISOString() },
        { onConflict: 'family_id' }
      )
      return NextResponse.json({ mastery, srs, history, revision_scores: {} }, CACHE)
    }
  }

  return NextResponse.json({ mastery: {}, srs: {}, history: {}, revision_scores: {} }, CACHE)
}

// POST /api/vocabwise/sync — save academic mastery/srs/history
export async function POST(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const { mastery, srs, history } = body

  const { data, error } = await supabase
    .from('vw_academic_sync')
    .upsert(
      { family_id: session.familyId, mastery: mastery ?? {}, srs: srs ?? {}, history: history ?? {}, updated_at: new Date().toISOString() },
      { onConflict: 'family_id' }
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
  if (!revision_score_key || !revision_score_value) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const { data: current } = await supabase
    .from('vw_academic_sync')
    .select('revision_scores')
    .eq('family_id', session.familyId)
    .single()

  const merged = { ...(current?.revision_scores ?? {}), [revision_score_key]: revision_score_value }

  if (current) {
    await supabase
      .from('vw_academic_sync')
      .update({ revision_scores: merged, updated_at: new Date().toISOString() })
      .eq('family_id', session.familyId)
  } else {
    await supabase
      .from('vw_academic_sync')
      .insert({ family_id: session.familyId, mastery: {}, srs: {}, history: {}, revision_scores: merged, updated_at: new Date().toISOString() })
  }

  return NextResponse.json({ ok: true })
}
