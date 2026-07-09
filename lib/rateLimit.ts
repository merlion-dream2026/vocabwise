import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Shared across all Vercel instances when Upstash env vars are set.
// Falls back to in-memory (per-instance) when not configured — fine for pilot scale.

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url:   process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null

// Cache one Ratelimit instance per (limit, window) pair
const limiterCache = new Map<string, Ratelimit>()

function getUpstashLimiter(limit: number, windowSec: number): Ratelimit {
  const key = `${limit}:${windowSec}`
  if (!limiterCache.has(key)) {
    limiterCache.set(key, new Ratelimit({
      redis: redis!,
      limiter: Ratelimit.slidingWindow(limit, `${windowSec} s`),
      analytics: false,
      prefix: 'vw_rl',
    }))
  }
  return limiterCache.get(key)!
}

// Warn (rate-limited to once/60s) when Upstash is unreachable and a call falls back to
// in-memory — that fallback isn't shared across Vercel instances, so limits stop being
// enforced globally without this being visible somewhere.
let lastRedisWarnAt = 0
export function warnRedisFallback(source: string, err: unknown) {
  const now = Date.now()
  if (now - lastRedisWarnAt < 60_000) return
  lastRedisWarnAt = now
  console.warn(`[rateLimit] Upstash unreachable, falling back to in-memory (${source}):`, err)
}

// In-memory fallback
const store = new Map<string, { count: number; resetAt: number }>()

function inMemoryLimit(key: string, limit: number, windowSec: number): boolean {
  const now = Date.now()
  const windowMs = windowSec * 1000
  let entry = store.get(key)
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + windowMs }
    store.set(key, entry)
  }
  if (entry.count >= limit) return false
  entry.count++
  return true
}

export async function rateLimit(
  key: string,
  limit: number,
  windowSec: number,
): Promise<{ allowed: boolean }> {
  if (redis) {
    try {
      const { success } = await getUpstashLimiter(limit, windowSec).limit(key)
      return { allowed: success }
    } catch (e) {
      warnRedisFallback('rateLimit', e)
    }
  }
  return { allowed: inMemoryLimit(key, limit, windowSec) }
}

// Daily cap: 150 topic page requests per family per UTC day
const capStore = new Map<string, { count: number; resetAt: number }>()

export async function checkDailyCap(familyId: string, limit = 150): Promise<boolean> {
  const date = new Date().toISOString().split('T')[0]
  const key  = `vw:cap:${familyId}:${date}`
  if (redis) {
    try {
      const count = await redis.incr(key)
      if (count === 1) await redis.expire(key, 90000) // 25h
      return count <= limit
    } catch (e) { warnRedisFallback('checkDailyCap', e) }
  }
  const now = Date.now()
  const ttl = 25 * 60 * 60 * 1000
  let e = capStore.get(key)
  if (!e || now > e.resetAt) { e = { count: 0, resetAt: now + ttl }; capStore.set(key, e) }
  e.count++
  return e.count <= limit
}

// ── AI Speak daily usage ──────────────────────────────────────────────────────
const aiSpeakStore = new Map<string, { count: number; resetAt: number }>()

/** Increments usage and returns false if the daily limit is exceeded. */
export async function checkAndIncrementAISpeakUsage(familyId: string, limit: number): Promise<boolean> {
  const date = new Date().toISOString().split('T')[0]
  const key = `vw:ai:${familyId}:${date}`
  if (redis) {
    try {
      const count = await redis.incr(key)
      if (count === 1) await redis.expire(key, 90000) // 25h
      return count <= limit
    } catch (e) { warnRedisFallback('checkAndIncrementAISpeakUsage', e) }
  }
  const now = Date.now()
  const ttl = 25 * 60 * 60 * 1000
  let e = aiSpeakStore.get(key)
  if (!e || now > e.resetAt) { e = { count: 0, resetAt: now + ttl }; aiSpeakStore.set(key, e) }
  e.count++
  return e.count <= limit
}

// ── AI text-helper daily usage (explain/hint/grammar-note/writing-check/generate-exercises) ──
const aiTextStore = new Map<string, { count: number; resetAt: number }>()

/** Shared daily cap across all AI text-helper endpoints per family. Prevents cost-abuse spam. */
export async function checkAndIncrementAITextUsage(familyId: string, limit = 60): Promise<boolean> {
  const date = new Date().toISOString().split('T')[0]
  const key = `vw:ai-text:${familyId}:${date}`
  if (redis) {
    try {
      const count = await redis.incr(key)
      if (count === 1) await redis.expire(key, 90000) // 25h
      return count <= limit
    } catch (e) { warnRedisFallback('checkAndIncrementAITextUsage', e) }
  }
  const now = Date.now()
  const ttl = 25 * 60 * 60 * 1000
  let e = aiTextStore.get(key)
  if (!e || now > e.resetAt) { e = { count: 0, resetAt: now + ttl }; aiTextStore.set(key, e) }
  e.count++
  return e.count <= limit
}

// ── OTP attempt tracking ──────────────────────────────────────────────────────
const otpAttemptStore = new Map<string, { count: number; resetAt: number }>()

/** Increments OTP failure counter. Returns new count. TTL matches OTP expiry (15 min). */
export async function incrementOtpAttempts(familyId: string): Promise<number> {
  const key = `vw:otp-att:${familyId}`
  if (redis) {
    try {
      const count = await redis.incr(key)
      if (count === 1) await redis.expire(key, 900) // 15 min
      return count
    } catch (e) { warnRedisFallback('incrementOtpAttempts', e) }
  }
  const now = Date.now()
  const ttl = 15 * 60 * 1000
  let e = otpAttemptStore.get(key)
  if (!e || now > e.resetAt) { e = { count: 0, resetAt: now + ttl }; otpAttemptStore.set(key, e) }
  e.count++
  return e.count
}

/** Resets OTP failure counter on successful verification. */
export async function resetOtpAttempts(familyId: string): Promise<void> {
  if (redis) redis.del(`vw:otp-att:${familyId}`).catch(() => {})
  otpAttemptStore.delete(`vw:otp-att:${familyId}`)
}
