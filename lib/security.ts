import { supabase } from '@/lib/supabaseServer'
import { Redis } from '@upstash/redis'

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN })
    : null

// ── E: Honeypot ──────────────────────────────────────────────────────────────
// IDs that never appear in the UI — only bots/scrapers hit them
export const HONEYPOT_TOPICS = new Set(['b1-t00', 'b2-t00', 'b3-t00'])

export async function blockFamily(familyId: string): Promise<void> {
  if (redis) await redis.sadd('vw:blocked', familyId).catch(() => {})
  await supabase.from('families').update({ is_blocked: true }).eq('id', familyId)
}

export async function isFamilyBlocked(familyId: string): Promise<boolean> {
  if (redis) {
    try {
      return (await redis.sismember('vw:blocked', familyId)) === 1
    } catch { /* fall through */ }
  }
  const { data } = await supabase
    .from('families').select('is_blocked').eq('id', familyId).single()
  return data?.is_blocked === true
}

// ── B: Sequential scraping detection ────────────────────────────────────────
// Flag if 5+ topics are accessed in numerical order within 10 min
const seqStore = new Map<string, { nums: number[]; times: number[] }>()

export function detectSequential(familyId: string, topicId: string): boolean {
  const match = topicId.match(/t(\d+)$/)
  if (!match) return false
  const num = parseInt(match[1])
  const now = Date.now()
  const cutoff = now - 10 * 60_000

  const prev = seqStore.get(familyId) ?? { nums: [], times: [] }
  const valid = prev.nums
    .map((n, i) => ({ n, t: prev.times[i] }))
    .filter(e => e.t > cutoff)
  valid.push({ n: num, t: now })
  seqStore.set(familyId, { nums: valid.map(e => e.n), times: valid.map(e => e.t) })

  if (valid.length < 5) return false

  const recent = valid.slice(-5).map(e => e.n).sort((a, b) => a - b)
  for (let i = 1; i < recent.length; i++) {
    if (recent[i] - recent[i - 1] > 2) return false
  }
  return true
}

// ── C: New-account velocity cap ──────────────────────────────────────────────
// Accounts < 24h old get a tighter cap to deter create-and-scrape attacks
export async function getAgeCap(familyId: string): Promise<number> {
  const { data } = await supabase
    .from('families').select('created_at').eq('id', familyId).single()
  if (!data?.created_at) return 20
  const ageHrs = (Date.now() - new Date(data.created_at).getTime()) / 3_600_000
  return ageHrs < 24 ? 5 : 20
}

// ── F: Impossible-travel detection ───────────────────────────────────────────
// Returns true if the same session appears from two different countries/IPs
// within a short window — indicates account sharing or session hijack
export async function detectImpossibleTravel(
  familyId: string,
  currentIp: string,
  cfCountry?: string,
): Promise<boolean> {
  const { data } = await supabase
    .from('families')
    .select('last_request_ip, last_request_at, last_request_country')
    .eq('id', familyId)
    .single()

  // Update current request metadata (fire-and-forget — don't block response)
  supabase.from('families').update({
    last_request_ip:      currentIp,
    last_request_at:      new Date().toISOString(),
    last_request_country: cfCountry ?? null,
  }).eq('id', familyId).then(() => {}, () => {})

  if (!data?.last_request_at) return false
  const minsSince = (Date.now() - new Date(data.last_request_at).getTime()) / 60_000
  if (minsSince > 60) return false

  // Country changed within 1 hour (only possible when Cloudflare proxy is active)
  if (
    cfCountry && cfCountry !== 'XX' &&
    data.last_request_country && data.last_request_country !== cfCountry
  ) return true

  // /16 subnet changed within 5 minutes — VPN switch or credential sharing
  if (data.last_request_ip && currentIp !== 'unknown' && minsSince < 5) {
    const prevNet = data.last_request_ip.split('.').slice(0, 2).join('.')
    const currNet = currentIp.split('.').slice(0, 2).join('.')
    if (prevNet !== currNet) return true
  }

  return false
}

// ── D: Cloudflare Turnstile verification ─────────────────────────────────────
// Returns true if token is valid, or if Turnstile is not yet configured (graceful)
export async function verifyTurnstile(token: string | undefined): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) return true   // Not configured — skip silently
  if (!token)  return false

  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret, response: token }),
    })
    const data = await res.json() as { success: boolean }
    return data.success === true
  } catch {
    return true // Network error — degrade gracefully, don't block user
  }
}
