import { NextRequest, NextResponse } from 'next/server'
import { getSession, createParentUnlock, parentUnlockCookie } from '@/lib/auth'
import { loadPinFamily, checkParentPin, PIN_RE } from '@/lib/parentPin'

// POST /api/rewards/pin/verify { pin } — unlock the Quà tặng area for 10 minutes.
export async function POST(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { pin } = await req.json().catch(() => ({}))
  if (typeof pin !== 'string' || !PIN_RE.test(pin)) return NextResponse.json({ error: 'PIN gồm đúng 4 chữ số' }, { status: 400 })

  const fam = await loadPinFamily(session.familyId)
  if (!fam) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const result = await checkParentPin(session.familyId, fam, pin)
  if (result === 'unset') return NextResponse.json({ error: 'Chưa đặt PIN' }, { status: 409 })
  if (result === 'locked') return NextResponse.json({ error: 'Nhập sai quá nhiều lần. Thử lại sau 15 phút.' }, { status: 429 })
  if (result === 'wrong') return NextResponse.json({ error: 'PIN chưa đúng' }, { status: 401 })

  const res = NextResponse.json({ ok: true })
  res.cookies.set(parentUnlockCookie(await createParentUnlock(session.familyId)))
  return res
}

// DELETE — lock again immediately.
export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set(parentUnlockCookie('', 0))
  return res
}
