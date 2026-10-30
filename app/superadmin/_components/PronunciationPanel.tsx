'use client'

import { useState, useEffect } from 'react'
import type { Bars, BarGroup } from '@/lib/pronunciationScore'

// Azure pronunciation bars (docs/pronunciation-thresholds-plan.md). Saved bars apply within ~1 min,
// no deploy. Rates come from pronunciation_log (Azure attempts only; Whisper fallbacks aren't logged).
type Stat = { grp: BarGroup; total: number; ok: number; disputed: number }
type Dispute = { id: number; source: string; level: string | null; target: string; pron_score: number; completeness: number; detail: { w: string; a: number }[] | null; disputed_at: string }
type Data = { bars: Bars; defaults: Bars; days: number; stats: Stat[]; disputes: Dispute[] }

const GROUPS: { key: BarGroup; label: string }[] = [
  { key: 'young', label: 'Seeker · Starter · Ranger · Phonics' },
  { key: 'mid', label: 'Explorer (+ ghi âm nhanh)' },
  { key: 'ielts', label: 'Scholar · Master' },
]
const FIELDS: { key: 'pron' | 'word' | 'completeness'; label: string }[] = [
  { key: 'pron', label: 'Điểm tổng' },
  { key: 'word', label: 'Từ khoá / âm' },
  { key: 'completeness', label: 'Đầy đủ' },
]
const pct = (n: number, d: number) => (d ? `${Math.round((n / d) * 100)}%` : '–')

export function PronunciationPanel() {
  const [data, setData] = useState<Data | null>(null)
  const [bars, setBars] = useState<Bars | null>(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    fetch('/api/superadmin/pronunciation').then(r => r.json())
      .then((d: Data) => { setData(d); setBars(d.bars) })
      .catch(() => setMsg('Không tải được ngưỡng phát âm'))
  }, [])

  if (!data || !bars) return <div className="bg-white rounded-3xl border-2 border-gray-100 p-5 mb-6 text-sm text-slate-500">{msg || 'Đang tải ngưỡng phát âm...'}</div>

  const set = (g: BarGroup, f: 'pron' | 'word' | 'completeness', v: number) => setBars({ ...bars, [g]: { ...bars[g], [f]: v } })
  const setHard = (g: BarGroup, v: number) => setBars({ ...bars, hard: { ...bars.hard, [g]: v } })
  const dirty = JSON.stringify(bars) !== JSON.stringify(data.bars)

  async function save(next: Bars) {
    setSaving(true); setMsg('')
    const res = await fetch('/api/superadmin/pronunciation', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bars: next }) })
    const d = await res.json().catch(() => ({}))
    setSaving(false)
    if (!res.ok || !d.bars) { setMsg('Lưu thất bại'); return }
    setData({ ...data!, bars: d.bars }); setBars(d.bars)
    setMsg('Đã lưu — áp dụng trong ~1 phút')
  }

  const num = (v: number, onChange: (n: number) => void, max = 100) => (
    <input type="number" min={0} max={max} value={v} onChange={e => onChange(Number(e.target.value))}
      className="w-16 border-2 border-slate-100 rounded-lg px-2 py-1 text-sm text-center font-bold text-slate-700" />
  )

  return (
    <div className="bg-white rounded-3xl border-2 border-gray-100 shadow-sm p-5 mb-6">
      <h2 className="font-semibold text-indigo-600 mb-1">🎤 Ngưỡng chấm phát âm (Azure)</h2>
      <p className="text-xs text-slate-500 mb-3">
        Đạt khi: điểm tổng ≥ ngưỡng, đọc đủ ≥ ngưỡng, và từ khoá (Phonics: âm của bài) ≥ ngưỡng.
        &ldquo;Nới âm khó&rdquo; = số điểm hạ ngưỡng từ/âm khi chỉ sai ở âm khó với người Việt
        (θ ð ʒ, l/n, iː/ɪ, æ/e, ʃ/s, v/w, phụ âm cuối p t k b d g s z). Phonics không nới khi AI nghe thành âm còn lại của cặp.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-slate-500 text-left">
              <th className="py-1 pr-2">Nhóm</th>
              {FIELDS.map(f => <th key={f.key} className="py-1 px-1 text-center">{f.label}</th>)}
              <th className="py-1 px-1 text-center">Nới âm khó</th>
              <th className="py-1 px-1 text-center">Đạt / Khiếu nại ({data.days} ngày)</th>
            </tr>
          </thead>
          <tbody>
            {GROUPS.map(g => {
              const s = data.stats.find(x => x.grp === g.key)
              return (
                <tr key={g.key} className="border-t border-slate-100">
                  <td className="py-2 pr-2 text-xs font-semibold text-slate-600">{g.label}</td>
                  {FIELDS.map(f => (
                    <td key={f.key} className="py-2 px-1 text-center">
                      {num(bars[g.key][f.key], v => set(g.key, f.key, v))}
                      {bars[g.key][f.key] !== data.defaults[g.key][f.key] && <span className="block text-[11px] text-slate-400">gốc {data.defaults[g.key][f.key]}</span>}
                    </td>
                  ))}
                  <td className="py-2 px-1 text-center">{num(bars.hard[g.key], v => setHard(g.key, v), 30)}</td>
                  <td className="py-2 px-1 text-center text-xs text-slate-600">
                    {s?.total ? <><b>{pct(s.ok, s.total)}</b> đạt · {pct(s.disputed, s.total - s.ok)} khiếu nại<span className="block text-[11px] text-slate-400">{s.total} lượt</span></> : 'chưa có dữ liệu'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-slate-400 mt-1">Mục tiêu: đạt lần đầu 60–80% · khiếu nại (trên số lượt trượt) thấp — cao = ngưỡng đang quá gắt.</p>

      <div className="flex flex-wrap items-center gap-2 mt-3">
        <button disabled={!dirty || saving} onClick={() => save(bars)}
          className="bg-indigo-600 disabled:bg-slate-200 disabled:text-slate-500 text-white text-sm font-bold px-4 py-2 rounded-xl">
          {saving ? 'Đang lưu...' : 'Lưu ngưỡng'}
        </button>
        <button disabled={saving} onClick={() => save(data.defaults)}
          className="bg-slate-50 hover:bg-slate-100 text-slate-600 text-sm font-bold px-4 py-2 rounded-xl">
          Về mặc định
        </button>
        {msg && <span className="text-xs text-slate-500 font-semibold">{msg}</span>}
      </div>

      {data.disputes.length > 0 && (
        <details className="mt-4">
          <summary className="text-sm font-semibold text-slate-600 cursor-pointer">Khiếu nại &ldquo;Tôi đọc đúng mà&rdquo; gần đây ({data.disputes.length})</summary>
          <ul className="mt-2 space-y-1.5">
            {data.disputes.map(d => (
              <li key={d.id} className="text-xs text-slate-600 border-t border-slate-100 pt-1.5">
                <b>{d.target}</b> · {d.level ?? d.source} · tổng {d.pron_score} · đủ {d.completeness}
                {d.detail?.length ? <span className="text-slate-400"> · {d.detail.map(w => `${w.w} ${w.a}`).join(', ')}</span> : null}
                <span className="text-slate-400"> · {new Date(d.disputed_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}
