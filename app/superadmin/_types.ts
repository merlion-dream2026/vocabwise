export type Family = {
  id: string
  username: string
  email: string | null
  name: string | null
  phone: string | null
  referral_source: string | null
  plan: string
  disabled: boolean
  email_verified: boolean
  created_at: string
  free_trial_expires_at: string | null
  plan_start_date: string | null
  plan_end_date: string | null
  max_kids: number | null
  admin_note: string | null
  bonus_features: string[] | null
  last_active?: string | null
  children_count?: number
}
