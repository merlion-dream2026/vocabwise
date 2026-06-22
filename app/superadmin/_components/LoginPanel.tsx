'use client'

import { useState, FormEvent } from 'react'
import { PasswordInput } from './PasswordInput'

export function LoginPanel({ onLogin }: { onLogin: () => void }) {
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
