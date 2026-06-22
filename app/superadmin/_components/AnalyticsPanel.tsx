'use client'

import { useState, useEffect } from 'react'

type AnalyticsData = {
  total: number; total_active: number; active_free: number; active_pro: number
  expired: number; new_this_month: number; conversion_rate_pct: number
  activation_rate_pct: number; active_this_week: number
  by_plan: Record<string, number>
}

export function AnalyticsPanel({ refreshKey }: { refreshKey: number }) {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch('/api/superadmin/analytics')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [refreshKey])

  if (loading) return <div className="text-center py-12 text-slate-500">Đang tải...</div>
  if (!data) return <div className="text-center py-12 text-red-400">Lỗi tải analytics</div>

  const statCards = [
    { label: 'Tổng tài khoản', value: data.total, color: 'text-indigo-700' },
    { label: 'Đang hoạt động', value: data.total_active, color: 'text-green-400' },
    { label: 'Free (trial)', value: data.active_free, color: 'text-blue-400' },
    { label: 'Pro đang dùng', value: data.active_pro, color: 'text-indigo-600' },
    { label: 'Hết hạn', value: data.expired, color: 'text-red-400' },
    { label: 'Mới tháng này', value: data.new_this_month, color: 'text-yellow-400' },
  ]

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3">
        {statCards.map(s => (
          <div key={s.label} className="bg-white rounded-3xl border-2 border-gray-100 shadow-sm p-4 text-center">
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-1 font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Funnel KPIs */}
      <div className="bg-white rounded-3xl border-2 border-gray-100 shadow-sm p-5 space-y-4">
        <h3 className="font-bold text-slate-700">📊 Funnel KPIs</h3>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-slate-500">Activation rate (có ít nhất 1 bé)</span>
            <span className="font-bold text-green-400">{data.activation_rate_pct}%</span>
          </div>
          <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full" style={{ width: `${data.activation_rate_pct}%` }} />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-slate-500">Conversion rate (trial → Pro)</span>
            <span className="font-bold text-indigo-600">{data.conversion_rate_pct}%</span>
          </div>
          <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
            <div className="h-full bg-teal-500 rounded-full" style={{ width: `${data.conversion_rate_pct}%` }} />
          </div>
        </div>

        <div className="flex justify-between text-sm border-t border-slate-200 pt-3">
          <span className="text-slate-500">Active học tuần này (sessions)</span>
          <span className="font-bold text-yellow-400">{data.active_this_week}</span>
        </div>
      </div>

      {/* By plan — visual bars */}
      <div className="bg-white rounded-3xl border-2 border-gray-100 shadow-sm p-5">
        <h3 className="font-bold text-slate-700 mb-3">📋 Phân bổ theo gói</h3>
        {(() => {
          const entries = Object.entries(data.by_plan).sort((a, b) => b[1] - a[1])
          const total = entries.reduce((s, [, v]) => s + v, 0)
          const PLAN_COLORS: Record<string, string> = {
            free: 'bg-blue-600', '1month': 'bg-teal-500', '3months': 'bg-violet-500', '6months': 'bg-amber-500',
          }
          return (
            <div className="space-y-2.5">
              {entries.map(([plan, count]) => (
                <div key={plan} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 font-mono">{plan}</span>
                    <span className="font-bold text-slate-900">{count} <span className="text-slate-400 font-normal">({total > 0 ? Math.round(count / total * 100) : 0}%)</span></span>
                  </div>
                  <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${PLAN_COLORS[plan] ?? 'bg-gray-500'}`}
                      style={{ width: total > 0 ? `${(count / total) * 100}%` : '0%' }} />
                  </div>
                </div>
              ))}
            </div>
          )
        })()}
      </div>
    </div>
  )
}
