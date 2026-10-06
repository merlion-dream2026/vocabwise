import { NextRequest, NextResponse } from 'next/server'
import { getSession, verifyPassword, createParentUnlock, parentUnlockCookie } from '@/lib/auth'
import { loadPinFamily, setParentPin, PIN_RE } from '@/lib/parentPin'

// POST /api/rewards/pin/reset { password, pin } — forgot the PIN: prove it with the account password.
export async function POST(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { password, pin } = await req.json().catch(() => ({}))
  if (typeof password !== 'string' || typeof pin !== 'string' || !PIN_RE.test(pin)) {
    return NextResponse.json({ error: 'Thiếu thông tin hoặc PIN không hợp lệ' }, { status: 400 })
  }
  const fam = await loadPinFamily(session.familyId)
  if (!fam || !(await verifyPassword(password, fam.password_hash))) {
    return NextResponse.json({ error: 'Mật khẩu chưa đúng' }, { status: 401 })
  }
  await setParentPin(session.familyId, pin)
  const res = NextResponse.json({ ok: true })
  res.cookies.set(parentUnlockCookie(await createParentUnlock(session.familyId)))
  return res
}
