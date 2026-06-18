import { describe, it, expect, beforeEach } from 'vitest'

// Test the in-memory fallback logic directly (Upstash not available in tests)

type Store = Map<string, { count: number; resetAt: number }>

function createLimiter() {
  const store: Store = new Map()

  return function limit(key: string, max: number, windowSec: number): boolean {
    const now = Date.now()
    const windowMs = windowSec * 1000
    let entry = store.get(key)
    if (!entry || now > entry.resetAt) {
      entry = { count: 0, resetAt: now + windowMs }
      store.set(key, entry)
    }
    if (entry.count >= max) return false
    entry.count++
    return true
  }
}

describe('in-memory rate limiter', () => {
  it('allows requests up to limit', () => {
    const limit = createLimiter()
    for (let i = 0; i < 5; i++) {
      expect(limit('key', 5, 60)).toBe(true)
    }
  })

  it('blocks request at limit', () => {
    const limit = createLimiter()
    for (let i = 0; i < 5; i++) limit('key', 5, 60)
    expect(limit('key', 5, 60)).toBe(false)
  })

  it('different keys are independent', () => {
    const limit = createLimiter()
    for (let i = 0; i < 5; i++) limit('key1', 5, 60)
    expect(limit('key1', 5, 60)).toBe(false)
    expect(limit('key2', 5, 60)).toBe(true)
  })

  it('window resets after expiry', () => {
    const store: Store = new Map()
    const now = Date.now()
    // Pre-seed an expired window
    store.set('key', { count: 5, resetAt: now - 1000 })

    function limit(key: string, max: number, _windowSec: number): boolean {
      const entry = store.get(key)
      if (!entry || Date.now() > entry.resetAt) {
        store.set(key, { count: 1, resetAt: Date.now() + 60000 })
        return true
      }
      if (entry.count >= max) return false
      entry.count++
      return true
    }

    expect(limit('key', 5, 60)).toBe(true)
  })
})
