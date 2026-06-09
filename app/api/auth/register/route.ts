import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { hashPassword } from '@/lib/auth'
import { sendEmail } from '@/lib/email'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// SĐT VN hợp lệ: đầu số 03x, 05x, 07x, 08x, 09x — đúng 10 số
const VN_PHONE_REGEX = /^(03[2-9]|05[6-9]|07[06-9]|08[0-9]|09[0-9])\d{7}$/

const SUPERADMIN_EMAIL = process.env.GMAIL_USER ?? ''
const FLAG_THRESHOLD = 5   // số accounts/24h trước khi flag

/**
 * Ghi nhận 1 lượt đăng ký từ IP, flag nếu vượt ngưỡng.
 * Dùng ip_flags table với 2 event types:
 *   'register_event' — tracking thô (auto-reviewed)
 *   'mass_register'  — flag cảnh báo cho superadmin
 */
async function trackRegistrationIP(ip: string): Promise<void> {
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  // Ghi nhận lượt đăng ký (không cần await — fire-and-forget)
  await supabase.from('ip_flags').insert({
    ip,
    event_type: 'register_event',
    count: 1,
    reviewed: true,   // auto-reviewed — chỉ dùng để đếm
  })

  // Đếm số lần đăng ký thành công từ IP này trong 24h
  const { count } = await supabase
    .from('ip_flags')
    .select('*', { count: 'exact', head: true })
    .eq('ip', ip)
    .eq('event_type', 'register_event')
    .gte('flagged_at', since24h)

  if ((count ?? 0) <= FLAG_THRESHOLD) return

  // Kiểm tra đã flag cho IP này trong 24h chưa (tránh spam email)
  const { data: existingFlag } = await supabase
    .from('ip_flags')
    .select('id')
    .eq('ip', ip)
    .eq('event_type', 'mass_register')
    .gte('flagged_at', since24h)
    .maybeSingle()

  if (existingFlag) return  // Đã flag rồi, không cần gửi lại

  // Tạo flag mới + gửi email alert cho superadmin
  await supabase.from('ip_flags').insert({
    ip,
    event_type: 'mass_register',
    count: count ?? FLAG_THRESHOLD + 1,
    reviewed: false,
  })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://vocab-kids-pro.vercel.app'
  sendEmail({
    to: SUPERADMIN_EMAIL,
    subject: `⚠️ [VocabKids] IP đăng ký bất thường: ${ip}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px">
        <h2 style="color:#dc2626">⚠️ Cảnh báo đăng ký bất thường</h2>
        <p>IP <strong>${ip}</strong> đã đăng ký <strong>${count} tài khoản</strong> trong 24 giờ qua.</p>
        <p style="color:#6b7280;font-size:14px">Vào Superadmin → tab Cảnh báo để xem xét.</p>
        <a href="${appUrl}/superadmin"
           style="display:inline-block;margin-top:16px;background:#9333ea;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:bold">
          Xem Superadmin →
        </a>
      </div>`,
  }).catch(err => console.error('[register] flag email error:', err))
}

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

/** Tạo referral code 6 ký tự, unique trong DB */
async function generateUniqueReferralCode(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const code = Math.random().toString(36).slice(2, 8).toUpperCase()
    const { data } = await supabase
      .from('families')
      .select('id')
      .eq('referral_code', code)
      .maybeSingle()
    if (!data) return code
  }
  // Fallback: 8 ký tự nếu vẫn bị trùng sau 10 lần thử
  return Math.random().toString(36).slice(2, 10).toUpperCase()
}

