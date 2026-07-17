import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export type NotificationType =
  | 'referral_signup_reward' | 'referral_paid_reward' | 'gift_redeemed'
  | 'streak_7' | 'streak_30' | 'level_up' | 'topic_mastered_first'
  | 'weekly_report' | 'monthly_recap'
  | 'pro_expiry_14d' | `renewal_reminder_${number}d` | 'pro_expiry_d1' | 'pro_expiry_d7'
  | 'trial_d4' | 'trial_d6' | 'trial_d7' | 'trial_d8'

export interface CreateNotificationInput {
  familyId: string
  childId?: string | null
  type: NotificationType | string
  title: string
  body: string
  url?: string
  metadata?: object
}

export type Notification = {
  id: string
  family_id: string
  child_id: string | null
  type: string
  title: string
  body: string
  url: string | null
  metadata: Record<string, unknown>
  read_at: string | null
  created_at: string
}

/** Insert a notification. Fire-and-forget (errors are suppressed, never throws) —
 *  call sites already fire push/email the same way and must not be blocked by this. */
export async function createNotification(input: CreateNotificationInput): Promise<void> {
  await supabase.from('notifications').insert({
    family_id: input.familyId,
    child_id: input.childId ?? null,
    type: input.type,
    title: input.title,
    body: input.body,
    url: input.url ?? null,
    metadata: input.metadata ?? {},
  }).then(({ error }) => {
    if (error) console.error('[notifications] insert error:', error.message)
  })
}

export async function listNotifications(
  familyId: string,
  limit = 30,
  before?: string
): Promise<Notification[]> {
  let q = supabase
    .from('notifications')
    .select('*')
    .eq('family_id', familyId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (before) q = q.lt('created_at', before)
  const { data, error } = await q
  if (error) throw error
  return (data ?? []) as Notification[]
}

export async function getUnreadCount(familyId: string): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('family_id', familyId)
    .is('read_at', null)
  if (error) throw error
  return count ?? 0
}

/** Marks one notification read. Scoped by family_id (not just id) so a family can never
 *  mark-read another family's row even though this runs behind the service-role key. */
export async function markRead(familyId: string, id: string): Promise<void> {
  await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id)
    .eq('family_id', familyId)
}

export async function markAllRead(familyId: string): Promise<void> {
  await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('family_id', familyId)
    .is('read_at', null)
}
