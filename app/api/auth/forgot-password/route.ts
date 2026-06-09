import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from '@/lib/email'
import crypto from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  // Accept either username (from kids page) or email (legacy)
  const username = body.username?.trim().toLowerCase()
  const emailInput = body.email?.trim().toLowerCase()

  if (!username && !emailInput) return NextResponse.json({ error: 'Thiếu thông tin' }, { status: 400 })

  const { data: family } = username
    ? await supabase.from('families').select('id, username, email').eq('username', username).single()
    : await supabase.from('families').select('id, username, email').eq('email', emailInput).single()

  // Always return success — don't reveal whether account exists
  if (!family?.email) return NextResponse.json({ ok: true })

  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString()

  await supabase
    .from('families')
    .update({ reset_token: token, reset_token_expires_at: expiresAt })
    .eq('id', family.id)

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://vocabwise.vercel.app'
  const resetUrl = `${appUrl}/reset-password?token=${token}`

  await sendEmail({
    to: family.email,
    subject: '🔑 Đặt lại mật khẩu VocabWise',
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8f4ff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:480px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(147,51,234,0.12)">
    <div style="background:linear-gradient(135deg,#9333ea,#ec4899);padding:28px 24px;text-align:center">
      <p style="font-size:36px;margin:0 0 8px">🔑</p>
      <h1 style="color:#fff;font-size:20px;font-weight:900;margin:0">Đặt lại mật khẩu</h1>
      <p style="color:rgba(255,255,255,0.85);font-size:13px;margin:6px 0 0">VocabWise · Xin chào, <strong>${family.username}</strong>!</p>
    </div>
    <div style="padding:28px;text-align:center">
      <p style="color:#374151;font-size:14px;margin:0 0 24px;line-height:1.7">
        Bấm vào nút bên dưới để đặt lại mật khẩu của bạn.<br>
        Link có hiệu lực trong <strong>1 giờ</strong>.
      </p>
      <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#9333ea,#ec4899);color:#fff;font-weight:900;font-size:15px;padding:14px 36px;border-radius:999px;text-decoration:none">Đặt lại mật khẩu →</a>
      <p style="color:#9ca3af;font-size:12px;margin:20px 0 0">Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.</p>
    </div>
    <div style="border-top:1px solid #f0e6ff;padding:16px 28px;text-align:center">
      <p style="color:#ccc;font-size:11px;margin:0">© 2026 VocabWise · Từ vựng tiếng Anh — vui học mỗi ngày</p>
    </div>
  </div>
</body>
</html>`,
  })

  return NextResponse.json({ ok: true })
}
