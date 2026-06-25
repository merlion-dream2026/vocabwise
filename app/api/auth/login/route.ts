import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyPassword, createSession, sessionCookieOptions } from '@/lib/auth'
import { rateLimit } from '@/lib/rateLimit'
import { verifyTurnstile } from '@/lib/security'
import { verifyTotp } from '@/lib/totp'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const MAX_ATTEMPTS = 5
const LOCKOUT_MINUTES = 15

function isExpired(plan: string, freeTrialExpiresAt: string | null, planEndDate: string | null, bonusProExpiresAt: string | null): boolean {
  const now = new Date()
  if (bonusProExpiresAt && new Date(bonusProExpiresAt) > now) return false
  if (plan === 'free') return freeTrialExpiresAt ? new Date(freeTrialExpiresAt) < now : false
  return planEndDate ? new Date(planEndDate) < now : false
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown'
  if (!(await rateLimit(`login:${ip}`, 20, 60)).allowed) {
    return NextResponse.json({ error: 'Quá nhiều lần thử. Vui lòng thử lại sau 1 phút.' }, { status: 429 })
  }

  const { username, password, turnstileToken, totpCode, emailOtp } = await req.json().catch(() => ({}))

  if (!(await verifyTurnstile(turnstileToken))) {
    return NextResponse.json({ error: 'Xác minh bảo mật thất bại. Vui lòng thử lại.' }, { status: 400 })
  }

  if (!username || !password) {
    return NextResponse.json({ error: 'Thiếu thông tin đăng nhập' }, { status: 400 })
  }

  const { data: family, error } = await supabase
    .from('families')
    .select('id, username, password_hash, plan, disabled, free_trial_expires_at, plan_end_date, bonus_pro_expires_at, failed_login_count, lockout_until')
    .eq('username', username.trim().toLowerCase())
    .single()

  if (error || !family) {
    return NextResponse.json({ error: 'Sai tên đăng nhập hoặc mật khẩu' }, { status: 401 })
  }

  if (family.disabled) {
    return NextResponse.json({ error: 'Tài khoản đã bị khóa. Vui lòng liên hệ hỗ trợ.' }, { status: 403 })
  }

  // Account lockout check
  if (family.lockout_until && new Date(family.lockout_until) > new Date()) {
    const minutesLeft = Math.ceil((new Date(family.lockout_until).getTime() - Date.now()) / 60000)
    return NextResponse.json(
      { error: `Tài khoản tạm khóa do đăng nhập sai nhiều lần. Thử lại sau ${minutesLeft} phút.` },
      { status: 423 }
    )
  }

  const valid = await verifyPassword(password, family.password_hash)

  if (!valid) {
    const newCount = (family.failed_login_count ?? 0) + 1
    const shouldLock = newCount >= MAX_ATTEMPTS
    await supabase.from('families').update({
      failed_login_count: newCount,
      ...(shouldLock ? { lockout_until: new Date(Date.now() + LOCKOUT_MINUTES * 60000).toISOString() } : {}),
    }).eq('id', family.id)

    if (shouldLock) {
      return NextResponse.json(
        { error: `Sai mật khẩu quá ${MAX_ATTEMPTS} lần. Tài khoản tạm khóa ${LOCKOUT_MINUTES} phút.` },
        { status: 423 }
      )
    }
    const remaining = MAX_ATTEMPTS - newCount
    return NextResponse.json(
      { error: `Sai mật khẩu. Còn ${remaining} lần thử trước khi bị khóa tạm thời.` },
      { status: 401 }
    )
  }

  // Successful login — reset lockout counters
  await supabase.from('families').update({ failed_login_count: 0, lockout_until: null }).eq('id', family.id)

  // TOTP 2FA check for superadmin
  if (family.id === 'superadmin') {
    const { data: totpRow } = await supabase.from('admin_config').select('value').eq('key', 'totp_secret').single()
    if (totpRow?.value) {
      if (!totpCode && !emailOtp) {
        return NextResponse.json({ requires2fa: true }, { status: 200 })
      }
      if (emailOtp) {
        // Email OTP recovery path
        const { data: otpRow } = await supabase.from('admin_config').select('value').eq('key', 'totp_email_otp').single()
        const { data: expiryRow } = await supabase.from('admin_config').select('value').eq('key', 'totp_email_otp_expires').single()
        const expired = !expiryRow?.value || new Date(expiryRow.value) < new Date()
        const match = otpRow?.value === String(emailOtp).trim()
        // Always clean up OTP after use (one-time)
        await supabase.from('admin_config').delete().in('key', ['totp_email_otp', 'totp_email_otp_expires'])
        if (expired || !match) {
          return NextResponse.json({ error: 'Mã OTP email không đúng hoặc đã hết hạn.' }, { status: 401 })
        }
      } else {
        const totpOk = await verifyTotp(totpRow.value, totpCode)
        if (!totpOk) {
          return NextResponse.json({ error: 'Mã 2FA không đúng.' }, { status: 401 })
        }
      }
    }
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
