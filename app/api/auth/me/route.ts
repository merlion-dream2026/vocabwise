import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSession } from '@/lib/auth'
import { releasePendingSignupRewards } from '@/lib/referralUtils'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json(null)

  if (session.familyId === 'superadmin') return NextResponse.json(session)

  const [{ data }, { data: configs }] = await Promise.all([
    supabase
      .from('families')
      .select('free_trial_expires_at, plan_end_date, plan, disabled, max_kids, bonus_pro_expires_at, referral_code, gift_token')
      .eq('id', session.familyId)
      .single(),
    supabase.from('admin_config').select('key, value'),
  ])

  if (!data || data.disabled) return NextResponse.json(null)

  const configMap: Record<string, number> = {}
  for (const row of configs ?? []) configMap[row.key] = parseInt(row.value)
  const globalDefault = data.plan === 'free' ? (configMap.free_max_kids ?? 1) : (configMap.pro_max_kids ?? 3)

  // 2B: Release signup rewards đã đủ 24h (lazy check mỗi lần load dashboard)
  // Nếu có reward mới → cập nhật bonus_pro_expires_at trong response
  let bonusProExpiresAt = data.bonus_pro_expires_at ?? null
  const released = await releasePendingSignupRewards(session.familyId, bonusProExpiresAt)
  if (released) bonusProExpiresAt = released

  return NextResponse.json({
    ...session,
    plan: data.plan,
    free_trial_expires_at: data.free_trial_expires_at ?? null,
    plan_end_date: data.plan_end_date ?? null,
    bonus_pro_expires_at: bonusProExpiresAt,
    referral_code: data.referral_code ?? null,
    gift_token: data.gift_token ?? null,
    max_kids: data.max_kids ?? globalDefault,
  })
}
