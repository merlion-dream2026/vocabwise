// In-memory rate limiter — works per Vercel instance (sufficient for small apps).
// For high traffic, replace with Upstash Redis + @upstash/ratelimit.
const store = new Map<string, { count: number; resetAt: number }>()

export function rateLimit(
  key: string,
  limit: number,
  windowSec: number
): { allowed: boolean } {
  const now = Date.now()
  const windowMs = windowSec * 1000
  let entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + windowMs }
    store.set(key, entry)
  }

  if (entry.count >= limit) return { allowed: false }
  entry.count++
  return { allowed: true }
}
