'use client'

import { useState, useEffect } from 'react'

// ── Finance Panel (server-side) ──────────────────────────────────────────────
type FinanceData = {
  total: number; pro_active: number; free_trial: number; expired: number
  mrr: number; conversion_rate: number; total_revenue: number
  mrr_breakdown: { plan: string; count: number; revenue: number }[]
  total_revenue_breakdown: { plan: string; count: number; revenue: number }[]
}

const PLAN_LABELS_FIN: Record<string, string> = {
  '1month': '1 tháng (×59k)',
  '3months': '3 tháng (×53k/tháng)',
  '6months': '6 tháng (×49.8k/tháng)',
}

export function FinancePanel({ refreshKey, onCardClick }: {
  refreshKey: number
  onCardClick?: (plan: string, status: string) => void
}) {
  const [data, setData] = useState<FinanceData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch('/api/superadmin/finance')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [refreshKey])

  function fmtVnd(n: number) {
    if (n >= 1000000) return `${(n / 1000000).toFixed(2)}tr đ`
    return `${n.toLocaleString('vi-VN')}đ`
  }

  if (loading) return <div className="text-center py-12 text-slate-500">Đang tải...</div>
  if (!data) return <div className="text-center py-12 text-red-400">Lỗi tải Finance</div>

  const cards = [
    { label: 'Tổng tài khoản',     value: data.total,      color: 'text-indigo-700', bg: 'bg-indigo-50',     plan: 'all',  status: 'all' },
    { label: 'Pro đang hoạt động', value: data.pro_active, color: 'text-green-700',  bg: 'bg-green-50 border-2 border-green-200', plan: 'pro',  status: 'active' },
    { label: 'Free / Trial',       value: data.free_trial, color: 'text-blue-700',   bg: 'bg-blue-50 border-2 border-blue-200',  plan: 'free', status: 'all' },
    { label: 'Pro hết hạn',        value: data.expired,    color: 'text-red-600',    bg: 'bg-red-50 border-2 border-red-200',   plan: 'pro',  status: 'expired' },
  ]

  return (
    <div className="space-y-4 mb-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3">
        {cards.map(c => (
          <button key={c.label} onClick={() => onCardClick?.(c.plan, c.status)}
            className={`${c.bg} rounded-2xl p-4 text-left w-full ${onCardClick ? 'hover:opacity-80 active:scale-95 transition-all cursor-pointer' : 'cursor-default'}`}>
            <p className="text-slate-500 text-xs font-semibold mb-1">{c.label}</p>
            <p className={`text-3xl font-black ${c.color}`}>{c.value}</p>
            {onCardClick && <p className="text-slate-400 text-[10px] mt-1">Xem danh sách →</p>}
          </button>
        ))}
      </div>

      {/* MRR */}
      <div className="bg-white rounded-3xl border-2 border-gray-100 shadow-sm p-5">
        <h3 className="font-semibold text-indigo-600 mb-3">💰 Doanh thu ước tính (MRR)</h3>
        <div className="space-y-2 mb-4">
          {data.mrr_breakdown.map(row => (
            <div key={row.plan} className="flex items-center justify-between text-sm">
              <span className="text-slate-500">{PLAN_LABELS_FIN[row.plan] ?? row.plan} — <span className="text-slate-900 font-bold">{row.count}</span> TK</span>
              <span className="text-indigo-500 font-bold">{fmtVnd(row.revenue)}</span>
            </div>
          ))}
          <div className="border-t border-slate-300 pt-2 flex items-center justify-between">
            <span className="text-slate-900 font-black">Tổng MRR</span>
            <span className="text-green-400 font-black text-lg">{fmtVnd(data.mrr)}</span>
          </div>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex items-center justify-between">
          <span className="text-sm text-slate-600">Tỉ lệ chuyển đổi (Pro / verified)</span>
          <span className="text-yellow-300 font-black text-lg">{data.conversion_rate}%</span>
        </div>
      </div>

      {/* Cumulative revenue */}
      <div className="bg-white rounded-3xl border-2 border-gray-100 shadow-sm p-5">
        <h3 className="font-semibold text-amber-400 mb-3">🏦 Doanh thu tích lũy (all-time)</h3>
        <div className="space-y-2 mb-3">
          {data.total_revenue_breakdown.map(row => (
            <div key={row.plan} className="flex items-center justify-between text-sm">
              <span className="text-slate-500">{PLAN_LABELS_FIN[row.plan] ?? row.plan} — <span className="text-slate-900 font-bold">{row.count}</span> TK</span>
              <span className="text-amber-300 font-bold">{fmtVnd(row.revenue)}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-slate-300 pt-3 flex items-center justify-between">
          <span className="text-slate-900 font-black">Tổng cộng</span>
          <span className="text-amber-400 font-black text-xl">{fmtVnd(data.total_revenue)}</span>
        </div>
        <p className="text-slate-400 text-[10px] mt-2">* Ước tính — dựa trên gói hiện tại của mỗi TK (kể cả đã hết hạn)</p>
      </div>
    </div>
  )
}
