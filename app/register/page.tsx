'use client'
import { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const REFERRAL_OPTIONS = [
  'Google / Tìm kiếm trên mạng',
  'Bạn bè / Người thân giới thiệu',
  'Facebook / Instagram',
  'YouTube / TikTok',
  'Thầy cô / Trường học',
  'Khác',
]

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [referralSource, setReferralSource] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState('')
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

  // SĐT VN hợp lệ: đầu số 03x, 05x, 07x, 08x, 09x — đúng 10 số
  const VN_PHONE_REGEX = /^(03[2-9]|05[6-9]|07[06-9]|08[0-9]|09[0-9])\d{7}$/

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    const cleanPhone = phone.trim().replace(/\D/g, '')
    if (!VN_PHONE_REGEX.test(cleanPhone)) {
      setError('Số điện thoại không hợp lệ. Vui lòng nhập đúng định dạng VN (VD: 0901234567)')
      return
    }
    if (password !== confirm) { setError('Mật khẩu xác nhận không khớp'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, email, referral_source: referralSource, password, turnstileToken }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Đăng ký thất bại'); return }
      router.push(`/verify-email?email=${encodeURIComponent(email)}`)
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
          <Link href="/login" className="text-3xl inline-block mb-3">📚</Link>
          <h1 className="text-2xl font-black text-gray-800">Tạo tài khoản miễn phí</h1>
          <p className="text-gray-400 text-sm font-semibold mt-1">Thử miễn phí 7 ngày, không cần cài app</p>
          <div className="flex flex-wrap justify-center gap-1.5 mt-2">
            <span className="text-xs bg-purple-100 text-purple-700 font-bold px-2.5 py-1 rounded-full">📖 4.500+ từ vựng</span>
            <span className="text-xs bg-rose-100 text-rose-700 font-bold px-2.5 py-1 rounded-full">🎤 Phát âm AI</span>
            <span className="text-xs bg-amber-100 text-amber-700 font-bold px-2.5 py-1 rounded-full">🔤 Học IPA</span>
            <span className="text-xs bg-blue-100 text-blue-700 font-bold px-2.5 py-1 rounded-full">🎓 Academic IELTS/SAT</span>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-white p-6 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">

            <div>
              <label className="block text-sm font-bold text-gray-600 mb-1.5">Họ tên phụ huynh</label>
              <input
                type="text" value={name} onChange={e => setName(e.target.value)} required
                onInvalid={e => (e.target as HTMLInputElement).setCustomValidity('Vui lòng nhập họ tên phụ huynh')}
                onInput={e => (e.target as HTMLInputElement).setCustomValidity('')}
                placeholder="Nguyễn Văn A"
                className="w-full bg-purple-50 border border-purple-100 rounded-2xl px-4 py-3 text-gray-800 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-300 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-600 mb-1.5">Số điện thoại</label>
              <input
                type="tel" value={phone} onChange={e => setPhone(e.target.value)} required
                onInvalid={e => (e.target as HTMLInputElement).setCustomValidity('Vui lòng nhập số điện thoại')}
                onInput={e => (e.target as HTMLInputElement).setCustomValidity('')}
                placeholder="0901234567"
                className="w-full bg-purple-50 border border-purple-100 rounded-2xl px-4 py-3 text-gray-800 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-300 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-600 mb-1.5">Email <span className="text-gray-400 font-normal">(để nhận mã xác thực)</span></label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)} required
                onInvalid={e => (e.target as HTMLInputElement).setCustomValidity('Vui lòng nhập địa chỉ email hợp lệ')}
                onInput={e => (e.target as HTMLInputElement).setCustomValidity('')}
                placeholder="example@gmail.com"
                className="w-full bg-purple-50 border border-purple-100 rounded-2xl px-4 py-3 text-gray-800 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-300 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-600 mb-1.5">Biết đến VocabWise qua</label>
              <select
                value={referralSource} onChange={e => setReferralSource(e.target.value)} required
                onInvalid={e => (e.target as HTMLSelectElement).setCustomValidity('Vui lòng chọn kênh bạn biết đến VocabWise')}
                onInput={e => (e.target as HTMLSelectElement).setCustomValidity('')}
                className="w-full bg-purple-50 border border-purple-100 rounded-2xl px-4 py-3 text-gray-800 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-300 transition"
              >
                <option value="">— Chọn kênh —</option>
                {REFERRAL_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-600 mb-1.5">Mật khẩu</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                  onInvalid={e => (e.target as HTMLInputElement).setCustomValidity('Vui lòng nhập mật khẩu (tối thiểu 6 ký tự)')}
                  onInput={e => (e.target as HTMLInputElement).setCustomValidity('')}
                  placeholder="Tối thiểu 6 ký tự"
                  autoComplete="new-password"
                  className="w-full bg-purple-50 border border-purple-100 rounded-2xl px-4 py-3 pr-11 text-gray-800 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-300 transition"
                />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg">
                  {showPw ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-600 mb-1.5">Xác nhận mật khẩu</label>
              <input
                type={showPw ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)} required
                onInvalid={e => (e.target as HTMLInputElement).setCustomValidity('Vui lòng xác nhận mật khẩu')}
                onInput={e => (e.target as HTMLInputElement).setCustomValidity('')}
                placeholder="Nhập lại mật khẩu"
                autoComplete="new-password"
                className="w-full bg-purple-50 border border-purple-100 rounded-2xl px-4 py-3 text-gray-800 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-300 transition"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-500 text-sm rounded-2xl px-4 py-3 font-semibold">⚠️ {error}</div>
            )}

            {turnstileSiteKey && (
              <div className="cf-turnstile" data-sitekey={turnstileSiteKey} data-callback="onTurnstileVerify" data-theme="light" />
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-60 text-white font-black rounded-2xl py-3.5 shadow-md active:scale-95 transition-all text-lg">
              {loading ? '⏳ Đang tạo tài khoản...' : '🚀 Tạo tài khoản'}
            </button>
          </form>

        </div>

        <p className="text-center text-sm text-gray-400 font-semibold mt-5">
          Đã có tài khoản?{' '}
          <Link href="/login" className="text-purple-500 font-bold hover:underline">Đăng nhập</Link>
        </p>

        <p className="text-center text-xs text-gray-300 font-semibold mt-3">
          Đăng ký đồng nghĩa với việc bạn đồng ý với{' '}
          <Link href="/terms" className="hover:text-gray-500">Điều khoản sử dụng</Link>
          {' '}và{' '}
          <Link href="/privacy" className="hover:text-gray-500">Chính sách bảo mật</Link>.
        </p>
      </div>
    </div>
  )
}
