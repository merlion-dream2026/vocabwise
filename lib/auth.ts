import bcrypt from 'bcryptjs'

// Re-export Edge-compatible helpers from session.ts
export type { SessionPayload } from './session'
export { createSession, getSession, sessionCookieOptions, clearSessionCookie, getAdminSession, adminSessionCookieOptions, clearAdminSessionCookie } from './session'

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}
