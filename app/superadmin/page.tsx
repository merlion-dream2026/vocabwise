'use client'

import { useState, useEffect, useRef, FormEvent } from 'react'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { getAvatarSrc } from '@/lib/avatars'


type Family = {
  id: string
  username: string
  email: string | null
  name: string | null
  phone: string | null
  referral_source: string | null
  plan: string
  disabled: boolean
  email_verified: boolean
  created_at: string
  free_trial_expires_at: string | null
  plan_start_date: string | null
  plan_end_date: string | null
  max_kids: number | null
  admin_note: string | null
  bonus_features: string[] | null
  last_active?: string | null
  children_count?: number
}

// Features that can be manually granted to individual users
const BONUS_FEATURES = [
  { key: 'phonics_full',       icon: '🔤', label: 'Phonics đầy đủ',   desc: 'Tất cả bài Phonics (mặc định Free chỉ 1 bài)' },
  { key: 'word_stress',        icon: '📢', label: 'Word Stress',        desc: 'Module trọng âm (thường cần Pro 3T+)' },
  { key: 'my_words',           icon: '⭐', label: 'My Words',           desc: 'Lưu & quản lý từ vựng cá nhân' },
  { key: 'srs',                icon: '📅', label: 'SRS ôn từ',         desc: 'Ôn tập từ yếu theo lịch' },
  { key: 'kids_full',          icon: '📚', label: 'Kids đầy đủ',       desc: 'Tất cả 180 chủ đề VocabWise Kids' },
  { key: 'academic_full',      icon: '🎓', label: 'Academic đầy đủ',  desc: 'Tất cả 3 books Academic (180 chủ đề)' },
  { key: 'ai_speak_unlimited', icon: '🎤', label: 'AI Speak ∞',        desc: 'Không giới hạn lần chấm phát âm AI' },
] as const

type BonusFeatureKey = typeof BONUS_FEATURES[number]['key']

// Features already included in each plan (no need to grant manually)
function getPlanIncludes(plan: string): BonusFeatureKey[] {
  if (plan === 'free') return []
  const base: BonusFeatureKey[] = ['phonics_full', 'my_words', 'srs', 'kids_full', 'academic_full']
  if (plan === '3months' || plan === '6months') return [...base, 'word_stress', 'ai_speak_unlimited']
  return base
}

const PLAN_OPTIONS = [
  { value: 'free',     label: 'Free (dùng thử 7 ngày)' },
  { value: '2weeks',   label: '🎁 Pro 2 tuần (tặng bạn bè)' },
  { value: '1month',   label: '1 tháng — 59.000đ' },
  { value: '3months',  label: '3 tháng — 159.000đ' },
  { value: '6months',  label: '6 tháng — 299.000đ' },
]

const PLAN_DURATIONS: Record<string, number> = {
  '2weeks': 14,
  '1month': 30,
  '3months': 90,
  '6months': 180,
}

