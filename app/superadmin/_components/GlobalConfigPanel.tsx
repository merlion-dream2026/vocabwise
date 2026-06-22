'use client'

import { useState, useEffect } from 'react'

export function GlobalConfigPanel() {
  const [config, setConfig] = useState({ free_max_kids: 1, pro_max_kids: 3 })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    fetch('/api/superadmin/config').then(r => r.json()).then(d => {
      if (d && typeof d.free_max_kids === 'number') setConfig(d)
    })
  }, [])

  async function save() {
    setSaving(true)
    const res = await fetch('/api/superadmin/config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ free_max_kids: config.free_max_kids, pro_max_kids: config.pro_max_kids }),
    })
    setSaving(false)
    setMsg(res.ok ? '✅ Đã lưu!' : '❌ Lỗi')
    setTimeout(() => setMsg(''), 2000)
  }

  return (
    <div className="bg-white rounded-3xl border-2 border-gray-100 shadow-sm p-5 mb-6">
      <h2 className="font-semibold text-indigo-600 mb-3">⚙️ Giới hạn hồ sơ bé (mặc định toàn hệ thống)</h2>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-slate-500 mb-1 block">Gói Free — tối đa bé</label>
          <input type="number" min={1} max={10} value={config.free_max_kids}
            onChange={e => setConfig(c => ({ ...c, free_max_kids: parseInt(e.target.value) || 1 }))}
            className="w-full bg-white border-2 border-slate-200 rounded-2xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="text-xs text-slate-500 mb-1 block">Gói Pro — tối đa bé</label>
          <input type="number" min={1} max={20} value={config.pro_max_kids}
            onChange={e => setConfig(c => ({ ...c, pro_max_kids: parseInt(e.target.value) || 3 }))}
            className="w-full bg-white border-2 border-slate-200 rounded-2xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
      </div>
      <div className="flex items-center gap-3 mt-3">
        <button onClick={save} disabled={saving}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2 rounded-xl">
          {saving ? 'Đang lưu...' : 'Lưu cấu hình'}
        </button>
        {msg && <span className="text-sm">{msg}</span>}
      </div>
    </div>
  )
}
