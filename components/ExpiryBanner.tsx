'use client'

import { daysUntilExpiry } from '@/lib/useExpiryGuard'

type Session = {
  plan: string
  free_trial_expires_at?: string | null
  plan_end_date?: string | null
  bonus_pro_expires_at?: string | null
}

type Props = {
  session: Session
  onUpgrade?: () => void
  className?: string
}

/**
 * Hiện banner đếm ngược khi tài khoản còn ≤3 ngày hết hạn.
 * Dùng được ở mọi trang (level, kids, dashboard).
 */
export default function ExpiryBanner({ session, onUpgrade, className = '' }: Props) {
  const d = daysUntilExpiry(session)
  if (d === null || d > 7) return null

  const expired = d <= 0
  return (
    <div className={`bg-orange-50 border-2 border-orange-200 rounded-2xl px-4 py-2.5 flex items-center gap-2.5 ${className}`}>
      <span className="text-xl flex-shrink-0">⏰</span>
      <p className="text-orange-700 text-xs font-bold leading-snug flex-1">
        {expired
          ? 'Tài khoản đã hết hạn!'
          : `Tài khoản hết hạn sau ${d} ngày — học ngay khi còn thời gian!`}
      </p>
      {onUpgrade && (
        <button
          onClick={onUpgrade}
          className="flex-shrink-0 bg-orange-500 text-white text-xs font-black px-3 py-1.5 rounded-full whitespace-nowrap active:scale-95 transition-transform"
        >
          Gia hạn
        </button>
      )}
    </div>
  )
}
