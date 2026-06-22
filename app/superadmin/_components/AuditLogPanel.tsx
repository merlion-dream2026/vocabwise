'use client'

import { useState, useEffect } from 'react'

// ── Audit Log Panel ───────────────────────────────────────────────────────────
type AuditEntry = {
  id: string
  action: string
  target_username: string
  details: {
    changed?: string[]
    before?: Record<string, unknown>
    after?: Record<string, unknown>
    plan?: string
    email?: string | null
  }
  created_at: string
}

const AUDIT_ACTION_META: Record<string, { label: string; color: string }> = {
  create_family: { label: '+ Tạo',  color: 'text-emerald-500' },
  update_family: { label: '✏ Sửa', color: 'text-blue-500' },
  delete_family: { label: '🗑 Xóa', color: 'text-red-500' },
}

const AUDIT_FIELD_LABELS: Record<string, string> = {
  plan: 'Gói', disabled: 'Trạng thái', email: 'Email', username: 'SĐT',
  plan_start_date: 'Bắt đầu', plan_end_date: 'Kết thúc', email_verified: 'Xác thực',
  admin_note: 'Ghi chú', max_kids: 'Số bé', free_trial_expires_at: 'Hết trial',
  bonus_features: 'Bonus', password_hash: 'Mật khẩu',
}

const AUDIT_PLAN_LABELS: Record<string, string> = {
  free: 'Free', '1month': '1T', '3months': '3T', '6months': '6T',
}

function auditFmtVal(key: string, val: unknown): string {
  if (val === null || val === undefined || val === '') return '—'
  if (key === 'plan') return AUDIT_PLAN_LABELS[val as string] ?? String(val)
  if (key === 'disabled') return val ? 'Khóa' : 'Hoạt động'
  if (key === 'email_verified') return val ? '✓' : '✗'
  if (key === 'password_hash') return '(đã đổi)'
  if (Array.isArray(val)) return val.join(', ')
  if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(val)) {
    return new Date(val).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: '2-digit' })
  }
  return String(val)
}

export function AuditLogPanel() {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetch('/api/superadmin/audit')
      .then(r => r.json())
      .then(d => { setEntries(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  function fmtTime(iso: string) {
    const d = new Date(iso)
    const date = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: '2-digit' })
    const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })
    return `${date} ${time}`
  }

  function toggleExpand(id: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  function getInlinePreview(e: AuditEntry): string | null {
    if (e.action === 'create_family') {
      const p = AUDIT_PLAN_LABELS[e.details.plan as string] ?? e.details.plan
      return p ? `Gói: ${p}` : null
    }
    if (e.action === 'update_family' && e.details.before && e.details.after && e.details.changed?.length) {
      const k = e.details.changed[0]
      const label = AUDIT_FIELD_LABELS[k] ?? k
      const bv = auditFmtVal(k, e.details.before[k])
      const av = auditFmtVal(k, e.details.after[k])
      const more = e.details.changed.length > 1 ? ` +${e.details.changed.length - 1}` : ''
      return `${label}: ${bv}→${av}${more}`
    }
    if (e.action === 'update_family' && e.details.changed?.length) {
      return `(${e.details.changed.join(', ')})`
    }
    return null
  }

  function getDiffs(e: AuditEntry): { key: string; before: unknown; after: unknown }[] {
    if (!e.details.before || !e.details.after || !e.details.changed) return []
    return e.details.changed.map(k => ({
      key: k,
      before: (e.details.before as Record<string, unknown>)[k],
      after: (e.details.after as Record<string, unknown>)[k],
    }))
  }

  return (
    <div className="bg-white rounded-3xl border-2 border-gray-100 shadow-sm p-5 mt-6">
      <h2 className="font-semibold text-slate-600 mb-4">📋 Audit Log <span className="text-slate-400 font-normal text-xs">(100 gần nhất)</span></h2>
      {loading ? (
        <p className="text-slate-500 text-sm text-center py-4">Đang tải...</p>
      ) : entries.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-slate-400 text-sm mb-1">Chưa có logs.</p>
          <p className="text-slate-400 text-xs">Chạy <code className="bg-slate-50 px-1 rounded">supabase/phase3_audit_log.sql</code> trong Supabase SQL Editor để bật tính năng này.</p>
        </div>
      ) : (
        <div className="space-y-1.5 max-h-96 overflow-y-auto">
          {entries.map(e => {
            const meta = AUDIT_ACTION_META[e.action] ?? { label: e.action, color: 'text-slate-600' }
            const preview = getInlinePreview(e)
            const diffs = getDiffs(e)
            const isExpanded = expanded.has(e.id)
            const hasDetail = diffs.length > 1 || (e.action === 'create_family' && e.details.email)
            return (
              <div key={e.id}
                className={`bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 text-sm ${hasDetail || diffs.length > 0 ? 'cursor-pointer hover:bg-slate-100' : ''}`}
                onClick={() => (hasDetail || diffs.length > 0) && toggleExpand(e.id)}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`font-bold text-xs flex-shrink-0 w-12 ${meta.color}`}>{meta.label}</span>
                    <span className="font-mono text-slate-700 text-xs">{e.target_username}</span>
                    {preview && <span className="text-slate-400 text-[11px] truncate hidden sm:block">{preview}</span>}
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="text-slate-400 text-[11px]">{fmtTime(e.created_at)}</span>
                    {(hasDetail || diffs.length > 0) && (
                      <span className="text-slate-300 text-[10px]">{isExpanded ? '▲' : '▼'}</span>
                    )}
                  </div>
                </div>

                {isExpanded && diffs.length > 0 && (
                  <div className="mt-2 pl-14 space-y-0.5">
                    {diffs.map(d => (
                      <div key={d.key} className="flex items-center gap-1.5 text-[11px]">
                        <span className="text-slate-500 w-20 flex-shrink-0">{AUDIT_FIELD_LABELS[d.key] ?? d.key}</span>
                        <span className="text-slate-400">{auditFmtVal(d.key, d.before)}</span>
                        <span className="text-slate-300">→</span>
                        <span className="text-slate-700 font-medium">{auditFmtVal(d.key, d.after)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {isExpanded && e.action === 'create_family' && (
                  <div className="mt-2 pl-14 space-y-0.5">
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <span className="text-slate-500 w-20">Gói</span>
                      <span className="text-slate-700 font-medium">{AUDIT_PLAN_LABELS[e.details.plan as string] ?? e.details.plan ?? '—'}</span>
                    </div>
                    {e.details.email !== undefined && (
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <span className="text-slate-500 w-20">Email</span>
                        <span className="text-slate-700 font-medium">{e.details.email ?? '—'}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
