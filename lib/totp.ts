// TOTP RFC 6238 using Web Crypto (no external deps, Node 18+ / Vercel edge)

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
  const key = await crypto.subtle.importKey('raw', keyBytes.buffer.slice(keyBytes.byteOffset, keyBytes.byteOffset + keyBytes.byteLength) as ArrayBuffer, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign'])
  const buf = new Uint8Array(8)
  let c = counter
  for (let i = 7; i >= 0; i--) { buf[i] = c & 0xff; c = Math.floor(c / 256) }
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, buf))
  const offset = sig[sig.length - 1] & 0xf
  const code = ((sig[offset] & 0x7f) << 24) | (sig[offset + 1] << 16) | (sig[offset + 2] << 8) | sig[offset + 3]
  return (code % 1_000_000).toString().padStart(6, '0')
}

export async function verifyTotp(secret: string, token: string): Promise<boolean> {
  const counter = Math.floor(Date.now() / 1000 / 30)
  for (const delta of [-1, 0, 1]) {
    if (await hotp(secret, counter + delta) === token.trim()) return true
  }
  return false
}

export function generateTotpSecret(): string {
  const bytes = new Uint8Array(20)
  crypto.getRandomValues(bytes)
  return Array.from(bytes).map(b => B32[b & 0x1f]).join('')
}

export function totpUri(secret: string, issuer: string, account: string): string {
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(account)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`
}
