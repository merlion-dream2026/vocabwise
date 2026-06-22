'use client'

import { useState } from 'react'
import type { Family } from '../_types'
import { addDays, today, daysUntil } from '../_lib/helpers'

export function ExpiryReport({ families, onRefresh }: { families: Family[], onRefresh: () => void }) {
  const [windowDays, setWindowDays] = useState(7)
  const [copying, setCopying] = useState(false)
  const [extending, setExtending] = useState<string | null>(null)

  const expiring = families.filter(f => {
    const d = f.plan !== 'free' ? daysUntil(f.plan_end_date) : daysUntil(f.free_trial_expires_at)
    return d !== null && d >= 0 && d <= windowDays
  }).sort((a, b) => {
    const da = a.plan !== 'free' ? daysUntil(a.plan_end_date) ?? 99 : daysUntil(a.free_trial_expires_at) ?? 99
    const db = b.plan !== 'free' ? daysUntil(b.plan_end_date) ?? 99 : daysUntil(b.free_trial_expires_at) ?? 99
    return da - db
  })

  async function extend(f: Family, days: number) {
    setExtending(f.id)
    const base = (f.plan !== 'free' ? f.plan_end_date : f.free_trial_expires_at) ?? today()
    const newDate = addDays(base, days)
    const body = f.plan !== 'free' ? { plan_end_date: newDate } : { free_trial_expires_at: newDate }
    const res = await fetch(`/api/superadmin/families/${f.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    })
    setExtending(null)
    if (res.ok) onRefresh()
  }

  async function copyReport() {
    const lines = [`📅 TÀI KHOẢN SẮP HẾT HẠN (${windowDays} NGÀY TỚI)`, '']
    for (const f of expiring) {
      const d = f.plan !== 'free' ? daysUntil(f.plan_end_date) : daysUntil(f.free_trial_expires_at)
      lines.push(`• ${f.username} (${f.plan}) — còn ${d} ngày`)
      if (f.phone) lines.push(`  📞 ${f.phone}`)
      if (f.email) lines.push(`  📧 ${f.email}`)
    }
    if (expiring.length === 0) lines.push('Không có tài khoản nào sắp hết hạn.')
    await navigator.clipboard.writeText(lines.join('\n'))
    setCopying(true)
    setTimeout(() => setCopying(false), 2000)
  }

  return (
    <div className="bg-white rounded-3xl border-2 border-gray-100 shadow-sm p-5 mb-6">
      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <h2 className="font-semibold text-amber-400">
          ⚠️ Sắp hết hạn — {expiring.length} tài khoản
        </h2>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {[7, 14, 30].map(w => (
              <button key={w} onClick={() => setWindowDays(w)}
                className={`text-xs px-2 py-1 rounded-lg font-semibold transition-colors ${windowDays === w ? 'bg-amber-600 text-white' : 'bg-slate-50 text-slate-500 hover:bg-indigo-50'}`}>
                {w}d
              </button>
            ))}
          </div>
          <button onClick={copyReport}
            className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors ${copying ? 'bg-green-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-indigo-50'}`}>
            {copying ? '✅ Copied' : '📋 Copy'}
          </button>
        </div>
      </div>
      {expiring.length === 0 ? (
        <p className="text-slate-400 text-sm">Không có tài khoản nào sắp hết hạn trong {windowDays} ngày tới.</p>
      ) : (
        <div className="space-y-2">
          {expiring.map(f => {
            const d = f.plan !== 'free' ? daysUntil(f.plan_end_date) : daysUntil(f.free_trial_expires_at)
            const isExtending = extending === f.id
            return (
              <div key={f.id} className="bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="font-semibold text-sm">{f.username}</span>
                    {f.name && <span className="text-slate-500 text-xs ml-2">({f.name})</span>}
                    <div className="text-slate-500 text-xs mt-0.5">
                      {f.phone && <span className="mr-3">📞 {f.phone}</span>}
                      {f.email && <span>📧 {f.email}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {isExtending ? (
                      <span className="text-xs text-slate-500 px-2">...</span>
                    ) : (
                      <>
                        {[30, 90, 180].map(d2 => (
                          <button key={d2} onClick={() => extend(f, d2)}
                            className="text-[10px] px-1.5 py-0.5 bg-indigo-800 hover:bg-indigo-700 text-indigo-400 rounded font-bold transition-colors">
                            +{d2}d
                          </button>
                        ))}
                      </>
                    )}
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ml-1 ${d === 0 ? 'bg-red-700 text-red-200' : 'bg-yellow-700 text-yellow-200'}`}>
                      còn {d}d
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
