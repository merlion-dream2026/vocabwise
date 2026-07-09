import { supabase } from '@/lib/supabaseServer'
import { Redis } from '@upstash/redis'
import { warnRedisFallback } from '@/lib/rateLimit'

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN })
    : null

// ── Family profile cache ──────────────────────────────────────────────────────
// One DB query per family per 5 min — used by all security checks in topics API

export interface FamilyProfile {
  plan: string
  free_trial_expires_at: string | null
  plan_end_date: string | null
  bonus_pro_expires_at: string | null
  bonus_features: string[] | null
  is_blocked: boolean
  created_at: string
  last_request_ip: string | null
  last_request_at: string | null
  last_request_country: string | null
}

export async function getFamilyProfile(familyId: string): Promise<FamilyProfile | null> {
  const key = `vw:fam:${familyId}`
  if (redis) {
    try {
      const cached = await redis.get<FamilyProfile>(key)
      if (cached) return cached
    } catch (e) { warnRedisFallback('getFamilyProfile', e) }
  }
  const { data } = await supabase
    .from('families')
    .select('plan, free_trial_expires_at, plan_end_date, bonus_pro_expires_at, bonus_features, is_blocked, created_at, last_request_ip, last_request_at, last_request_country')
    .eq('id', familyId)
    .single()
  if (!data) return null
  if (redis) redis.set(key, data, { ex: 300 }).catch(() => {})
  return data as FamilyProfile
}

function invalidateFamilyCache(familyId: string): void {
  if (redis) redis.del(`vw:fam:${familyId}`).catch(() => {})
}

// ── E: Honeypot ──────────────────────────────────────────────────────────────
export const HONEYPOT_TOPICS = new Set(['b1-t00', 'b2-t00', 'b3-t00'])

export async function blockFamily(familyId: string): Promise<void> {
  if (redis) await redis.sadd('vw:blocked', familyId).catch(() => {})
  invalidateFamilyCache(familyId) // force fresh read on next request
  await supabase.from('families').update({ is_blocked: true }).eq('id', familyId)
}

// ── B: Sequential scraping detection ─────────────────────────────────────────
// Uses Redis sorted set (score=timestamp, member=topicNum) for distributed tracking.
// Falls back to in-memory Map per instance when Redis unavailable.
const seqStore = new Map<string, { nums: number[]; times: number[] }>()

export async function detectSequential(familyId: string, topicId: string): Promise<boolean> {
  const match = topicId.match(/t(\d+)$/)
  if (!match) return false
  const num = parseInt(match[1])
  const now = Date.now()
  const cutoff = now - 10 * 60_000
  const key = `vw:seq:${familyId}`

  if (redis) {
    try {
      await redis.zadd(key, { score: now, member: `${now}:${num}` })
      await redis.zremrangebyscore(key, 0, cutoff)
      await redis.expire(key, 600)
      const members = await redis.zrange(key, 0, -1)
      const nums = (members as string[]).map((m) => parseInt(m.split(':')[1])).filter((n) => !isNaN(n))
      if (nums.length < 5) return false
      const recent = nums.slice(-5).sort((a: number, b: number) => a - b)
      for (let i = 1; i < recent.length; i++) {
        if (recent[i] - recent[i - 1] > 2) return false
      }
      return true
    } catch (e) { warnRedisFallback('detectSequential', e) }
  }

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

// ── F: Impossible-travel detection ───────────────────────────────────────────
// Accepts cached profile — no extra DB query needed
export function checkImpossibleTravel(
  profile: FamilyProfile,
  currentIp: string,
  cfCountry?: string,
): boolean {
  if (!profile.last_request_at) return false
  const minsSince = (Date.now() - new Date(profile.last_request_at).getTime()) / 60_000
  if (minsSince > 60) return false

  if (cfCountry && cfCountry !== 'XX' && profile.last_request_country &&
      profile.last_request_country !== cfCountry) return true

  if (profile.last_request_ip && currentIp !== 'unknown' && minsSince < 5) {
    const prevNet = profile.last_request_ip.split('.').slice(0, 2).join('.')
    const currNet = currentIp.split('.').slice(0, 2).join('.')
    if (prevNet !== currNet) return true
  }
  return false
}

// Fire-and-forget: update last_request_* in DB + invalidate cache
export function updateRequestMetadata(familyId: string, ip: string, country?: string): void {
  supabase.from('families').update({
    last_request_ip:      ip,
    last_request_at:      new Date().toISOString(),
    last_request_country: country ?? null,
  }).eq('id', familyId).then(() => {
    invalidateFamilyCache(familyId)
  }, () => {})
}

// ── D: Cloudflare Turnstile verification ─────────────────────────────────────
export async function verifyTurnstile(token: string | undefined): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) return true
  if (!token)  return process.env.VERCEL_ENV === 'preview'
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret, response: token }),
    })
    const data = await res.json() as { success: boolean }
    return data.success === true
  } catch (err) {
    console.warn('[Turnstile] verification error — blocking request:', err)
    return false
  }
}
