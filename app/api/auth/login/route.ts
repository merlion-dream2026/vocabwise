import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyPassword, createSession, sessionCookieOptions } from '@/lib/auth'
import { rateLimit } from '@/lib/rateLimit'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function isExpired(plan: string, freeTrialExpiresAt: string | null, planEndDate: string | null, bonusProExpiresAt: string | null): boolean {
  const now = new Date()
  // Bonus Pro active → không block đăng nhập
  if (bonusProExpiresAt && new Date(bonusProExpiresAt) > now) return false
  if (plan === 'free') return freeTrialExpiresAt ? new Date(freeTrialExpiresAt) < now : false
  return planEndDate ? new Date(planEndDate) < now : false
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown'
  if (!rateLimit(`login:${ip}`, 5, 60).allowed) {
    return NextResponse.json({ error: 'Quá nhiều lần thử. Vui lòng thử lại sau 1 phút.' }, { status: 429 })
  }

  const { username, password } = await req.json().catch(() => ({}))

  if (!username || !password) {
    return NextResponse.json({ error: 'Thiếu thông tin đăng nhập' }, { status: 400 })
  }

  const { data: family, error } = await supabase
    .from('families')
    .select('id, username, password_hash, plan, disabled, free_trial_expires_at, plan_end_date, bonus_pro_expires_at')
    .eq('username', username.trim().toLowerCase())
    .single()

  if (error || !family) {
    return NextResponse.json({ error: 'Sai tên đăng nhập hoặc mật khẩu' }, { status: 401 })
  }

  if (family.disabled) {
    return NextResponse.json({ error: 'Tài khoản đã bị khóa' }, { status: 403 })
  }

  const valid = await verifyPassword(password, family.password_hash)
  if (!valid) {
    return NextResponse.json({ error: 'Sai tên đăng nhập hoặc mật khẩu' }, { status: 401 })
  }

  if (isExpired(family.plan, family.free_trial_expires_at, family.plan_end_date, family.bonus_pro_expires_at)) {
    return NextResponse.json({ error: 'expired', expired: true }, { status: 403 })
  }

  const token = await createSession({
    familyId: family.id,
    username: family.username,
    plan: family.plan,
  })

  const res = NextResponse.json({ ok: true, username: family.username, plan: family.plan })
  res.cookies.set(sessionCookieOptions(token))
  return res
}
