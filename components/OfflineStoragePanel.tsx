'use client'

import { useState, useEffect, useCallback } from 'react'

type DownloadEntry = {
  cacheKey: string
  path: string
  type: 'daily' | 'academic'
  label: string
  downloadSize: number  // audioSize + data overhead, from stored bundle
}

const DOWNLOAD_CACHE = 'vocabwise-downloads-v1'
const DATA_OVERHEAD  = 30 * 1024  // ~30KB for words+story JSON

function formatBytes(bytes: number): string {
  if (bytes === 0) return ''
  if (bytes < 1024 * 1024) return `~${Math.round(bytes / 1024)}KB`
  return `~${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

function getDailyDownloadSize(path: string): number {
  const m = path.match(/^\/dashboard\/[0-9a-f-]{36}\/([^/]+)\/([^/]+)$/)
  if (!m) return 0
  try {
    const raw = localStorage.getItem(`vw_dl_daily_${m[1]}_${m[2]}`)
    const bundle = raw ? JSON.parse(raw) : null
    const audio = (bundle?.audioSize as number) ?? 0
    return audio > 0 ? audio + DATA_OVERHEAD : 0
  } catch { return 0 }
}

function emitCacheChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('offline-cache-changed'))
  }
}

export function OfflineStoragePanel() {
  const [entries, setEntries] = useState<DownloadEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [confirmAll, setConfirmAll] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const loadEntries = useCallback(async () => {
    setLoading(true)
    if (!('caches' in window)) { setLoading(false); return }
    try {
      const cache = await caches.open(DOWNLOAD_CACHE)
      const keys = await cache.keys()
      const result: DownloadEntry[] = keys.map(req => {
        const path = new URL(req.url).pathname
        const daily = path.match(/^\/dashboard\/[0-9a-f-]{36}\/([^/]+)\/([^/]+)$/)
        if (daily) {
          const [, level, topicId] = daily
          let label = `${level} / ${topicId}`
          try {
            const raw = localStorage.getItem(`vw_dl_daily_${level}_${topicId}`)
            const bundle = raw ? JSON.parse(raw) : null
            if (bundle?.topic?.name) label = `${bundle.topic.name}`
          } catch {}
          return { cacheKey: req.url, path, type: 'daily' as const, label, downloadSize: getDailyDownloadSize(path) }
        }
        const academic = path.match(/^\/vocabwise\/(book[123])\/(b[123]-t\d+)$/)
        if (academic) {
          const [, book, topicId] = academic
          return { cacheKey: req.url, path, type: 'academic' as const, label: `${book} / ${topicId}`, downloadSize: 0 }
        }
        return { cacheKey: req.url, path, type: 'academic' as const, label: path, downloadSize: 0 }
      })
      setEntries(result)
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { loadEntries() }, [loadEntries])

  async function deleteSelected() {
    setDeleting(true)
    try {
      const cache = await caches.open(DOWNLOAD_CACHE)
      for (const entry of entries.filter(e => selected.has(e.cacheKey))) {
        await cache.delete(entry.cacheKey).catch(() => {})
        const daily = entry.path.match(/^\/dashboard\/[0-9a-f-]{36}\/([^/]+)\/([^/]+)$/)
        if (daily) {
          localStorage.removeItem(`vw_dl_daily_${daily[1]}_${daily[2]}`)
          localStorage.removeItem(`vw_last_sync_${daily[1]}`)
          localStorage.removeItem(`vw_offline_prog_${daily[1]}_${daily[2]}`)
        }
      }
    } catch {}
    setSelected(new Set())
    await loadEntries()
    emitCacheChange()
    setDeleting(false)
  }

  async function deleteAll() {
    setDeleting(true)
    try {
      await caches.delete(DOWNLOAD_CACHE)
      const toDelete: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i)
        if (k?.startsWith('vw_dl_') || k?.startsWith('vw_last_sync_') || k?.startsWith('vw_offline_prog_')) {
          toDelete.push(k)
        }
      }
      toDelete.forEach(k => localStorage.removeItem(k))
    } catch {}
    setEntries([])
    setSelected(new Set())
    setConfirmAll(false)
    emitCacheChange()
    setDeleting(false)
  }

  function toggleSelect(key: string) {
    setSelected(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n })
  }

  function toggleAll() {
    setSelected(selected.size === entries.length ? new Set() : new Set(entries.map(e => e.cacheKey)))
  }

  if (loading) return <p className="text-gray-400 text-sm py-2">Đang tải...</p>

  if (entries.length === 0) return (
    <p className="text-gray-400 text-sm py-1">
      Chưa có chủ đề nào được tải offline. Bấm ↓ trên từng chủ đề để tải (Gói Pro).
    </p>
  )

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-100">
        {/* Select all row */}
        <div className="px-4 py-2.5 flex items-center gap-3 bg-gray-50">
          <input
            type="checkbox"
            checked={selected.size > 0 && selected.size === entries.length}
            ref={el => { if (el) el.indeterminate = selected.size > 0 && selected.size < entries.length }}
            onChange={toggleAll}
            className="w-4 h-4 rounded accent-purple-600"
          />
          <span className="text-xs text-gray-500 font-medium flex-1">
            {selected.size > 0 ? `Đã chọn ${selected.size}` : (
              <>
                {entries.length} chủ đề đã tải
                {(() => { const total = entries.reduce((s, e) => s + e.downloadSize, 0); return total > 0 ? <span className="text-gray-400 ml-1">· {formatBytes(total)}</span> : null })()}
              </>
            )}
          </span>
          <button
            onClick={() => setConfirmAll(true)}
            className="text-xs font-bold text-red-400 hover:text-red-600 transition-colors"
          >
            Xóa tất cả
          </button>
        </div>

        {entries.map(entry => (
          <div key={entry.cacheKey} className="px-4 py-3 flex items-center gap-3">
            <input
              type="checkbox"
              checked={selected.has(entry.cacheKey)}
              onChange={() => toggleSelect(entry.cacheKey)}
              className="w-4 h-4 rounded accent-purple-600 flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-700 truncate">{entry.label}</p>
              <p className="text-xs text-gray-400">
                {entry.type === 'daily' ? '📱 Daily' : '🎓 Academic'}
                {entry.downloadSize > 0 && <span className="ml-1.5 text-gray-300">·</span>}
                {entry.downloadSize > 0 && <span className="ml-1.5 font-medium">{formatBytes(entry.downloadSize)}</span>}
              </p>
            </div>
          </div>
        ))}
      </div>

      {selected.size > 0 && (
        <button
          onClick={deleteSelected}
          disabled={deleting}
          className="w-full bg-red-50 text-red-500 font-black text-sm py-2.5 rounded-2xl border border-red-200 hover:bg-red-100 disabled:opacity-50 transition-colors active:scale-95"
        >
          {deleting ? 'Đang xóa...' : `🗑 Xóa ${selected.size} chủ đề đã chọn`}
        </button>
      )}

      {confirmAll && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 p-4" onClick={() => setConfirmAll(false)}>
          <div className="bg-white rounded-3xl p-5 w-full max-w-sm shadow-2xl mb-2" onClick={e => e.stopPropagation()}>
            <p className="font-black text-gray-800 text-base mb-1">Xóa tất cả offline?</p>
            <p className="text-gray-500 text-sm mb-4">
              Tất cả <span className="font-semibold text-gray-700">{entries.length} chủ đề</span> đã tải sẽ bị xóa. Có thể tải lại bất cứ lúc nào.
            </p>
            <div className="flex gap-3">
              <button onClick={deleteAll} disabled={deleting}
                className="flex-1 bg-red-500 text-white font-black py-3 rounded-2xl active:scale-95 disabled:opacity-50 transition-all">
                {deleting ? 'Đang xóa...' : 'Xóa tất cả'}
              </button>
              <button onClick={() => setConfirmAll(false)}
                className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 rounded-2xl active:scale-95 transition-all">
                Huỷ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
