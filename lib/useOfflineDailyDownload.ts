'use client'

import { useState, useEffect, useCallback } from 'react'
import type { DownloadState } from './useOfflineDownload'

const DOWNLOAD_CACHE = 'vocabwise-downloads-v1'

function pageUrl(childId: string, level: string, topicId: string) {
  return `/dashboard/${childId}/${level}/${topicId}`
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
        // SW handles fetch + cache asynchronously
        sw.postMessage({ type: 'DOWNLOAD_DAILY_TOPIC', childId, level, topicId })
        // Optimistically mark as downloaded — SW will cache in background
        setState('downloaded')
      } else {
        // Fallback: fetch and cache directly (SW not yet controlling)
        const cache = await caches.open(DOWNLOAD_CACHE)
        const res = await fetch(url, { credentials: 'include' })
        if (!res.ok) throw new Error('fetch_failed')
        await cache.put(url, res)
        setState('downloaded')
      }
    } catch {
      setState('error')
      setTimeout(() => setState('idle'), 3000)
    }
  }, [childId, level, topicId, state])

  const remove = useCallback(async () => {
    if (!('caches' in window)) return
    const sw = navigator.serviceWorker?.controller
    if (sw) {
      sw.postMessage({ type: 'REMOVE_DAILY_DOWNLOAD', childId, level, topicId })
    } else {
      const cache = await caches.open(DOWNLOAD_CACHE)
      await cache.delete(pageUrl(childId, level, topicId))
    }
    setState('idle')
  }, [childId, level, topicId])

  return { state, download, remove }
}
