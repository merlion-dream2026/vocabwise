'use client'

import { useState, useEffect, useRef, FormEvent } from 'react'
import type { Family } from '../_types'
import { PLAN_OPTIONS, PLAN_DURATIONS } from '../_lib/constants'
import { exportCSV, addDays, today, daysUntil, planBadge } from '../_lib/helpers'
import { PasswordInput } from './PasswordInput'
import { FamilyEditModal } from './FamilyEditModal'
import { GlobalConfigPanel } from './GlobalConfigPanel'
import { TotpPanel } from './TotpPanel'
import { ExpiryReport } from './ExpiryReport'
import { FinancePanel } from './FinancePanel'
import { AuditLogPanel } from './AuditLogPanel'
import { AnalyticsPanel } from './AnalyticsPanel'
import { TrendsPanel } from './TrendsPanel'
import { ReferralStatsPanel } from './ReferralStatsPanel'
import { FlagsPanel } from './FlagsPanel'

// ── Admin Panel ───────────────────────────────────────────────────────────────
export function AdminPanel() {
  const [families, setFamilies] = useState<Family[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ username: '', password: '', email: '', plan: 'free', plan_start_date: today() })
  const [createMsg, setCreateMsg] = useState('')
  const [editing, setEditing] = useState<Family | null>(null)
  const [search, setSearch] = useState('')
  const [adminTab, setAdminTab] = useState<'users' | 'finance' | 'settings' | 'flags' | 'referral' | 'analytics'>('users')
  const [flagCount, setFlagCount] = useState(0)
  const [filterPlan, setFilterPlan] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [sortBy, setSortBy] = useState<'newest' | 'expiry' | 'plan'>('newest')
  const [page, setPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulking, setBulking] = useState(false)
  const [showBulkEmail, setShowBulkEmail] = useState(false)
  const [bulkEmailSubject, setBulkEmailSubject] = useState('')
  const [bulkEmailBody, setBulkEmailBody] = useState('')
  const [bulkEmailSending, setBulkEmailSending] = useState(false)
  const [bulkEmailResult, setBulkEmailResult] = useState<{ sent: number; skipped: number } | null>(null)
  const [idleWarning, setIdleWarning] = useState(false)
  const lastActivityRef = useRef(Date.now())
  const [analyticsKey, setAnalyticsKey] = useState(0)
  const [referralKey, setReferralKey] = useState(0)
  const [financeKey, setFinanceKey] = useState(0)
  const PAGE_SIZE = 20


  async function loadFamilies() {
    const res = await fetch('/api/superadmin/families')
    if (res.ok) setFamilies(await res.json())
    setLoading(false)
  }

  async function loadFlagCount() {
    const res = await fetch('/api/superadmin/flags')
    if (res.ok) {
      const data = await res.json()
      setFlagCount(data.filter((f: { reviewed: boolean }) => !f.reviewed).length)
    }
  }

  useEffect(() => { loadFamilies(); loadFlagCount() }, [])

  const formPlanEndDate = PLAN_DURATIONS[form.plan] ? addDays(form.plan_start_date, PLAN_DURATIONS[form.plan]) : null

  async function createFamily(e: FormEvent) {
    e.preventDefault()
    setCreateMsg('')
    const body: Record<string, unknown> = { ...form }
    if (formPlanEndDate) {
      body.plan_end_date = formPlanEndDate
    }
    const res = await fetch('/api/superadmin/families', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (res.ok) {
      setCreateMsg(`✅ Đã tạo: ${data.username}`)
      setForm({ username: '', password: '', email: '', plan: 'free', plan_start_date: today() })
      loadFamilies()
    } else {
      setCreateMsg(`❌ ${data.error}`)
    }
  }

  function handleSaved(updated: Family) {
    setFamilies(prev => prev.map(f => f.id === updated.id ? { ...f, ...updated } : f))
    setEditing(prev => prev?.id === updated.id ? { ...prev, ...updated } : prev)
  }

  function handleDeleted(id: string) {
    setFamilies(prev => prev.filter(f => f.id !== id))
    setEditing(null)
  }

  async function verifyFamily(id: string) {
    const res = await fetch(`/api/superadmin/families/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email_verified: true }),
    })
    if (res.ok) {
      const updated = await res.json()
      handleSaved(updated)
    }
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.reload()
  }

  useEffect(() => { setPage(1); setSelectedIds(new Set()) }, [search, filterPlan, filterStatus, sortBy])

  function toggleSelect(id: string) {
    setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  async function executeBulk(action: 'disable' | 'enable' | 'extend', days?: number) {
    if (selectedIds.size === 0 || bulking) return
    setBulking(true)
    await fetch('/api/superadmin/families/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ids: Array.from(selectedIds), days }),
    })
    setBulking(false)
    setSelectedIds(new Set())
    loadFamilies()
  }

  async function sendBulkEmail() {
    if (!bulkEmailSubject || !bulkEmailBody || selectedIds.size === 0) return
    setBulkEmailSending(true)
    const html = `<div style="font-family:sans-serif;max-width:560px;margin:auto;padding:24px;white-space:pre-wrap">${bulkEmailBody.replace(/\n/g, '<br>')}</div>`
    const res = await fetch('/api/superadmin/notify/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject: bulkEmailSubject, html, ids: Array.from(selectedIds) }),
    })
    const data = await res.json()
    setBulkEmailResult(data)
    setBulkEmailSending(false)
  }

  // Idle timeout: warn at 55min, logout at 60min
  useEffect(() => {
    const TIMEOUT = 60 * 60 * 1000
    const WARN_AT  = 55 * 60 * 1000

    function resetIdle() {
      lastActivityRef.current = Date.now()
      setIdleWarning(false)
    }

    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'] as const
    events.forEach(e => window.addEventListener(e, resetIdle, { passive: true }))

    const timer = setInterval(() => {
      const idle = Date.now() - lastActivityRef.current
      if (idle >= TIMEOUT) logout()
      else if (idle >= WARN_AT) setIdleWarning(true)
    }, 30_000)

    return () => {
      events.forEach(e => window.removeEventListener(e, resetIdle))
      clearInterval(timer)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const displayed = families
    .filter(f => !search || f.username.includes(search) || f.email?.includes(search) || f.name?.includes(search) || f.phone?.includes(search))
    .filter(f => filterPlan === 'all' || (filterPlan === 'pro' ? f.plan !== 'free' : f.plan === filterPlan))
    .filter(f => {
      if (filterStatus === 'all') return true
      if (filterStatus === 'disabled') return f.disabled
      const expiry = f.plan !== 'free' ? f.plan_end_date : f.free_trial_expires_at
      const days = daysUntil(expiry)
      if (filterStatus === 'active') return !f.disabled && (days ?? -1) >= 0
      if (filterStatus === 'expired') return !f.disabled && (days ?? -1) < 0
      return true
    })
    .sort((a, b) => {
      if (sortBy === 'expiry') {
        const da = daysUntil(a.plan !== 'free' ? a.plan_end_date : a.free_trial_expires_at) ?? 999
        const db = daysUntil(b.plan !== 'free' ? b.plan_end_date : b.free_trial_expires_at) ?? 999
        return da - db
      }
      if (sortBy === 'plan') {
        const ord = { '6months': 0, '3months': 1, '1month': 2, free: 3 }
        return (ord[a.plan as keyof typeof ord] ?? 9) - (ord[b.plan as keyof typeof ord] ?? 9)
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

  const totalPages = Math.max(1, Math.ceil(displayed.length / PAGE_SIZE))
  const paginated = displayed.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function relativeDate(iso: string): string {
    const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
    if (days === 0) return 'hôm nay'
    if (days === 1) return 'hôm qua'
    if (days < 7) return `${days}d trước`
    if (days < 30) return `${Math.floor(days / 7)}w`
    return `${Math.floor(days / 30)}th`
  }

  const ADMIN_TABS = [
    { key: 'users',     icon: '👥', text: 'Users' },
    { key: 'analytics', icon: '📊', text: 'Analytics' },
    { key: 'finance',   icon: '💰', text: 'Finance' },
    { key: 'referral',  icon: '🎯', text: 'Referral' },
    { key: 'flags',     icon: '⚠️', text: 'Flags' },
    { key: 'settings',  icon: '⚙️', text: 'Settings' },
  ] as const

  return (
    <div className="min-h-screen bg-[#F8F6FF] p-4 text-slate-900">

      {/* Idle warning */}
      {idleWarning && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4">
          <div className="bg-white border-2 border-amber-200 rounded-2xl p-4 shadow-xl">
            <p className="text-amber-800 font-black text-sm">⏰ Sắp hết phiên đăng nhập</p>
            <p className="text-amber-700 text-xs mt-1">Bạn sẽ bị đăng xuất sau 5 phút không hoạt động.</p>
            <button onClick={() => { setIdleWarning(false); lastActivityRef.current = Date.now() }}
              className="mt-3 w-full bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold py-2 rounded-xl">
              Tiếp tục làm việc
            </button>
          </div>
        </div>
      )}

      {/* Bulk email modal */}
      {showBulkEmail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => { setShowBulkEmail(false); setBulkEmailResult(null) }}>
          <div className="bg-white rounded-3xl border-2 border-gray-100 shadow-sm p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg">📧 Gửi email hàng loạt</h2>
              <button onClick={() => { setShowBulkEmail(false); setBulkEmailResult(null) }} className="text-slate-400 hover:text-slate-700 text-xl">×</button>
            </div>
            {bulkEmailResult ? (
              <div className="text-center py-6 space-y-2">
                <p className="text-3xl">✅</p>
                <p className="font-bold text-green-400">Đã gửi {bulkEmailResult.sent} email</p>
                {bulkEmailResult.skipped > 0 && <p className="text-slate-500 text-sm">Bỏ qua {bulkEmailResult.skipped} TK không có email</p>}
                <button onClick={() => { setShowBulkEmail(false); setBulkEmailResult(null); setSelectedIds(new Set()) }}
                  className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-6 py-2.5 rounded-xl">
                  Xong
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-slate-500 text-sm">Gửi đến <strong className="text-white">{selectedIds.size}</strong> tài khoản đã chọn (chỉ TK có email).</p>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Tiêu đề email</label>
                  <input value={bulkEmailSubject} onChange={e => setBulkEmailSubject(e.target.value)}
                    placeholder="Ví dụ: Gia hạn VocabWise — ưu đãi đặc biệt"
                    className="w-full bg-white border-2 border-slate-200 rounded-2xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Nội dung</label>
                  <textarea value={bulkEmailBody} onChange={e => setBulkEmailBody(e.target.value)}
                    placeholder="Xin chào phụ huynh,&#10;&#10;..."
                    rows={5}
                    className="w-full bg-white border-2 border-slate-200 rounded-2xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
                </div>
                <div className="flex gap-3">
                  <button onClick={sendBulkEmail} disabled={bulkEmailSending || !bulkEmailSubject || !bulkEmailBody}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-sm py-2.5 rounded-xl">
                    {bulkEmailSending ? 'Đang gửi...' : '📧 Gửi ngay'}
                  </button>
                  <button onClick={() => setShowBulkEmail(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm py-2.5 rounded-xl">Hủy</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {editing && (
        <FamilyEditModal
          family={editing}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
          onDeleted={handleDeleted}
        />
      )}
      <div className="max-w-3xl mx-auto">
        {/* Header gradient — ôm luôn tab bar, giống parent UI */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-3xl mb-6 shadow-lg overflow-hidden">
          {/* Brand row */}
          <div className="flex items-center justify-between px-6 pt-5 pb-4">
            <div>
              <h1 className="text-2xl font-black text-white">🔐 Super Admin</h1>
              <p className="text-indigo-200 text-xs mt-0.5 font-semibold">VocabWise</p>
            </div>
            <button onClick={logout}
              className="bg-white/20 hover:bg-white/30 text-white text-xs px-3 py-2 rounded-2xl transition-colors whitespace-nowrap">
              Đăng xuất
            </button>
          </div>

          {/* Tabs — active: icon+text, inactive: icon only → vừa hết 1 hàng */}
          <div className="flex gap-1 px-3 pb-0">
            {ADMIN_TABS.map(t => {
              const isActive = adminTab === t.key
              return (
                <button key={t.key} onClick={() => setAdminTab(t.key)}
                  className={`flex items-center gap-1 py-2.5 rounded-t-2xl font-black text-sm transition-all flex-1 justify-center ${
                    isActive ? 'bg-white text-gray-800 px-3' : 'text-white/70 hover:text-white px-2'
                  }`}>
                  <span className="relative">
                    {t.icon}
                    {t.key === 'flags' && flagCount > 0 && (
                      <span className="absolute -top-1 -right-1.5 bg-red-500 text-white text-[8px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center">
                        {flagCount}
                      </span>
                    )}
                  </span>
                  {isActive && <span className="whitespace-nowrap">{t.text}</span>}
                </button>
              )
            })}
          </div>
        </div>

        {/* Tab: Users */}
        {adminTab === 'users' && (
          <div className="bg-white rounded-3xl border-2 border-gray-100 shadow-sm p-5">
            <div className="flex items-center mb-3 gap-2">
              <div className="flex items-center gap-2 flex-shrink-0">
                <input type="checkbox"
                  checked={paginated.length > 0 && paginated.every(f => selectedIds.has(f.id))}
                  onChange={e => e.target.checked ? setSelectedIds(new Set(paginated.map(f => f.id))) : setSelectedIds(new Set())}
                  className="w-4 h-4 rounded accent-indigo-600 cursor-pointer"
                />
                <h2 className="font-semibold text-lg whitespace-nowrap">Tài khoản ({families.length})</h2>
              </div>
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Tìm kiếm..."
                className="flex-1 min-w-0 bg-white border-2 border-slate-200 rounded-2xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button onClick={() => exportCSV(displayed)}
                className="bg-slate-50 hover:bg-indigo-50 text-slate-600 text-sm px-3 py-2 rounded-xl whitespace-nowrap flex-shrink-0 hidden sm:block">
                📥 CSV
              </button>
              <button onClick={() => setShowCreate(!showCreate)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-xl whitespace-nowrap flex-shrink-0">
                + Tạo
              </button>
            </div>

            {/* Filter + Sort bar */}
            {/* Filter + Sort bar — 2 rows */}
            <div className="space-y-1.5 mb-4">
              {/* Row 1: Plan */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wide">Gói:</span>
                {[
                  { val: 'all', label: 'Tất cả' }, { val: 'pro', label: 'Pro' }, { val: 'free', label: 'Free' },
                  { val: '2weeks', label: '🎁' }, { val: '1month', label: '1T' }, { val: '3months', label: '3T' }, { val: '6months', label: '6T' },
                ].map(p => (
                  <button key={p.val} onClick={() => setFilterPlan(p.val)}
                    className={`text-xs px-2.5 py-1 rounded-full font-semibold transition-colors ${filterPlan === p.val ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-500 hover:bg-indigo-50'}`}>
                    {p.label}
                  </button>
                ))}
              </div>
              {/* Row 2: Status + Sort */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wide">TT:</span>
                {[
                  { val: 'all', label: 'Tất cả' }, { val: 'active', label: '✅ Active' },
                  { val: 'expired', label: '⏰ Hết hạn' }, { val: 'disabled', label: '🔒 Khóa' },
                ].map(s => (
                  <button key={s.val} onClick={() => setFilterStatus(s.val)}
                    className={`text-xs px-2.5 py-1 rounded-full font-semibold transition-colors ${filterStatus === s.val ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-500 hover:bg-indigo-50'}`}>
                    {s.label}
                  </button>
                ))}
                <div className="ml-auto flex items-center gap-2">
                  <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)}
                    className="bg-white border-2 border-slate-200 rounded-2xl px-2 py-1 text-xs text-slate-600 focus:outline-none">
                    <option value="newest">Mới nhất</option>
                    <option value="expiry">Sắp hết hạn</option>
                    <option value="plan">Theo gói</option>
                  </select>
                  <span className="text-xs text-slate-400 whitespace-nowrap">{displayed.length}/{families.length}</span>
                </div>
              </div>
            </div>

            {showCreate && (
              <form onSubmit={createFamily} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })}
                    placeholder="Username" required
                    className="bg-slate-50 border-2 border-slate-200 rounded-2xl px-3 py-2 text-sm focus:outline-none" />
                  <PasswordInput value={form.password} onChange={(v) => setForm({ ...form, password: v })}
                    placeholder="Mật khẩu"
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-3 py-2 text-sm focus:outline-none" />
                  <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="Email (tùy chọn)"
                    className="bg-slate-50 border-2 border-slate-200 rounded-2xl px-3 py-2 text-sm focus:outline-none" />
                  <select value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })}
                    className="bg-slate-50 border-2 border-slate-200 rounded-2xl px-3 py-2 text-sm focus:outline-none">
                    {PLAN_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                {PLAN_DURATIONS[form.plan] && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Ngày bắt đầu</label>
                      <input type="date" value={form.plan_start_date} onChange={e => setForm({ ...form, plan_start_date: e.target.value })}
                        className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-3 py-2 text-sm focus:outline-none" />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Hết hạn (tự động)</label>
                      <input type="date" value={formPlanEndDate ?? ''} readOnly
                        className="w-full bg-slate-100 border-2 border-slate-200 rounded-2xl px-3 py-2 text-sm text-slate-600 cursor-not-allowed" />
                    </div>
                  </div>
                )}
                {createMsg && <p className="text-sm">{createMsg}</p>}
                <button type="submit" className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2 rounded-lg">
                  Tạo tài khoản
                </button>
              </form>
            )}

            {/* Bulk action bar */}
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-2 bg-indigo-900/40 border border-indigo-200/50 rounded-xl px-3 py-2 mb-3 flex-wrap">
                <span className="text-indigo-500 text-sm font-semibold flex-shrink-0">{selectedIds.size} đã chọn</span>
                <button onClick={() => executeBulk('enable')} disabled={bulking}
                  className="text-xs bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg font-semibold">✅ Mở khóa</button>
                <button onClick={() => executeBulk('disable')} disabled={bulking}
                  className="text-xs bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg font-semibold">🔒 Khóa</button>
                <div className="flex gap-1">
                  {[30, 90, 180].map(d => (
                    <button key={d} onClick={() => executeBulk('extend', d)} disabled={bulking}
                      className="text-xs bg-indigo-700 hover:bg-indigo-600 disabled:opacity-50 text-teal-100 px-2 py-1.5 rounded-lg font-bold">
                      +{d}d
                    </button>
                  ))}
                </div>
                <button onClick={() => { setShowBulkEmail(true); setBulkEmailSubject(''); setBulkEmailBody(''); setBulkEmailResult(null) }}
                  className="text-xs bg-blue-700 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg font-semibold">📧 Email</button>
                <button onClick={() => setSelectedIds(new Set())} className="ml-auto text-xs text-slate-500 hover:text-slate-900">✕</button>
              </div>
            )}

            {loading ? (
              <p className="text-slate-500 text-sm">Đang tải...</p>
            ) : (
              <div className="space-y-2">
                {paginated.map((f) => {
                  const badge = planBadge(f)
                  const regDate = new Date(f.created_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: '2-digit' })
                  return (
                    <div key={f.id} className="flex items-center gap-2 bg-slate-50 hover:bg-indigo-50 rounded-xl px-2 py-2.5 transition-colors">
                      <input type="checkbox"
                        checked={selectedIds.has(f.id)}
                        onChange={() => toggleSelect(f.id)}
                        onClick={e => e.stopPropagation()}
                        className="w-4 h-4 flex-shrink-0 rounded accent-indigo-600 cursor-pointer ml-1"
                      />
                      <button onClick={() => setEditing(f)} className="flex-1 flex items-center justify-between text-left gap-3 min-w-0">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm">{f.username}</span>
                            {f.name && <span className="text-slate-500 text-xs">{f.name}</span>}
                            {!f.email_verified && <span className="text-yellow-500 text-[10px] font-bold">⚠ unverified</span>}
                            {f.admin_note && <span title={f.admin_note} className="text-yellow-400 text-xs">📝</span>}
                          </div>
                          <p className="text-slate-400 text-xs mt-0.5 truncate">
                            {[f.email, f.phone, regDate, f.last_active ? `🟢 ${relativeDate(f.last_active)}` : null].filter(Boolean).join(' · ')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`text-xs px-2 py-1 rounded-full font-semibold ${badge.color}`}>{badge.label}</span>
                          <span className="text-xs px-2 py-1 rounded-full font-semibold bg-slate-200 text-slate-600">
                            {f.children_count ?? 0}👶
                          </span>
                          {f.max_kids !== null && f.max_kids !== undefined && (
                            <span className="text-xs px-2 py-1 rounded-full font-semibold bg-blue-700 text-blue-200">max {f.max_kids}</span>
                          )}
                          {f.disabled && <span className="text-xs text-red-400">🔒</span>}
                        </div>
                      </button>
                      {!f.email_verified && (
                        <button
                          onClick={e => { e.stopPropagation(); verifyFamily(f.id) }}
                          title="Xác minh tài khoản"
                          className="flex-shrink-0 text-[10px] text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 px-1.5 py-1 rounded-lg font-bold">
                          ✓ XM
                        </button>
                      )}
                    </div>
                  )
                })}
                {displayed.length === 0 && (
                  <p className="text-slate-500 text-sm py-2">{search || filterPlan !== 'all' || filterStatus !== 'all' ? 'Không tìm thấy.' : 'Chưa có tài khoản nào'}</p>
                )}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4 pt-3 border-t border-slate-200">
                <button onClick={() => setPage(1)} disabled={page === 1}
                  className="text-xs px-2 py-1.5 bg-slate-50 hover:bg-indigo-50 disabled:opacity-40 rounded-lg">«</button>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="text-xs px-3 py-1.5 bg-slate-50 hover:bg-indigo-50 disabled:opacity-40 rounded-lg">← Trước</button>
                <span className="text-sm text-slate-500 font-semibold px-2">{page} / {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="text-xs px-3 py-1.5 bg-slate-50 hover:bg-indigo-50 disabled:opacity-40 rounded-lg">Tiếp →</button>
                <button onClick={() => setPage(totalPages)} disabled={page === totalPages}
                  className="text-xs px-2 py-1.5 bg-slate-50 hover:bg-indigo-50 disabled:opacity-40 rounded-lg">»</button>
              </div>
            )}
          </div>
        )}

        {/* Tab: Finance */}
        {adminTab === 'finance' && (
          <div>
            <div className="flex justify-end mb-3">
              <button onClick={() => { setFinanceKey(k => k + 1); loadFamilies() }} className="text-xs bg-slate-50 hover:bg-indigo-50 text-slate-600 px-3 py-1.5 rounded-lg">
                🔄 Làm mới
              </button>
            </div>
            <FinancePanel
              refreshKey={financeKey}
              onCardClick={(plan, status) => { setFilterPlan(plan); setFilterStatus(status); setAdminTab('users') }}
            />
            <TrendsPanel mode="finance" />
            <div className="mt-4">
              <ExpiryReport families={families} onRefresh={loadFamilies} />
            </div>
          </div>
        )}

        {/* Tab: Settings */}
        {adminTab === 'settings' && (
          <div>
            <GlobalConfigPanel />
            <TotpPanel />
            <AuditLogPanel />
          </div>
        )}

        {/* Tab: Analytics */}
        {adminTab === 'analytics' && (
          <div>
            <div className="flex justify-end mb-3">
              <button onClick={() => setAnalyticsKey(k => k + 1)} className="text-xs bg-slate-50 hover:bg-indigo-50 text-slate-600 px-3 py-1.5 rounded-lg">
                🔄 Làm mới
              </button>
            </div>
            <AnalyticsPanel refreshKey={analyticsKey} />
            <div className="mt-4">
              <TrendsPanel mode="analytics" />
            </div>
          </div>
        )}

        {/* Tab: Referral */}
        {adminTab === 'referral' && (
          <div>
            <div className="flex justify-end mb-3">
              <button onClick={() => setReferralKey(k => k + 1)} className="text-xs bg-slate-50 hover:bg-indigo-50 text-slate-600 px-3 py-1.5 rounded-lg">
                🔄 Làm mới
              </button>
            </div>
            <ReferralStatsPanel refreshKey={referralKey} />
          </div>
        )}

        {/* Tab: Flags */}
        {adminTab === 'flags' && (
          <FlagsPanel onReviewed={() => { setFlagCount(c => Math.max(0, c - 1)) }} />
        )}

      </div>
    </div>
  )
}
