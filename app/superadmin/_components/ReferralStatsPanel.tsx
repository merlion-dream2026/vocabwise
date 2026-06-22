'use client'

import { useState, useEffect } from 'react'

// ── Referral Stats Panel ─────────────────────────────────────────────────────
type ReferralStats = {
  total: number
  by_status: Record<string, number>
  total_bonus_days_given: number
  top_referrers: { username: string; count: number }[]
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Chưa học',
  signup_triggered: 'Đang xử lý',
  signup_rewarded: 'Đã nhận thưởng ĐK',
  paid_rewarded: 'Đã nhận thưởng Pro',
}

export function ReferralStatsPanel({ refreshKey }: { refreshKey: number }) {
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch('/api/superadmin/referrals')
      .then(r => r.json())
      .then(d => { setStats(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [refreshKey])

  if (loading) return <div className="text-slate-500 text-center py-10">Đang tải...</div>
  if (!stats) return <div className="text-red-400 text-center py-10">Lỗi tải dữ liệu</div>

  const conversion = stats.total > 0
    ? Math.round(((stats.by_status.signup_rewarded ?? 0) + (stats.by_status.paid_rewarded ?? 0)) / stats.total * 100)
    : 0

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Tổng referrals', value: stats.total, color: 'text-blue-300' },
          { label: 'Conversion rate', value: `${conversion}%`, color: 'text-green-300' },
          { label: 'Ngày Pro đã tặng', value: `+${stats.total_bonus_days_given}d`, color: 'text-indigo-500' },
          { label: 'Đã mua Pro', value: stats.by_status.paid_rewarded ?? 0, color: 'text-yellow-300' },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-3xl border-2 border-gray-100 shadow-sm p-4 text-center">
            <div className={`text-2xl font-black ${c.color}`}>{c.value}</div>
            <div className="text-xs text-slate-500 font-semibold mt-1">{c.label}</div>
          </div>
        ))}
      </div>

      {/* By status breakdown */}
      <div className="bg-white rounded-3xl border-2 border-gray-100 shadow-sm p-4">
        <h3 className="font-bold text-sm text-slate-600 mb-3">Trạng thái referrals</h3>
        <div className="space-y-2">
          {Object.entries(STATUS_LABELS).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between text-sm">
              <span className="text-slate-500">{label}</span>
              <span className="font-bold text-slate-900">{stats.by_status[key] ?? 0}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top referrers */}
      {stats.top_referrers.length > 0 && (
        <div className="bg-white rounded-3xl border-2 border-gray-100 shadow-sm p-4">
          <h3 className="font-bold text-sm text-slate-600 mb-3">🏆 Top referrers</h3>
          <div className="space-y-2">
            {stats.top_referrers.map((r, i) => (
              <div key={r.username} className="flex items-center justify-between text-sm">
                <span className="text-slate-600">
                  <span className="text-slate-400 mr-2">#{i + 1}</span>
                  {r.username}
                </span>
                <span className="font-bold text-indigo-500">{r.count} người</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
