import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { getSession, hasParentUnlock, hashPin, verifyPin } from '@/lib/auth'

export const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const PIN_RE = /^\d{4}$/
const MAX_FAILS = 5
const LOCK_MINUTES = 15

export type PinFamily = { parent_pin_hash: string | null; parent_pin_failed: number; parent_pin_locked_until: string | null; password_hash: string }

export async function loadPinFamily(familyId: string): Promise<PinFamily | null> {
  const { data } = await db
    .from('families')
    .select('parent_pin_hash, parent_pin_failed, parent_pin_locked_until, password_hash')
    .eq('id', familyId)
    .single()
  return (data as PinFamily | null) ?? null
}

export async function setParentPin(familyId: string, pin: string) {
  await db.from('families').update({
    parent_pin_hash: await hashPin(pin), parent_pin_failed: 0, parent_pin_locked_until: null,
  }).eq('id', familyId)
}

/** Check a PIN with a lockout: 5 misses in a row lock the area for 15 minutes. */
export async function checkParentPin(familyId: string, fam: PinFamily, pin: string): Promise<'ok' | 'wrong' | 'locked' | 'unset'> {
  if (!fam.parent_pin_hash) return 'unset'
  if (fam.parent_pin_locked_until && new Date(fam.parent_pin_locked_until) > new Date()) return 'locked'
  if (await verifyPin(pin, fam.parent_pin_hash)) {
    if (fam.parent_pin_failed > 0) await db.from('families').update({ parent_pin_failed: 0, parent_pin_locked_until: null }).eq('id', familyId)
    return 'ok'
  }
  const failed = fam.parent_pin_failed + 1
  const lock = failed >= MAX_FAILS
  await db.from('families').update({
    parent_pin_failed: lock ? 0 : failed,
    parent_pin_locked_until: lock ? new Date(Date.now() + LOCK_MINUTES * 60_000).toISOString() : null,
  }).eq('id', familyId)
  return lock ? 'locked' : 'wrong'
}

// Resolve the child for a parent-unlocked request, or an error response.
export async function authorizeParent(req: NextRequest, childId: string) {
  const session = await getSession(req)
  if (!session) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  if (!(await hasParentUnlock(req, session.familyId))) return { error: NextResponse.json({ error: 'locked' }, { status: 403 }) }
  const { data: child } = await db.from('children').select('id, name').eq('id', childId).eq('family_id', session.familyId).single()
  if (!child) return { error: NextResponse.json({ error: 'Not found' }, { status: 404 }) }
  return { session, child: child as { id: string; name: string } }
}
