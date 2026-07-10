import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'

function reqWithCookie(name: string, value: string): NextRequest {
  return new NextRequest('https://vocabwise.id.vn/', {
    headers: { cookie: `${name}=${value}` },
  })
}

describe('lib/session.ts', () => {
  describe('createSession / getSession round-trip', () => {
    it('signs a session and reads back the same payload via the request cookie', async () => {
      const { createSession, getSession } = await import('@/lib/session')
      const token = await createSession({ familyId: 'fam-1', username: 'user1', plan: 'free' })
      const req = reqWithCookie('vk_session', token)
      const payload = await getSession(req)
      expect(payload).toMatchObject({ familyId: 'fam-1', username: 'user1', plan: 'free' })
    })

    it('returns null when no session cookie is present', async () => {
      const { getSession } = await import('@/lib/session')
      const req = new NextRequest('https://vocabwise.id.vn/')
      expect(await getSession(req)).toBeNull()
    })

    it('returns null for a tampered/invalid token', async () => {
      const { getSession } = await import('@/lib/session')
      const req = reqWithCookie('vk_session', 'not-a-real-jwt')
      expect(await getSession(req)).toBeNull()
    })

    it('rejects a token signed with a different secret', async () => {
      vi.resetModules()
      process.env.JWT_SECRET = 'a-completely-different-32-plus-char-secret-000'
      const { createSession: createWithOtherSecret } = await import('@/lib/session')
      const foreignToken = await createWithOtherSecret({ familyId: 'x', username: 'x', plan: 'free' })

      vi.resetModules()
      process.env.JWT_SECRET = 'test-only-jwt-secret-not-for-production-use-0000'
      const { getSession } = await import('@/lib/session')
      const req = reqWithCookie('vk_session', foreignToken)
      expect(await getSession(req)).toBeNull()
    })
  })

  describe('admin session (vk_admin_session) is isolated from vk_session', () => {
    it('getAdminSession ignores a vk_session cookie and vice versa', async () => {
      const { createSession, getSession, getAdminSession } = await import('@/lib/session')
      const token = await createSession({ familyId: 'superadmin', username: 'superadmin', plan: 'superadmin' })

      const asUserCookie = reqWithCookie('vk_session', token)
      expect(await getSession(asUserCookie)).not.toBeNull()
      expect(await getAdminSession(asUserCookie)).toBeNull()

      const asAdminCookie = reqWithCookie('vk_admin_session', token)
      expect(await getAdminSession(asAdminCookie)).not.toBeNull()
      expect(await getSession(asAdminCookie)).toBeNull()
    })
  })

  describe('cookie option helpers', () => {
    it('sessionCookieOptions sets httpOnly, sameSite=lax, and the default 30-day maxAge', async () => {
      const { sessionCookieOptions } = await import('@/lib/session')
      const opts = sessionCookieOptions('tok')
      expect(opts.name).toBe('vk_session')
      expect(opts.httpOnly).toBe(true)
      expect(opts.sameSite).toBe('lax')
      expect(opts.maxAge).toBe(60 * 60 * 24 * 30)
    })

    it('sessionCookieOptions accepts a custom maxAge override', async () => {
      const { sessionCookieOptions } = await import('@/lib/session')
      const opts = sessionCookieOptions('tok', 3600)
      expect(opts.maxAge).toBe(3600)
    })

    it('clearSessionCookie zeroes maxAge and empties the value', async () => {
      const { clearSessionCookie } = await import('@/lib/session')
      const opts = clearSessionCookie()
      expect(opts.value).toBe('')
      expect(opts.maxAge).toBe(0)
    })

    it('adminSessionCookieOptions uses the admin cookie name and 8h maxAge', async () => {
      const { adminSessionCookieOptions, ADMIN_SESSION_MAX_AGE } = await import('@/lib/session')
      const opts = adminSessionCookieOptions('tok')
      expect(opts.name).toBe('vk_admin_session')
      expect(opts.maxAge).toBe(ADMIN_SESSION_MAX_AGE)
      expect(ADMIN_SESSION_MAX_AGE).toBe(60 * 60 * 8)
    })

    it('clearAdminSessionCookie zeroes maxAge and empties the value', async () => {
      const { clearAdminSessionCookie } = await import('@/lib/session')
      const opts = clearAdminSessionCookie()
      expect(opts.value).toBe('')
      expect(opts.maxAge).toBe(0)
    })
  })

  describe('JWT_SECRET fail-fast', () => {
    const ORIGINAL_SECRET = process.env.JWT_SECRET

    beforeEach(() => {
      process.env.JWT_SECRET = ORIGINAL_SECRET
    })

    it('throws at import time when JWT_SECRET is missing', async () => {
      vi.resetModules()
      delete process.env.JWT_SECRET
      await expect(import('@/lib/session')).rejects.toThrow(/JWT_SECRET/)
    })

    it('throws at import time when JWT_SECRET is shorter than 32 chars', async () => {
      vi.resetModules()
      process.env.JWT_SECRET = 'too-short'
      await expect(import('@/lib/session')).rejects.toThrow(/JWT_SECRET/)
    })

    it('loads fine when JWT_SECRET is 32+ chars', async () => {
      vi.resetModules()
      process.env.JWT_SECRET = 'x'.repeat(32)
      await expect(import('@/lib/session')).resolves.toBeDefined()
    })
  })
})
