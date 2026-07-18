'use client'
import { useState } from 'react'
import UpgradeModal from './UpgradeModal'

type Props = {
  plan: string
  freeTrialExpiresAt?: string | null
  planEndDate?: string | null
  username?: string
  /** 'fixed' (default) floats top-left over content. 'inline' renders as a compact
   *  pill meant to sit inside a flex row (e.g. a page header) — no positioning of its own. */
  variant?: 'fixed' | 'inline'
}

function isExpired(dateStr?: string | null) {
  if (!dateStr) return true
  return new Date(dateStr) < new Date()
}

function isPremium(plan: string, planEndDate?: string | null) {
  return plan !== 'free' && !isExpired(planEndDate)
}

export default function UpgradeBanner({ plan, freeTrialExpiresAt, planEndDate, username, variant = 'fixed' }: Props) {
  const [open, setOpen] = useState(false)

  if (isPremium(plan, planEndDate)) return null

  const trialExpired = isExpired(freeTrialExpiresAt)
  const daysLeft = freeTrialExpiresAt
    ? Math.max(0, Math.ceil((new Date(freeTrialExpiresAt).getTime() - Date.now()) / 86400000))
    : 0

  const label = trialExpired
    ? (variant === 'inline' ? 'Hết hạn' : 'Hết hạn! Nâng cấp')
    : `${variant === 'inline' ? '' : 'FREE '}còn ${daysLeft}d`

  const positionCls = variant === 'fixed'
    ? 'fixed top-4 left-4 z-30 text-sm px-3 py-2'
    : 'text-xs px-2.5 py-1.5 flex-shrink-0'

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`${positionCls} flex items-center gap-1.5 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-white font-black rounded-full shadow-lg active:scale-95 transition-all whitespace-nowrap`}
      >
        <span className={variant === 'inline' ? 'text-sm' : 'text-base'}>⭐</span>
        <span>{label}</span>
      </button>

      {open && <UpgradeModal onClose={() => setOpen(false)} username={username} />}
    </>
  )
}
