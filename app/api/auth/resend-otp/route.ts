import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from '@/lib/email'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

export async function POST(req: NextRequest) {
  const { email } = await req.json().catch(() => ({}))
  if (!email) return NextResponse.json({ error: 'Thiếu email' }, { status: 400 })

  const { data: family } = await supabase
    .from('families')
    .select('id, name, email_verified')
    .eq('email', email.trim().toLowerCase())
    .single()

  if (!family) return NextResponse.json({ error: 'Không tìm thấy tài khoản' }, { status: 404 })
  if (family.email_verified) return NextResponse.json({ error: 'Email đã được xác thực' }, { status: 400 })

  const otp = generateOtp()
  const otp_expires_at = new Date(Date.now() + 15 * 60 * 1000).toISOString()

  await supabase
    .from('families')
    .update({ otp, otp_expires_at })
    .eq('id', family.id)

  try {
    await sendEmail({
      to: email.trim(),
      subject: 'Mã xác thực VocabWise (mới)',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px">
          <h2 style="color:#9333ea">📚 VocabWise</h2>
          <p>Mã xác thực mới của bạn là:</p>
          <div style="background:#f3e8ff;border-radius:12px;padding:20px;text-align:center;margin:20px 0">
            <span style="font-size:36px;font-weight:900;letter-spacing:8px;color:#7c3aed">${otp}</span>
          </div>
          <p style="color:#666;font-size:14px">Mã có hiệu lực trong <strong>15 phút</strong>.</p>
        </div>`,
    })
  } catch (emailError) {
    console.error('[resend-otp] Gmail error:', emailError)
    return NextResponse.json({ error: 'Không gửi được email. Vui lòng thử lại sau.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