export async function POST(req: NextRequest) {
  const { name, phone, email, referral_source, password } = await req.json().catch(() => ({}))
  const username = phone?.trim().replace(/\D/g, '') || ''

  if (!username || !password || !email || !name || !phone) {
    return NextResponse.json({ error: 'Thiếu thông tin bắt buộc' }, { status: 400 })
  }

  // Strict VN phone validation
  if (!VN_PHONE_REGEX.test(username)) {
    return NextResponse.json(
      { error: 'Số điện thoại không hợp lệ. Vui lòng nhập đúng định dạng VN (VD: 0901234567)' },
      { status: 400 }
    )
  }

  if (password.length < 6) {
    return NextResponse.json({ error: 'Mật khẩu tối thiểu 6 ký tự' }, { status: 400 })
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Email không hợp lệ' }, { status: 400 })
  }

  const now = new Date()

  // Ghost account cleanup: unverified + OTP expired → cho phép đăng ký lại
  const { data: existingPhone } = await supabase
    .from('families')
    .select('id, email_verified, otp_expires_at')
    .eq('username', username.trim().toLowerCase())
    .single()
  if (existingPhone) {
    if (existingPhone.email_verified) {
      return NextResponse.json({ error: 'Số điện thoại này đã được đăng ký' }, { status: 409 })
    }
    if (existingPhone.otp_expires_at && new Date(existingPhone.otp_expires_at) > now) {
      return NextResponse.json(
        { error: 'Số điện thoại này đang chờ xác thực OTP. Vui lòng kiểm tra hộp thư email.' },
        { status: 409 }
      )
    }
    await supabase.from('families').delete().eq('id', existingPhone.id)
  }

  const { data: existingEmail } = await supabase
    .from('families')
    .select('id, email_verified, otp_expires_at')
    .eq('email', email.trim().toLowerCase())
    .single()
  if (existingEmail) {
    if (existingEmail.email_verified) {
      return NextResponse.json({ error: 'Email này đã được đăng ký' }, { status: 409 })
    }
    if (existingEmail.otp_expires_at && new Date(existingEmail.otp_expires_at) > now) {
      return NextResponse.json(
        { error: 'Email này đang chờ xác thực OTP. Vui lòng kiểm tra hộp thư.' },
        { status: 409 }
      )
    }
    await supabase.from('families').delete().eq('id', existingEmail.id)
  }

  // Đọc referral code từ cookie (set bởi /r/[code])
  const refCode = req.cookies.get('ref_code')?.value?.toUpperCase() ?? null
  const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  let referrerId: string | null = null
  if (refCode) {
    const { data: referrer } = await supabase
      .from('families')
      .select('id, registration_ip')
      .eq('referral_code', refCode)
      .maybeSingle()
    // Fraud check: cùng IP → không tính referral
    const sameIp = referrer?.registration_ip && clientIp !== 'unknown' && referrer.registration_ip === clientIp
    if (!sameIp) referrerId = referrer?.id ?? null
  }

  const password_hash = await hashPassword(password)
  const otp = generateOtp()
  const otp_expires_at = new Date(Date.now() + 15 * 60 * 1000).toISOString()       // 15 phút
  const free_trial_expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 ngày
  const referral_code = await generateUniqueReferralCode()

  const { data: family, error } = await supabase
    .from('families')
    .insert({
      username: username.trim().toLowerCase(),
      password_hash,
      email: email.trim().toLowerCase(),
      name: name.trim(),
      phone: phone.trim(),
      referral_source: referral_source || null,
      referral_code,
      plan: 'free',
      email_verified: false,
      otp,
      otp_expires_at,
      free_trial_expires_at,
      registration_ip: clientIp,   // lưu IP để chống fraud referral
    })
    .select('id, username')
    .single()

  if (error || !family) {
    return NextResponse.json({ error: 'Lỗi tạo tài khoản, thử lại sau' }, { status: 500 })
  }

  // Tạo referral record nếu đến từ referral link hợp lệ (và không self-refer)
  if (referrerId && referrerId !== family.id) {
    const { error: refError } = await supabase.from('referrals').insert({
      referrer_id: referrerId,
      referred_id: family.id,
      status: 'pending',
    })
    if (refError) {
      // Log nhưng không fail registration
      console.error('[register] Referral insert error:', refError.message)
    }
  }

  // Gửi OTP email
  try {
    await sendEmail({
      to: email.trim(),
      subject: 'Mã xác thực VocabKids Pro',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px">
          <h2 style="color:#9333ea">📚 VocabKids Pro</h2>
          <p>Xin chào <strong>${name.trim()}</strong>,</p>
          <p>Mã xác thực tài khoản của bạn là:</p>
          <div style="background:#f3e8ff;border-radius:12px;padding:20px;text-align:center;margin:20px 0">
            <span style="font-size:36px;font-weight:900;letter-spacing:8px;color:#7c3aed">${otp}</span>
          </div>
          <p style="color:#666;font-size:14px">Mã có hiệu lực trong <strong>15 phút</strong>. Không chia sẻ mã này với bất kỳ ai.</p>
          <p style="color:#999;font-size:12px;margin-top:24px">Nếu bạn không đăng ký VocabKids Pro, hãy bỏ qua email này.</p>
        </div>`,
    })
  } catch (emailError) {
    console.error('[register] Gmail error:', emailError)
    await supabase.from('families').delete().eq('id', family.id)
    return NextResponse.json(
      { error: 'Không gửi được email xác thực. Vui lòng kiểm tra lại email và thử lại.' },
      { status: 500 }
    )
  }

  // IP flag tracking (fire-and-forget — không block response)
  trackRegistrationIP(clientIp).catch(err => console.error('[register] ip tracking error:', err))

  // Trả response + xóa ref_code cookie
  const res = NextResponse.json({ ok: true, username: family.username })
  if (refCode) {
    res.cookies.set('ref_code', '', { maxAge: 0, path: '/' })
  }
  return res
}
