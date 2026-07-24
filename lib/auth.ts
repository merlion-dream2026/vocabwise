import bcrypt from 'bcryptjs'

// Re-export Edge-compatible helpers from session.ts
export type { SessionPayload } from './session'
export { createSession, getSession, sessionCookieOptions, clearSessionCookie, getAdminSession, adminSessionCookieOptions, clearAdminSessionCookie } from './session'

// Cost 10 on the pure-JS bcryptjs used here: ~75ms/login instead of ~250-300ms
// at cost 12. Online brute-force is already blocked by the 5-attempt/15min
// lockout at the login route; cost 10 still keeps offline (DB-leak) cracking
// slow enough to not be the weak link.
const PASSWORD_BCRYPT_COST = 10

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, PASSWORD_BCRYPT_COST)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// Lower work factor for the 4-digit child PIN: only 10,000 combos and already
// rate-limited to 5 attempts/5min at the route, so cost 12 (~250-300ms in the
// pure-JS bcryptjs used here) buys no real security over cost 8 (~15-20ms) —
// it just adds latency to every PIN pad tap.
const PIN_BCRYPT_COST = 8

export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, PIN_BCRYPT_COST)
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash)
}

/** Cost factor embedded in a bcrypt hash, e.g. "$2a$12$..." -> 12. */
export function bcryptCost(hash: string): number | null {
  const m = /^\$2[aby]\$(\d+)\$/.exec(hash)
  return m ? parseInt(m[1], 10) : null
}
