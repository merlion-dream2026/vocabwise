import { describe, it, expect, vi } from 'vitest'

vi.mock('./supabaseServer', () => ({ supabase: {} }))
vi.mock('./auth', () => ({ getSession: vi.fn(), createSession: vi.fn(), adminSessionCookieOptions: vi.fn() }))
vi.mock('./email', () => ({ sendEmail: vi.fn() }))

const { isSixDigits, isWeakPin, maskEmail, generateOtp, hashOtp, otpMatches } = await import('./ownerAdmin')

describe('ownerAdmin helpers', () => {
  it('accepts exactly six digits', () => {
    expect(isSixDigits('048213')).toBe(true)
    expect(isSixDigits('12345')).toBe(false)
    expect(isSixDigits('1234567')).toBe(false)
    expect(isSixDigits('12a456')).toBe(false)
    expect(isSixDigits(123456)).toBe(false)
  })

  it('flags repeated and sequential PINs as weak', () => {
    for (const p of ['000000', '777777', '123456', '456789', '987654', '654321']) expect(isWeakPin(p)).toBe(true)
    for (const p of ['048213', '135790', '112233', '209876']) expect(isWeakPin(p)).toBe(false)
  })

  it('masks the admin email', () => {
    expect(maskEmail('someone@gmail.com')).toBe('so•••@gmail.com')
    expect(maskEmail('bad')).toBe('•••')
  })

  it('generates zero-padded 6-digit codes', () => {
    for (let i = 0; i < 200; i++) expect(generateOtp()).toMatch(/^\d{6}$/)
  })

  it('matches only the original code', () => {
    const h = hashOtp('482019')
    expect(otpMatches('482019', h)).toBe(true)
    expect(otpMatches('482018', h)).toBe(false)
    expect(h).not.toContain('482019')
  })
})
