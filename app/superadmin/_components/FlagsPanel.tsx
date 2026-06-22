'use client'

import { useState, useEffect } from 'react'

// ── Flags Panel ──────────────────────────────────────────────────────────────
type IpFlag = { id: string; ip: string; count: number; flagged_at: string; reviewed: boolean }

export function FlagsPanel({ onReviewed }: { onReviewed: () => void }) {
  const [flags, setFlags] = useState<IpFlag[]>([])
  const [loading, setLoading] = useState(true)
  const [reviewing, setReviewing] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/superadmin/flags')
      .then(r => r.json())
      .then(d => { setFlags(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function markReviewed(id: string) {
    setReviewing(id)
    const res = await fetch(`/api/superadmin/flags/${id}`, { method: 'PATCH' })
    if (res.ok) {
      setFlags(prev => prev.map(f => f.id === id ? { ...f, reviewed: true } : f))
      onReviewed()
    }
    setReviewing(null)
  }

  function fmtTime(iso: string) {
    const d = new Date(iso)
    const diff = Math.floor((Date.now() - d.getTime()) / 60000)
    if (diff < 60) return `${diff} phút trước`
    if (diff < 1440) return `${Math.floor(diff / 60)}h trước`
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
  }

  if (loading) return <div className="text-slate-500 text-sm py-8 text-center">Đang tải...</div>

  const unreviewed = flags.filter(f => !f.reviewed)
  const reviewed = flags.filter(f => f.reviewed)

  return (
    <div className="space-y-4">
      {/* Unreviewed */}
      <div className="bg-white rounded-3xl border-2 border-gray-100 shadow-sm p-5">
        <h2 className="font-semibold text-lg mb-4">
          ⚠️ Chưa xem xét
          {unreviewed.length > 0 && (
            <span className="ml-2 bg-red-500 text-white text-xs font-black px-2 py-0.5 rounded-full">
              {unreviewed.length}
            </span>
          )}
        </h2>

        {unreviewed.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-4">✅ Không có cảnh báo nào</p>
        ) : (
          <div className="space-y-2">
            {unreviewed.map(f => (
              <div key={f.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-slate-900 font-mono text-sm">{f.ip}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    <span className="text-red-400 font-bold">{f.count} accounts</span> trong 24h · {fmtTime(f.flagged_at)}
                  </p>
                </div>
                <button
                  onClick={() => markReviewed(f.id)}
                  disabled={reviewing === f.id}
                  className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-xs font-black px-3 py-2 rounded-lg flex-shrink-0 transition-colors">
                  {reviewing === f.id ? '...' : '✓ Đã xem'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reviewed history */}
      {reviewed.length > 0 && (
        <div className="bg-white rounded-3xl border-2 border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-base text-slate-500 mb-3">Lịch sử đã xem xét</h2>
          <div className="space-y-2">
            {reviewed.map(f => (
              <div key={f.id} className="bg-slate-100 rounded-2xl px-4 py-3 flex items-center justify-between">
                <p className="font-mono text-sm text-slate-500">{f.ip}</p>
                <p className="text-xs text-slate-400">{f.count} acc · {fmtTime(f.flagged_at)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="bg-white rounded-3xl border-2 border-gray-100 shadow-sm p-4">
        <p className="text-xs text-slate-400 font-semibold mb-1">ℹ️ Ngưỡng cảnh báo</p>
        <p className="text-xs text-slate-500">Flag xuất hiện khi cùng 1 IP đăng ký &gt;5 tài khoản trong vòng 24 giờ. IP bị flag không bị chặn — chỉ để admin xem xét.</p>
      </div>
    </div>
  )
}