function exportCSV(families: Family[]) {
  const headers = ['Username', 'Tên', 'Email', 'SĐT', 'Gói', 'Hết hạn', 'Ngày ĐK', 'Trạng thái']
  const rows = families.map(f => [
    f.username,
    f.name || '',
    f.email || '',
    f.phone || '',
    f.plan,
    (f.plan !== 'free' ? f.plan_end_date : f.free_trial_expires_at)?.split('T')[0] || '',
    f.created_at.split('T')[0],
    f.disabled ? 'Bị khóa' : 'Hoạt động',
  ])
  const csv = [headers, ...rows]
    .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `vocabwise-users-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

function today(): string {
  return new Date().toISOString().split('T')[0]
}

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000)
}

function planBadge(f: Family): { label: string; color: string } {
  if (f.plan === 'free') {
    const d = daysUntil(f.free_trial_expires_at)
    if (d === null || d < 0) return { label: 'FREE ✗', color: 'bg-red-700 text-red-200' }
    return { label: `FREE (${d}d)`, color: 'bg-slate-100 text-slate-700' }
  }
  const PLAN_SHORT: Record<string, string> = { '2weeks': 'GIFT', '1month': 'PRO1', '3months': 'PRO3', '6months': 'PRO6' }
  const planShort = PLAN_SHORT[f.plan] ?? f.plan.toUpperCase()
  const d = daysUntil(f.plan_end_date)
  if (d === null || d < 0) return { label: `${planShort} ✗`, color: 'bg-red-700 text-red-200' }
  if (d <= 7) return { label: `${planShort} (${d}d ⚠)`, color: 'bg-yellow-600 text-yellow-100' }
  const PLAN_COLOR: Record<string, string> = {
    '2weeks':  'bg-pink-500 text-white',
    '1month':  'bg-sky-500 text-white',
    '3months': 'bg-violet-600 text-white',
    '6months': 'bg-indigo-700 text-white',
  }
  return { label: `${planShort} (${d}d)`, color: PLAN_COLOR[f.plan] ?? 'bg-indigo-700 text-white' }
}

function EyeIcon({ show }: { show: boolean }) {
  return show ? (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
    </svg>
  )
}

function PasswordInput({ value, onChange, placeholder, className }: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  className?: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={className + ' pr-10'}
      />
      <button type="button" onClick={() => setShow(!show)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700">
        <EyeIcon show={show} />
      </button>
    </div>
  )
}

const EMAIL_TYPE_INFO: Record<string, { icon: string; subject: string }> = {
  // Onboarding drip
  onboarding_d1:        { icon: '👋', subject: 'D+1 · Bắt đầu chỉ mất 5 phút' },
  onboarding_d3:        { icon: '🔥', subject: 'D+3 · Bạn đang đi đúng hướng!' },
  onboarding_d7:        { icon: '📖', subject: 'D+7 · 1 tuần với VocabWise' },
  // Trial conversion
  trial_d4:             { icon: '⏰', subject: 'D+4 · Còn 3 ngày dùng thử' },
  trial_d6:             { icon: '🚨', subject: 'D+6 · Ngày cuối dùng thử' },
  trial_d7:             { icon: '📋', subject: 'D+7 · Chuyển về Free' },
  trial_d8:             { icon: '🤔', subject: 'D+8 · FAQ phân vân nâng cấp' },
  // Milestones
  streak_7:             { icon: '🔥', subject: 'Milestone · Streak 7 ngày' },
  streak_30:            { icon: '🏆', subject: 'Milestone · Streak 30 ngày' },
  topic_mastered_first: { icon: '✅', subject: 'Milestone · Topic Academic đầu tiên đạt MASTERED' },
  // Re-engagement
  inactive_3d:          { icon: '🐣', subject: 'Re-engage · Chưa học 3 ngày' },
  inactive_7d:          { icon: '📚', subject: 'Re-engage · Chưa học 7 ngày' },
  inactive_14d:         { icon: '🙏', subject: 'Re-engage · Chưa học 14 ngày (Pro)' },
  winback_30d:          { icon: '👀', subject: 'Win-back · Chưa học 30 ngày' },
  // Pro lifecycle
  pro_expiry_14d:       { icon: '⏰', subject: 'Pro · Còn 14 ngày — nhắc gia hạn sớm' },
  renewal_reminder_7d:  { icon: '⏰', subject: 'Pro · Còn 7 ngày — nhắc gia hạn' },
  renewal_reminder_1d:  { icon: '🚨', subject: 'Pro · Còn 1 ngày — nhắc gia hạn gấp' },
  pro_expiry_d1:        { icon: '📋', subject: 'Pro · Hết hạn hôm qua (D+1)' },
  pro_expiry_d7:        { icon: '🐣', subject: 'Pro · Nhắc gia hạn lần cuối (D+7)' },
}

function getEmailTypeInfo(emailType: string): { icon: string; subject: string } {
  if (emailType in EMAIL_TYPE_INFO) return EMAIL_TYPE_INFO[emailType]
  if (emailType.startsWith('level_up_')) {
    const parts = emailType.split('_')
    const level = parts[parts.length - 1]
    return { icon: '🎓', subject: `Milestone · Bé lên level ${level}` }
  }
  return { icon: '📧', subject: emailType }
}

function FamilyEditModal({ family, onClose, onSaved, onDeleted }: {
  family: Family
  onClose: () => void
  onSaved: (f: Family) => void
  onDeleted: (id: string) => void
}) {
  const [username, setUsername] = useState(family.username)
  const [plan, setPlan] = useState(family.plan)
  const [email, setEmail] = useState(family.email ?? '')
  const [disabled, setDisabled] = useState(family.disabled)
  const [planStartDate, setPlanStartDate] = useState(family.plan_start_date ?? today())
  const [maxKids, setMaxKids] = useState<string>(family.max_kids !== null && family.max_kids !== undefined ? String(family.max_kids) : '')
  const [adminNote, setAdminNote] = useState(family.admin_note ?? '')
  const [bonusFeatures, setBonusFeatures] = useState<string[]>(family.bonus_features ?? [])
  const [newPassword, setNewPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [notifPassword, setNotifPassword] = useState('')
  const [showNotif, setShowNotif] = useState(false)
  const [notifMode, setNotifMode] = useState<'email' | 'message' | null>(null)
  const [sending, setSending] = useState(false)
  const [copied, setCopied] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showChildren, setShowChildren] = useState(false)
  const [childrenData, setChildrenData] = useState<{
    id: string; name: string; emoji: string; level: string
    word_count: number; phonics_count: number; topics_count: number; last_active: string | null
    total_xp: number; badge_icon: string | null; badge_label: string | null; badge_cls: string | null
    streak_current: number; streak_last_active: string
    phonics_seen: number; phonics_mastered: number; phonics_total: number
    daily_words: number; daily_words_total: number
    daily_topics: number; daily_topics_total: number
    academic_completed: number; academic_total: number
  }[]>([])
  const [childrenLoading, setChildrenLoading] = useState(false)
  const [showEmailLog, setShowEmailLog] = useState(false)
  const [emailLogData, setEmailLogData] = useState<{
    id: number; email_type: string; sent_at: string; metadata: Record<string, unknown> | null
  }[]>([])
  const [emailLogLoading, setEmailLogLoading] = useState(false)

  const savedUsername = username.trim().toLowerCase()
  const planEndDate = PLAN_DURATIONS[plan] ? addDays(planStartDate, PLAN_DURATIONS[plan]) : null

  const PLAN_LABELS: Record<string, string> = {
    free: 'Free (dùng thử)',
    '2weeks': '🎁 Pro 2 tuần (tặng)',
    '1month': '1 tháng',
    '3months': '3 tháng',
    '6months': '6 tháng',
  }
  const planLabel = PLAN_LABELS[plan] ?? plan

  function fmtDate(dateStr: string | null): string {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
  }

  const emailSubject = `Thông tin đăng nhập VocabWise`
  const emailHtml = `
    <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px">
      <h2 style="color:#9333ea">📚 VocabWise</h2>
      <p>Xin chào phụ huynh,</p>
      <p>Dưới đây là thông tin tài khoản <strong>VocabWise</strong>:</p>
      <table style="border-collapse:collapse;width:100%">
        <tr><td style="padding:8px 0;color:#666">Tên đăng nhập:</td><td style="padding:8px 0;font-weight:bold">${savedUsername}</td></tr>
        ${notifPassword ? `<tr><td style="padding:8px 0;color:#666">Mật khẩu:</td><td style="padding:8px 0;font-weight:bold">${notifPassword}</td></tr>` : ''}
        <tr><td style="padding:8px 0;color:#666">Gói:</td><td style="padding:8px 0;font-weight:bold">${planLabel}</td></tr>
        ${planEndDate ? `<tr><td style="padding:8px 0;color:#666">Hết hạn:</td><td style="padding:8px 0;font-weight:bold">${fmtDate(planEndDate)}</td></tr>` : ''}
      </table>
      <p style="margin-top:24px">Truy cập tại: <a href="https://vocabwise.id.vn">VocabWise</a></p>
    </div>`

  const messageText =
    `📚 Tài khoản VocabWise của bạn:\n` +
    `• Tên đăng nhập: ${savedUsername}\n` +
    (notifPassword ? `• Mật khẩu: ${notifPassword}\n` : '') +
    `• Gói: ${planLabel}\n` +
    (planEndDate ? `• Hết hạn: ${fmtDate(planEndDate)}\n` : '') +
    `\n🔤 Học phát âm Phonics chuẩn IPA quốc tế\n` +
    `📖 Từ vựng hàng ngày VocabWise Daily Pre-A1→C2\n` +
    `🎓 Từ vựng học thuật VocabWise Academic IELTS/SAT\n` +
    `🇻🇳🇬🇧 Song ngữ Việt–Anh · 🎤 Phát âm cùng AI\n` +
    `✨ Dùng thử miễn phí!\n` +
    `\n🌐 Truy cập: https://vocabwise.id.vn`

  async function save(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMsg('')
    const body: Record<string, unknown> = { username: savedUsername, plan, email, disabled }
    if (PLAN_DURATIONS[plan]) {
      body.plan_start_date = planStartDate
      body.plan_end_date = planEndDate
    } else {
      body.plan_start_date = null
      body.plan_end_date = null
    }
    body.max_kids = maxKids === '' ? null : parseInt(maxKids)
    body.admin_note = adminNote || null
    body.bonus_features = bonusFeatures.length > 0 ? bonusFeatures : null
    if (newPassword) body.password = newPassword
    const res = await fetch(`/api/superadmin/families/${family.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setSaving(false)
    if (res.ok) {
      const updated = await res.json()
      if (newPassword) setNotifPassword(newPassword)
      setNewPassword('')
      setMsg('✅ Đã lưu thành công!')
      onSaved(updated)
    } else {
      if (res.status === 401) { window.location.reload(); return }
      const d = await res.json()
      setMsg(`❌ ${d.error}`)
    }
  }

  async function sendEmail() {
    if (!email) return
    setSending(true)
    const res = await fetch('/api/superadmin/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: email, subject: emailSubject, html: emailHtml }),
    })
    setSending(false)
    if (res.ok) { setMsg('✅ Đã gửi email!'); setShowNotif(false) }
    else { const d = await res.json(); setMsg(`❌ ${d.error}`) }
  }

  async function copyMessage() {
    await navigator.clipboard.writeText(messageText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleDelete() {
    setDeleting(true)
    const res = await fetch(`/api/superadmin/families/${family.id}`, { method: 'DELETE' })
    setDeleting(false)
    if (res.ok) { onDeleted(family.id); onClose() }
    else { const d = await res.json(); setMsg(`❌ ${d.error}`) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl border-2 border-gray-100 shadow-sm p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-lg">✏️ {family.username}</h2>
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end gap-0.5">
              <button type="button" onClick={() => setDisabled(!disabled)}
                className={`relative flex-shrink-0 w-12 h-6 rounded-full transition-colors ${disabled ? 'bg-red-400' : 'bg-green-500'}`}>
                <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-200 ${disabled ? 'translate-x-0' : 'translate-x-6'}`} />
              </button>
              <span className="text-xs text-slate-500 whitespace-nowrap">
                {disabled ? '🔒 Đang khóa' : '✅ Hoạt động'}
              </span>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-xl leading-none">×</button>
          </div>
        </div>

        {/* Read-only info */}
        {(family.name || family.phone || family.referral_source) && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 mb-4 space-y-1 text-xs text-slate-600">
            {family.name && <div>👤 {family.name}</div>}
            {family.phone && <div>📞 {family.phone}</div>}
            {family.referral_source && <div>📣 Biết qua: {family.referral_source}</div>}
          </div>
        )}

        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Tên đăng nhập</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} required
              className="w-full bg-white border-2 border-slate-200 rounded-2xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              className="w-full bg-white border-2 border-slate-200 rounded-2xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Gói</label>
            <select value={plan} onChange={(e) => {
              const newPlan = e.target.value
              setPlan(newPlan)
              if (PLAN_DURATIONS[newPlan]) setPlanStartDate(today())
            }}
              className="w-full bg-white border-2 border-slate-200 rounded-2xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {PLAN_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {plan === 'free' ? (
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Hết dùng thử (free_trial_expires_at)</label>
              <input type="date" value={family.free_trial_expires_at?.split('T')[0] ?? ''} readOnly
                className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-3 py-2 text-sm text-slate-600 cursor-not-allowed" />
            </div>
          ) : PLAN_DURATIONS[plan] ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Ngày bắt đầu</label>
                <input type="date" value={planStartDate} onChange={e => setPlanStartDate(e.target.value)}
                  className="w-full bg-white border-2 border-slate-200 rounded-2xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Ngày hết hạn (tự động)</label>
                <input type="date" value={planEndDate ?? ''} readOnly
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-3 py-2 text-sm text-slate-600 cursor-not-allowed" />
              </div>
            </div>
          ) : null}

          <div>
            <label className="text-xs text-slate-500 mb-1 block">Giới hạn hồ sơ bé <span className="text-slate-400">(trống = theo mặc định gói)</span></label>
            <input type="number" min={1} max={20} value={maxKids} onChange={e => setMaxKids(e.target.value)}
              placeholder={plan === 'free' ? 'Mặc định: 1' : 'Mặc định: 3'}
              className="w-full bg-white border-2 border-slate-200 rounded-2xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          <div>
            <label className="text-xs text-slate-500 mb-1 block">Ghi chú admin <span className="text-slate-400">(không hiển thị cho user)</span></label>
            <textarea value={adminNote} onChange={e => setAdminNote(e.target.value)}
              placeholder="VIP, test account, ghi chú nội bộ..."
              rows={2}
              className="w-full bg-white border-2 border-slate-200 rounded-2xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
          </div>

          {/* Feature Grants */}
          <div className="border-2 border-dashed border-indigo-200 rounded-2xl p-3 bg-indigo-50/30">
            <div className="flex items-center justify-between mb-2.5">
              <div>
                <p className="text-sm font-black text-indigo-700">🎁 Feature Grants</p>
                <p className="text-xs text-slate-400 mt-0.5">Mở thêm tính năng ngoài gói — chỉ áp dụng cho user này</p>
              </div>
              {bonusFeatures.filter(f => !getPlanIncludes(plan).includes(f as BonusFeatureKey)).length > 0 && (
                <button type="button" onClick={() => setBonusFeatures([])}
                  className="text-xs text-red-400 hover:text-red-600 font-bold px-2 py-0.5 rounded-full hover:bg-red-50 transition-colors">
                  Xóa grants
                </button>
              )}
            </div>
            {getPlanIncludes(plan).length === BONUS_FEATURES.length ? (
              <p className="text-xs text-green-600 font-semibold bg-green-50 rounded-xl px-3 py-2">
                ✅ Gói {plan === '3months' ? 'Pro 3T' : plan === '6months' ? 'Pro 6T' : plan} đã bao gồm tất cả tính năng — không cần grant thêm.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {BONUS_FEATURES.map(feat => {
                  const inPlan = getPlanIncludes(plan).includes(feat.key as BonusFeatureKey)
                  const granted = bonusFeatures.includes(feat.key)
                  return (
                    <button
                      type="button"
                      key={feat.key}
                      onClick={() => {
                        if (inPlan) return
                        setBonusFeatures(prev =>
                          prev.includes(feat.key) ? prev.filter(f => f !== feat.key) : [...prev, feat.key]
                        )
                      }}
                      title={feat.desc}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all select-none ${
                        inPlan
                          ? 'bg-green-100 text-green-600 cursor-default opacity-70'
                          : granted
                            ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-300'
                            : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-400 hover:text-indigo-600 cursor-pointer active:scale-95'
                      }`}
                    >
                      <span>{feat.icon}</span>
                      <span>{feat.label}</span>
                      {inPlan   && <span className="text-[10px] opacity-60">gói</span>}
                      {!inPlan && granted   && <span className="text-[10px]">✓</span>}
                      {!inPlan && !granted  && <span className="text-[10px] opacity-40">＋</span>}
                    </button>
                  )
                })}
              </div>
            )}
            {bonusFeatures.filter(f => !getPlanIncludes(plan).includes(f as BonusFeatureKey)).length > 0 && (
              <p className="text-xs text-indigo-600 font-semibold mt-2 bg-indigo-50 rounded-lg px-2 py-1">
                🎁 {bonusFeatures.filter(f => !getPlanIncludes(plan).includes(f as BonusFeatureKey)).length} grant đang hoạt động · lưu để áp dụng
              </p>
            )}
          </div>

          <div>
            <label className="text-xs text-slate-500 mb-1 block">Mật khẩu mới (để trống = giữ nguyên)</label>
            <PasswordInput value={newPassword} onChange={setNewPassword}
              placeholder="Mật khẩu mới"
              className="w-full bg-white border-2 border-slate-200 rounded-2xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          {msg && (
            <p className={`text-sm font-medium px-3 py-2 rounded-lg ${msg.startsWith('✅') ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'}`}>
              {msg}
            </p>
          )}
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={saving}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold rounded-xl py-2.5">
              {saving ? 'Đang lưu...' : 'Lưu'}
            </button>
            <button type="button" onClick={onClose}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl py-2.5">
              Hủy
            </button>
          </div>
        </form>

        {/* Notification panel */}
        <div className="mt-4 border-t border-slate-200 pt-4">
          <button type="button" onClick={() => { setShowNotif(!showNotif); setNotifMode(null) }}
            className="w-full flex items-center justify-between text-sm text-slate-600 hover:text-slate-900 py-1">
            <span>📨 Gửi thông báo cho phụ huynh</span>
            <span>{showNotif ? '▲' : '▼'}</span>
          </button>

          {showNotif && (
            <div className="mt-3 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setNotifMode('email')}
                  className={`py-2 rounded-xl text-sm font-medium transition-colors ${notifMode === 'email' ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-indigo-50'}`}>
                  📧 Email
                </button>
                <button type="button" onClick={() => setNotifMode('message')}
                  className={`py-2 rounded-xl text-sm font-medium transition-colors ${notifMode === 'message' ? 'bg-green-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-indigo-50'}`}>
                  💬 Tin nhắn
                </button>
              </div>

              {notifMode === 'email' && (
                <div className="space-y-2">
                  {!email && (
                    <p className="text-xs text-yellow-400">⚠️ Tài khoản này chưa có email.</p>
                  )}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-600 leading-relaxed">
                    <div className="text-slate-400 mb-1">Gửi đến: <span className="text-white">{email || '—'}</span></div>
                    <div className="border-t border-slate-200 pt-2 space-y-1">
                      <div>Tên đăng nhập: <strong>{savedUsername}</strong></div>
                      {notifPassword && <div>Mật khẩu: <strong>{notifPassword}</strong></div>}
                      <div>Gói: <strong>{plan}</strong></div>
                      {planEndDate && <div>Hết hạn: <strong>{planEndDate}</strong></div>}
                    </div>
                  </div>
                  <button type="button" onClick={sendEmail} disabled={!email || sending}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl py-2.5">
                    {sending ? 'Đang gửi...' : '📧 Gửi email'}
                  </button>
                </div>
              )}

              {notifMode === 'message' && (
                <div className="space-y-2">
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-sm text-slate-600 leading-relaxed whitespace-pre-wrap font-mono">
                    {messageText}
                  </div>
                  <button type="button" onClick={copyMessage}
                    className={`w-full text-sm font-semibold rounded-xl py-2.5 transition-colors ${copied ? 'bg-green-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}>
                    {copied ? '✅ Đã copy!' : '📋 Copy tin nhắn'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Children view */}
        <div className="mt-4 border-t border-slate-200 pt-4">
          <button type="button"
            onClick={async () => {
              setShowChildren(s => !s)
              if (!showChildren && childrenData.length === 0) {
                setChildrenLoading(true)
                const res = await fetch(`/api/superadmin/families/${family.id}/children`)
                if (res.ok) setChildrenData(await res.json())
                setChildrenLoading(false)
              }
            }}
            className="w-full flex items-center justify-between text-sm text-slate-600 hover:text-slate-900 py-1">
            <span>👶 Hồ sơ bé ({childrenLoading || (!showChildren && childrenData.length === 0) ? (family.children_count ?? '?') : childrenData.length} hồ sơ{family.max_kids != null ? ` · giới hạn ${family.max_kids}` : ''})</span>
            <span>{showChildren ? '▲' : '▼'}</span>
          </button>
          {showChildren && (
            <div className="mt-3">
              {childrenLoading ? (
                <p className="text-slate-500 text-sm text-center py-2">Đang tải...</p>
              ) : childrenData.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-2">Chưa có hồ sơ bé nào.</p>
              ) : (
                <div className="space-y-2">
                  {childrenData.map(c => (
                    <div key={c.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2">
                      {/* Row 1: avatar + name + meta */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={getAvatarSrc(c.emoji)} alt={c.name} className="w-10 h-10 rounded-full object-cover bg-slate-100 flex-shrink-0" />
                          <div>
                            <p className="font-bold text-sm text-slate-800">{c.name}</p>
                            <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                              <span className="text-[11px] font-semibold text-slate-400 capitalize">{c.level}</span>
                              {c.total_xp > 0 && (
                                <span className="text-[11px] font-black text-yellow-600">⭐ {c.total_xp.toLocaleString()} XP</span>
                              )}
                              {c.badge_icon && c.badge_label && (
                                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${c.badge_cls ?? ''}`}>
                                  {c.badge_icon} {c.badge_label}
                                </span>
                              )}
                              {c.streak_current > 0 && (() => {
                                const todayStr = new Date().toISOString().split('T')[0]
                                const yesterStr = new Date(Date.now() - 86400000).toISOString().split('T')[0]
                                const la = c.streak_last_active
                                const icon = la === todayStr ? '🔥' : la === yesterStr ? '⚡' : '💤'
                                return (
                                  <span className="text-[11px] font-bold text-orange-500">{icon} {c.streak_current}d</span>
                                )
                              })()}
                            </div>
                          </div>
                        </div>
                        <span className="text-[11px] text-slate-400 flex-shrink-0">
                          {c.last_active ? new Date(c.last_active).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) : 'Chưa học'}
                        </span>
                      </div>

                      {/* Row 2: progress stats */}
                      {(c.total_xp > 0 || c.phonics_seen > 0 || c.daily_words > 0 || c.academic_completed > 0) && (
                        <div className="bg-white rounded-xl px-3 py-2 space-y-1.5">
                          {/* Phonics */}
                          <div className="flex items-center gap-2 text-[11px]">
                            <span className="text-slate-500 w-14 flex-shrink-0">🔤 Phonics</span>
                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-teal-400 rounded-full" style={{ width: `${c.phonics_total > 0 ? Math.round(c.phonics_seen / c.phonics_total * 100) : 0}%` }} />
                            </div>
                            <span className="text-slate-400 w-20 text-right flex-shrink-0">
                              {c.phonics_seen}/{c.phonics_total} bài
                              {c.phonics_mastered > 0 && ` · ✓${c.phonics_mastered}`}
                            </span>
                          </div>
                          {/* Daily vocab */}
                          <div className="flex items-center gap-2 text-[11px]">
                            <span className="text-slate-500 w-14 flex-shrink-0">📚 Daily</span>
                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-purple-400 rounded-full" style={{ width: `${c.daily_words_total > 0 ? Math.round(c.daily_words / c.daily_words_total * 100) : 0}%` }} />
                            </div>
                            <span className="text-slate-400 w-20 text-right flex-shrink-0">
                              {c.daily_words.toLocaleString()} từ · {c.daily_topics} CĐ
                            </span>
                          </div>
                          {/* Academic */}
                          {c.academic_completed > 0 && (
                            <div className="flex items-center gap-2 text-[11px]">
                              <span className="text-slate-500 w-14 flex-shrink-0">🎓 Academic</span>
                              <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${c.academic_total > 0 ? Math.round(c.academic_completed / c.academic_total * 100) : 0}%` }} />
                              </div>
                              <span className="text-slate-400 w-20 text-right flex-shrink-0">
                                {c.academic_completed}/{c.academic_total} CĐ
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Email log */}
        <div className="mt-4 border-t border-slate-200 pt-4">
          <button type="button"
            onClick={async () => {
              setShowEmailLog(s => !s)
              if (!showEmailLog && emailLogData.length === 0) {
                setEmailLogLoading(true)
                const res = await fetch(`/api/superadmin/families/${family.id}/email-log`)
                if (res.ok) setEmailLogData(await res.json())
                setEmailLogLoading(false)
              }
            }}
            className="w-full flex items-center justify-between text-sm text-slate-600 hover:text-slate-900 py-1">
            <span>📧 Emails tự động đã gửi {showEmailLog && emailLogData.length > 0 ? `(${emailLogData.length})` : ''}</span>
            <span>{showEmailLog ? '▲' : '▼'}</span>
          </button>
          {showEmailLog && (
            <div className="mt-3">
              {emailLogLoading ? (
                <p className="text-slate-500 text-sm text-center py-2">Đang tải...</p>
              ) : emailLogData.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-2">Chưa có email tự động nào được gửi.</p>
              ) : (
                <div className="space-y-1">
                  {emailLogData.map(log => {
                    const info = getEmailTypeInfo(log.email_type)
                    const dt = new Date(log.sent_at)
                    const dateStr = dt.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
                    const timeStr = dt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                    return (
                      <div key={log.id} className="flex items-start gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                        <span className="text-base flex-shrink-0 mt-0.5">{info.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-700 truncate">{info.subject}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5 font-mono">{log.email_type}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-[10px] font-semibold text-slate-500">{dateStr}</p>
                          <p className="text-[10px] text-slate-400">{timeStr}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Danger zone */}
        <div className="mt-4 border-t border-red-900/40 pt-4">
          {!deleteConfirm ? (
            <button type="button" onClick={() => setDeleteConfirm(true)}
              className="w-full text-sm text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-xl py-2 transition-colors">
              🗑️ Xóa tài khoản này
            </button>
          ) : (
            <div className="bg-red-900/30 rounded-xl p-3 space-y-2">
              <p className="text-sm text-red-300 font-medium">Xóa vĩnh viễn <strong>{family.username}</strong> và toàn bộ dữ liệu bé?</p>
              <div className="flex gap-2">
                <button type="button" onClick={handleDelete} disabled={deleting}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-semibold rounded-lg py-2">
                  {deleting ? 'Đang xóa...' : 'Xác nhận xóa'}
                </button>
                <button type="button" onClick={() => setDeleteConfirm(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm rounded-lg py-2">
                  Hủy
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function GlobalConfigPanel() {
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

function TotpPanel() {
  const [status, setStatus] = useState<'loading' | 'enabled' | 'disabled'>('loading')
  const [secret, setSecret] = useState('')
  const [uri, setUri] = useState('')
  const [code, setCode] = useState('')
  const [msg, setMsg] = useState('')
  const [saving, setSaving] = useState(false)
  const [showSecret, setShowSecret] = useState(false)
  type QRCType = React.ComponentType<{ value: string; size?: number; bgColor?: string; fgColor?: string; level?: string }>
  const [qrBundle, setQrBundle] = useState<{ C: QRCType } | null>(null)

  useEffect(() => {
    import('qrcode.react').then(m => setQrBundle({ C: m.QRCodeSVG as QRCType }))
  }, [])

  async function load() {
    const res = await fetch('/api/superadmin/totp')
    const d = await res.json()
    if (d.enabled) { setStatus('enabled') }
    else { setStatus('disabled'); setSecret(d.secret ?? ''); setUri(d.uri ?? '') }
  }

  useEffect(() => { load() }, [])

  async function enable() {
    setSaving(true); setMsg('')
    const res = await fetch('/api/superadmin/totp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })
    const d = await res.json()
    setSaving(false)
    if (res.ok) { setStatus('enabled'); setMsg('✅ 2FA đã bật!'); setCode('') }
    else setMsg('❌ ' + (d.error || 'Lỗi'))
  }

  async function disable() {
    if (!confirm('Tắt 2FA cho tài khoản superadmin?')) return
    await fetch('/api/superadmin/totp', { method: 'DELETE' })
    setMsg('✅ 2FA đã tắt.')
    load()
  }

  return (
    <div className="bg-white rounded-3xl border-2 border-gray-100 shadow-sm p-5 mb-6">
      <h2 className="font-semibold text-red-600 mb-3">🔐 Xác thực 2 bước (2FA) — Superadmin</h2>
      {status === 'loading' && <p className="text-sm text-slate-400">Đang tải...</p>}
      {status === 'enabled' && (
        <div>
          <p className="text-sm text-green-600 font-semibold mb-3">✅ 2FA đang bật — đăng nhập admin yêu cầu mã xác thực.</p>
          <button onClick={disable} className="text-sm bg-red-50 hover:bg-red-100 text-red-600 font-semibold px-4 py-2 rounded-xl">Tắt 2FA</button>
          {msg && <span className="text-sm ml-3">{msg}</span>}
        </div>
      )}
      {status === 'disabled' && uri && (
        <div className="space-y-4">
          {/* Step-by-step guide */}
          <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-xs text-amber-800 space-y-1 leading-relaxed">
            <p className="font-bold text-amber-900">📱 Hướng dẫn quét mã (iPhone / Android):</p>
            <p>1. Mở app <strong>Google Authenticator</strong> hoặc <strong>Authy</strong> (không dùng camera thường)</p>
            <p>2. Nhấn <strong>+</strong> → chọn <strong>Quét mã QR</strong></p>
            <p>3. Hướng camera vào mã QR bên dưới</p>
            <p>4. App tự thêm tài khoản → nhập mã 6 số vào ô xác nhận</p>
          </div>

          {/* QR Code */}
          <div className="flex justify-center">
            <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 inline-block">
              {qrBundle
                ? <qrBundle.C value={uri} size={192} bgColor="#ffffff" fgColor="#111827" level="M" />
                : <div className="w-[192px] h-[192px] bg-slate-100 rounded-xl animate-pulse" />
              }
            </div>
          </div>

          {/* Manual entry fallback */}
          <details className="group">
            <summary className="text-xs text-slate-400 cursor-pointer select-none hover:text-slate-600 list-none flex items-center gap-1">
              <span className="group-open:rotate-90 transition-transform inline-block">▶</span>
              Không quét được? Nhập thủ công vào app
            </summary>
            <div className="mt-2 bg-slate-50 rounded-xl p-3 space-y-2">
              <p className="text-xs text-slate-400 font-semibold">Secret key:</p>
              <div className="flex items-center gap-2">
                <code className="text-sm font-mono text-slate-700 tracking-widest select-all flex-1">
                  {showSecret ? secret : '•'.repeat(secret.length || 20)}
                </code>
                <button onClick={() => setShowSecret(v => !v)}
                  className="text-xs text-slate-400 hover:text-slate-600 font-semibold flex-shrink-0">
                  {showSecret ? 'Ẩn' : 'Hiện'}
                </button>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Trong app → Thêm tài khoản → Nhập thủ công → Tài khoản: <em>superadmin</em> → Khóa: dán secret key trên.
              </p>
            </div>
          </details>

          {/* Verify code */}
          <div>
            <label className="text-xs text-slate-500 mb-1 block font-semibold">Nhập mã 6 số từ ứng dụng để xác nhận:</label>
            <div className="flex gap-2">
              <input
                type="text" inputMode="numeric" maxLength={6} value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-32 bg-white border-2 border-slate-200 rounded-xl px-3 py-2 text-sm font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-red-400"
              />
              <button onClick={enable} disabled={saving || code.length !== 6}
                className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-xl">
                {saving ? 'Đang lưu...' : 'Bật 2FA'}
              </button>
            </div>
          </div>
          {msg && <p className="text-sm">{msg}</p>}
        </div>
      )}
    </div>
  )
}

function LoginPanel({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await fetch('/api/superadmin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    setLoading(false)
    if (res.ok) { onLogin() } else {
      const d = await res.json()
      setError(d.error || 'Sai mật khẩu')
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F6FF] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl border-2 border-gray-100 p-8 w-full max-w-sm">
        <div className="text-center mb-7">
          <div className="text-5xl mb-3">🔐</div>
          <h1 className="text-2xl font-black text-slate-900">Super Admin</h1>
          <p className="text-slate-500 text-sm mt-1 font-semibold">VocabWise</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <PasswordInput value={password} onChange={setPassword}
            placeholder="Mật khẩu admin"
            className="w-full border-2 border-slate-200 rounded-2xl px-4 py-3 text-slate-900 focus:outline-none focus:border-indigo-400 font-semibold" />
          {error && <p className="text-red-500 text-sm font-semibold">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 disabled:opacity-60 text-white font-black rounded-2xl py-3 active:scale-95 transition-all">
            {loading ? 'Đang vào...' : 'Vào Admin'}
          </button>
        </form>
      </div>
    </div>
  )
}

function ExpiryReport({ families, onRefresh }: { families: Family[], onRefresh: () => void }) {
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


// ── Finance Panel (server-side) ──────────────────────────────────────────────
type FinanceData = {
  total: number; pro_active: number; free_trial: number; expired: number
  mrr: number; conversion_rate: number; total_revenue: number
  mrr_breakdown: { plan: string; count: number; revenue: number }[]
  total_revenue_breakdown: { plan: string; count: number; revenue: number }[]
}

const PLAN_LABELS_FIN: Record<string, string> = {
  '1month': '1 tháng (×59k)',
  '3months': '3 tháng (×53k/tháng)',
  '6months': '6 tháng (×49.8k/tháng)',
}

function FinancePanel({ refreshKey, onCardClick }: {
  refreshKey: number
  onCardClick?: (plan: string, status: string) => void
}) {
  const [data, setData] = useState<FinanceData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch('/api/superadmin/finance')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [refreshKey])

  function fmtVnd(n: number) {
    if (n >= 1000000) return `${(n / 1000000).toFixed(2)}tr đ`
    return `${n.toLocaleString('vi-VN')}đ`
  }

  if (loading) return <div className="text-center py-12 text-slate-500">Đang tải...</div>
  if (!data) return <div className="text-center py-12 text-red-400">Lỗi tải Finance</div>

  const cards = [
    { label: 'Tổng tài khoản',     value: data.total,      color: 'text-indigo-700', bg: 'bg-indigo-50',     plan: 'all',  status: 'all' },
    { label: 'Pro đang hoạt động', value: data.pro_active, color: 'text-green-700',  bg: 'bg-green-50 border-2 border-green-200', plan: 'pro',  status: 'active' },
    { label: 'Free / Trial',       value: data.free_trial, color: 'text-blue-700',   bg: 'bg-blue-50 border-2 border-blue-200',  plan: 'free', status: 'all' },
    { label: 'Pro hết hạn',        value: data.expired,    color: 'text-red-600',    bg: 'bg-red-50 border-2 border-red-200',   plan: 'pro',  status: 'expired' },
  ]

  return (
    <div className="space-y-4 mb-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3">
        {cards.map(c => (
          <button key={c.label} onClick={() => onCardClick?.(c.plan, c.status)}
            className={`${c.bg} rounded-2xl p-4 text-left w-full ${onCardClick ? 'hover:opacity-80 active:scale-95 transition-all cursor-pointer' : 'cursor-default'}`}>
            <p className="text-slate-500 text-xs font-semibold mb-1">{c.label}</p>
            <p className={`text-3xl font-black ${c.color}`}>{c.value}</p>
            {onCardClick && <p className="text-slate-400 text-[10px] mt-1">Xem danh sách →</p>}
          </button>
        ))}
      </div>

      {/* MRR */}
      <div className="bg-white rounded-3xl border-2 border-gray-100 shadow-sm p-5">
        <h3 className="font-semibold text-indigo-600 mb-3">💰 Doanh thu ước tính (MRR)</h3>
        <div className="space-y-2 mb-4">
          {data.mrr_breakdown.map(row => (
            <div key={row.plan} className="flex items-center justify-between text-sm">
              <span className="text-slate-500">{PLAN_LABELS_FIN[row.plan] ?? row.plan} — <span className="text-slate-900 font-bold">{row.count}</span> TK</span>
              <span className="text-indigo-500 font-bold">{fmtVnd(row.revenue)}</span>
            </div>
          ))}
          <div className="border-t border-slate-300 pt-2 flex items-center justify-between">
            <span className="text-slate-900 font-black">Tổng MRR</span>
            <span className="text-green-400 font-black text-lg">{fmtVnd(data.mrr)}</span>
          </div>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex items-center justify-between">
          <span className="text-sm text-slate-600">Tỉ lệ chuyển đổi (Pro / verified)</span>
          <span className="text-yellow-300 font-black text-lg">{data.conversion_rate}%</span>
        </div>
      </div>

      {/* Cumulative revenue */}
      <div className="bg-white rounded-3xl border-2 border-gray-100 shadow-sm p-5">
        <h3 className="font-semibold text-amber-400 mb-3">🏦 Doanh thu tích lũy (all-time)</h3>
        <div className="space-y-2 mb-3">
          {data.total_revenue_breakdown.map(row => (
            <div key={row.plan} className="flex items-center justify-between text-sm">
              <span className="text-slate-500">{PLAN_LABELS_FIN[row.plan] ?? row.plan} — <span className="text-slate-900 font-bold">{row.count}</span> TK</span>
              <span className="text-amber-300 font-bold">{fmtVnd(row.revenue)}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-slate-300 pt-3 flex items-center justify-between">
          <span className="text-slate-900 font-black">Tổng cộng</span>
          <span className="text-amber-400 font-black text-xl">{fmtVnd(data.total_revenue)}</span>
        </div>
        <p className="text-slate-400 text-[10px] mt-2">* Ước tính — dựa trên gói hiện tại của mỗi TK (kể cả đã hết hạn)</p>
      </div>
    </div>
  )
}

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

function AuditLogPanel() {
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

// ── Referral Stats Panel ─────────────────────────────────────────────────────
type ReferralStats = {
  total: number
  by_status: Record<string, number>
  total_bonus_days_given: number
  top_referrers: { username: string; count: number }[]
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Chưa học',
  signup_triggered: 'Đang xử lý',
  signup_rewarded: 'Đã nhận thưởng ĐK',
  paid_rewarded: 'Đã nhận thưởng Pro',
}

type AnalyticsData = {
  total: number; total_active: number; active_free: number; active_pro: number
  expired: number; new_this_month: number; conversion_rate_pct: number
  activation_rate_pct: number; active_this_week: number
  by_plan: Record<string, number>
}

function AnalyticsPanel({ refreshKey }: { refreshKey: number }) {
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

// ── Trends Panel (charts) ────────────────────────────────────────────────────
type TrendPoint = { label: string; signups: number; mrr: number; pro_count: number; churn: number }

const CHART_TOOLTIP_STYLE = {
  contentStyle: { background: '#1f2937', border: '1px solid #374151', borderRadius: 8, fontSize: 12 },
  labelStyle: { color: '#e5e7eb' },
}

function TrendsPanel({ mode = 'analytics' }: { mode?: 'analytics' | 'finance' }) {
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

function ReferralStatsPanel({ refreshKey }: { refreshKey: number }) {
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch('/api/superadmin/referrals')
      .then(r => r.json())
      .then(d => { setStats(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [refreshKey])

  if (loading) return <div className="text-slate-500 text-center py-10">Đang tải...</div>
  if (!stats) return <div className="text-red-400 text-center py-10">Lỗi tải dữ liệu</div>

  const conversion = stats.total > 0
    ? Math.round(((stats.by_status.signup_rewarded ?? 0) + (stats.by_status.paid_rewarded ?? 0)) / stats.total * 100)
    : 0

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Tổng referrals', value: stats.total, color: 'text-blue-300' },
          { label: 'Conversion rate', value: `${conversion}%`, color: 'text-green-300' },
          { label: 'Ngày Pro đã tặng', value: `+${stats.total_bonus_days_given}d`, color: 'text-indigo-500' },
          { label: 'Đã mua Pro', value: stats.by_status.paid_rewarded ?? 0, color: 'text-yellow-300' },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-3xl border-2 border-gray-100 shadow-sm p-4 text-center">
            <div className={`text-2xl font-black ${c.color}`}>{c.value}</div>
            <div className="text-xs text-slate-500 font-semibold mt-1">{c.label}</div>
          </div>
        ))}
      </div>

      {/* By status breakdown */}
      <div className="bg-white rounded-3xl border-2 border-gray-100 shadow-sm p-4">
        <h3 className="font-bold text-sm text-slate-600 mb-3">Trạng thái referrals</h3>
        <div className="space-y-2">
          {Object.entries(STATUS_LABELS).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between text-sm">
              <span className="text-slate-500">{label}</span>
              <span className="font-bold text-slate-900">{stats.by_status[key] ?? 0}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top referrers */}
      {stats.top_referrers.length > 0 && (
        <div className="bg-white rounded-3xl border-2 border-gray-100 shadow-sm p-4">
          <h3 className="font-bold text-sm text-slate-600 mb-3">🏆 Top referrers</h3>
          <div className="space-y-2">
            {stats.top_referrers.map((r, i) => (
              <div key={r.username} className="flex items-center justify-between text-sm">
                <span className="text-slate-600">
                  <span className="text-slate-400 mr-2">#{i + 1}</span>
                  {r.username}
                </span>
                <span className="font-bold text-indigo-500">{r.count} người</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Flags Panel ──────────────────────────────────────────────────────────────
type IpFlag = { id: string; ip: string; count: number; flagged_at: string; reviewed: boolean }

function FlagsPanel({ onReviewed }: { onReviewed: () => void }) {
  const [flags, setFlags] = useState<IpFlag[]>([])
  const [loading, setLoading] = useState(true)
  const [reviewing, setReviewing] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/superadmin/flags')
      .then(r => r.json())
      .then(d => { setFlags(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function markReviewed(id: string) {
    setReviewing(id)
    const res = await fetch(`/api/superadmin/flags/${id}`, { method: 'PATCH' })
    if (res.ok) {
      setFlags(prev => prev.map(f => f.id === id ? { ...f, reviewed: true } : f))
      onReviewed()
    }
    setReviewing(null)
  }

  function fmtTime(iso: string) {
    const d = new Date(iso)
    const diff = Math.floor((Date.now() - d.getTime()) / 60000)
    if (diff < 60) return `${diff} phút trước`
    if (diff < 1440) return `${Math.floor(diff / 60)}h trước`
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
  }

  if (loading) return <div className="text-slate-500 text-sm py-8 text-center">Đang tải...</div>

  const unreviewed = flags.filter(f => !f.reviewed)
  const reviewed = flags.filter(f => f.reviewed)

  return (
    <div className="space-y-4">
      {/* Unreviewed */}
      <div className="bg-white rounded-3xl border-2 border-gray-100 shadow-sm p-5">
        <h2 className="font-semibold text-lg mb-4">
          ⚠️ Chưa xem xét
          {unreviewed.length > 0 && (
            <span className="ml-2 bg-red-500 text-white text-xs font-black px-2 py-0.5 rounded-full">
              {unreviewed.length}
            </span>
          )}
        </h2>

        {unreviewed.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-4">✅ Không có cảnh báo nào</p>
        ) : (
          <div className="space-y-2">
            {unreviewed.map(f => (
              <div key={f.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-slate-900 font-mono text-sm">{f.ip}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    <span className="text-red-400 font-bold">{f.count} accounts</span> trong 24h · {fmtTime(f.flagged_at)}
                  </p>
                </div>
                <button
                  onClick={() => markReviewed(f.id)}
                  disabled={reviewing === f.id}
                  className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-xs font-black px-3 py-2 rounded-lg flex-shrink-0 transition-colors">
                  {reviewing === f.id ? '...' : '✓ Đã xem'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reviewed history */}
      {reviewed.length > 0 && (
        <div className="bg-white rounded-3xl border-2 border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-base text-slate-500 mb-3">Lịch sử đã xem xét</h2>
          <div className="space-y-2">
            {reviewed.map(f => (
              <div key={f.id} className="bg-slate-100 rounded-2xl px-4 py-3 flex items-center justify-between">
                <p className="font-mono text-sm text-slate-500">{f.ip}</p>
                <p className="text-xs text-slate-400">{f.count} acc · {fmtTime(f.flagged_at)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="bg-white rounded-3xl border-2 border-gray-100 shadow-sm p-4">
        <p className="text-xs text-slate-400 font-semibold mb-1">ℹ️ Ngưỡng cảnh báo</p>
        <p className="text-xs text-slate-500">Flag xuất hiện khi cùng 1 IP đăng ký &gt;5 tài khoản trong vòng 24 giờ. IP bị flag không bị chặn — chỉ để admin xem xét.</p>
      </div>
    </div>
  )
}

// ── Admin Panel ───────────────────────────────────────────────────────────────
function AdminPanel() {
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

export default function SuperAdminPage() {
  const [authed, setAuthed] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    fetch('/api/superadmin/me').then(r => {
      if (r.ok) setAuthed(true)
      setChecking(false)
    })
  }, [])

  if (checking) return null
  return authed ? <AdminPanel /> : <LoginPanel onLogin={() => setAuthed(true)} />
}
