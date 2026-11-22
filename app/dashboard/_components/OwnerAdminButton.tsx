'use client'

// 🛡️ Admin — owner-only header button on /dashboard → bottom sheet into /superadmin
// (PIN, or emailed code when PIN is new/forgotten).
// Server re-checks families.is_owner on every call; hiding this button is not the security boundary.
import { useState } from 'react'

type Step = 'pin' | 'otp' | 'newPin'

function PinBoxes({ value, onChange, error, masked = true, autoFocus = false }: {
  value: string; onChange: (v: string) => void; error?: boolean; masked?: boolean; autoFocus?: boolean
}) {
  return (
    <label className="relative flex justify-center gap-2 cursor-text">
      <input
        type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} autoFocus={autoFocus}
        value={value} onChange={e => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
        className="absolute inset-0 opacity-0" aria-label="6 chữ số"
      />
      {Array.from({ length: 6 }).map((_, i) => {
        const ch = value[i]
        return (
          <div key={i}
            className={`w-[42px] h-[50px] rounded-[14px] border-2 flex items-center justify-center text-[22px] font-black text-slate-700 bg-white ${
              error ? 'border-red-400 bg-red-50' : ch ? 'border-violet-600' : 'border-gray-200'}`}>
            {ch ? (masked ? '•' : ch) : ''}
          </div>
        )
      })}
    </label>
  )
}

export function OwnerAdminButton({ hasPin }: { hasPin: boolean }) {
  const [open, setOpen] = useState<Step | null>(null)
  const [pin, setPin] = useState('')
  const [otp, setOtp] = useState('')
  const [newPin, setNewPin] = useState('')
  const [newPin2, setNewPin2] = useState('')
  const [maskedEmail, setMaskedEmail] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const [resendAt, setResendAt] = useState(0)

  function close() {
    setOpen(null); setPin(''); setOtp(''); setNewPin(''); setNewPin2(''); setMsg('')
  }

  async function post(url: string, body?: unknown) {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined })
    const data = await res.json().catch(() => ({}))
    return { ok: res.ok, data }
  }

  async function sendOtp() {
    setBusy(true); setMsg('')
    const { ok, data } = await post('/api/owner/admin/otp/send')
    setBusy(false)
    setOpen('otp'); setOtp('')
    if (ok) {
      setMaskedEmail(data.email ?? '')
      setResendAt(Date.now() + 60_000)
      setTimeout(() => setResendAt(0), 60_000) // re-render so "Gửi lại mã" re-enables
    }
    else setMsg(data.error ?? 'Không gửi được mã.')
  }

  async function submitPin() {
    setBusy(true); setMsg('')
    const { ok, data } = await post('/api/owner/admin/pin', { pin })
    setBusy(false)
    if (ok) { window.location.href = '/superadmin'; return }
    if (data.needsSetup) { sendOtp(); return }
    setPin(''); setMsg(data.error ?? 'Lỗi, thử lại nhé.')
  }

  async function submitNewPin() {
    if (newPin !== newPin2) { setMsg('❌ Hai lần nhập PIN không khớp.'); setNewPin2(''); return }
    setBusy(true); setMsg('')
    const { ok, data } = await post('/api/owner/admin/otp/verify', { otp, newPin })
    setBusy(false)
    if (ok) { window.location.href = '/superadmin'; return }
    setMsg(data.error ?? 'Lỗi, thử lại nhé.')
    if (data.step === 'otp') { setOpen('otp'); setOtp('') }
    else { setNewPin(''); setNewPin2('') }
  }

  const btn = 'w-full font-bold py-3 rounded-2xl text-sm transition-all active:scale-95 disabled:bg-none disabled:bg-gray-200 disabled:text-gray-400 bg-gradient-to-r from-violet-600 to-purple-500 text-white'
  const isErr = msg.startsWith('❌') || msg.startsWith('⏳')
  const canResend = Date.now() >= resendAt

  return (
    <>
      <button onClick={() => (hasPin ? setOpen('pin') : sendOtp())} disabled={busy}
        className="bg-white text-violet-600 font-extrabold text-xs px-3 py-2 rounded-2xl transition-colors whitespace-nowrap disabled:opacity-60">
        🛡️ Admin
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-slate-900/45 flex items-end sm:items-center justify-center" onClick={close}>
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 pb-8" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1.5 bg-gray-200 rounded-full mx-auto mb-4" />

            {open === 'pin' && (
              <>
                <h3 className="font-black text-gray-800 text-lg text-center">🔐 Nhập PIN quản trị</h3>
                <p className="text-xs text-gray-500 font-semibold text-center mt-1 mb-5">6 số · phiên quản trị kéo dài 8 giờ</p>
                <div className="mb-4"><PinBoxes value={pin} onChange={setPin} error={isErr} autoFocus /></div>
                {msg && <p className={`text-sm font-bold text-center mb-4 ${isErr ? 'text-red-500' : 'text-gray-600'}`}>{msg}</p>}
                <button onClick={submitPin} disabled={busy || pin.length !== 6} className={btn}>{busy ? 'Đang kiểm tra...' : 'Vào Superadmin'}</button>
                <button onClick={sendOtp} disabled={busy} className="block mx-auto mt-4 text-sm font-bold text-purple-600 underline">Quên / đổi PIN?</button>
              </>
            )}

            {open === 'otp' && (
              <>
                <h3 className="font-black text-gray-800 text-lg text-center">📧 Xác nhận qua email</h3>
                <p className="text-xs text-gray-500 font-semibold text-center mt-1 mb-5">
                  {maskedEmail ? <>Đã gửi mã 6 số tới <b>{maskedEmail}</b><br /></> : null}Mã hết hạn sau 10 phút · dùng 1 lần
                </p>
                <div className="mb-4"><PinBoxes value={otp} onChange={setOtp} masked={false} error={!!msg} autoFocus /></div>
                {msg && <p className="text-sm font-bold text-center text-red-500 mb-4">{msg}</p>}
                <button onClick={() => { setMsg(''); setOpen('newPin') }} disabled={otp.length !== 6} className={btn}>Xác nhận</button>
                <button onClick={sendOtp} disabled={busy || !canResend}
                  className="block mx-auto mt-4 text-xs font-bold text-gray-400 disabled:opacity-60 underline">
                  {canResend ? 'Gửi lại mã' : 'Gửi lại mã (sau 60s)'}
                </button>
              </>
            )}

            {open === 'newPin' && (
              <>
                <h3 className="font-black text-gray-800 text-lg text-center">🔢 Đặt PIN quản trị mới</h3>
                <p className="text-xs text-gray-500 font-semibold text-center mt-1 mb-4">6 số · tránh 123456, 000000, ngày sinh</p>
                <p className="text-xs font-bold text-gray-500 mb-1">PIN mới</p>
                <div className="mb-3"><PinBoxes value={newPin} onChange={setNewPin} autoFocus /></div>
                <p className="text-xs font-bold text-gray-500 mb-1">Nhập lại</p>
                <div className="mb-4"><PinBoxes value={newPin2} onChange={setNewPin2} error={!!msg} /></div>
                {msg && <p className="text-sm font-bold text-center text-red-500 mb-4">{msg}</p>}
                <button onClick={submitNewPin} disabled={busy || newPin.length !== 6 || newPin2.length !== 6} className={btn}>
                  {busy ? 'Đang lưu...' : 'Lưu PIN & vào Superadmin'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
