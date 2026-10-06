import { NextRequest, NextResponse } from 'next/server'
import { getSession, createParentUnlock, hasParentUnlock, parentUnlockCookie } from '@/lib/auth'
import { loadPinFamily, setParentPin, PIN_RE } from '@/lib/parentPin'

// GET /api/rewards/pin — has the family set a parent PIN, and is the area currently unlocked?
export async function GET(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const fam = await loadPinFamily(session.familyId)
  if (!fam) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({
    hasPin: !!fam.parent_pin_hash,
    unlocked: await hasParentUnlock(req, session.familyId),
    lockedUntil: fam.parent_pin_locked_until && new Date(fam.parent_pin_locked_until) > new Date() ? fam.parent_pin_locked_until : null,
  }, { headers: { 'Cache-Control': 'private, no-store' } })
}

// POST /api/rewards/pin { pin } — first-time setup, or change while unlocked.
export async function POST(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { pin } = await req.json().catch(() => ({}))
  if (typeof pin !== 'string' || !PIN_RE.test(pin)) return NextResponse.json({ error: 'PIN gồm đúng 4 chữ số' }, { status: 400 })

  const fam = await loadPinFamily(session.familyId)
  if (!fam) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (fam.parent_pin_hash && !(await hasParentUnlock(req, session.familyId))) {
    return NextResponse.json({ error: 'Cần nhập PIN hiện tại trước' }, { status: 403 })
  }
  await setParentPin(session.familyId, pin)
  const res = NextResponse.json({ ok: true })
  res.cookies.set(parentUnlockCookie(await createParentUnlock(session.familyId)))
  return res
}
