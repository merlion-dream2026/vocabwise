import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'node:crypto'
import { getAdminSession } from './session'

/** Log the real error server-side; the client only gets a generic message (no table/column leaks). */
export function serverError(err: unknown, message = 'Lỗi hệ thống. Vui lòng thử lại sau.', status = 500) {
  console.error(err)
  return NextResponse.json({ error: message }, { status })
}

/** Constant-time string compare for shared secrets (a plain === leaks the matching prefix length via timing). */
export function safeEqual(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false
  const x = Buffer.from(a)
  const y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}

/** `Authorization: Bearer <secret>` check against an env var; false when the env var is unset. */
export function hasBearer(req: NextRequest, secret: string | undefined): boolean {
  return !!secret && safeEqual(req.headers.get('authorization'), `Bearer ${secret}`)
}

/** Superadmin console gate (vk_admin_session). getAdminSession already checks kind + familyId. */
export async function isAdminRequest(req?: NextRequest): Promise<boolean> {
  return (await getAdminSession(req)) !== null
}
