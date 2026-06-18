import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAdminSession } from '@/lib/auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function requireSuperAdmin(req: NextRequest) {
  const session = await getAdminSession(req)
  return session?.familyId === 'superadmin'
}

const PLAN_PRICES: Record<string, number> = {
  '1month': 59000,
  '3months': 159000,
  '6months': 299000,
}

const PLAN_MONTHLY: Record<string, number> = {
  '1month': 59000,
  '3months': 53000,
  '6months': 49833,
}

export async function GET(req: NextRequest) {
  if (!await requireSuperAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: families } = await supabase
    .from('families')
    .select('id, plan, plan_end_date, free_trial_expires_at, email_verified, disabled, bonus_pro_expires_at')

  if (!families) return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 })

  const now = new Date()

  const isPro = (f: typeof families[0]) =>
    (f.plan !== 'free' && f.plan_end_date && new Date(f.plan_end_date) > now) ||
    !!(f.bonus_pro_expires_at && new Date(f.bonus_pro_expires_at) > now)

  const isPlanActive = (f: typeof families[0]) => {
    if (f.bonus_pro_expires_at && new Date(f.bonus_pro_expires_at) > now) return true
    if (f.plan !== 'free') return f.plan_end_date ? new Date(f.plan_end_date) > now : false
    return f.free_trial_expires_at ? new Date(f.free_trial_expires_at) > now : false
  }

  // Only verified + not disabled = accurate base
  const verified = families.filter(f => f.email_verified && !f.disabled)
  const total = verified.length
  const proActive  = verified.filter(isPro).length
  const freeTrial  = verified.filter(f => f.plan === 'free' && isPlanActive(f)).length
  const expired    = verified.filter(f => !isPlanActive(f)).length

  // MRR — current active paid plans
  const mrrCounts = { '1month': 0, '3months': 0, '6months': 0 }
  for (const f of verified) {
    if (isPro(f) && f.plan in mrrCounts) mrrCounts[f.plan as keyof typeof mrrCounts]++
  }
  const mrr = Object.entries(mrrCounts).reduce(
    (sum, [plan, cnt]) => sum + cnt * (PLAN_MONTHLY[plan] ?? 0), 0
  )

  // Cumulative revenue — all families ever paid (regardless of expiry/verified)
  const allTimeCounts = { '1month': 0, '3months': 0, '6months': 0 }
  for (const f of families) {
    if (f.plan in allTimeCounts) allTimeCounts[f.plan as keyof typeof allTimeCounts]++
  }
  const totalRevenue = Object.entries(allTimeCounts).reduce(
    (sum, [plan, cnt]) => sum + cnt * (PLAN_PRICES[plan] ?? 0), 0
  )

  const conversionRate = total > 0 ? +(proActive / total * 100).toFixed(1) : 0

  return NextResponse.json({
    total,
    pro_active: proActive,
    free_trial: freeTrial,
    expired,
    mrr,
    mrr_breakdown: Object.entries(mrrCounts).map(([plan, count]) => ({
      plan,
      count,
      revenue: count * (PLAN_MONTHLY[plan] ?? 0),
    })),
    conversion_rate: conversionRate,
    total_revenue: totalRevenue,
    total_revenue_breakdown: Object.entries(allTimeCounts).map(([plan, count]) => ({
      plan,
      count,
      revenue: count * (PLAN_PRICES[plan] ?? 0),
    })),
  })
}
