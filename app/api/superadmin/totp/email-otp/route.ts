// POST { username, password } — verify superadmin password then send recovery OTP to admin email.
// Rate-limited to 2 requests per 15 min per IP.
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyPassword } from '@/lib/auth'
import { rateLimit } from '@/lib/rateLimit'
import { sendEmail } from '@/lib/email'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const ADMIN_EMAIL = 'vocabwise.admin@gmail.com'
const OTP_TTL_MS = 10 * 60_000 // 10 minutes

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown'
  if (!(await rateLimit(`totp-email-otp:${ip}`, 2, 900)).allowed) {
    return NextResponse.json({ error: 'Quá nhiều yêu cầu. Vui lòng thử lại sau 15 phút.' }, { status: 429 })
  }

  const { username, password } = await req.json().catch(() => ({}))
  if (!username || !password) return NextResponse.json({ error: 'Thiếu thông tin' }, { status: 400 })

  // Verify against the families table (same as regular login)
  const { data: family } = await supabase
    .from('families')
    .select('id, password_hash')
    .eq('username', String(username).trim().toLowerCase())
    .single()

  if (!family || family.id !== 'superadmin') {
    return NextResponse.json({ error: 'Không tìm thấy tài khoản' }, { status: 401 })
  }

  const valid = await verifyPassword(password, family.password_hash)
  if (!valid) return NextResponse.json({ error: 'Sai mật khẩu' }, { status: 401 })

  // Generate 6-digit OTP
  const otp = String(Math.floor(100000 + Math.random() * 900000))
  const expiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString()

  // Store in admin_config (cleaned up after use)
  await supabase.from('admin_config').upsert({ key: 'totp_email_otp', value: otp }, { onConflict: 'key' })
  await supabase.from('admin_config').upsert({ key: 'totp_email_otp_expires', value: expiresAt }, { onConflict: 'key' })

  await sendEmail({
    to: ADMIN_EMAIL,
    subject: '🔐 Mã khôi phục đăng nhập Admin — VocabWise',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:16px">
        <h2 style="color:#7c3aed;margin-top:0">🔐 Mã khôi phục 2FA</h2>
        <p style="color:#374151">Ai đó đã yêu cầu mã khôi phục để đăng nhập trang <strong>VocabWise Superadmin</strong>.</p>
        <div style="background:#f5f3ff;border-radius:12px;padding:20px;text-align:center;margin:20px 0">
          <p style="color:#6b7280;font-size:13px;margin:0 0 8px">Mã xác thực (hết hạn sau 10 phút):</p>
          <span style="font-size:36px;font-weight:900;letter-spacing:8px;color:#7c3aed">${otp}</span>
        </div>
        <p style="color:#6b7280;font-size:12px">Nếu không phải bạn yêu cầu, hãy bỏ qua email này.</p>
      </div>`,
  })

  return NextResponse.json({ ok: true })
}
