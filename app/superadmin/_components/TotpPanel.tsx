'use client'

import { useState, useEffect } from 'react'

export function TotpPanel() {
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
