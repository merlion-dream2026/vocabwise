import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSession } from '@/lib/auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/** Mask SĐT: 0901234567 → "0901 xxx 567" */
function maskPhone(phone: string): string {
  const p = (phone ?? '').replace(/\D/g, '')
  if (p.length < 7) return '0xxx xxx xxx'
  return `${p.slice(0, 4)} xxx ${p.slice(-3)}`
}

export async function GET() {
  const session = await getSession()
  if (!session || session.familyId === 'superadmin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Lấy referral_code + bonus_pro_expires_at của referrer
  const { data: me } = await supabase
    .from('families')
    .select('referral_code, bonus_pro_expires_at')
    .eq('id', session.familyId)
    .single()

  // Lấy tất cả referrals mà mình là referrer
  const { data: referrals } = await supabase
    .from('referrals')
    .select('id, referred_id, status, signup_reward_days, paid_reward_days, signup_rewarded_at, paid_rewarded_at, signup_reward_available_at, created_at')
    .eq('referrer_id', session.familyId)
    .order('created_at', { ascending: false })

  // Lấy phone của từng referred user (để mask hiển thị)
  const referredIds = (referrals ?? []).map(r => r.referred_id)
  const phoneMap: Record<string, string> = {}
  if (referredIds.length > 0) {
    const { data: referred } = await supabase
      .from('families')
      .select('id, username')
      .in('id', referredIds)
    for (const f of referred ?? []) {
      phoneMap[f.id] = maskPhone(f.username)
    }
  }

  // Tính stats
  const list = (referrals ?? []).map(r => ({
    id: r.id,
    phone_masked: phoneMap[r.referred_id] ?? '0xxx xxx xxx',
    status: r.status as string,
    signup_reward_days: r.signup_reward_days ?? 7,
    paid_reward_days: r.paid_reward_days ?? 14,
    signup_rewarded_at: r.signup_rewarded_at ?? null,
    paid_rewarded_at: r.paid_rewarded_at ?? null,
    signup_reward_available_at: r.signup_reward_available_at ?? null,
    created_at: r.created_at,
  }))

  const totalDaysEarned = list.reduce((sum, r) => {
    if (r.status === 'paid_rewarded') return sum + r.signup_reward_days + r.paid_reward_days
    if (r.status === 'signup_rewarded') return sum + r.signup_reward_days
    return sum
  }, 0)

  return NextResponse.json({
    referral_code: me?.referral_code ?? null,
    bonus_pro_expires_at: me?.bonus_pro_expires_at ?? null,
    stats: {
      total_referred: list.length,
      total_rewarded: list.filter(r => ['signup_rewarded', 'paid_rewarded'].includes(r.status)).length,
      total_days_earned: totalDaysEarned,
    },
    referrals: list,
  })
}
