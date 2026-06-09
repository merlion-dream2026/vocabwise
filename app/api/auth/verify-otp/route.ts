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
    .select('id, username, name, email, plan, otp, otp_expires_at, email_verified')
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
    subject: 'Chào mừng bạn đến với VocabKids Pro! 🎉',
    html: welcomeEmailHtml(family.name),
  }).catch(err => console.error('[verify-otp] welcome email error:', err))

  const token = await createSession({ familyId: family.id, username: family.username, plan: family.plan })
  const res = NextResponse.json({ ok: true })
  res.cookies.set(sessionCookieOptions(token))
  return res
}
