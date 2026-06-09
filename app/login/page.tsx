'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'
import UpgradeModal from '@/components/UpgradeModal'

const FEATURES = [
  { emoji: '🎯', title: '6 Levels', sub: 'Pre-A1 → C1-C2' },
  { emoji: '📖', title: '2.300+ từ', sub: 'Chọn lọc theo CEFR' },
  { emoji: '🎮', title: '10 Games', sub: 'Học mà như chơi' },
  { emoji: '🎤', title: 'Phát âm cùng AI ✨', sub: 'Bé phát âm, AI chấm điểm ngay!' },
  { emoji: '📲', title: 'Dùng như app thật', sub: 'Không cài · Tự cập nhật · iPhone, Android, iPad, PC', wide: true },
]

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const rawRedirect = searchParams.get('redirect') || ''
  const redirect = rawRedirect.startsWith('/') && !rawRedirect.startsWith('//') ? rawRedirect : '/kids'
  const isExpiredParam = searchParams.get('expired') === 'true'

  useEffect(() => { router.prefetch('/kids') }, [router])

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [expiredUser, setExpiredUser] = useState(isExpiredParam)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setExpiredUser(false)
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.expired) {
          setExpiredUser(true)
          return
        }
        setError(data.error || 'Đăng nhập thất bại')
        return
      }
      router.push(redirect)
    } catch {
      setError('Lỗi kết nối, thử lại nhé')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 flex items-center justify-center p-4">
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} username={username} />}

      <div className="w-full max-w-sm">

        {/* Hero */}
        <div className="text-center mb-4">
          <div className="text-6xl mb-3">📚</div>
          <h1 className="text-3xl font-black text-gray-800 tracking-tight">VocabKids Pro</h1>
          <p className="text-gray-500 mt-1.5 font-semibold text-sm leading-snug">
            Từ vựng tiếng Anh — vui học mỗi ngày
          </p>
        </div>

        {/* No-install callout */}
        <div className="flex items-center justify-center gap-1.5 mb-4">
          <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1.5 rounded-full">✅ Không cần cài app</span>
          <span className="bg-purple-100 text-purple-700 text-xs font-bold px-3 py-1.5 rounded-full">🆓 Đăng ký miễn phí</span>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-2 gap-2.5 mb-6">
          {FEATURES.map((f) => (
            <div key={f.title} className={`bg-white/70 backdrop-blur-sm border border-white rounded-2xl px-3 py-3 flex items-center gap-2.5 shadow-sm${'wide' in f && f.wide ? ' col-span-2' : ''}`}>
              <span className="text-2xl flex-shrink-0">{f.emoji}</span>
              <div className="min-w-0">
                <p className="font-black text-gray-800 text-sm leading-tight">{f.title}</p>
                <p className="text-gray-400 text-xs leading-tight truncate">{f.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Expired account banner */}
        {expiredUser && (
          <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl px-4 py-4 mb-4 text-center">
            <p className="text-2xl mb-1">⏰</p>
            <p className="font-black text-orange-700 text-sm mb-1">Tài khoản đã hết hạn</p>
            <p className="text-orange-600 text-xs font-semibold mb-3 leading-snug">
              Vui lòng nâng cấp Pro để tiếp tục sử dụng đầy đủ tính năng.
            </p>
            <button
              onClick={() => setShowUpgrade(true)}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-black text-sm px-5 py-2.5 rounded-xl active:scale-95 transition-all"
            >
              ⭐ Nâng cấp Pro ngay
            </button>
          </div>
        )}

        {/* Form card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-white p-6 space-y-4">
          <p className="text-center text-sm font-bold text-gray-500">
            Đăng nhập để bắt đầu hành trình cùng bé →
          </p>

          <div>
            <label className="block text-sm font-bold text-gray-600 mb-1.5">Số điện thoại <span className="text-gray-400 font-normal">(tên đăng nhập)</span></label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-purple-50 border border-purple-100 rounded-2xl px-4 py-3 text-gray-800 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-300 transition"
              placeholder="09xxxxxxxx"
              required
              autoComplete="username"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-600 mb-1.5">Mật khẩu</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-purple-50 border border-purple-100 rounded-2xl px-4 py-3 pr-11 text-gray-800 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-300 transition"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg"
              >
                {showPw ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-500 text-sm rounded-2xl px-4 py-3 font-semibold">
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            onClick={handleSubmit}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-60 text-white font-black rounded-2xl py-3.5 shadow-md active:scale-95 transition-all duration-150 text-lg"
          >
            {loading ? '⏳ Đang đăng nhập...' : '🚀 Đăng nhập'}
          </button>

          <div className="text-center">
            <Link href="/forgot-password" className="text-xs text-gray-400 hover:text-purple-500 font-semibold underline transition-colors">
              Quên mật khẩu?
            </Link>
          </div>
        </div>

        <p className="text-center text-sm text-gray-400 font-semibold mt-5">
          Chưa có tài khoản?{' '}
          <Link href="/register" className="text-purple-500 font-bold hover:underline">Đăng ký miễn phí</Link>
        </p>

        {/* PWA install tip */}
        <div className="mt-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100 rounded-2xl px-4 py-3 text-center">
          <p className="text-purple-600 text-xs font-semibold leading-snug">
            📲 <span className="font-black">Cài lên màn hình chính:</span> Safari/Chrome → "Thêm vào màn hình chính" → mở như app thật, <span className="font-black">tự cập nhật</span>, không cần lên App Store!
          </p>
        </div>

      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
