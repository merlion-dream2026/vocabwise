import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { supabase } from '@/lib/supabaseServer'
import { getEffectivePlan, getOfflineDownloadLimit } from '@/lib/planUtils'
import { rateLimit } from '@/lib/rateLimit'

const VALID_LEVELS = new Set(['seeker', 'starter', 'ranger', 'explorer', 'scholar', 'master'])

export async function POST(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Rate limit: 30 downloads/hour/family (POST — not covered by middleware GET limiter)
  const { allowed } = await rateLimit(`offline:daily:${session.familyId}`, 30, 3600)
  if (!allowed) {
    return NextResponse.json({ error: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.' }, { status: 429 })
  }

  const body = await req.json().catch(() => null)
  const childId = typeof body?.childId === 'string' ? body.childId : ''
  const level   = typeof body?.level === 'string' ? body.level : ''
  const topicId = typeof body?.topicId === 'string' ? body.topicId : ''

  if (!childId || !VALID_LEVELS.has(level) || !topicId) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { data: family } = await supabase
    .from('families')
    .select('plan, plan_end_date, free_trial_expires_at, bonus_pro_expires_at, bonus_features')
    .eq('id', session.familyId)
    .single()

  if (!family) return NextResponse.json({ error: 'Account not found' }, { status: 404 })

  const { isProActive } = getEffectivePlan(family)
  if (!isProActive) {
    return NextResponse.json({ error: 'Pro plan required for offline downloads.' }, { status: 403 })
  }

  // childId must belong to this family
  const { data: child } = await supabase
    .from('children')
    .select('id')
    .eq('id', childId)
    .eq('family_id', session.familyId)
    .single()

  if (!child) return NextResponse.json({ error: 'Child not found' }, { status: 404 })

  const limit = getOfflineDownloadLimit(family)
  return NextResponse.json({ ok: true, limit })
}
