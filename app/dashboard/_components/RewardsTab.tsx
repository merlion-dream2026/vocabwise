'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { cachedFetch } from '@/lib/cachedFetch'
import Sticker from '@/components/Sticker'
import { cta } from '@/components/ChunkyUI'
import type { Child } from '../_types'

type StickerRow = { id: number; collection: string; level: string; topic_id: string; earned_at: string; legacy: boolean; redemption_id: number | null }
type Redemption = { id: number; sticker_count: number; note: string | null; created_at: string }
type TopicInfo = { id: string; name: string; emoji: string }
type View = 'loading' | 'setup' | 'locked' | 'reset' | 'ready'

const COLLECTION_LABEL: Record<string, string> = { daily: 'Daily', academic: 'Academic', phonics: 'Phonics' }
const LEVEL_LABEL: Record<string, string> = {
  seeker: 'Seeker', starter: 'Starter', ranger: 'Ranger', explorer: 'Explorer', scholar: 'Scholar', master: 'Master',
  book1: 'Foundation', book2: 'Progress', book3: 'Mastery',
}
const card = 'rounded-3xl border-2 border-b-[4px] border-slate-200 border-b-slate-300 bg-white p-4'
const input = 'w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-center text-lg font-bold tracking-widest text-slate-800 outline-none focus:border-purple-400'

