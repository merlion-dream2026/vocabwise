'use client'

import { useState, useEffect, FormEvent } from 'react'
import UpgradeModal from '@/components/UpgradeModal'
import Image from 'next/image'
import { getAvatarSrc } from '@/lib/avatars'
import { getDownloadedCount, clearAllDownloads } from '@/lib/useOfflineDownload'
import type { Child, Session, ReportSettings } from '../_types'
import {
  LEVEL_INFO_MAP, THEME_COLORS, DEFAULT_COLOR, VN_DAYS, getPlanBadge, fmtDateTime, urlBase64ToUint8Array, APP_URL,
} from '../_utils'
import { PwInput, CollapsibleCard } from './shared'

const DEFAULT_REPORT: ReportSettings = { enabled: false, schedule: 'manual', day: 1, monthly_recap: false }

function ReportSettingsContent({ plan }: { plan: string }) {
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
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-colors ${settings.day === i ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
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
          className="flex-1 bg-purple-500 text-white font-black py-2.5 rounded-2xl text-sm disabled:opacity-50 active:scale-95 transition-transform">
          {saving ? 'Đang lưu...' : 'Lưu cài đặt'}
        </button>
        <button onClick={sendNow} disabled={sending}
          className="bg-white border-2 border-purple-200 text-purple-500 font-black py-2.5 px-4 rounded-2xl text-sm disabled:opacity-50 active:scale-95 transition-transform">
          {sending ? '...' : 'Gửi ngay'}
        </button>
      </div>
    </>
  )
}

function UpgradeModalButton({ username, expired }: { username: string; expired: boolean }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`mt-4 w-full font-black py-3 rounded-2xl text-sm active:scale-95 transition-all ${expired ? 'bg-gradient-to-r from-red-500 to-orange-400 text-white' : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'}`}
      >
        {expired ? '⚠️ Gia hạn ngay' : '⭐ Nâng cấp Pro'}
      </button>
      {open && <UpgradeModal onClose={() => setOpen(false)} username={username} />}
    </>
  )
}

