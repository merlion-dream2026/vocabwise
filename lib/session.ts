import { SignJWT, jwtVerify } from 'jose'
import { NextRequest } from 'next/server'

// Edge-compatible session helpers (no bcryptjs)
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET is missing or too short (must be >= 32 chars) — refusing to start with a forgeable session secret.')
}
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET)
const COOKIE_NAME = 'vk_session'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 8 // 8h

export type SessionPayload = {
  familyId: string
  username: string
  plan: string
}

export async function createSession(payload: SessionPayload, expiresIn = '30d'): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(JWT_SECRET)
}

export async function getSession(req?: NextRequest): Promise<SessionPayload | null> {
  try {
    let token: string | undefined
    if (req) {
      token = req.cookies.get(COOKIE_NAME)?.value
    } else {
      const { cookies } = await import('next/headers')
      token = (await cookies()).get(COOKIE_NAME)?.value
    }
    if (!token) return null
    const { payload } = await jwtVerify(token, JWT_SECRET, { algorithms: ['HS256'] })
    return payload as unknown as SessionPayload
  } catch {
    return null
  }
}

export function sessionCookieOptions(token: string, maxAge?: number) {
  return {
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: maxAge ?? COOKIE_MAX_AGE,
    path: '/',
  }
}

export function clearSessionCookie() {
  return {
    name: COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 0,
    path: '/',
  }
}

const ADMIN_COOKIE_NAME = 'vk_admin_session'

export async function getAdminSession(req?: NextRequest): Promise<SessionPayload | null> {
  try {
    let token: string | undefined
    if (req) {
      token = req.cookies.get(ADMIN_COOKIE_NAME)?.value
    } else {
      const { cookies } = await import('next/headers')
      token = (await cookies()).get(ADMIN_COOKIE_NAME)?.value
    }
    if (!token) return null
    const { payload } = await jwtVerify(token, JWT_SECRET, { algorithms: ['HS256'] })
    return payload as unknown as SessionPayload
  } catch {
    return null
  }
}

export function adminSessionCookieOptions(token: string) {
  return {
    name: ADMIN_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: ADMIN_SESSION_MAX_AGE,
    path: '/',
  }
}

export function clearAdminSessionCookie() {
  return {
    name: ADMIN_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 0,
    path: '/',
  }
}

// ── Parent unlock (Quà tặng area) ─────────────────────────────────────────────
// Short-lived cookie proving the parent PIN was entered recently. Separate from the family session so a
// child using the same logged-in device can't mark stickers redeemed.
const PARENT_COOKIE = 'vk_parent_ok'
export const PARENT_UNLOCK_SECONDS = 60 * 10

export async function createParentUnlock(familyId: string): Promise<string> {
  return new SignJWT({ familyId, kind: 'parent-unlock' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${PARENT_UNLOCK_SECONDS}s`)
    .sign(JWT_SECRET)
}

export async function hasParentUnlock(req: NextRequest, familyId: string): Promise<boolean> {
  try {
    const token = req.cookies.get(PARENT_COOKIE)?.value
    if (!token) return false
    const { payload } = await jwtVerify(token, JWT_SECRET, { algorithms: ['HS256'] })
    return payload.kind === 'parent-unlock' && payload.familyId === familyId
  } catch {
    return false
  }
}

export function parentUnlockCookie(token: string, maxAge = PARENT_UNLOCK_SECONDS) {
  return {
    name: PARENT_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge,
    path: '/api/rewards',
  }
}