// Parent area: PIN (set / enter / reset with the account password), then per-child sticker counts,
// choose stickers → "đã đổi quà" (optional note), and the redemption history. No money value is stored —
// what a sticker is worth is agreed between parent and child.
export function RewardsTab({ kids }: { kids: Child[] }) {
  const [view, setView] = useState<View>('loading')
  const [pin, setPin] = useState('')
  const [pin2, setPin2] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const [childId, setChildId] = useState(kids[0]?.id ?? '')
  const [stickers, setStickers] = useState<StickerRow[]>([])
  const [history, setHistory] = useState<Redemption[]>([])
  const [topics, setTopics] = useState<Record<string, TopicInfo[]>>({})
  const [picked, setPicked] = useState<Set<number>>(new Set())
  const [note, setNote] = useState('')
  const [folded, setFolded] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetch('/api/rewards/pin', { cache: 'no-store' }).then(r => r.json()).then(d => {
      setView(!d.hasPin ? 'setup' : d.unlocked ? 'ready' : 'locked')
    }).catch(() => setView('locked'))
  }, [])

  const load = useCallback(async () => {
    if (!childId) return
    const r = await fetch(`/api/rewards/${childId}`, { cache: 'no-store' })
    if (r.status === 403) { setView('locked'); return }
    if (!r.ok) return
    const d = await r.json() as { stickers: StickerRow[]; redemptions: Redemption[] }
    setStickers(d.stickers); setHistory(d.redemptions); setPicked(new Set())
    const wanted = Array.from(new Set(d.stickers.filter(s => s.collection === 'daily' || s.collection === 'academic').map(s => `${s.collection}/${s.level}`)))
    const entries = await Promise.all(wanted.map(async w => {
      const [col, lv] = w.split('/')
      const url = col === 'daily' ? `/api/words/${lv}/topics` : `/api/vocabwise/topic-meta?book=${lv}`
      const t = await cachedFetch(url).then(x => x.json()).catch(() => [])
      return [w, Array.isArray(t) ? (t as TopicInfo[]).map(x => ({ id: x.id, name: x.name, emoji: x.emoji })) : []] as const
    }))
    setTopics(Object.fromEntries(entries))
  }, [childId])

  useEffect(() => { if (view === 'ready') load() }, [view, load])

  async function post(url: string, body: unknown) {
    setBusy(true); setMsg('')
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const d = await r.json().catch(() => ({}))
    setBusy(false)
    if (!r.ok) { setMsg(d.error ?? 'Có lỗi xảy ra'); return null }
    return d
  }

  async function submitPin() {
    if (view === 'setup') {
      if (pin !== pin2) { setMsg('Hai lần nhập PIN chưa khớp'); return }
      if (await post('/api/rewards/pin', { pin })) { setPin(''); setPin2(''); setView('ready') }
    } else if (view === 'locked') {
      if (await post('/api/rewards/pin/verify', { pin })) { setPin(''); setView('ready') }
    } else if (view === 'reset') {
      if (await post('/api/rewards/pin/reset', { password, pin })) { setPin(''); setPassword(''); setView('ready') }
    }
  }

  const eligible = useMemo(() => stickers.filter(s => !s.legacy && !s.redemption_id), [stickers])
  const earned = stickers.filter(s => !s.legacy).length
  const redeemed = stickers.filter(s => !s.legacy && s.redemption_id).length
  const legacy = stickers.filter(s => s.legacy).length
  const groups = useMemo(() => {
    const m = new Map<string, StickerRow[]>()
    for (const s of eligible) { const k = `${s.collection}/${s.level}`; m.set(k, [...(m.get(k) ?? []), s]) }
    return Array.from(m.entries())
  }, [eligible])

  const toggle = (id: number) => setPicked(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n })

  async function redeem() {
    const kid = kids.find(k => k.id === childId)
    if (!window.confirm(`Đánh dấu ${picked.size} sticker của ${kid?.name ?? 'bé'} là đã đổi quà? Không hoàn tác được.`)) return
    if (await post(`/api/rewards/${childId}/redeem`, { stickerIds: Array.from(picked), note })) { setNote(''); await load() }
    else await load()
  }

  async function lockNow() {
    await fetch('/api/rewards/pin/verify', { method: 'DELETE' })
    setPin(''); setView('locked')
  }

  if (view === 'loading') return <div className={`${card} h-40 animate-pulse`} />

  if (view !== 'ready') {
    const title = view === 'setup' ? 'Đặt PIN phụ huynh' : view === 'reset' ? 'Đặt lại PIN' : 'Nhập PIN phụ huynh'
    const sub = view === 'setup' ? 'PIN 4 số giúp chỉ phụ huynh mới đánh dấu được sticker đã đổi quà.'
      : view === 'reset' ? 'Nhập mật khẩu tài khoản để đặt PIN mới.' : 'Khu vực Quà tặng chỉ dành cho phụ huynh.'
    return (
      <div className={`${card} space-y-3`}>
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 -rotate-6 items-center justify-center rounded-2xl bg-amber-100 text-3xl">🔒</span>
          <div><p className="text-base font-bold text-slate-800">{title}</p><p className="text-xs font-semibold text-slate-500">{sub}</p></div>
        </div>
        {view === 'reset' && (
          <input type="password" autoComplete="current-password" placeholder="Mật khẩu tài khoản" value={password}
            onChange={e => setPassword(e.target.value)} className={`${input} tracking-normal`} />
        )}
        <input type="password" inputMode="numeric" autoComplete="off" maxLength={4} placeholder={view === 'reset' ? 'PIN mới (4 số)' : '••••'}
          value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, ''))} className={input} />
        {view === 'setup' && (
          <input type="password" inputMode="numeric" autoComplete="off" maxLength={4} placeholder="Nhập lại PIN"
            value={pin2} onChange={e => setPin2(e.target.value.replace(/\D/g, ''))} className={input} />
        )}
        {msg && <p className="text-center text-sm font-bold text-red-500">{msg}</p>}
        <button type="button" disabled={busy || pin.length !== 4 || (view === 'setup' && pin2.length !== 4) || (view === 'reset' && !password)}
          onClick={submitPin} className={cta('amber')}>
          {view === 'setup' ? 'Lưu PIN' : view === 'reset' ? 'Đặt PIN mới' : 'Mở khóa'}
        </button>
        {view === 'locked' && (
          <button type="button" onClick={() => { setView('reset'); setPin(''); setMsg('') }} className="w-full text-center text-xs font-bold text-slate-500 underline">Quên PIN?</button>
        )}
        {view === 'reset' && (
          <button type="button" onClick={() => { setView('locked'); setPin(''); setMsg('') }} className="w-full text-center text-xs font-bold text-slate-500 underline">← Quay lại</button>
        )}
      </div>
    )
  }

  const nameOf = (s: StickerRow) => topics[`${s.collection}/${s.level}`]?.find(t => t.id === s.topic_id)
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex flex-1 gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {kids.map(k => (
            <button key={k.id} type="button" onClick={() => setChildId(k.id)}
              className={`flex-shrink-0 rounded-full border-2 px-4 py-1.5 text-sm font-bold ${k.id === childId ? 'border-purple-400 bg-purple-100 text-purple-700' : 'border-slate-200 bg-white text-slate-500'}`}>
              {k.name}
            </button>
          ))}
        </div>
        <button type="button" onClick={lockNow} className="flex-shrink-0 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-500">🔒 Khóa</button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[['Đã nhận', earned, 'text-purple-700'], ['Đã đổi', redeemed, 'text-slate-500'], ['Còn lại', earned - redeemed, 'text-emerald-600']].map(([l, n, c]) => (
          <div key={l as string} className={`${card} !p-3 text-center`}>
            <p className={`text-2xl font-bold ${c}`}>{n}</p>
            <p className="text-xs font-semibold text-slate-500">{l}</p>
          </div>
        ))}
      </div>
      {legacy > 0 && <p className="px-1 text-xs font-semibold text-slate-400">+ {legacy} sticker tặng cho chủ đề đã hoàn thành từ trước: xem trong album của bé, không dùng để đổi quà.</p>}

      <div className={`${card} space-y-4`}>
        <p className="text-base font-bold text-slate-800">Chọn sticker để đổi quà</p>
        {groups.length === 0 && <p className="text-sm font-semibold text-slate-500">Không còn sticker nào để đổi.</p>}
        {groups.map(([key, list]) => {
          const [col, lv] = key.split('/')
          return (
            <div key={key}>
              <button type="button" aria-expanded={!folded[key]} onClick={() => setFolded(f => ({ ...f, [key]: !f[key] }))}
                className="mb-2 flex w-full items-center justify-between text-left">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-400">{COLLECTION_LABEL[col] ?? col} · {LEVEL_LABEL[lv] ?? lv} <span className="normal-case">({list.length})</span></span>
                <span className={`flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-500 transition-transform ${folded[key] ? '' : 'rotate-180'}`}>▾</span>
              </button>
              {!folded[key] && <div className="flex flex-wrap gap-3">
                {list.map(s => {
                  const on = picked.has(s.id); const info = nameOf(s)
                  return (
                    <button key={s.id} type="button" onClick={() => toggle(s.id)} aria-pressed={on} title={info?.name}
                      className={`relative rounded-2xl p-1 ${on ? 'bg-purple-100 ring-2 ring-purple-500' : ''}`}>
                      <Sticker emoji={info?.emoji ?? '⭐'} size="sm" tilt={-4} />
                      {on && <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 text-[10px] font-bold text-white">✓</span>}
                    </button>
                  )
                })}
              </div>}
            </div>
          )
        })}
        {eligible.length > 0 && (
          <div className="flex items-center gap-2">
            <button type="button" className="text-xs font-bold text-purple-700 underline"
              onClick={() => setPicked(picked.size === eligible.length ? new Set() : new Set(eligible.map(s => s.id)))}>
              {picked.size === eligible.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
            </button>
          </div>
        )}
        <input type="text" maxLength={200} placeholder="Ghi chú (không bắt buộc), ví dụ: 1 cuốn truyện" value={note}
          onChange={e => setNote(e.target.value)}
          className="w-full rounded-2xl border-2 border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-purple-400" />
        {msg && <p className="text-sm font-bold text-red-500">{msg}</p>}
        <button type="button" disabled={busy || picked.size === 0} onClick={redeem} className={cta('purple')}>
          {picked.size === 0 ? 'Chọn sticker để đổi' : `Đánh dấu đã đổi ${picked.size} sticker`}
        </button>
      </div>

      <div className={`${card} space-y-2`}>
        <p className="text-base font-bold text-slate-800">Lịch sử đổi quà</p>
        {history.length === 0 && <p className="text-sm font-semibold text-slate-500">Chưa có lần đổi nào.</p>}
        <ul className="divide-y divide-slate-100">
          {history.map(h => (
            <li key={h.id} className="flex items-start justify-between gap-3 py-2">
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-700">{h.sticker_count} sticker</p>
                {h.note && <p className="truncate text-xs font-semibold text-slate-500">{h.note}</p>}
              </div>
              <span className="flex-shrink-0 text-xs font-semibold text-slate-400">{new Date(h.created_at).toLocaleDateString('vi-VN')}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
