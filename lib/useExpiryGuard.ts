'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

type Session = {
  plan: string
  free_trial_expires_at?: string | null
  plan_end_date?: string | null
  bonus_pro_expires_at?: string | null
}

export function isAccountExpired(session: Session): boolean {
  const now = new Date()
  // Bonus Pro active → không bao giờ expired (override cả trial hết hạn)
  if (session.bonus_pro_expires_at && new Date(session.bonus_pro_expires_at) > now) return false
  if (session.plan === 'free') {
    return session.free_trial_expires_at ? new Date(session.free_trial_expires_at) < now : false
  }
  return session.plan_end_date ? new Date(session.plan_end_date) < now : false
}

export function daysUntilExpiry(session: Session): number | null {
  const now = Date.now()
  // Tìm ngày hết hạn xa nhất còn active
  let best: number | null = null
  if (session.bonus_pro_expires_at) {
    const t = new Date(session.bonus_pro_expires_at).getTime()
    if (t > now) best = t
  }
  const planDate = session.plan === 'free' ? session.free_trial_expires_at : session.plan_end_date
  if (planDate) {
    const t = new Date(planDate).getTime()
    if (best === null || t > best) best = t
  }
  if (best === null) return null
  return Math.ceil((best - now) / 86400000)
}

export function useExpiryGuard(session: Session | null) {
  const router = useRouter()

  useEffect(() => {
    if (!session) return
    if (!isAccountExpired(session)) return

    router.push('/expired')
  }, [session, router])
}
