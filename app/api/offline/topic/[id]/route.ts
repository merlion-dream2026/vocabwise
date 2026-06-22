import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { supabase } from '@/lib/supabaseServer'
import { getEffectivePlan, getPlanTier } from '@/lib/planUtils'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: RouteParams) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: topicId } = await params

  if (!/^b[123]-t\d{2,3}$/.test(topicId)) {
    return NextResponse.json({ error: 'Invalid topic ID' }, { status: 400 })
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

  // Plan tier — for client to enforce download cap
  const tier = getPlanTier(family)
  const limit = tier === 'pro1' ? 20 : null

  return NextResponse.json({ ok: true, topicId, limit })
}
