'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'
import UpgradeModal from '@/components/UpgradeModal'

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
  const [turnstileToken, setTurnstileToken] = useState('')
  const [totpCode, setTotpCode] = useState('')
  const [needs2fa, setNeeds2fa] = useState(false)
  const [emailOtpMode, setEmailOtpMode] = useState(false)
  const [emailOtp, setEmailOtp] = useState('')
  const [emailOtpSent, setEmailOtpSent] = useState(false)
  const [emailOtpLoading, setEmailOtpLoading] = useState(false)
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

  useEffect(() => {
    if (!turnstileSiteKey) return
    ;(window as Window & { onTurnstileVerify?: (t: string) => void }).onTurnstileVerify = t => setTurnstileToken(t)
    const s = document.createElement('script')
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
    s.async = true
    document.body.appendChild(s)
    return () => { document.body.removeChild(s) }
  }, [turnstileSiteKey])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setExpiredUser(false)
    setLoading(true)
    try {
      const body: Record<string, string> = { username, password, turnstileToken }
      if (needs2fa && emailOtpMode && emailOtp) body.emailOtp = emailOtp
      else if (needs2fa && totpCode) body.totpCode = totpCode
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (data.requires2fa) {
        setNeeds2fa(true)
        return
      }
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

  async function handleSendEmailOtp() {
    setEmailOtpLoading(true)
    setError('')
    try {
      const res = await fetch('/api/superadmin/totp/email-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const d = await res.json()
      if (!res.ok) { setError(d.error || 'Không gửi được email'); return }
      setEmailOtpSent(true)
      setEmailOtpMode(true)
    } catch {
      setError('Lỗi kết nối')
    } finally {
      setEmailOtpLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 flex items-center justify-center p-4">
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} username={username} />}

      <div className="w-full max-w-sm">

        {/* Hero */}
        <div className="text-center mb-4">
          <div className="text-6xl mb-3">📚</div>
          <h1 className="text-3xl font-black text-gray-800 tracking-tight">VocabWise</h1>
          <p className="text-gray-500 mt-1.5 font-semibold text-sm leading-snug">
            Từ vựng tiếng Anh — vui học mỗi ngày
          </p>
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
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
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

          {needs2fa && !emailOtpMode && (
            <div>
              <label className="block text-sm font-bold text-gray-600 mb-1.5">Mã xác thực 2FA <span className="text-gray-400 font-normal">(6 chữ số từ ứng dụng)</span></label>
              <input
                type="text"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-gray-800 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-300 transition tracking-widest text-center text-lg"
                placeholder="000000"
                autoFocus
                autoComplete="one-time-code"
              />
              <button
                type="button"
                onClick={handleSendEmailOtp}
                disabled={emailOtpLoading}
                className="mt-2 text-xs text-purple-500 hover:text-purple-700 font-semibold disabled:opacity-50"
              >
                {emailOtpLoading ? '⏳ Đang gửi...' : '📧 Quên mã? Gửi OTP qua email'}
              </button>
            </div>
          )}

          {needs2fa && emailOtpMode && (
            <div>
              {emailOtpSent && (
                <div className="bg-green-50 border border-green-100 rounded-2xl px-4 py-3 mb-3 text-sm text-green-700 font-semibold">
                  ✅ Đã gửi mã OTP tới email admin. Hiệu lực 10 phút.
                </div>
              )}
              <label className="block text-sm font-bold text-gray-600 mb-1.5">Mã OTP từ email <span className="text-gray-400 font-normal">(6 chữ số)</span></label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={emailOtp}
                onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-green-50 border border-green-200 rounded-2xl px-4 py-3 text-gray-800 font-semibold focus:outline-none focus:ring-2 focus:ring-green-300 transition tracking-widest text-center text-lg"
                placeholder="000000"
                autoFocus
                autoComplete="one-time-code"
              />
              <button
                type="button"
                onClick={() => { setEmailOtpMode(false); setEmailOtp(''); setEmailOtpSent(false) }}
                className="mt-2 text-xs text-gray-400 hover:text-gray-600 font-semibold"
              >
                ← Quay lại nhập mã từ ứng dụng
              </button>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-500 text-sm rounded-2xl px-4 py-3 font-semibold">
              ⚠️ {error}
            </div>
          )}

          {turnstileSiteKey && (
            <div className="cf-turnstile" data-sitekey={turnstileSiteKey} data-callback="onTurnstileVerify" data-theme="light" />
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
        <div className="mt-4 bg-blue-50 border border-blue-100 rounded-2xl p-3.5 space-y-2.5">
          <p className="text-xs font-black text-blue-700">📲 Cách cài app lên màn hình chính:</p>
          <div className="space-y-1.5">
            <p className="text-xs font-black text-gray-600">🍎 iPhone / iPad (Safari)</p>
            <p className="text-xs text-gray-500 leading-relaxed">① Bấm nút <span className="font-bold">Chia sẻ</span> <span className="font-mono bg-gray-100 px-1 rounded">⬆️</span> ở thanh dưới Safari</p>
            <p className="text-xs text-gray-500">② Chọn <span className="font-bold">&quot;Thêm vào Màn hình chính&quot;</span></p>
            <p className="text-xs text-gray-500">③ Bấm <span className="font-bold">Thêm</span> → mở app từ icon vừa tạo</p>
          </div>
          <div className="border-t border-blue-100 pt-2 space-y-1.5">
            <p className="text-xs font-black text-gray-600">🤖 Android (Chrome)</p>
            <p className="text-xs text-gray-500 leading-relaxed">① Bấm menu <span className="font-bold">⋮</span> góc trên phải Chrome</p>
            <p className="text-xs text-gray-500">② Chọn <span className="font-bold">&quot;Thêm vào Màn hình chính&quot;</span> hoặc <span className="font-bold">&quot;Cài đặt ứng dụng&quot;</span></p>
            <p className="text-xs text-gray-500">③ Bấm <span className="font-bold">Thêm</span> → mở app từ icon vừa tạo</p>
          </div>
          <p className="text-[11px] text-blue-400 font-semibold text-center pt-1">Mở như app thật · tự cập nhật · không cần App Store</p>
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
