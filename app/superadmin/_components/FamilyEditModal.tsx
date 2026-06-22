'use client'

import { useState, FormEvent } from 'react'
import { getAvatarSrc } from '@/lib/avatars'
import type { Family } from '../_types'
import { BONUS_FEATURES, BonusFeatureKey, getPlanIncludes, PLAN_OPTIONS, PLAN_DURATIONS } from '../_lib/constants'
import { addDays, today } from '../_lib/helpers'
import { PasswordInput } from './PasswordInput'

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

export function FamilyEditModal({ family, onClose, onSaved, onDeleted }: {
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
