'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

type Notif = {
  id: string
  type: string
  title: string
  body: string
  url: string | null
  read_at: string | null
  created_at: string
}

export default function NotificationBell() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<Notif[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  const load = useCallback(() => {
    fetch('/api/notifications').then(r => r.ok ? r.json() : null).then(d => {
      if (d) { setItems(d.items); setUnreadCount(d.unreadCount) }
    }).catch(() => {})
  }, [])

  useEffect(() => {
    load()
    const onFocus = () => load()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [load])

  async function handleTap(n: Notif) {
    setOpen(false)
    if (!n.read_at) {
      setItems(prev => prev.map(x => x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x))
      setUnreadCount(c => Math.max(0, c - 1))
      fetch(`/api/notifications/${n.id}/read`, { method: 'POST' }).catch(() => {})
    }
    if (n.url) router.push(n.url)
  }

  function handleReadAll() {
    fetch('/api/notifications/read-all', { method: 'POST' }).catch(() => {})
    setItems(prev => prev.map(x => ({ ...x, read_at: x.read_at ?? new Date().toISOString() })))
    setUnreadCount(0)
  }

  function timeAgo(iso: string): string {
    const diffMin = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
    if (diffMin < 1) return 'Vừa xong'
    if (diffMin < 60) return `${diffMin} phút trước`
    const diffH = Math.floor(diffMin / 60)
    if (diffH < 24) return `${diffH} giờ trước`
    return `${Math.floor(diffH / 24)} ngày trước`
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Thông báo"
        aria-haspopup="true"
        aria-expanded={open}
        className="relative w-10 h-10 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-sm shadow-sm active:scale-95 transition-transform"
      >
        <span className="text-xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[9px] font-black flex items-center justify-center leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-50" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            role="dialog"
            aria-label="Thông báo"
            className="absolute bottom-0 inset-x-0 mx-auto w-full max-w-md bg-white rounded-t-[22px] max-h-[75vh] flex flex-col shadow-[0_-8px_30px_rgba(0,0,0,0.25)]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-center pt-2 pb-1 flex-shrink-0">
              <div className="w-9 h-1 rounded-full bg-gray-200" />
            </div>
            <div className="flex items-center justify-between px-4 py-2 flex-shrink-0">
              <span className="text-[11px] font-black tracking-widest uppercase text-gray-400">Thông báo</span>
              {unreadCount > 0 && (
                <button onClick={handleReadAll} className="text-xs font-bold text-purple-500">
                  Đánh dấu đã đọc
                </button>
              )}
            </div>
            <div className="overflow-y-auto flex-1" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
              {items.length === 0 && (
                <p className="text-center text-sm text-gray-400 py-10">Chưa có thông báo nào</p>
              )}
              {items.map(n => (
                <button
                  key={n.id}
                  onClick={() => handleTap(n)}
                  className={`w-full text-left px-4 py-3 border-b border-gray-50 flex gap-3 ${!n.read_at ? 'bg-purple-50/40' : ''}`}
                >
                  {!n.read_at
                    ? <span className="w-2 h-2 mt-1.5 rounded-full bg-pink-500 flex-shrink-0" />
                    : <span className="w-2 flex-shrink-0" />}
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm text-gray-800 leading-snug">{n.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-snug">{n.body}</p>
                    <p className="text-[10px] text-gray-300 mt-1 font-semibold">{timeAgo(n.created_at)}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
