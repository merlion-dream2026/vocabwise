'use client'
import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function VerifyEmailForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''

  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendMsg, setResendMsg] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  useEffect(() => {
    return () => { if (cooldownRef.current) clearInterval(cooldownRef.current) }
  }, [])

  function handleChange(i: number, val: string) {
    const digit = val.replace(/\D/g, '').slice(-1)
    const next = [...otp]
    next[i] = digit
    setOtp(next)
    if (digit && i < 5) inputRefs.current[i + 1]?.focus()
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !otp[i] && i > 0) {
      inputRefs.current[i - 1]?.focus()
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (text.length === 6) {
      setOtp(text.split(''))
      inputRefs.current[5]?.focus()
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const code = otp.join('')
    if (code.length < 6) { setError('Vui lòng nhập đủ 6 chữ số'); return }
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: code }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Mã không đúng'); return }
      router.push('/onboarding')
    } catch {
      setError('Lỗi kết nối, thử lại nhé')
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    if (resendCooldown > 0) return
    setResendMsg('')
    setResending(true)
    try {
      const res = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (res.ok) {
        setResendMsg('✅ Đã gửi lại mã mới!')
        setResendCooldown(60)
        cooldownRef.current = setInterval(() => {
          setResendCooldown(c => {
            if (c <= 1) { clearInterval(cooldownRef.current!); return 0 }
            return c - 1
          })
        }, 1000)
      } else {
        setResendMsg(`❌ ${data.error}`)
      }
    } catch {
      setResendMsg('❌ Lỗi kết nối')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        <div className="text-center mb-6">
          <div className="text-5xl mb-3">📧</div>
          <h1 className="text-2xl font-black text-gray-800">Xác thực email</h1>
          <p className="text-gray-500 text-sm font-semibold mt-2 leading-snug">
            Mã 6 chữ số đã gửi đến<br/>
            <span className="text-purple-600 font-bold">{email}</span>
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-white p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div onPaste={handlePaste} className="flex justify-center gap-2">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={el => { inputRefs.current[i] = el }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleChange(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  className="w-12 h-14 text-center text-2xl font-black text-gray-800 bg-purple-50 border-2 border-purple-100 rounded-2xl focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-200 transition"
                />
              ))}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-500 text-sm rounded-2xl px-4 py-3 font-semibold text-center">
                ⚠️ {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-60 text-white font-black rounded-2xl py-3.5 shadow-md active:scale-95 transition-all text-lg">
              {loading ? '⏳ Đang xác thực...' : '✅ Xác thực'}
            </button>
          </form>

          <div className="mt-4 text-center">
            {resendMsg && (
              <p className="text-sm font-semibold mb-2" style={{ color: resendMsg.startsWith('✅') ? '#16a34a' : '#ef4444' }}>
                {resendMsg}
              </p>
            )}
            <button
              onClick={handleResend}
              disabled={resending || resendCooldown > 0}
              className="text-sm text-gray-400 hover:text-purple-500 font-semibold disabled:opacity-50 transition-colors"
            >
              {resendCooldown > 0 ? `Gửi lại sau ${resendCooldown}s` : resending ? 'Đang gửi...' : 'Không nhận được mã? Gửi lại'}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 font-semibold mt-5 leading-snug">
          Kiểm tra hòm thư rác nếu không thấy email.<br/>
          Mã có hiệu lực trong 15 phút.
        </p>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailForm />
    </Suspense>
  )
}
