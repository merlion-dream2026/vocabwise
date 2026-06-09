'use client'
import { useState, FormEvent, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function ResetForm() {
  const router = useRouter()
  const token = useSearchParams().get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  if (!token) return (
    <div className="text-center space-y-4">
      <div className="text-5xl">❌</div>
      <p className="font-black text-gray-800">Link không hợp lệ</p>
      <Link href="/forgot-password" className="block text-purple-500 underline text-sm">
        Yêu cầu link mới
      </Link>
    </div>
  )

  if (done) return (
    <div className="text-center space-y-4">
      <div className="text-5xl">✅</div>
      <p className="font-black text-gray-800 text-lg">Đặt lại mật khẩu thành công!</p>
      <p className="text-gray-400 text-sm">Đang chuyển về đăng nhập...</p>
    </div>
  )

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('Mật khẩu xác nhận không khớp'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Có lỗi xảy ra'); return }
      setDone(true)
      setTimeout(() => router.push('/login'), 2000)
    } catch {
      setError('Lỗi kết nối, thử lại nhé')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-bold text-gray-600 mb-1.5">Mật khẩu mới</label>
        <div className="relative">
          <input
            type={showPw ? 'text' : 'password'} value={password}
            onChange={e => setPassword(e.target.value)} required
            placeholder="Tối thiểu 6 ký tự"
            className="w-full bg-purple-50 border border-purple-100 rounded-2xl px-4 py-3 pr-11 text-gray-800 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-300 transition"
          />
          <button type="button" onClick={() => setShowPw(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg">
            {showPw ? '🙈' : '👁️'}
          </button>
        </div>
      </div>
      <div>
        <label className="block text-sm font-bold text-gray-600 mb-1.5">Xác nhận mật khẩu mới</label>
        <input
          type={showPw ? 'text' : 'password'} value={confirm}
          onChange={e => setConfirm(e.target.value)} required
          placeholder="Nhập lại mật khẩu mới"
          className="w-full bg-purple-50 border border-purple-100 rounded-2xl px-4 py-3 text-gray-800 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-300 transition"
        />
      </div>
      {error && (
        <div className="bg-red-50 border border-red-100 text-red-500 text-sm rounded-2xl px-4 py-3 font-semibold">
          ⚠️ {error}
        </div>
      )}
      <button type="submit" disabled={loading}
        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 disabled:opacity-60 text-white font-black rounded-2xl py-3.5 shadow-md active:scale-95 transition-all text-lg">
        {loading ? '⏳ Đang lưu...' : '🔑 Đặt lại mật khẩu'}
      </button>
    </form>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <Link href="/" className="text-3xl inline-block mb-3">📚</Link>
          <h1 className="text-2xl font-black text-gray-800">Đặt lại mật khẩu</h1>
          <p className="text-gray-400 text-sm mt-1">Nhập mật khẩu mới cho tài khoản của bạn</p>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-white p-6">
          <Suspense fallback={<p className="text-center text-gray-400 text-sm">Đang tải...</p>}>
            <ResetForm />
          </Suspense>
        </div>
        <p className="text-center text-xs text-gray-300 mt-4">
          <Link href="/login" className="hover:text-gray-500">← Về đăng nhập</Link>
        </p>
      </div>
    </div>
  )
}
