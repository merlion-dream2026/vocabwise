'use client'
import { useState } from 'react'
import UpgradeModal from './UpgradeModal'

type Props = {
  plan: string
  freeTrialExpiresAt?: string | null
  planEndDate?: string | null
  username?: string
}

function isExpired(dateStr?: string | null) {
  if (!dateStr) return true
  return new Date(dateStr) < new Date()
}

function isPremium(plan: string, planEndDate?: string | null) {
  return plan !== 'free' && !isExpired(planEndDate)
}

export default function UpgradeBanner({ plan, freeTrialExpiresAt, planEndDate, username }: Props) {
  const [open, setOpen] = useState(false)

  if (isPremium(plan, planEndDate)) return null

  const trialExpired = isExpired(freeTrialExpiresAt)
  const daysLeft = freeTrialExpiresAt
    ? Math.max(0, Math.ceil((new Date(freeTrialExpiresAt).getTime() - Date.now()) / 86400000))
    : 0

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed top-4 left-4 z-30 flex items-center gap-2 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-white font-black text-sm px-3 py-2 rounded-full shadow-lg active:scale-95 transition-all"
      >
        <span className="text-base">⭐</span>
        <span>{trialExpired ? 'Hết hạn! Nâng cấp' : `FREE (còn ${daysLeft}d)`}</span>
      </button>

      {open && <UpgradeModal onClose={() => setOpen(false)} username={username} />}
    </>
  )
}
