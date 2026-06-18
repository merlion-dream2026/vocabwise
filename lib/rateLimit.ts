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
    } catch {
      // Upstash unreachable — fall through to in-memory
    }
  }
  return { allowed: inMemoryLimit(key, limit, windowSec) }
}
