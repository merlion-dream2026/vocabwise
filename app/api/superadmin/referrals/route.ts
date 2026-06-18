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

/** GET /api/superadmin/referrals — tổng quan referral stats cho superadmin */
export async function GET(req: NextRequest) {
  if (!await requireSuperAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [{ data: allReferrals }, { data: topReferrers }] = await Promise.all([
    // Tất cả referrals với joined info
    supabase
      .from('referrals')
      .select('id, status, created_at, signup_rewarded_at, paid_rewarded_at, signup_reward_days, paid_reward_days')
      .order('created_at', { ascending: false }),

    // Top referrers: join families để lấy username
    supabase.rpc('get_top_referrers', { limit_count: 10 }).maybeSingle(),
  ])

  if (!allReferrals) return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 })

  const byStatus: Record<string, number> = {}
  let totalBonusDays = 0

  for (const r of allReferrals) {
    byStatus[r.status] = (byStatus[r.status] ?? 0) + 1
    if (r.status === 'signup_rewarded') totalBonusDays += (r.signup_reward_days ?? 7)
    if (r.status === 'paid_rewarded') totalBonusDays += (r.signup_reward_days ?? 7) + (r.paid_reward_days ?? 14)
  }

  // Top 10 referrers: count referrals per referrer_id + join username
  type ReferralJoin = { referrer_id: string; families: { username: string } | null }
  const { data: topRaw } = await supabase
    .from('referrals')
    .select('referrer_id, families!referrals_referrer_id_fkey(username)')
    .not('status', 'eq', 'pending') as { data: ReferralJoin[] | null }

  const referrerMap: Record<string, { username: string; count: number }> = {}
  for (const r of topRaw ?? []) {
    const id = r.referrer_id
    if (!referrerMap[id]) {
      referrerMap[id] = {
        username: r.families?.username ?? id,
        count: 0,
      }
    }
    referrerMap[id].count++
  }
  const topList = Object.values(referrerMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  return NextResponse.json({
    total: allReferrals.length,
    by_status: byStatus,
    total_bonus_days_given: totalBonusDays,
    top_referrers: topList,
    recent: allReferrals.slice(0, 20),
  })
}
