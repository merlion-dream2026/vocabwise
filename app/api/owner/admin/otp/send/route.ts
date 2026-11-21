// POST — email a one-time 6-digit code to ADMIN_ALERT_EMAIL (first-time PIN setup / forgotten PIN / đổi PIN).
// Max 3 sends per 15 min per owner; code valid 10 min, single use, 5 wrong tries → voided.
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseServer'
import { rateLimit } from '@/lib/rateLimit'
import { sendEmail } from '@/lib/email'
import { serverError } from '@/lib/api'
import { getOwner, notOwner, adminEmail, maskEmail, generateOtp, hashOtp, OTP_TTL_MINUTES } from '@/lib/ownerAdmin'

export async function POST() {
  try {
    const owner = await getOwner()
    if (!owner) return notOwner()

    const to = adminEmail()
    if (!to) return NextResponse.json({ error: 'Chưa cấu hình email quản trị.' }, { status: 500 })

    if (!(await rateLimit(`owner-otp-send:${owner.id}`, 3, 900)).allowed) {
      return NextResponse.json({ error: 'Đã gửi quá 3 mã. Vui lòng thử lại sau 15 phút.' }, { status: 429 })
    }

    const otp = generateOtp()
    const { error } = await supabase.from('families').update({
      admin_otp_hash: hashOtp(otp),
      admin_otp_expires_at: new Date(Date.now() + OTP_TTL_MINUTES * 60_000).toISOString(),
      admin_otp_attempts: 0,
    }).eq('id', owner.id)
    if (error) return serverError(error)

    await sendEmail({
      to,
      subject: '🔐 Mã xác nhận quản trị — VocabWise',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:16px">
          <h2 style="color:#7c3aed;margin-top:0">🔐 Mã đặt lại PIN quản trị</h2>
          <p style="color:#374151">Có yêu cầu đặt PIN để vào <strong>VocabWise Superadmin</strong> từ Dashboard.</p>
          <div style="background:#f5f3ff;border-radius:12px;padding:20px;text-align:center;margin:20px 0">
            <p style="color:#6b7280;font-size:13px;margin:0 0 8px">Mã xác nhận (hết hạn sau ${OTP_TTL_MINUTES} phút, dùng 1 lần):</p>
            <span style="font-size:36px;font-weight:900;letter-spacing:8px;color:#7c3aed">${otp}</span>
          </div>
          <p style="color:#6b7280;font-size:12px">Nếu không phải bạn yêu cầu, hãy đổi mật khẩu tài khoản ngay.</p>
        </div>`,
    })

    return NextResponse.json({ ok: true, email: maskEmail(to) })
  } catch (err) {
    return serverError(err)
  }
}
