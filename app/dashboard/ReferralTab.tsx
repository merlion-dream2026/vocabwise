'use client'

import { useState, useEffect } from 'react'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://vocabwise.id.vn'

type ReferralItem = {
  id: string
  phone_masked: string
  status: string
  signup_reward_days: number
  paid_reward_days: number
  signup_rewarded_at: string | null
  paid_rewarded_at: string | null
  signup_reward_available_at: string | null
  created_at: string
}

type ReferralData = {
  referral_code: string | null
  bonus_pro_expires_at: string | null
  stats: { total_referred: number; total_rewarded: number; total_days_earned: number }
  referrals: ReferralItem[]
}

const STATUS_INFO: Record<string, { label: string; color: string; days: (r: ReferralItem) => number }> = {
  pending:          { label: 'Chưa học',          color: 'bg-gray-100 text-gray-500',         days: () => 0 },
  signup_triggered: { label: 'Đang xử lý…',       color: 'bg-yellow-100 text-yellow-700',     days: () => 0 },
  signup_rewarded:  { label: '✅ Đã đăng ký',     color: 'bg-green-100 text-green-700',       days: r => r.signup_reward_days },
  paid_rewarded:    { label: '⭐ Đã mua Pro',     color: 'bg-purple-100 text-purple-700',     days: r => r.signup_reward_days + r.paid_reward_days },
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function ReferralTab() {
  const [data, setData] = useState<ReferralData | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetch('/api/referrals')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const shareLink = data?.referral_code ? `${APP_URL}/r/${data.referral_code}` : ''
  const shareText = `Con mình đang học tiếng Anh với VocabWise — bé học qua game nên rất thích! 🎮📚\n\nĐăng ký qua link này để dùng thử miễn phí:\n${shareLink}`

  async function copyLink() {
    if (!shareLink) return
    try {
      await navigator.clipboard.writeText(shareLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback: select text
    }
  }

  async function shareNative() {
    if (!shareLink) return
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: 'VocabWise', text: shareText, url: shareLink })
      } catch { /* user cancelled */ }
    } else {
      copyLink()
    }
  }

  function shareFacebook() {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareLink)}`, '_blank', 'width=600,height=400')
  }

  function shareZalo() {
    // Zalo share: trên mobile → mở Zalo app qua deep link; fallback → native share
    const zaloUrl = `https://zalo.me/share?text=${encodeURIComponent(shareText)}`
    if (typeof navigator !== 'undefined' && /android|iphone|ipad/i.test(navigator.userAgent)) {
      // Thử deep link trước, sau 800ms fallback về web share
      window.location.href = `zalo://share?link=${encodeURIComponent(shareLink)}&text=${encodeURIComponent(shareText)}`
      setTimeout(() => window.open(zaloUrl, '_blank'), 800)
    } else {
      window.open(zaloUrl, '_blank')
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-16 text-gray-400 font-semibold">Đang tải...</div>
  )

  if (!data?.referral_code) return (
    <div className="flex items-center justify-center py-16 text-gray-400 font-semibold">Không tải được dữ liệu. Thử lại sau.</div>
  )

  const bonusActive = data.bonus_pro_expires_at && new Date(data.bonus_pro_expires_at) > new Date()
  const bonusExpiry = data.bonus_pro_expires_at
    ? new Date(data.bonus_pro_expires_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : null

  return (
    <div className="space-y-4">

      {/* Bonus Pro days active banner */}
      {bonusActive && (
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl p-4 text-white">
          <p className="font-black text-sm">🎁 Đang có Pro từ giới thiệu!</p>
          <p className="text-white/80 text-xs mt-0.5">Hiệu lực đến {bonusExpiry} · Mời thêm để kéo dài</p>
        </div>
      )}

      {/* Share section */}
      <div className="bg-white rounded-3xl border-2 border-gray-100 shadow-sm p-5 space-y-4">
        <div>
          <h2 className="font-black text-gray-800 text-base">🎁 Giới thiệu bạn bè</h2>
          <p className="text-xs text-gray-400 font-semibold mt-0.5">Cả hai cùng có lợi khi học cùng nhau!</p>
        </div>

        {/* Reward info */}
        <div className="bg-purple-50 rounded-2xl p-3.5 space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 font-semibold">Bạn bè đăng ký dùng thử</span>
            <span className="font-black text-purple-600">+7 ngày Pro 🎁</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 font-semibold">Bạn bè mua gói Pro</span>
            <span className="font-black text-purple-600">+14 ngày Pro thêm 🏆</span>
          </div>
          <p className="text-[11px] text-gray-400 pt-0.5">Phần thưởng được cộng vào tài khoản của bạn sau 24 giờ.</p>
        </div>

        {/* How it works — inline, trước link */}
        <div className="space-y-2">
          <p className="text-xs font-black text-gray-500">❓ Cách hoạt động</p>
          {[
            { step: '1', text: 'Bạn chia sẻ link của mình cho phụ huynh khác' },
            { step: '2', text: 'Họ đăng ký và bé bắt đầu học từ vựng' },
            { step: '3', text: 'Bạn nhận +7 ngày Pro sau 24 giờ' },
            { step: '4', text: 'Khi họ mua gói Pro, bạn nhận thêm +14 ngày nữa!' },
          ].map(s => (
            <div key={s.step} className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-600 font-black text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                {s.step}
              </span>
              <p className="text-sm text-gray-600 font-semibold">{s.text}</p>
            </div>
          ))}
        </div>

        {/* Link display */}
        <div>
          <p className="text-xs font-bold text-gray-500 mb-1.5">Link giới thiệu của bạn</p>
          <div className="flex items-center gap-2 bg-gray-50 rounded-2xl px-3 py-2.5 border border-gray-200">
            <span className="text-xs text-gray-600 font-semibold truncate flex-1">
              {APP_URL}/r/{data.referral_code}
            </span>
            <button onClick={copyLink}
              className="text-xs font-black text-purple-600 hover:text-purple-800 flex-shrink-0 transition-colors">
              {copied ? '✅ Đã copy' : '📋 Copy'}
            </button>
          </div>
        </div>

        {/* Share buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button onClick={shareZalo}
            className="bg-blue-500 hover:bg-blue-600 text-white font-black py-3 rounded-2xl text-sm active:scale-95 transition-transform">
            💬 Zalo
          </button>
          <button onClick={shareNative}
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-black py-3 rounded-2xl text-sm active:scale-95 transition-transform">
            ••• Khác
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Đã mời',        value: data.stats.total_referred,    emoji: '👥' },
          { label: 'Đã nhận thưởng',value: data.stats.total_rewarded,    emoji: '✅' },
          { label: 'Ngày Pro tích lũy',value: `+${data.stats.total_days_earned}`, emoji: '🗓️' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border-2 border-gray-100 shadow-sm p-3 text-center">
            <div className="text-xl mb-0.5">{s.emoji}</div>
            <div className="font-black text-gray-800 text-lg leading-tight">{s.value}</div>
            <div className="text-[11px] text-gray-400 font-semibold leading-tight mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Referrals table */}
      {data.referrals.length === 0 ? (
        <div className="bg-white rounded-3xl border-2 border-dashed border-gray-200 p-8 text-center">
          <div className="text-4xl mb-3">🔗</div>
          <p className="text-gray-500 font-bold text-sm">Chưa có ai đăng ký qua link của bạn</p>
          <p className="text-gray-400 text-xs mt-1">Chia sẻ link bên trên để bắt đầu nhận thưởng!</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border-2 border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100">
            <h3 className="font-black text-gray-800 text-sm">📋 Danh sách giới thiệu</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {data.referrals.map(r => {
              const info = STATUS_INFO[r.status] ?? STATUS_INFO.pending
              const daysEarned = info.days(r)
              return (
                <div key={r.id} className="px-5 py-3.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-black text-gray-800 text-sm">{r.phone_masked}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {fmtDate(r.created_at)}
                      {r.status === 'signup_triggered' && r.signup_reward_available_at && (
                        <> · thưởng sau {Math.max(0, Math.ceil((new Date(r.signup_reward_available_at).getTime() - Date.now()) / 3600000))}h</>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {daysEarned > 0 && (
                      <span className="text-xs font-black text-purple-600">+{daysEarned}d</span>
                    )}
                    <span className={`text-[11px] font-black px-2.5 py-1 rounded-full whitespace-nowrap ${info.color}`}>
                      {info.label}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

    </div>
  )
}
