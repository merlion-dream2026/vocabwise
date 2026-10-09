import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseServer'
import { getSession, verifyPassword, hashPassword, createSession, sessionCookieOptions } from '@/lib/auth'
import { bumpSessionVersion } from '@/lib/sessionGuard'

export async function POST(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { currentPassword, newPassword } = await req.json().catch(() => ({}))
  if (!currentPassword || !newPassword) return NextResponse.json({ error: 'Thiếu thông tin' }, { status: 400 })
  if (newPassword.length < 6) return NextResponse.json({ error: 'Mật khẩu mới tối thiểu 6 ký tự' }, { status: 400 })

  const { data: family } = await supabase
    .from('families')
    .select('password_hash')
    .eq('id', session.familyId)
    .single()

  if (!family) return NextResponse.json({ error: 'Không tìm thấy tài khoản' }, { status: 404 })

  const valid = await verifyPassword(currentPassword, family.password_hash)
  if (!valid) return NextResponse.json({ error: 'Mật khẩu hiện tại không đúng' }, { status: 400 })

  const password_hash = await hashPassword(newPassword)
  const { error } = await supabase.from('families').update({ password_hash }).eq('id', session.familyId)
  if (error) return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 })

  // Log out other devices; re-issue this device's cookie with the new version
  const sv = await bumpSessionVersion(session.familyId)
  const token = await createSession({ familyId: session.familyId, username: session.username, plan: session.plan, sv })
  const res = NextResponse.json({ ok: true })
  res.cookies.set(sessionCookieOptions(token))
  return res
}
