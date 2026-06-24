'use client'

import { useState, useEffect, useCallback } from 'react'

type DownloadEntry = {
  cacheKey: string  // full cache URL
  path: string      // pathname only
  type: 'daily' | 'academic'
  label: string
}

const DOWNLOAD_CACHE = 'vocabwise-downloads-v1'

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
        // Daily: /dashboard/{uuid}/{level}/{topicId}
        const daily = path.match(/^\/dashboard\/[0-9a-f-]{36}\/([^/]+)\/([^/]+)$/)
        if (daily) {
          const [, level, topicId] = daily
          let label = `Daily · ${level} / ${topicId}`
          try {
            const raw = localStorage.getItem(`vw_dl_daily_${level}_${topicId}`)
            const bundle = raw ? JSON.parse(raw) : null
            if (bundle?.topic?.name) label = `Daily · ${level} — ${bundle.topic.name}`
          } catch {}
          return { cacheKey: req.url, path, type: 'daily' as const, label }
        }
        // Academic: /vocabwise/book1/b1-t01
        const academic = path.match(/^\/vocabwise\/(book[123])\/(b[123]-t\d+)$/)
        if (academic) {
          const [, book, topicId] = academic
          return { cacheKey: req.url, path, type: 'academic' as const, label: `Academic · ${book} / ${topicId}` }
        }
        return { cacheKey: req.url, path, type: 'academic' as const, label: path }
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
        // Clean up localStorage for daily
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
    setDeleting(false)
  }

  async function deleteAll() {
    setDeleting(true)
    try {
      await caches.delete(DOWNLOAD_CACHE)
      // Clear all related localStorage keys
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
    setDeleting(false)
  }

  function toggleSelect(key: string) {
    setSelected(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n })
  }

  function toggleAll() {
    setSelected(selected.size === entries.length ? new Set() : new Set(entries.map(e => e.cacheKey)))
  }

  if (loading) return (
    <div className="bg-white rounded-2xl border-2 border-slate-100 p-6">
      <p className="text-slate-400 text-sm">Đang tải danh sách...</p>
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-slate-700">
          {entries.length > 0 ? `${entries.length} topic đã tải (thiết bị này)` : 'Không có topic nào được tải offline'}
        </p>
        <div className="flex gap-2">
          <button
            onClick={loadEntries}
            className="text-xs font-bold text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50"
          >
            ↺ Làm mới
          </button>
          {entries.length > 0 && (
            <button
              onClick={() => setConfirmAll(true)}
              className="text-xs font-bold text-red-500 hover:text-red-700 px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50"
            >
              Xóa tất cả
            </button>
          )}
        </div>
      </div>

      {entries.length > 0 && (
        <>
          <div className="bg-white rounded-2xl border-2 border-slate-100 overflow-hidden divide-y divide-slate-100">
            <div className="px-4 py-2.5 flex items-center gap-3 bg-slate-50">
              <input
                type="checkbox"
                checked={selected.size > 0 && selected.size === entries.length}
                ref={el => { if (el) el.indeterminate = selected.size > 0 && selected.size < entries.length }}
                onChange={toggleAll}
                className="w-4 h-4 rounded accent-indigo-600"
              />
              <span className="text-xs text-slate-500 font-medium">
                {selected.size > 0 ? `Đã chọn ${selected.size}` : 'Chọn tất cả'}
              </span>
            </div>
            {entries.map(entry => (
              <div key={entry.cacheKey} className="px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors">
                <input
                  type="checkbox"
                  checked={selected.has(entry.cacheKey)}
                  onChange={() => toggleSelect(entry.cacheKey)}
                  className="w-4 h-4 rounded accent-indigo-600 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">{entry.label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {entry.type === 'daily' ? '📱 Daily module' : '🎓 Academic module'}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {selected.size > 0 && (
            <button
              onClick={deleteSelected}
              disabled={deleting}
              className="w-full bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-bold text-sm py-3 rounded-xl transition-colors"
            >
              {deleting ? 'Đang xóa...' : `🗑 Xóa ${selected.size} topic đã chọn`}
            </button>
          )}
        </>
      )}

      {confirmAll && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setConfirmAll(false)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <p className="font-black text-gray-800 text-lg mb-2">Xóa tất cả offline?</p>
            <p className="text-gray-500 text-sm mb-5">
              Tất cả <span className="font-bold text-gray-700">{entries.length} topic</span> đã tải sẽ bị xóa khỏi bộ nhớ thiết bị này. Có thể tải lại bất cứ lúc nào.
            </p>
            <div className="flex gap-3">
              <button
                onClick={deleteAll}
                disabled={deleting}
                className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-bold py-3 rounded-2xl transition-colors"
              >
                {deleting ? 'Đang xóa...' : 'Xóa tất cả'}
              </button>
              <button
                onClick={() => setConfirmAll(false)}
                className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 rounded-2xl"
              >
                Huỷ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
