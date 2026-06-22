'use client'

import { useState, useEffect } from 'react'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

// ── Trends Panel (charts) ────────────────────────────────────────────────────
type TrendPoint = { label: string; signups: number; mrr: number; pro_count: number; churn: number }

const CHART_TOOLTIP_STYLE = {
  contentStyle: { background: '#1f2937', border: '1px solid #374151', borderRadius: 8, fontSize: 12 },
  labelStyle: { color: '#e5e7eb' },
}

export function TrendsPanel({ mode = 'analytics' }: { mode?: 'analytics' | 'finance' }) {
  const [data, setData] = useState<TrendPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/superadmin/trends')
      .then(r => r.json())
      .then(d => { setData(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-center py-8 text-slate-500 text-sm">Đang tải biểu đồ...</div>
  if (data.length === 0) return null

  const mrrData = data.map(d => ({ ...d, mrrK: Math.round(d.mrr / 1000) }))
  const maxSignups = Math.max(...data.map(d => d.signups), 1)

  return (
    <div className="space-y-4">
      {/* MRR trend — both modes */}
      <div className="bg-white rounded-3xl border-2 border-gray-100 shadow-sm p-5">
        <h3 className="font-semibold text-indigo-600 mb-4">📈 MRR Trend — 6 tháng gần nhất</h3>
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={mrrData} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
            <defs>
              <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#4f46e5" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}k`} />
            <Tooltip {...CHART_TOOLTIP_STYLE} formatter={(v: unknown) => [`${Number(v)}k đ`, 'MRR']} />
            <Area type="monotone" dataKey="mrrK" stroke="#4f46e5" strokeWidth={2.5}
              fill="url(#mrrGrad)" dot={{ fill: '#0d9488', r: 3 }} activeDot={{ r: 5 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Churn — both modes */}
      <div className="bg-white rounded-3xl border-2 border-gray-100 shadow-sm p-5">
        <h3 className="font-semibold text-red-400 mb-4">📉 Churn — Pro hết hạn / tháng</h3>
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip {...CHART_TOOLTIP_STYLE} formatter={(v: unknown) => [Number(v), 'TK hết hạn']} />
            <Bar dataKey="churn" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Signups + Plan distribution — analytics mode only */}
      {mode === 'analytics' && (
        <>
          <div className="bg-white rounded-3xl border-2 border-gray-100 shadow-sm p-5">
            <h3 className="font-semibold text-blue-400 mb-4">👥 Signups mới — 6 tháng</h3>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip {...CHART_TOOLTIP_STYLE} formatter={(v: unknown) => [Number(v), 'Đăng ký mới']} />
                <Bar dataKey="signups" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-3xl border-2 border-gray-100 shadow-sm p-5">
            <h3 className="font-semibold text-slate-700 mb-4">🎯 Pro active — phân bổ theo tháng</h3>
            <div className="space-y-2">
              {data.map(d => (
                <div key={d.label} className="flex items-center gap-3 text-xs">
                  <span className="text-slate-500 w-12 flex-shrink-0">{d.label}</span>
                  <div className="flex-1 h-5 bg-slate-50 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 rounded-full transition-all"
                      style={{ width: d.pro_count > 0 ? `${Math.min(100, (d.pro_count / Math.max(...data.map(x => x.pro_count), 1)) * 100)}%` : '0%' }} />
                  </div>
                  <span className="text-indigo-500 font-bold w-8 text-right">{d.pro_count}</span>
                </div>
              ))}
            </div>
            <p className="text-slate-400 text-[10px] mt-3">* Số TK Pro có plan active trong tháng đó</p>
          </div>

          <div className="bg-white rounded-3xl border-2 border-gray-100 shadow-sm p-5">
            <h3 className="font-semibold text-slate-700 mb-4">📊 Signups vs Churn — net growth</h3>
            <div className="space-y-2">
              {data.map(d => {
                const net = d.signups - d.churn
                return (
                  <div key={d.label} className="flex items-center gap-3 text-xs">
                    <span className="text-slate-500 w-12 flex-shrink-0">{d.label}</span>
                    <div className="flex items-center gap-1.5 flex-1">
                      <div className="h-4 bg-blue-600 rounded" style={{ width: `${(d.signups / maxSignups) * 80}px` }} />
                      {d.churn > 0 && <div className="h-4 bg-red-600 rounded" style={{ width: `${(d.churn / maxSignups) * 80}px` }} />}
                    </div>
                    <span className={`font-bold w-8 text-right ${net >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {net >= 0 ? '+' : ''}{net}
                    </span>
                  </div>
                )
              })}
              <div className="flex gap-4 pt-1 text-[10px] text-slate-400">
                <span className="flex items-center gap-1"><span className="w-3 h-2 bg-blue-600 rounded inline-block" /> Signups</span>
                <span className="flex items-center gap-1"><span className="w-3 h-2 bg-red-600 rounded inline-block" /> Churn</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
