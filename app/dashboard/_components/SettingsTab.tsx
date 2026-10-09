'use client'

import { useState, FormEvent } from 'react'
import UpgradeModal from '@/components/UpgradeModal'
import Image from 'next/image'
import { getAvatarSrc } from '@/lib/avatars'
import type { Child, Session } from '../_types'
import {
  LEVEL_INFO_MAP, THEME_COLORS, DEFAULT_COLOR, getPlanBadge, fmtDateTime,
} from '../_utils'
import { PwInput, CollapsibleCard } from './shared'
import { ReportSettingsContent } from './settings/ReportSettings'
import { PushNotificationContent } from './settings/PushNotifications'
import { FontSizeSettings } from './settings/FontSizeSettings'
import { GiftTokenCard } from './settings/GiftTokenCard'

function UpgradeModalButton({ username, expired }: { username: string; expired: boolean }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`mt-4 w-full font-bold py-3 rounded-2xl text-sm active:scale-95 transition-all ${expired ? 'bg-gradient-to-r from-red-500 to-orange-400 text-white' : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'}`}
      >
        {expired ? '⚠️ Gia hạn ngay' : '⭐ Nâng cấp Pro'}
      </button>
      {open && <UpgradeModal onClose={() => setOpen(false)} username={username} />}
    </>
  )
}

