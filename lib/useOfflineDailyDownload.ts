'use client'

import { useState, useEffect, useCallback } from 'react'
import type { DownloadState } from './useOfflineDownload'

const DOWNLOAD_CACHE = 'vocabwise-downloads-v1'

function pageUrl(childId: string, level: string, topicId: string) {
  return `/dashboard/${childId}/${level}/${topicId}`
}

function emitCacheChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('offline-cache-changed'))
  }
}

export function useOfflineDailyDownload(childId: string, level: string, topicId: string) {
  const [state, setState] = useState<DownloadState>('idle')

  // Check cache on mount
  useEffect(() => {
    if (!('caches' in window)) return
    caches.open(DOWNLOAD_CACHE)
      .then(cache => cache.match(pageUrl(childId, level, topicId)))
      .then(r => { if (r) setState('downloaded') })
      .catch(() => {})
  }, [childId, level, topicId])

  const download = useCallback(async (): Promise<{ error?: string } | void> => {
    if (state === 'downloading' || state === 'downloaded') return
    setState('downloading')

    try {
      // Validate Pro access + child ownership + rate limit server-side
      const check = await fetch('/api/offline/daily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId, level, topicId }),
      })
      if (check.status === 403) {
        setState('idle')
        return { error: 'pro_required' }
      }
      if (check.status === 429) {
        setState('idle')
        return { error: 'rate_limited' }
      }
      if (!check.ok) throw new Error('validation_failed')

      const url = pageUrl(childId, level, topicId)
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
          sw.postMessage({ type: 'DOWNLOAD_DAILY_TOPIC', childId, level, topicId }, [mc.port2])
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
  }, [childId, level, topicId, state])

  const remove = useCallback(async () => {
    if (!('caches' in window)) return
    // Direct delete for immediate guaranteed removal
    const cache = await caches.open(DOWNLOAD_CACHE)
    await cache.delete(pageUrl(childId, level, topicId))
    // Notify SW (informational)
    navigator.serviceWorker?.controller?.postMessage({ type: 'REMOVE_DAILY_DOWNLOAD', childId, level, topicId })
    setState('idle')
    emitCacheChange()
  }, [childId, level, topicId])

  return { state, download, remove }
}
