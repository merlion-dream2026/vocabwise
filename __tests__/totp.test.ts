import { describe, it, expect, vi, afterEach } from 'vitest'
import { generateTotpSecret, totpUri, verifyTotp } from '@/lib/totp'

const B32_RE = /^[A-Z2-7]+$/

// Reimplement HOTP exactly as lib/totp.ts does so tests can compute a valid
// token for a given secret + time without exposing internals.
const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
function base32Decode(encoded: string): Uint8Array {
  const str = encoded.toUpperCase().replace(/=+$/, '').replace(/\s/g, '')
  const bits: number[] = []
  for (const c of str) {
    const val = B32.indexOf(c)
    if (val === -1) throw new Error('Invalid base32')
    for (let i = 4; i >= 0; i--) bits.push((val >> i) & 1)
  }
  const bytes = new Uint8Array(Math.floor(bits.length / 8))
  for (let i = 0; i < bytes.length; i++) {
    let b = 0
    for (let j = 0; j < 8; j++) b = (b << 1) | bits[i * 8 + j]
    bytes[i] = b
  }
  return bytes
}
async function hotp(secret: string, counter: number): Promise<string> {
  const keyBytes = base32Decode(secret)
  const key = await crypto.subtle.importKey(
    'raw',
    keyBytes.buffer.slice(keyBytes.byteOffset, keyBytes.byteOffset + keyBytes.byteLength) as ArrayBuffer,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  )
  const buf = new Uint8Array(8)
  let c = counter
  for (let i = 7; i >= 0; i--) { buf[i] = c & 0xff; c = Math.floor(c / 256) }
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, buf))
  const offset = sig[sig.length - 1] & 0xf
  const code = ((sig[offset] & 0x7f) << 24) | (sig[offset + 1] << 16) | (sig[offset + 2] << 8) | sig[offset + 3]
  return (code % 1_000_000).toString().padStart(6, '0')
}
function tokenForTime(secret: string, epochMs: number) {
  return hotp(secret, Math.floor(epochMs / 1000 / 30))
}

afterEach(() => {
  vi.useRealTimers()
})

describe('generateTotpSecret', () => {
  it('returns a string', () => {
    expect(typeof generateTotpSecret()).toBe('string')
  })

  it('emits one base32 char per random byte → 20 chars', () => {
    // Implementation maps each of the 20 bytes to a single B32 char (b & 0x1f),
    // so the secret is 20 chars long (not a full base32 encoding of 20 bytes).
    expect(generateTotpSecret()).toHaveLength(20)
  })

  it('contains only valid base32 chars (A-Z2-7)', () => {
    for (let i = 0; i < 50; i++) {
      expect(generateTotpSecret()).toMatch(B32_RE)
    }
  })

  it('produces a different secret each call', () => {
    const a = generateTotpSecret()
    const b = generateTotpSecret()
    expect(a).not.toBe(b)
  })
})

describe('totpUri', () => {
  const secret = 'JBSWY3DPEHPK3PXP'
  const uri = totpUri(secret, 'VocabWise', 'admin@vocabwise.id.vn')

  it('uses the otpauth://totp scheme with issuer:account label', () => {
    expect(uri.startsWith('otpauth://totp/VocabWise:')).toBe(true)
  })

  it('URL-encodes the account', () => {
    expect(uri).toContain(encodeURIComponent('admin@vocabwise.id.vn'))
  })

  it('includes secret, issuer, algorithm, digits, and period params', () => {
    const q = new URL(uri).searchParams
    expect(q.get('secret')).toBe(secret)
    expect(q.get('issuer')).toBe('VocabWise')
    expect(q.get('algorithm')).toBe('SHA1')
    expect(q.get('digits')).toBe('6')
    expect(q.get('period')).toBe('30')
  })

  it('URL-encodes an issuer that contains spaces', () => {
    const u = totpUri(secret, 'IELTS Champion', 'me')
    expect(u).toContain('IELTS%20Champion')
  })
})

describe('verifyTotp', () => {
  const secret = generateTotpSecret()

  it('accepts the token for the current 30s window', async () => {
    const now = 1_700_000_000_000 // fixed instant
    vi.useFakeTimers()
    vi.setSystemTime(now)
    const token = await tokenForTime(secret, now)
    expect(await verifyTotp(secret, token)).toBe(true)
  })

  it('accepts a token from the adjacent (±30s) window (clock skew tolerance)', async () => {
    const now = 1_700_000_000_000
    vi.useFakeTimers()
    vi.setSystemTime(now)
    const prevWindow = await tokenForTime(secret, now - 30_000)
    const nextWindow = await tokenForTime(secret, now + 30_000)
    expect(await verifyTotp(secret, prevWindow)).toBe(true)
    expect(await verifyTotp(secret, nextWindow)).toBe(true)
  })

  it('rejects a wrong token', async () => {
    expect(await verifyTotp(secret, '000000')).toBe(false)
  })

  it('rejects an expired token (older than the ±1 window)', async () => {
    const now = 1_700_000_000_000
    vi.useFakeTimers()
    vi.setSystemTime(now)
    // Token computed 90s in the past → outside the [-1,0,+1] window set.
    const stale = await tokenForTime(secret, now - 90_000)
    expect(await verifyTotp(secret, stale)).toBe(false)
  })

  it('trims surrounding whitespace before comparing', async () => {
    const now = 1_700_000_000_000
    vi.useFakeTimers()
    vi.setSystemTime(now)
    const token = await tokenForTime(secret, now)
    expect(await verifyTotp(secret, `  ${token}  `)).toBe(true)
  })
})