// ── Settings tab ──────────────────────────────────────────────────────────────
export function SettingsTab({ kids, session, onChildrenRefresh }: { kids: Child[]; session: Session; onChildrenRefresh: () => void }) {
  const [cur, setCur] = useState(''); const [nw, setNw] = useState(''); const [cnf, setCnf] = useState('')
  const [pwMsg, setPwMsg] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [resetMsg, setResetMsg] = useState<Record<string, string>>({})
  const [resetConfirm, setResetConfirm] = useState<string | null>(null)
  const [pinInputs, setPinInputs] = useState<Record<string, string>>({})
  const [pinMsg, setPinMsg] = useState<Record<string, string>>({})
  const [pinSaving, setPinSaving] = useState<Record<string, boolean>>({})
  const [showPin, setShowPin] = useState<Record<string, boolean>>({})
  const [selectedPinChildId, setSelectedPinChildId] = useState<string>(() => kids[0]?.id ?? '')

  async function setPin(childId: string, pin: string | null) {
    setPinSaving(p => ({ ...p, [childId]: true }))
    const res = await fetch(`/api/children/${childId}/pin`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    })
    setPinSaving(p => ({ ...p, [childId]: false }))
    if (res.ok) {
      setPinMsg(p => ({ ...p, [childId]: pin ? '✅ Đã đặt PIN' : '✅ Đã xóa PIN' }))
      setPinInputs(p => ({ ...p, [childId]: '' }))
      onChildrenRefresh()
      setTimeout(() => setPinMsg(p => { const n = { ...p }; delete n[childId]; return n }), 2500)
    } else {
      const d = await res.json()
      setPinMsg(p => ({ ...p, [childId]: `❌ ${d.error}` }))
    }
  }

  async function changePassword(e: FormEvent) {
    e.preventDefault()
    setPwMsg('')
    if (nw !== cnf) { setPwMsg('❌ Mật khẩu xác nhận không khớp'); return }
    if (nw.length < 6) { setPwMsg('❌ Mật khẩu mới tối thiểu 6 ký tự'); return }
    setPwSaving(true)
    const res = await fetch('/api/family/password', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: cur, newPassword: nw }),
    })
    setPwSaving(false)
    if (res.ok) { setPwMsg('✅ Đổi mật khẩu thành công!'); setCur(''); setNw(''); setCnf('') }
    else { const d = await res.json(); setPwMsg(`❌ ${d.error}`) }
  }

  async function resetChild(childId: string) {
    if (resetConfirm !== childId) { setResetConfirm(childId); return }
    setResetConfirm(null)
    const res = await fetch(`/api/sync/${childId}/reset`, { method: 'POST' })
    const msg = res.ok ? '✅ Đã reset' : '❌ Lỗi'
    setResetMsg(prev => ({ ...prev, [childId]: msg }))
    setTimeout(() => setResetMsg(prev => { const n = { ...prev }; delete n[childId]; return n }), 3000)
  }

  const isBonusProActive = !!session.bonus_pro_expires_at && new Date(session.bonus_pro_expires_at) > new Date()
  const isPaidPlanActive = session.plan !== 'free' && !!session.plan_end_date && new Date(session.plan_end_date) > new Date()
  const isPro = isPaidPlanActive || isBonusProActive
  const badge = isPro && !isPaidPlanActive
    ? { label: '🎁 PRO Bonus', cls: 'bg-gradient-to-r from-purple-400 to-pink-400 text-white' }
    : getPlanBadge(session.plan, session.plan_end_date)
  const expiryDate = isPaidPlanActive ? session.plan_end_date : isBonusProActive ? session.bonus_pro_expires_at : session.free_trial_expires_at
  const expiryLabel = isPaidPlanActive ? 'Ngày hết hạn' : isBonusProActive ? '🎁 Pro referral hết hạn' : 'Ngày hết dùng thử'
  const daysLeft = expiryDate ? Math.ceil((new Date(expiryDate).getTime() - Date.now()) / 86400000) : null
  // daysLeft <= 0: Math.ceil of any negative = 0 at first moment past expiry → must use <= 0
  const isExpired = daysLeft !== null && daysLeft <= 0
  const isWarning = daysLeft !== null && daysLeft > 0 && daysLeft <= 3
  // Free trial start = expiry - 7 days (trial is always 7 days)
  const freeTrialStart = !isPro && session.free_trial_expires_at
    ? new Date(new Date(session.free_trial_expires_at).getTime() - 7 * 24 * 60 * 60 * 1000)
    : null

  return (
    <div className="space-y-5">
      {/* Plan info */}
      <CollapsibleCard title="📦 Thông tin tài khoản" warn={isWarning || isExpired}>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-500">Loại tài khoản</span>
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${badge.cls.includes('white') ? 'bg-purple-100 text-purple-700' : badge.cls}`}>
              {badge.label}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-500">Tên đăng nhập</span>
            <span className="text-sm font-bold text-gray-700">{session.username}</span>
          </div>
          {isPaidPlanActive && session.plan_start_date && (
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold text-gray-500">Ngày bắt đầu</span>
              <span className="text-sm font-bold text-gray-700">{fmtDateTime(session.plan_start_date)}</span>
            </div>
          )}
          {freeTrialStart && (
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold text-gray-500">Ngày bắt đầu dùng thử</span>
              <span className="text-sm font-bold text-gray-700">{fmtDateTime(freeTrialStart)}</span>
            </div>
          )}
          {expiryDate && (
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold text-gray-500">{expiryLabel}</span>
              <span className={`text-sm font-bold ${isExpired ? 'text-red-500' : isWarning ? 'text-orange-500' : 'text-gray-700'}`}>
                {fmtDateTime(expiryDate)}
                {daysLeft !== null && daysLeft > 0 && ` · còn ${daysLeft} ngày`}
                {isExpired && ' ⚠️ Hết hạn'}
              </span>
            </div>
          )}
        </div>
        {(isWarning || isExpired || !isPro) && (
          <UpgradeModalButton username={session.username} expired={isExpired} />
        )}
      </CollapsibleCard>

      {/* Font size */}
      <CollapsibleCard title="🔡 Cỡ chữ" subtitle="Điều chỉnh kích thước chữ trên toàn app." defaultOpen={false}>
        <FontSizeSettings />
      </CollapsibleCard>

      {/* Change password */}
      <CollapsibleCard title="🔑 Đổi mật khẩu" subtitle="Đổi mật khẩu tài khoản gia đình" defaultOpen={false}>
        <form onSubmit={changePassword} className="space-y-2.5">
          <div>
            <input type="password" value={cur} onChange={e => setCur(e.target.value)}
              placeholder="Mật khẩu hiện tại"
              className="w-full border-2 border-gray-200 rounded-2xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:border-purple-400" />
            <p className="text-xs text-gray-400 mt-1 ml-1">Không thể hiện mật khẩu hiện tại vì lý do bảo mật</p>
          </div>
          <PwInput value={nw} onChange={setNw} placeholder="Mật khẩu mới (tối thiểu 6 ký tự)" />
          <PwInput value={cnf} onChange={setCnf} placeholder="Xác nhận mật khẩu mới" />
          {pwMsg && (
            <p className={`text-sm font-bold ${pwMsg.startsWith('✅') ? 'text-green-600' : 'text-red-500'}`}>{pwMsg}</p>
          )}
          <button type="submit" disabled={pwSaving}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 rounded-2xl disabled:opacity-50 active:scale-95 transition-transform">
            {pwSaving ? 'Đang lưu...' : 'Đổi mật khẩu'}
          </button>
        </form>
      </CollapsibleCard>

      {/* PIN per child */}
      {kids.length > 0 && (
        <CollapsibleCard title="🔢 PIN cho bé" subtitle="Bé phải nhập đúng PIN mới vào học được." defaultOpen={false}>
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4" style={{ scrollbarWidth: 'none' }}>
            {kids.map(child => {
              const isActive = child.id === selectedPinChildId
              const c = child.theme && THEME_COLORS[child.theme] ? THEME_COLORS[child.theme] : DEFAULT_COLOR
              return (
                <button key={child.id} onClick={() => setSelectedPinChildId(child.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-sm whitespace-nowrap flex-shrink-0 transition-all ${
                    isActive ? `${c.bar} text-white shadow-sm` : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}>
                  <Image src={getAvatarSrc(child.emoji)} width={24} height={24} className="rounded-full object-cover flex-shrink-0" alt="" unoptimized />
                  <span>{child.name}</span>
                </button>
              )
            })}
          </div>
          {kids.filter(c => c.id === selectedPinChildId).map(child => (
            <div key={child.id}>
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${child.pin ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                  {child.pin ? (showPin[child.id] ? `PIN: ${child.pin}` : '🔒 Có PIN') : 'Chưa có PIN'}
                </span>
                {child.pin && (
                  <button onClick={() => setShowPin(p => ({ ...p, [child.id]: !p[child.id] }))}
                    className="text-gray-400 hover:text-gray-600 text-sm">
                    {showPin[child.id] ? '🙈' : '👁️'}
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <input type="number" maxLength={4} value={pinInputs[child.id] ?? ''}
                  onChange={e => setPinInputs(p => ({ ...p, [child.id]: e.target.value.slice(0, 4) }))}
                  placeholder="PIN mới (4 số)"
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-center font-bold text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                <button onClick={() => { const p = pinInputs[child.id] ?? ''; if (p.length === 4) setPin(child.id, p) }}
                  disabled={pinSaving[child.id] || (pinInputs[child.id] ?? '').length !== 4}
                  className="bg-purple-500 text-white text-sm font-bold px-4 py-2.5 rounded-xl disabled:opacity-40 active:scale-95 transition-transform">
                  Đặt
                </button>
                {child.pin && (
                  <button onClick={() => setPin(child.id, null)} disabled={pinSaving[child.id]}
                    className="bg-gray-100 text-gray-500 text-sm font-bold px-3 py-2.5 rounded-xl disabled:opacity-40 active:scale-95 transition-transform">
                    Xóa
                  </button>
                )}
              </div>
              {pinMsg[child.id] && (
                <p className={`text-xs font-bold mt-1.5 ${pinMsg[child.id].startsWith('✅') ? 'text-green-600' : 'text-red-500'}`}>
                  {pinMsg[child.id]}
                </p>
              )}
            </div>
          ))}
        </CollapsibleCard>
      )}

      {/* Push notifications */}
      <CollapsibleCard title="🔔 Thông báo nhắc học" subtitle="Nhận thông báo nhắc bé học từ vựng theo lịch bạn chọn." defaultOpen={false}>
        <PushNotificationContent />
      </CollapsibleCard>

      {/* Report settings */}
      <CollapsibleCard title="📬 Báo cáo qua email" subtitle="Nhận báo cáo tiến độ học của bé qua email." defaultOpen={false}>
        <ReportSettingsContent plan={session.plan} />
      </CollapsibleCard>

      {/* Gift token — Pro 6m exclusive */}
      {session.plan === '6months' && session.gift_token && (
        <GiftTokenCard token={session.gift_token} />
      )}

      {/* Reset — cuối cùng, collapsed by default */}
      {kids.length > 0 && (
        <CollapsibleCard title="🔄 Reset tiến độ học" subtitle="Xóa toàn bộ tiến độ. Không thể hoàn tác." defaultOpen={false}>
          <p className="text-gray-400 text-sm font-semibold mb-4">Xóa toàn bộ tiến độ và bắt đầu lại. Không thể hoàn tác.</p>
          <div className="space-y-3">
            {kids.map(child => (
              <div key={child.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Image src={getAvatarSrc(child.emoji)} width={32} height={32} className="rounded-full object-cover flex-shrink-0" alt="" unoptimized />
                  <div>
                    <p className="font-bold text-gray-800 text-sm">{child.name}</p>
                    <p className="text-xs text-gray-400">{LEVEL_INFO_MAP[child.level]?.label ?? child.level} · {LEVEL_INFO_MAP[child.level]?.cefr ?? ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {resetMsg[child.id] && <span className="text-xs text-green-500 font-bold">{resetMsg[child.id]}</span>}
                  <button onClick={() => resetChild(child.id)}
                    className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-colors ${
                      resetConfirm === child.id ? 'bg-red-500 text-white' : 'bg-red-50 text-red-400 hover:bg-red-100'}`}>
                    {resetConfirm === child.id ? '⚠️ Xác nhận?' : 'Reset'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </CollapsibleCard>
      )}

    </div>
  )
}
