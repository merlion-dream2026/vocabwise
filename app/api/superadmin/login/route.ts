import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyPassword, createSession, adminSessionCookieOptions } from '@/lib/auth'
import { rateLimit } from '@/lib/rateLimit'
import { sendEmail } from '@/lib/email'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown'
  if (!(await rateLimit(`superadmin:${ip}`, 3, 300)).allowed) {
    return NextResponse.json({ error: 'Quá nhiều lần thử. Vui lòng thử lại sau 5 phút.' }, { status: 429 })
  }

  const { password } = await req.json().catch(() => ({}))
  if (!password) return NextResponse.json({ error: 'Thiếu mật khẩu' }, { status: 400 })

  const { data: admin } = await supabase
    .from('super_admin')
    .select('password_hash')
    .eq('id', 1)
    .single()

  if (!admin) return NextResponse.json({ error: 'Không tìm thấy admin' }, { status: 500 })

  const valid = await verifyPassword(password, admin.password_hash)
  if (!valid) return NextResponse.json({ error: 'Sai mật khẩu' }, { status: 401 })

  const token = await createSession({ familyId: 'superadmin', username: 'superadmin', plan: 'superadmin' }, '8h')
  const res = NextResponse.json({ ok: true })
  res.cookies.set(adminSessionCookieOptions(token))

  const alertEmail = process.env.ADMIN_ALERT_EMAIL ?? process.env.GMAIL_USER
  if (alertEmail) {
    const loginTime = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })
    sendEmail({
      to: alertEmail,
      subject: '🔐 Admin login — VocabWise',
      html: `<div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px"><h2 style="color:#0d9488">🔐 Admin đã đăng nhập</h2><p>Thời gian: <strong>${loginTime}</strong> (GMT+7)</p><p>IP: <code>${ip}</code></p><p style="color:#6b7280;font-size:13px">Nếu không phải bạn, hãy đổi mật khẩu admin ngay.</p></div>`,
    }).catch(() => {})
  }

  return res
}
