'use client'

import { useState, useEffect } from 'react'
import { WEEK_DAYS, TIME_OPTIONS, type PushSchedule } from '@/lib/pushSchedule'

/** Pick reminder days + a time per day (15-min grid). Shown once push is enabled. */
export function PushScheduleEditor() {
  const [schedule, setSchedule] = useState<PushSchedule | null>(null)
  // Remembers each day's time while it's switched off, so toggling back on restores it
  const [times, setTimes] = useState<Record<string, string>>({})
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    fetch('/api/push/schedule', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => {
        setSchedule(d.schedule)
        setTimes(Object.fromEntries(WEEK_DAYS.map(({ key }) => [key, d.schedule[key] ?? '08:00'])))
      })
      .catch(() => setMsg('❌ Không tải được lịch nhắc'))
  }, [])

  if (!schedule) return msg ? <p className="text-xs font-bold text-red-500">{msg}</p> : null

  function update(next: PushSchedule) { setSchedule(next); setDirty(true); setMsg('') }

  function toggleDay(key: keyof PushSchedule) {
    const next = { ...schedule }
    if (next[key]) delete next[key]
    else next[key] = times[key]
    update(next)
  }

  function setTime(key: keyof PushSchedule, time: string) {
    setTimes(t => ({ ...t, [key]: time }))
    if (schedule?.[key]) update({ ...schedule, [key]: time })
  }

  /** Copy the first enabled day's time to every enabled day. */
  function applyToAll() {
    const first = WEEK_DAYS.find(({ key }) => schedule?.[key])
    if (!first || !schedule) return
    const time = schedule[first.key]!
    setTimes(Object.fromEntries(WEEK_DAYS.map(({ key }) => [key, time])))
    update(Object.fromEntries(Object.keys(schedule).map(k => [k, time])) as PushSchedule)
  }

  async function save() {
    setSaving(true); setMsg('')
    const res = await fetch('/api/push/schedule', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ schedule }),
    })
    setSaving(false)
    if (res.ok) { setDirty(false); setMsg('✅ Đã lưu lịch nhắc') }
    else { const d = await res.json().catch(() => ({})); setMsg(`❌ ${d.error ?? 'Lỗi lưu lịch'}`) }
  }

  const enabledCount = Object.keys(schedule).length

  return (
    <div className="bg-gray-50 rounded-2xl p-3.5 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-gray-600">🗓️ Lịch nhắc</p>
        {enabledCount > 1 && (
          <button onClick={applyToAll} className="text-[11px] font-bold text-purple-600">Cùng giờ cho mọi ngày</button>
        )}
      </div>
      {WEEK_DAYS.map(({ key, label }) => {
        const on = !!schedule[key]
        return (
          <div key={key} className="flex items-center gap-3">
            <button onClick={() => toggleDay(key)} role="switch" aria-checked={on} aria-label={label}
              className={`relative w-10 h-6 rounded-full flex-shrink-0 transition-colors ${on ? 'bg-purple-500' : 'bg-gray-300'}`}>
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${on ? 'translate-x-4' : ''}`} />
            </button>
            <span className={`flex-1 text-sm font-bold ${on ? 'text-gray-700' : 'text-gray-400'}`}>{label}</span>
            <select value={times[key]} onChange={e => setTime(key, e.target.value)} disabled={!on}
              className="text-sm font-bold text-gray-700 bg-white border border-gray-200 rounded-xl px-2 py-1.5 disabled:opacity-40">
              {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        )
      })}
      {enabledCount === 0 && <p className="text-xs text-amber-600 font-bold">Chưa chọn ngày nào — sẽ không có thông báo nhắc.</p>}
      <p className="text-[11px] text-gray-400">Chỉ nhắc nếu hôm đó bé chưa học.</p>
      {(dirty || saving) && (
        <button onClick={save} disabled={saving}
          className="w-full bg-purple-500 text-white font-bold text-sm py-2.5 rounded-2xl disabled:opacity-50 active:scale-95 transition-transform">
          {saving ? 'Đang lưu…' : 'Lưu lịch nhắc'}
        </button>
      )}
      {msg && <p className={`text-xs font-bold ${msg.startsWith('✅') ? 'text-green-600' : 'text-red-500'}`}>{msg}</p>}
    </div>
  )
}
