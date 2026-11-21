// Owner → Superadmin step-up (Dashboard → Cài đặt → 🛡️ Quản trị).
// The owner family (families.is_owner) already has a live family session; entering the 6-digit admin PIN,
// or a one-time code emailed to ADMIN_ALERT_EMAIL, mints the same vk_admin_session the password gate does.
import { createHash, randomInt, timingSafeEqual } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from './supabaseServer'
import { getSession, createSession, adminSessionCookieOptions } from './auth'
import { sendEmail } from './email'

export const PIN_MAX_FAILS = 5
export const LOCK_MINUTES = 15
export const OTP_TTL_MINUTES = 10
export const OTP_MAX_ATTEMPTS = 5

const COLS = 'id, disabled, is_owner, admin_pin_hash, admin_pin_failed, admin_pin_locked_until, admin_otp_hash, admin_otp_expires_at, admin_otp_attempts'

export type OwnerRow = {
  id: string
  disabled: boolean | null
  is_owner: boolean
  admin_pin_hash: string | null
  admin_pin_failed: number
  admin_pin_locked_until: string | null
  admin_otp_hash: string | null
  admin_otp_expires_at: string | null
  admin_otp_attempts: number
}

/** Fresh DB check: logged-in family that is the owner and not disabled. Never trust the JWT alone. */
export async function getOwner(): Promise<OwnerRow | null> {
  const session = await getSession()
  if (!session || session.familyId === 'superadmin') return null
  const { data } = await supabase.from('families').select(COLS).eq('id', session.familyId).single()
  if (!data || data.disabled || !data.is_owner) return null
  return data as OwnerRow
}

export const notOwner = () => NextResponse.json({ error: 'Không có quyền truy cập.' }, { status: 403 })

export function clientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? req.headers.get('x-real-ip') ?? 'unknown'
}

export function adminEmail(): string {
  return process.env.ADMIN_ALERT_EMAIL ?? process.env.GMAIL_USER ?? ''
}

export function maskEmail(email: string): string {
  const [user, domain] = email.split('@')
  if (!domain) return '•••'
  return `${user.slice(0, 2)}•••@${domain}`
}

export function isSixDigits(v: unknown): v is string {
  return typeof v === 'string' && /^\d{6}$/.test(v)
}

/** Same digit repeated, or a straight ascending/descending run (123456, 987654). */
export function isWeakPin(pin: string): boolean {
  if (/^(\d)\1{5}$/.test(pin)) return true
  const d = pin.split('').map(Number)
  const steps = d.slice(1).map((x, i) => x - d[i])
  return steps.every(s => s === 1) || steps.every(s => s === -1)
}

export function generateOtp(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0')
}

// OTP is short-lived and single-use; a keyed SHA-256 keeps the plaintext out of the DB.
export function hashOtp(otp: string): string {
  return createHash('sha256').update(`owner-admin-otp:${process.env.JWT_SECRET}:${otp}`).digest('hex')
}

export function otpMatches(otp: string, hash: string): boolean {
  const a = Buffer.from(hashOtp(otp))
  const b = Buffer.from(hash)
  return a.length === b.length && timingSafeEqual(a, b)
}

export function minutesLeft(until: string): number {
  return Math.max(1, Math.ceil((new Date(until).getTime() - Date.now()) / 60_000))
}

/** Issue the 8h admin cookie (same token as /api/superadmin/login) and send the login alert. */
export async function grantAdminSession(ip: string, via: 'PIN' | 'mã email'): Promise<NextResponse> {
  const token = await createSession({ familyId: 'superadmin', username: 'superadmin', plan: 'superadmin', kind: 'admin' }, '8h')
  const res = NextResponse.json({ ok: true })
  res.cookies.set(adminSessionCookieOptions(token))

  const to = adminEmail()
  if (to) {
    const loginTime = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })
    sendEmail({
      to,
      subject: '🔐 Admin login — VocabWise',
      html: `<div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px"><h2 style="color:#0d9488">🔐 Admin đã đăng nhập</h2><p>Cách vào: <strong>Dashboard → ${via}</strong></p><p>Thời gian: <strong>${loginTime}</strong> (GMT+7)</p><p>IP: <code>${ip}</code></p><p style="color:#6b7280;font-size:13px">Nếu không phải bạn, hãy đổi mật khẩu tài khoản và PIN quản trị ngay.</p></div>`,
    }).catch(() => {})
  }
  return res
}
