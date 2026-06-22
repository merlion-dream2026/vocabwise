'use client'

import { useState, useEffect, useCallback } from 'react'

export type DownloadState = 'idle' | 'downloading' | 'downloaded' | 'error'

const DOWNLOAD_CACHE = 'vocabwise-downloads-v1'

function pageUrl(book: string, topicId: string) {
  return `/vocabwise/${book}/${topicId}`
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
        // SW handles fetch + cache asynchronously
        sw.postMessage({ type: 'DOWNLOAD_TOPIC', book, topicId })
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
  }, [book, topicId, state])

  const remove = useCallback(async () => {
    if (!('caches' in window)) return
    const sw = navigator.serviceWorker?.controller
    if (sw) {
      sw.postMessage({ type: 'REMOVE_DOWNLOAD', book, topicId })
    } else {
      const cache = await caches.open(DOWNLOAD_CACHE)
      await cache.delete(pageUrl(book, topicId))
    }
    setState('idle')
  }, [book, topicId])

  return { state, download, remove }
}

// ─── Utility functions ────────────────────────────────────────────────────────

export async function getDownloadedTopics(): Promise<string[]> {
  if (!('caches' in window)) return []
  try {
    const cache = await caches.open(DOWNLOAD_CACHE)
    const keys = await cache.keys()
    return keys
      .map(r => {
        const m = new URL(r.url).pathname.match(/\/vocabwise\/book[123]\/(b[123]-t\d+)$/)
        return m?.[1] ?? ''
      })
      .filter(Boolean)
  } catch {
    return []
  }
}

export async function getDownloadedCount(): Promise<number> {
  return (await getDownloadedTopics()).length
}

export async function clearAllDownloads(): Promise<void> {
  if (!('caches' in window)) return
  const sw = navigator.serviceWorker?.controller
  if (sw) {
    sw.postMessage({ type: 'CLEAR_DOWNLOADS' })
  } else {
    await caches.delete(DOWNLOAD_CACHE).catch(() => {})
  }
}
