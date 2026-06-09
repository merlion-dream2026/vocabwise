import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSession } from '@/lib/auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST /api/sync/[childId]/reset — wipe progress for a child
export async function POST(req: NextRequest, { params }: { params: { childId: string } }) {
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
