import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createSession, sessionCookieOptions } from '@/lib/auth'
import { sendEmail } from '@/lib/email'
import { welcomeEmailHtml } from '@/lib/emailTemplates'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const { email, otp } = await req.json().catch(() => ({}))
  if (!email || !otp) return NextResponse.json({ error: 'Thiếu thông tin' }, { status: 400 })

  const { data: family } = await supabase
    .from('families')
    .select('id, username, name, email, phone, plan, otp, otp_expires_at, email_verified, referral_source, free_trial_expires_at')
    .eq('email', email.trim().toLowerCase())
    .single()

  if (!family) return NextResponse.json({ error: 'Không tìm thấy tài khoản' }, { status: 404 })
  if (family.email_verified) {
    // Already verified — just create session
    const token = await createSession({ familyId: family.id, username: family.username, plan: family.plan })
    const res = NextResponse.json({ ok: true })
    res.cookies.set(sessionCookieOptions(token))
    return res
  }

  if (family.otp !== otp) return NextResponse.json({ error: 'Mã xác thực không đúng' }, { status: 400 })
  if (!family.otp_expires_at || new Date(family.otp_expires_at) < new Date()) {
    return NextResponse.json({ error: 'Mã đã hết hạn. Vui lòng gửi lại mã mới.' }, { status: 400 })
  }

  await supabase
    .from('families')
    .update({ email_verified: true, otp: null, otp_expires_at: null })
    .eq('id', family.id)

  // Send welcome email (fire-and-forget)
  sendEmail({
    to: family.email,
    subject: 'Chào mừng bạn đến với VocabWise! 🎉',
    html: welcomeEmailHtml(family.name),
  }).catch(err => console.error('[verify-otp] welcome email error:', err))

  // Thông báo admin có user mới xác thực thành công (fire-and-forget)
  void Promise.resolve(
    supabase
      .from('families')
      .select('id', { count: 'exact', head: true })
      .eq('email_verified', true)
  ).then(({ count }) => {
      const userNo = count ?? '?'
      const trialExpires = family.free_trial_expires_at
        ? new Date(family.free_trial_expires_at).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
        : '—'
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://vocabwise.id.vn'
      const row = (label: string, value: string) =>
        `<tr><td style="padding:7px 0;color:#888;width:130px;font-size:14px">${label}</td><td style="font-size:14px;color:#111">${value}</td></tr>`

      sendEmail({
        to: 'vocabwise.admin@gmail.com',
        subject: `🆕 [VocabWise] #${userNo} — ${family.name}`,
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px">
            <h2 style="color:#9333ea;margin-bottom:16px">📚 VocabWise — Tài khoản mới đã kích hoạt</h2>
            <table style="width:100%;border-collapse:collapse">
              ${row('👤 Họ tên', `<strong>${family.name}</strong>`)}
              ${row('📧 Email', family.email)}
              ${row('📱 SĐT', family.phone ?? '—')}
              ${row('📣 Nguồn', family.referral_source ?? '—')}
              ${row('⏳ Trial hết hạn', trialExpires)}
              ${row('🏅 User thứ', `#${userNo}`)}
              ${row('🕐 Thời gian', new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }))}
            </table>
            <a href="${appUrl}/superadmin"
               style="display:inline-block;margin-top:20px;background:#9333ea;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:bold">
              Xem Superadmin →
            </a>
          </div>`,
      }).catch(err => console.error('[verify-otp] admin notify error:', err))
  }).catch(err => console.error('[verify-otp] user count error:', err))

  const token = await createSession({ familyId: family.id, username: family.username, plan: family.plan })
  const res = NextResponse.json({ ok: true })
  res.cookies.set(sessionCookieOptions(token))
  return res
}
