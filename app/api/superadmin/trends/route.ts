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

const MONTHLY_PRICE: Record<string, number> = {
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
    .select('id, plan, plan_start_date, plan_end_date, created_at, bonus_pro_expires_at')

  if (!families) return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 })

  const now = new Date()
  const result = []

  for (let i = 5; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthEnd   = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59)

    const label = monthStart.toLocaleDateString('vi-VN', { month: 'short', year: '2-digit' })
      .replace(' ', '/').replace('thg ', 'T')

    // New signups this month
    const signups = families.filter(f => {
      const d = new Date(f.created_at)
      return d >= monthStart && d <= monthEnd
    }).length

    // Active Pro accounts + MRR this month
    let mrr = 0
    let proCount = 0
    for (const f of families) {
      // Paid plan active this month
      if (f.plan !== 'free' && f.plan_start_date && f.plan_end_date) {
        const start = new Date(f.plan_start_date)
        const end   = new Date(f.plan_end_date)
        if (start <= monthEnd && end >= monthStart) {
          mrr += MONTHLY_PRICE[f.plan] ?? 0
          proCount++
          continue
        }
      }
      // Bonus Pro active this month (referral reward — no MRR)
      if (f.bonus_pro_expires_at) {
        const bonusEnd = new Date(f.bonus_pro_expires_at)
        const acctStart = new Date(f.created_at)
        if (acctStart <= monthEnd && bonusEnd >= monthStart) proCount++
      }
    }

    // Churn: Pro plans that expired this month
    const churn = families.filter(f => {
      if (f.plan === 'free' || !f.plan_end_date) return false
      const end = new Date(f.plan_end_date)
      return end >= monthStart && end <= monthEnd
    }).length

    result.push({ label, signups, mrr, pro_count: proCount, churn })
  }

  return NextResponse.json(result)
}
