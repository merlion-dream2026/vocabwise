import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseServer'
import { getSession } from '@/lib/auth'

// POST /api/sync/[childId]/reset — wipe progress for a child
export async function POST(req: NextRequest, props: { params: Promise<{ childId: string }> }) {
  const params = await props.params;
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: child } = await supabase
    .from('children')
    .select('id, level')
    .eq('id', params.childId)
    .eq('family_id', session.familyId)
    .single()

  if (!child) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const resetAt = new Date().toISOString()
  const { error } = await supabase
    .from('vocab_sync')
    .upsert({
      child_id: params.childId,
      level: child.level,
      seen: [],
      weak_words: {},
      streak: {},
      battle: {},
      mastery: {},
      reset_at: resetAt,
      updated_at: resetAt,
    }, { onConflict: 'child_id,level' })

  if (error) return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 })
  return NextResponse.json({ ok: true, reset_at: resetAt })
}