// ── Push notification opt-in ──────────────────────────────────────────────────
function PushNotificationContent() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'subscribed' | 'denied' | 'unsupported' | 'error'>('idle')
  const [msg, setMsg] = useState('')

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      // Browser/Safari-without-PWA does not support push — NOT a permission denial
      setStatus('unsupported')
      return
    }
    navigator.serviceWorker.ready.then(async (reg) => {
      const existing = await reg.pushManager.getSubscription()
      if (existing) {
        setStatus('subscribed')
      } else if (typeof Notification !== 'undefined' && Notification.permission === 'denied') {
        // User previously denied permission in browser settings
        setStatus('denied')
      }
    }).catch(() => {/* ignore */})
  }, [])

  async function subscribe() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setMsg('Trình duyệt không hỗ trợ thông báo đẩy.')
      setStatus('error')
      return
    }
    setStatus('loading')
    setMsg('')
    try {
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidKey) {
        setStatus('error')
        setMsg('❌ Tính năng thông báo chưa được cấu hình. Vui lòng liên hệ admin.')
        return
      }
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setStatus('denied')
        setMsg('Bạn đã từ chối quyền thông báo.')
        return
      }
      const reg = await navigator.serviceWorker.ready
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      })
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription }),
      })
      if (res.ok) {
        setStatus('subscribed')
        setMsg('✅ Đã bật thông báo!')
      } else {
        const d = await res.json()
        setStatus('error')
        setMsg(`❌ ${d.error ?? 'Lỗi'}`)
      }
    } catch (e) {
      setStatus('error')
      setMsg(`❌ ${String(e)}`)
    }
  }

  async function unsubscribe() {
    setStatus('loading')
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) await sub.unsubscribe()
      await fetch('/api/push/subscribe', { method: 'DELETE' })
      setStatus('idle')
      setMsg('')
    } catch (e) {
      setStatus('error')
      setMsg(`❌ ${String(e)}`)
    }
  }

  return (
    <>
      {status === 'subscribed' ? (
        <div className="space-y-2">
          <div className="bg-green-50 border border-green-200 rounded-2xl px-4 py-2.5 flex items-center gap-2">
            <span className="text-green-600 font-black text-sm">✅ Đã bật thông báo nhắc học</span>
          </div>
          <button onClick={unsubscribe}
            className="w-full text-xs text-gray-400 hover:text-red-400 py-1.5 transition-colors">
            Tắt thông báo
          </button>
        </div>
      ) : (
        <>
          <button
            onClick={subscribe}
            disabled={status === 'loading' || status === 'denied' || status === 'unsupported'}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-black py-3 rounded-2xl disabled:opacity-50 active:scale-95 transition-transform text-sm">
            {status === 'loading'
              ? 'Đang bật...'
              : status === 'denied'
              ? '🚫 Quyền bị từ chối trong cài đặt trình duyệt'
              : status === 'unsupported'
              ? '📲 Cài app để dùng thông báo'
              : '🔔 Bật thông báo nhắc học'}
          </button>
          {status === 'unsupported' && (
            <div className="mt-3 bg-blue-50 border border-blue-100 rounded-2xl p-3.5 space-y-2.5">
              <p className="text-xs font-black text-blue-700">📲 Cách cài app lên màn hình chính:</p>
              <div className="space-y-1.5">
                <p className="text-xs font-black text-gray-600">🍎 iPhone / iPad (Safari)</p>
                <p className="text-xs text-gray-500 leading-relaxed">① Bấm nút <span className="font-bold">Chia sẻ</span> <span className="font-mono bg-gray-100 px-1 rounded">⬆️</span> ở thanh dưới Safari</p>
                <p className="text-xs text-gray-500">② Chọn <span className="font-bold">"Thêm vào Màn hình chính"</span></p>
                <p className="text-xs text-gray-500">③ Bấm <span className="font-bold">Thêm</span> → mở app từ icon vừa tạo</p>
              </div>
              <div className="border-t border-blue-100 pt-2 space-y-1.5">
                <p className="text-xs font-black text-gray-600">🤖 Android (Chrome)</p>
                <p className="text-xs text-gray-500 leading-relaxed">① Bấm menu <span className="font-bold">⋮</span> góc trên phải Chrome</p>
                <p className="text-xs text-gray-500">② Chọn <span className="font-bold">"Thêm vào Màn hình chính"</span> hoặc <span className="font-bold">"Cài đặt ứng dụng"</span></p>
                <p className="text-xs text-gray-500">③ Bấm <span className="font-bold">Thêm</span> → mở app từ icon vừa tạo</p>
              </div>
              <p className="text-[11px] text-blue-400 font-semibold text-center pt-1">Sau khi cài xong, mở lại app và bật thông báo nhắc học tại đây</p>
            </div>
          )}
          {status === 'denied' && (
            <p className="text-xs text-orange-500 font-semibold mt-2 text-center">
              Vào Cài đặt → trình duyệt → Thông báo → cho phép vocabwise.id.vn
            </p>
          )}
        </>
      )}
      {msg && (
        <p className={`text-xs font-bold mt-2 ${msg.startsWith('✅') ? 'text-green-600' : 'text-red-500'}`}>{msg}</p>
      )}
    </>
  )
}

const FONT_OPTIONS = [
  { value: '', label: 'Mặc định', size: 'A' },
  { value: 'large', label: 'Lớn hơn', size: 'A+' },
  { value: 'xl', label: 'Rất lớn', size: 'A++' },
]

