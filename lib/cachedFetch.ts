// Thin dedup + short-TTL cache for GET endpoints that repeat across navigations
// unchanged within a session (/api/auth/me, /api/children). Returns a Response-like
// object so existing `.then(r => r.json())` / `.then(r => r.ok ? r.json() : ...)`
// call sites work without modification.
const TTL_MS = 15_000

type CachedResponse = { ok: boolean; json: () => Promise<unknown> }

const cache = new Map<string, { expires: number; promise: Promise<CachedResponse> }>()

export function cachedFetch(url: string): Promise<CachedResponse> {
  const now = Date.now()
  const hit = cache.get(url)
  if (hit && hit.expires > now) return hit.promise

  const promise = fetch(url).then(async res => {
    let data: unknown = null
    try { data = await res.json() } catch {}
    return { ok: res.ok, json: async () => data }
  })
  // Evict on failure so a transient error isn't cached for the full TTL.
  promise.catch(() => cache.delete(url))
  cache.set(url, { expires: now + TTL_MS, promise })
  return promise
}

// Call after a mutation (login/logout/add child) so the next read isn't stale.
export function invalidateCachedFetch(url?: string) {
  if (url) cache.delete(url)
  else cache.clear()
}
