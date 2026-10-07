'use client'
import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { cta } from '@/components/ChunkyUI'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      setSent(true)
    } catch {
      setError('Lỗi kết nối, thử lại nhé')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <Link href="/" className="text-3xl inline-block mb-3">📚</Link>
          <h1 className="text-2xl font-bold text-gray-800">Quên mật khẩu</h1>
          <p className="text-gray-400 text-sm mt-1">Nhập email để nhận link đặt lại mật khẩu</p>
        </div>

        {sent ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl border-white p-6 text-center space-y-4 border-2 border-slate-200 border-b-[4px] border-b-slate-300">
            <div className="text-5xl">📬</div>
            <p className="font-bold text-gray-800 text-lg">Đã gửi email!</p>
            <p className="text-gray-500 text-sm leading-relaxed">
              Kiểm tra hộp thư (kể cả spam) để tìm link đặt lại mật khẩu. Link có hiệu lực trong <strong>1 giờ</strong>.
            </p>
            <p className="text-gray-400 text-xs">
              Không nhận được?{' '}
              <a href="https://zalo.me/0977347707" target="_blank" rel="noopener noreferrer"
                className="text-purple-500 underline">Liên hệ Zalo 0977 347 707</a>
            </p>
            <Link href="/login"
              className="block bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 rounded-2xl text-sm active:scale-95 transition-transform">
              ← Về đăng nhập
            </Link>
          </div>
        ) : (
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl border-white p-6 space-y-4 border-2 border-slate-200 border-b-[4px] border-b-slate-300">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-600 mb-1.5">Email tài khoản</label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  placeholder="example@gmail.com"
                  className="w-full bg-purple-50 border-2 border-b-[4px] border-purple-200 border-b-purple-300 rounded-3xl px-4 py-3 text-gray-800 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-300 transition"
                />
              </div>
              {error && (
                <div className="bg-red-50 border border-red-100 text-red-500 text-sm rounded-2xl px-4 py-3 font-semibold">
                  ⚠️ {error}
                </div>
              )}
              <button type="submit" disabled={loading}
                className={cta('purple')}>
                {loading ? '⏳ Đang gửi...' : '📬 Gửi link đặt lại'}
              </button>
            </form>

            <p className="text-center text-xs text-gray-400">
              Không có email?{' '}
              <a href="https://zalo.me/0977347707" target="_blank" rel="noopener noreferrer"
                className="text-purple-500 underline">Nhắn Zalo 0977 347 707</a>
            </p>
            <Link href="/login" className="block text-center text-sm text-gray-400 hover:text-gray-600">
              ← Về đăng nhập
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
