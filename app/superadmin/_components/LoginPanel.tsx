'use client'

import { useState, FormEvent } from 'react'
import { PasswordInput } from './PasswordInput'

export function LoginPanel({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState('')
  const [totpCode, setTotpCode] = useState('')
  const [needs2fa, setNeeds2fa] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submitLogin(body: { password: string; totpCode?: string }) {
    setError('')
    setLoading(true)
    const res = await fetch('/api/superadmin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const d = await res.json().catch(() => ({}))
    setLoading(false)
    if (res.ok && d.requires2fa) {
      setNeeds2fa(true)
      return
    }
    if (res.ok) { onLogin(); return }
    setError(d.error || 'Sai mật khẩu')
  }

  function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault()
    submitLogin({ password })
  }

  function handleTotpSubmit(e: FormEvent) {
    e.preventDefault()
    submitLogin({ password, totpCode })
  }

  return (
    <div className="min-h-screen bg-[#F8F6FF] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl border-2 border-gray-100 p-8 w-full max-w-sm">
        <div className="text-center mb-7">
          <div className="text-5xl mb-3">🔐</div>
          <h1 className="text-2xl font-black text-slate-900">Super Admin</h1>
          <p className="text-slate-500 text-sm mt-1 font-semibold">VocabWise</p>
        </div>
        {!needs2fa ? (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <PasswordInput value={password} onChange={setPassword}
              placeholder="Mật khẩu admin"
              className="w-full border-2 border-slate-200 rounded-2xl px-4 py-3 text-slate-900 focus:outline-none focus:border-indigo-400 font-semibold" />
            {error && <p className="text-red-500 text-sm font-semibold">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 disabled:opacity-60 text-white font-black rounded-2xl py-3 active:scale-95 transition-all">
              {loading ? 'Đang vào...' : 'Vào Admin'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleTotpSubmit} className="space-y-4">
            <p className="text-slate-500 text-sm text-center font-semibold">Nhập mã 6 số từ ứng dụng xác thực</p>
            <input value={totpCode} onChange={(e) => setTotpCode(e.target.value)}
              placeholder="123456" inputMode="numeric" maxLength={6} autoFocus
              className="w-full border-2 border-slate-200 rounded-2xl px-4 py-3 text-slate-900 text-center text-2xl tracking-[0.4em] focus:outline-none focus:border-indigo-400 font-semibold" />
            {error && <p className="text-red-500 text-sm font-semibold text-center">{error}</p>}
            <button type="submit" disabled={loading || totpCode.length < 6}
              className="w-full bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 disabled:opacity-60 text-white font-black rounded-2xl py-3 active:scale-95 transition-all">
              {loading ? 'Đang xác thực...' : 'Xác nhận'}
            </button>
            <button type="button" onClick={() => { setNeeds2fa(false); setTotpCode(''); setError('') }}
              className="w-full text-slate-400 text-sm font-semibold">
              ← Quay lại
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
