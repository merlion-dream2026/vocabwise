import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseServer'
import { verifyPassword, hashPassword, bcryptCost, createSession, sessionCookieOptions } from '@/lib/auth'
import { verifyTurnstile } from '@/lib/security'
import { verifyTotp } from '@/lib/totp'
import { incrementUnknownLoginMiss } from '@/lib/rateLimit'

const MAX_ATTEMPTS = 5
const LOCKOUT_MINUTES = 15

// Password hashes created before the cost-10 switch are still cost 12
// (~250-300ms to compare in bcryptjs). Once one verifies successfully,
// quietly rehash it at the cheaper cost so the family's next login is fast too.
const LEGACY_PASSWORD_COST = 10

// bcrypt hash (cost 10) of a random string — compared against when the username doesn't exist,
// so that path takes as long as a real password check.
const DUMMY_HASH = '$2b$10$rtrJwpfYx1PO65Tfht7eyua0Ln1hP7ziUpEHCY0EB3rthIDAWoQHa'

function isExpired(plan: string, freeTrialExpiresAt: string | null, planEndDate: string | null, bonusProExpiresAt: string | null): boolean {
  const now = new Date()
  if (bonusProExpiresAt && new Date(bonusProExpiresAt) > now) return false
  if (plan === 'free') return freeTrialExpiresAt ? new Date(freeTrialExpiresAt) < now : false
  return planEndDate ? new Date(planEndDate) < now : false
}

export async function POST(req: NextRequest) {
  const { username, password, turnstileToken, totpCode, emailOtp } = await req.json().catch(() => ({}))

  if (!username || !password) {
    return NextResponse.json({ error: 'Thiếu thông tin đăng nhập' }, { status: 400 })
  }

  // Run Turnstile verification and the family lookup concurrently — they're
  // independent, and each is a network round-trip that previously ran in series.
  const [turnstileOk, { data: family, error }] = await Promise.all([
    verifyTurnstile(turnstileToken),
    supabase
      .from('families')
      .select('id, username, password_hash, plan, disabled, free_trial_expires_at, plan_end_date, bonus_pro_expires_at, failed_login_count, lockout_until, session_version')
      .eq('username', username.trim().toLowerCase())
      .single(),
  ])

  if (!turnstileOk) {
    return NextResponse.json({ error: 'Xác minh bảo mật thất bại. Vui lòng thử lại.' }, { status: 400 })
  }

  const normalized = username.trim().toLowerCase()

  // Every failure path below answers with the same wording whether or not the phone number has an
  // account — different messages (or a faster "no such user" response) would let anyone check
  // which phone numbers are VocabWise customers.
  const wrongMsg = (remaining: number) =>
    NextResponse.json({ error: `Sai SĐT hoặc mật khẩu. Còn ${remaining} lần thử trước khi bị khóa tạm thời.` }, { status: 401 })
  const lockedMsg = (minutes: number) =>
    NextResponse.json({ error: `Đăng nhập sai quá ${MAX_ATTEMPTS} lần. Tạm khóa, thử lại sau ${minutes} phút.` }, { status: 423 })

  if (error || !family) {
    await verifyPassword(password, DUMMY_HASH) // keep timing equal to the real-account path
    const { count, secondsLeft } = await incrementUnknownLoginMiss(normalized, LOCKOUT_MINUTES * 60)
    if (count >= MAX_ATTEMPTS) return lockedMsg(Math.ceil(secondsLeft / 60))
    return wrongMsg(MAX_ATTEMPTS - count)
  }

  // Account lockout check
  const lockedUntil = family.lockout_until ? new Date(family.lockout_until) : null
  if (lockedUntil && lockedUntil > new Date()) {
    return lockedMsg(Math.ceil((lockedUntil.getTime() - Date.now()) / 60000))
  }

  const valid = await verifyPassword(password, family.password_hash)

  if (valid && (bcryptCost(family.password_hash) ?? 0) > LEGACY_PASSWORD_COST) {
    hashPassword(password)
      .then(rehashed => supabase.from('families').update({ password_hash: rehashed }).eq('id', family.id))
      .catch(() => {})
  }

  if (!valid) {
    // A lockout that has already expired starts a fresh count (previously one more miss re-locked at once)
    const newCount = (lockedUntil ? 0 : (family.failed_login_count ?? 0)) + 1
    const shouldLock = newCount >= MAX_ATTEMPTS
    await supabase.from('families').update({
      failed_login_count: shouldLock ? 0 : newCount,
      lockout_until: shouldLock ? new Date(Date.now() + LOCKOUT_MINUTES * 60000).toISOString() : null,
    }).eq('id', family.id)

    if (shouldLock) return lockedMsg(LOCKOUT_MINUTES)
    return wrongMsg(MAX_ATTEMPTS - newCount)
  }

  // Only now (correct password) is it safe to say the account exists but is disabled
  if (family.disabled) {
    return NextResponse.json({ error: 'Tài khoản đã bị khóa. Vui lòng liên hệ hỗ trợ.' }, { status: 403 })
  }

  // Successful login — reset lockout counters (skip the round-trip when already clean,
  // which is the common case: correct password on the first try)
  if ((family.failed_login_count ?? 0) !== 0 || family.lockout_until) {
    await supabase.from('families').update({ failed_login_count: 0, lockout_until: null }).eq('id', family.id)
  }

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
    sv: family.session_version ?? 0,
  })

  const res = NextResponse.json({ ok: true, username: family.username, plan: family.plan })
  res.cookies.set(sessionCookieOptions(token))
  return res
}
