import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSession } from '@/lib/auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function requireSuperAdmin(req: NextRequest) {
  const session = await getSession(req)
  return session?.familyId === 'superadmin'
}

export async function GET(req: NextRequest) {
  if (!await requireSuperAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000).toISOString()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString()

  const [
    { data: families },
    { data: children },
    { count: syncActiveWeek },
  ] = await Promise.all([
    supabase.from('families')
      .select('id, plan, plan_end_date, free_trial_expires_at, email_verified, disabled, created_at, bonus_pro_expires_at'),
    supabase.from('children').select('id, family_id'),
    supabase.from('vocab_sync')
      .select('*', { count: 'exact', head: true })
      .gte('updated_at', sevenDaysAgo),
  ])

  if (!families) return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 })

  // ── Phân loại accounts ──
  const verified    = families.filter(f => f.email_verified && !f.disabled)
  const total       = families.length
  const totalActive = verified.length

  const isPlanActive = (f: typeof families[0]) => {
    if (f.bonus_pro_expires_at && new Date(f.bonus_pro_expires_at) > now) return true
    if (f.plan !== 'free') return f.plan_end_date ? new Date(f.plan_end_date) > now : false
    return f.free_trial_expires_at ? new Date(f.free_trial_expires_at) > now : false
  }

  const isPro = (f: typeof families[0]) =>
    (f.plan !== 'free' && f.plan_end_date && new Date(f.plan_end_date) > now) ||
    (f.bonus_pro_expires_at && new Date(f.bonus_pro_expires_at) > now)

  const activeFree = verified.filter(f => f.plan === 'free' && isPlanActive(f))
  const activePro  = verified.filter(f => isPro(f))
  const expired    = verified.filter(f => !isPlanActive(f))
  const newThisMonth = verified.filter(f => f.created_at >= thirtyDaysAgo)

  // ── Conversion: trial → pro ──
  const everPro = families.filter(f => f.plan !== 'free').length
  const conversionRate = totalActive > 0 ? Math.round((everPro / totalActive) * 100) : 0

  // ── Activation: có ít nhất 1 bé ──
  const familiesWithChild = new Set(children?.map(c => c.family_id) ?? [])
  const activationRate = totalActive > 0
    ? Math.round((familiesWithChild.size / totalActive) * 100)
    : 0

  // ── By plan ──
  const byPlan: Record<string, number> = {}
  for (const f of families) {
    byPlan[f.plan] = (byPlan[f.plan] ?? 0) + 1
  }

  return NextResponse.json({
    total,
    total_active: totalActive,
    active_free: activeFree.length,
    active_pro: activePro.length,
    expired: expired.length,
    new_this_month: newThisMonth.length,
    conversion_rate_pct: conversionRate,
    activation_rate_pct: activationRate,
    active_this_week: syncActiveWeek ?? 0,
    by_plan: byPlan,
  })
}