function FontSizeSettings() {
  const [current, setCurrent] = useState('')
  useEffect(() => { setCurrent(localStorage.getItem('vw_fontsize') ?? '') }, [])
  function apply(v: string) {
    localStorage.setItem('vw_fontsize', v)
    document.documentElement.classList.remove('vw-large', 'vw-xl')
    if (v === 'large') document.documentElement.classList.add('vw-large')
    else if (v === 'xl') document.documentElement.classList.add('vw-xl')
    setCurrent(v)
  }
  return (
    <div className="flex gap-3">
      {FONT_OPTIONS.map(opt => (
        <button key={opt.value} onClick={() => apply(opt.value)}
          className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-2xl border-2 transition-all ${
            current === opt.value
              ? 'border-purple-500 bg-purple-50 text-purple-700'
              : 'border-gray-200 text-gray-500 hover:border-gray-300'
          }`}>
          <span className="font-black" style={{ fontSize: opt.value === '' ? 16 : opt.value === 'large' ? 20 : 24 }}>{opt.size}</span>
          <span className="text-xs font-semibold">{opt.label}</span>
        </button>
      ))}
    </div>
  )
}

function GiftTokenCard({ token }: { token: string }) {
  const [copied, setCopied] = useState(false)
  const [redeemInput, setRedeemInput] = useState('')
  const [redeemMsg, setRedeemMsg] = useState('')
  const [redeeming, setRedeeming] = useState(false)

  const giftLink = `${APP_URL}/register?gift=${token}`

  async function copyLink() {
    try { await navigator.clipboard.writeText(giftLink) } catch { /* fallback */ }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function redeem() {
    if (!redeemInput.trim()) return
    setRedeeming(true); setRedeemMsg('')
    const res = await fetch('/api/gift/redeem', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: redeemInput.trim() }),
    })
    setRedeeming(false)
    const d = await res.json().catch(() => ({}))
    setRedeemMsg(res.ok ? '🎉 Đã nhận 14 ngày Pro! Vui lòng đăng xuất và đăng nhập lại.' : `❌ ${d.error ?? 'Lỗi'}`)
  }

  return (
    <CollapsibleCard title="🎁 Tặng bạn bè" subtitle="Độc quyền gói Pro 6 tháng · Tặng 1 người bạn 14 ngày Pro miễn phí." defaultOpen={true}>
      <p className="text-xs text-gray-500 font-semibold mb-3">Mã quà tặng của bạn — chỉ dùng được 1 lần:</p>
      <div className="flex items-center gap-2 bg-indigo-50 border-2 border-indigo-200 rounded-2xl px-4 py-3 mb-3">
        <span className="flex-1 font-black text-indigo-700 text-xl tracking-[0.2em]">{token}</span>
        <button onClick={copyLink}
          className="bg-indigo-500 text-white text-xs font-black px-3 py-1.5 rounded-xl active:scale-95 transition-transform">
          {copied ? '✅ Copied!' : 'Copy link'}
        </button>
      </div>
      <p className="text-xs text-gray-400 font-semibold mb-4">
        Link: <span className="text-indigo-400 break-all">{giftLink}</span>
      </p>

      <div className="border-t border-gray-100 pt-4">
        <p className="text-xs text-gray-500 font-bold mb-2">Nhận mã từ bạn bè? Nhập tại đây:</p>
        <div className="flex gap-2">
          <input
            value={redeemInput}
            onChange={e => setRedeemInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8))}
            placeholder="XXXXXXXX"
            className="flex-1 border-2 border-gray-200 rounded-xl px-3 py-2 text-sm font-black tracking-widest text-center focus:outline-none focus:border-indigo-400"
          />
          <button onClick={redeem} disabled={redeeming || redeemInput.length !== 8}
            className="bg-indigo-500 text-white text-sm font-black px-4 py-2 rounded-xl disabled:opacity-40 active:scale-95 transition-transform">
            {redeeming ? '...' : 'Nhận'}
          </button>
        </div>
        {redeemMsg && (
          <p className={`text-xs font-bold mt-2 ${redeemMsg.startsWith('🎉') ? 'text-green-600' : 'text-red-500'}`}>
            {redeemMsg}
          </p>
        )}
      </div>
    </CollapsibleCard>
  )
}

// ── Settings tab ──────────────────────────────────────────────────────────────
export function SettingsTab({ children, session, onChildrenRefresh }: { children: Child[]; session: Session; onChildrenRefresh: () => void }) {
  const [cur, setCur] = useState(''); const [nw, setNw] = useState(''); const [cnf, setCnf] = useState('')
  const [pwMsg, setPwMsg] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [resetMsg, setResetMsg] = useState<Record<string, string>>({})
  const [resetConfirm, setResetConfirm] = useState<string | null>(null)
  const [dlCount, setDlCount] = useState(0)
  const [dlClearing, setDlClearing] = useState(false)

  useEffect(() => {
    getDownloadedCount().then(setDlCount).catch(() => {})
    const handler = () => getDownloadedCount().then(setDlCount).catch(() => {})
    window.addEventListener('offline-cache-changed', handler)
    return () => window.removeEventListener('offline-cache-changed', handler)
  }, [])
  const [pinInputs, setPinInputs] = useState<Record<string, string>>({})
  const [pinMsg, setPinMsg] = useState<Record<string, string>>({})
  const [pinSaving, setPinSaving] = useState<Record<string, boolean>>({})
  const [showPin, setShowPin] = useState<Record<string, boolean>>({})
  const [selectedPinChildId, setSelectedPinChildId] = useState<string>(() => children[0]?.id ?? '')

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
            <span className={`text-xs font-black px-3 py-1 rounded-full ${badge.cls.includes('white') ? 'bg-purple-100 text-purple-700' : badge.cls}`}>
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
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-black py-3 rounded-2xl disabled:opacity-50 active:scale-95 transition-transform">
            {pwSaving ? 'Đang lưu...' : 'Đổi mật khẩu'}
          </button>
        </form>
      </CollapsibleCard>

      {/* PIN per child */}
      {children.length > 0 && (
        <CollapsibleCard title="🔢 PIN cho bé" subtitle="Bé phải nhập đúng PIN mới vào học được." defaultOpen={false}>
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4" style={{ scrollbarWidth: 'none' }}>
            {children.map(child => {
              const isActive = child.id === selectedPinChildId
              const c = child.theme && THEME_COLORS[child.theme as 'pink' | 'blue'] ? THEME_COLORS[child.theme as 'pink' | 'blue'] : DEFAULT_COLOR
              return (
                <button key={child.id} onClick={() => setSelectedPinChildId(child.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-sm whitespace-nowrap flex-shrink-0 transition-all ${
                    isActive ? `${c.bar} text-white shadow-sm` : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}>
                  <Image src={getAvatarSrc(child.emoji)} width={24} height={24} className="rounded-full object-cover flex-shrink-0" alt="" unoptimized />
                  <span>{child.name}</span>
                </button>
              )
            })}
          </div>
          {children.filter(c => c.id === selectedPinChildId).map(child => (
            <div key={child.id}>
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs font-black px-2.5 py-1 rounded-full ${child.pin ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
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
                  className="bg-purple-500 text-white text-sm font-black px-4 py-2.5 rounded-xl disabled:opacity-40 active:scale-95 transition-transform">
                  Đặt
                </button>
                {child.pin && (
                  <button onClick={() => setPin(child.id, null)} disabled={pinSaving[child.id]}
                    className="bg-gray-100 text-gray-500 text-sm font-black px-3 py-2.5 rounded-xl disabled:opacity-40 active:scale-95 transition-transform">
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
      <CollapsibleCard title="🔔 Thông báo nhắc học" subtitle="Nhận thông báo nhắc bé học từ vựng mỗi ngày (8:00 sáng)." defaultOpen={false}>
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
      {children.length > 0 && (
        <CollapsibleCard title="🔄 Reset tiến độ học" subtitle="Xóa toàn bộ tiến độ. Không thể hoàn tác." defaultOpen={false}>
          <p className="text-gray-400 text-sm font-semibold mb-4">Xóa toàn bộ tiến độ và bắt đầu lại. Không thể hoàn tác.</p>
          <div className="space-y-3">
            {children.map(child => (
              <div key={child.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Image src={getAvatarSrc(child.emoji)} width={32} height={32} className="rounded-full object-cover flex-shrink-0" alt="" unoptimized />
                  <div>
                    <p className="font-black text-gray-800 text-sm">{child.name}</p>
                    <p className="text-xs text-gray-400">{LEVEL_INFO_MAP[child.level]?.label ?? child.level} · {LEVEL_INFO_MAP[child.level]?.cefr ?? ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {resetMsg[child.id] && <span className="text-xs text-green-500 font-bold">{resetMsg[child.id]}</span>}
                  <button onClick={() => resetChild(child.id)}
                    className={`text-xs px-3 py-1.5 rounded-xl font-black transition-colors ${
                      resetConfirm === child.id ? 'bg-red-500 text-white' : 'bg-red-50 text-red-400 hover:bg-red-100'}`}>
                    {resetConfirm === child.id ? '⚠️ Xác nhận?' : 'Reset'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </CollapsibleCard>
      )}

      {/* Offline storage management */}
      <CollapsibleCard title="💾 Bài tải offline">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-700">Đã tải: {dlCount} chủ đề</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {dlCount === 0
                  ? 'Bấm ↓ trên từng chủ đề để tải offline (Gói Pro).'
                  : 'Các bài này có thể xem khi không có mạng.'}
              </p>
            </div>
            {dlCount > 0 && (
              <button
                onClick={async () => {
                  setDlClearing(true)
                  await clearAllDownloads()
                  setDlCount(0)
                  setDlClearing(false)
                }}
                disabled={dlClearing}
                className="text-xs px-3 py-1.5 rounded-xl font-black bg-red-50 text-red-400 hover:bg-red-100 transition-colors disabled:opacity-50"
              >
                {dlClearing ? 'Đang xóa...' : 'Xóa tất cả'}
              </button>
            )}
          </div>
        </div>
      </CollapsibleCard>
    </div>
  )
}
