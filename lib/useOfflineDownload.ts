'use client'

import { useState, useEffect, useCallback } from 'react'
import { clearAllOfflineData } from './offlineStorage'

export type DownloadState = 'idle' | 'downloading' | 'downloaded' | 'error'

const DOWNLOAD_CACHE = 'vocabwise-downloads-v1'

function pageUrl(book: string, topicId: string) {
  return `/vocabwise/${book}/${topicId}`
}

function emitCacheChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('offline-cache-changed'))
  }
}

export function useOfflineDownload(book: string, topicId: string) {
  const [state, setState] = useState<DownloadState>('idle')

  // Check cache on mount
  useEffect(() => {
    if (!('caches' in window)) return
    caches.open(DOWNLOAD_CACHE)
      .then(cache => cache.match(pageUrl(book, topicId)))
      .then(r => { if (r) setState('downloaded') })
      .catch(() => {})
  }, [book, topicId])

  const download = useCallback(async (): Promise<{ error?: string } | void> => {
    if (state === 'downloading' || state === 'downloaded') return
    setState('downloading')

    try {
      // Validate Pro access + rate limit server-side
      const check = await fetch(`/api/offline/topic/${topicId}`)
      if (check.status === 403) {
        setState('idle')
        return { error: 'pro_required' }
      }
      if (check.status === 429) {
        setState('idle')
        return { error: 'rate_limited' }
      }
      if (!check.ok) throw new Error('validation_failed')

      const url = pageUrl(book, topicId)
      const sw = navigator.serviceWorker?.controller

      if (sw) {
        // Use MessageChannel to wait for SW confirmation before marking as downloaded
        await new Promise<void>((resolve, reject) => {
          const mc = new MessageChannel()
          const timer = setTimeout(() => reject(new Error('sw_timeout')), 30_000)
          mc.port1.onmessage = (e) => {
            clearTimeout(timer)
            e.data.ok ? resolve() : reject(new Error('cache_failed'))
          }
          sw.postMessage({ type: 'DOWNLOAD_TOPIC', book, topicId }, [mc.port2])
        })
      } else {
        // Fallback: fetch and cache directly (SW not yet controlling)
        const cache = await caches.open(DOWNLOAD_CACHE)
        const res = await fetch(url, { credentials: 'include' })
        if (!res.ok) throw new Error('fetch_failed')
        await cache.put(url, res)
      }

      setState('downloaded')
      emitCacheChange()
    } catch {
      setState('error')
      setTimeout(() => setState('idle'), 3000)
    }
  }, [book, topicId, state])

  const remove = useCallback(async () => {
    if (!('caches' in window)) return
    // Direct delete for immediate guaranteed removal
    const cache = await caches.open(DOWNLOAD_CACHE)
    await cache.delete(pageUrl(book, topicId))
    // Notify SW (informational)
    navigator.serviceWorker?.controller?.postMessage({ type: 'REMOVE_DOWNLOAD', book, topicId })
    setState('idle')
    emitCacheChange()
  }, [book, topicId])

  return { state, download, remove }
}

// ─── Utility functions ────────────────────────────────────────────────────────

/** Returns total count of ALL offline downloads (Academic + Daily combined). */
export async function getDownloadedCount(): Promise<number> {
  if (!('caches' in window)) return 0
  try {
    const cache = await caches.open(DOWNLOAD_CACHE)
    const keys = await cache.keys()
    return keys.length
  } catch {
    return 0
  }
}

/** Returns Academic topicIds + Daily URLs from the download cache. */
export async function getDownloadedTopics(): Promise<string[]> {
  if (!('caches' in window)) return []
  try {
    const cache = await caches.open(DOWNLOAD_CACHE)
    const keys = await cache.keys()
    return keys
      .map(r => {
        const p = new URL(r.url).pathname
        // Academic: /vocabwise/book1/b1-t01
        const academic = p.match(/\/vocabwise\/book[123]\/(b[123]-t\d+)$/)
        if (academic) return academic[1]
        // Daily: /dashboard/<uuid>/<level>/<topicId>
        const daily = p.match(/^\/dashboard\/[0-9a-f-]{36}\/[^/]+\/([^/]+)$/)
        if (daily) return `daily:${daily[1]}`
        return ''
      })
      .filter(Boolean)
  } catch {
    return []
  }
}

/** Clears all offline downloads (Cache Storage + localStorage). Awaits cache deletion before logout. */
export async function clearAllDownloads(): Promise<void> {
  if (!('caches' in window)) return
  await caches.delete(DOWNLOAD_CACHE).catch(() => {})
  // Notify SW to sync its state
  navigator.serviceWorker?.controller?.postMessage({ type: 'CLEAR_DOWNLOADS' })
  // Also clear localStorage offline data
  clearAllOfflineData()
  emitCacheChange()
}
