import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { supabase } from '@/lib/supabaseServer'
import { serverError } from '@/lib/api'

// "Con đọc đúng mà" under a failed Azure result: flags the logged attempt as a likely false reject.
// Only the family's own failed, not-yet-disputed rows; the verdict itself doesn't change.
export async function POST(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const id = Number(body.logId)
  if (!Number.isSafeInteger(id) || id <= 0) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

  const { error } = await supabase.from('pronunciation_log')
    .update({ disputed_at: new Date().toISOString() })
    .eq('id', id).eq('family_id', session.familyId).eq('ok', false).is('disputed_at', null)
  if (error) return serverError(error)
  return NextResponse.json({ ok: true })
}
