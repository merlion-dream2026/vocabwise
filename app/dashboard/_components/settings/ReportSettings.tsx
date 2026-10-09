'use client'

import { useState, useEffect } from 'react'
import type { ReportSettings } from '../../_types'
import { VN_DAYS } from '../../_utils'

const DEFAULT_REPORT: ReportSettings = { enabled: false, schedule: 'manual', day: 1, monthly_recap: false }

export function ReportSettingsContent({ plan }: { plan: string }) {
  const [settings, setSettings] = useState<ReportSettings>(DEFAULT_REPORT)
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    fetch('/api/report/settings').then(r => r.json()).then(d => {
      setSettings({ ...DEFAULT_REPORT, ...d })
      setLoaded(true)
    }).catch(() => setLoaded(true))
  }, [])

  async function save() {
    setSaving(true); setMsg('')
    const res = await fetch('/api/report/settings', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    })
    setSaving(false)
    setMsg(res.ok ? '✅ Đã lưu' : '❌ Lỗi lưu cài đặt')
    setTimeout(() => setMsg(''), 2500)
  }

  async function sendNow() {
    setSending(true); setMsg('')
    const res = await fetch('/api/report/send', { method: 'POST' })
    setSending(false)
    const d = await res.json().catch(() => ({}))
    setMsg(res.ok ? '✅ Đã gửi email!' : `❌ ${d.error ?? 'Lỗi gửi email'}`)
    setTimeout(() => setMsg(''), 4000)
  }

  if (!loaded) return null

  return (
    <>
      {/* Toggle */}
      <div className="flex items-center justify-between mb-4 pr-1">
        <span className="text-sm font-bold text-gray-700">Tự động gửi hàng tuần</span>
        <button
          onClick={() => setSettings(s => ({ ...s, enabled: !s.enabled, schedule: !s.enabled ? 'weekly' : 'manual' }))}
          className={`relative flex-shrink-0 w-14 h-7 rounded-full transition-colors mr-1 ${settings.enabled ? 'bg-purple-500' : 'bg-gray-300'}`}>
          <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ${settings.enabled ? 'translate-x-8' : 'translate-x-1'}`} />
        </button>
      </div>

      {settings.enabled && (
        <div className="mb-4">
          <p className="text-xs text-gray-500 font-bold mb-2">Gửi vào ngày (lúc 8:00 sáng giờ VN)</p>
          <div className="flex gap-1.5 flex-wrap">
            {VN_DAYS.map((d, i) => (
              <button key={i} onClick={() => setSettings(s => ({ ...s, day: i }))}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${settings.day === i ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                {d}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Monthly recap — Pro 6m exclusive */}
      {plan === '6months' && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
          <div>
            <span className="text-sm font-bold text-gray-700">Tổng kết hàng tháng</span>
            <p className="text-xs text-gray-400 mt-0.5">Gửi ngày 1 mỗi tháng · độc quyền Pro 6 tháng</p>
          </div>
          <button
            onClick={() => setSettings(s => ({ ...s, monthly_recap: !s.monthly_recap }))}
            className={`relative flex-shrink-0 w-14 h-7 rounded-full transition-colors mr-1 ${settings.monthly_recap ? 'bg-indigo-500' : 'bg-gray-300'}`}>
            <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ${settings.monthly_recap ? 'translate-x-8' : 'translate-x-1'}`} />
          </button>
        </div>
      )}

      {msg && (
        <p className={`text-sm font-bold mb-3 ${msg.startsWith('✅') ? 'text-green-600' : 'text-red-500'}`}>{msg}</p>
      )}

      <div className="flex gap-2">
        <button onClick={save} disabled={saving}
          className="flex-1 bg-purple-500 text-white font-bold py-2.5 rounded-2xl text-sm disabled:opacity-50 active:scale-95 transition-transform">
          {saving ? 'Đang lưu...' : 'Lưu cài đặt'}
        </button>
        <button onClick={sendNow} disabled={sending}
          className="bg-white border-2 border-purple-200 text-purple-500 font-bold py-2.5 px-4 rounded-2xl text-sm disabled:opacity-50 active:scale-95 transition-transform">
          {sending ? '...' : 'Gửi ngay'}
        </button>
      </div>
    </>
  )
}
