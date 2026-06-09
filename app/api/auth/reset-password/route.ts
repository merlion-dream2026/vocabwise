import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { hashPassword } from '@/lib/auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const { token, newPassword } = await req.json().catch(() => ({}))
  if (!token || !newPassword) return NextResponse.json({ error: 'Thiếu thông tin' }, { status: 400 })
  if (newPassword.length < 6) return NextResponse.json({ error: 'Mật khẩu tối thiểu 6 ký tự' }, { status: 400 })

  const now = new Date().toISOString()
  const { data: family } = await supabase
    .from('families')
    .select('id')
    .eq('reset_token', token)
    .gt('reset_token_expires_at', now)
    .single()

  if (!family) return NextResponse.json({ error: 'Link không hợp lệ hoặc đã hết hạn' }, { status: 400 })

  const password_hash = await hashPassword(newPassword)
  await supabase
    .from('families')
    .update({ password_hash, reset_token: null, reset_token_expires_at: null })
    .eq('id', family.id)

  return NextResponse.json({ ok: true })
}
