import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface PushPayload {
  title: string
  body: string
  url?: string
}

export async function sendPushToAll(payload: PushPayload): Promise<{ sent: number; failed: number; removed: number }> {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? 'mailto:vocab.kids.pro@gmail.com',
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  )

  const { data: subscriptions, error } = await supabase
    .from('push_subscriptions')
    .select('id, subscription')

  if (error) throw error
  if (!subscriptions?.length) return { sent: 0, failed: 0, removed: 0 }

  let sent = 0
  let failed = 0
  let removed = 0

  await Promise.all(
    subscriptions.map(async (row) => {
      try {
        await webpush.sendNotification(
          row.subscription as webpush.PushSubscription,
          JSON.stringify(payload)
        )
        sent++
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number }).statusCode
        if (statusCode === 410 || statusCode === 404) {
          // Subscription expired/invalid — remove from DB
          await supabase.from('push_subscriptions').delete().eq('id', row.id)
          removed++
        } else {
          failed++
        }
      }
    })
  )

  return { sent, failed, removed }
}

/** Gửi push notification đến 1 family cụ thể (dùng cho referral rewards) */
export async function sendPushToFamily(familyId: string, payload: PushPayload): Promise<void> {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? 'mailto:vocab.kids.pro@gmail.com',
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  )

  const { data: row } = await supabase
    .from('push_subscriptions')
    .select('id, subscription')
    .eq('family_id', familyId)
    .maybeSingle()

  if (!row) return

  try {
    await webpush.sendNotification(
      row.subscription as webpush.PushSubscription,
      JSON.stringify(payload)
    )
  } catch (err: unknown) {
    const statusCode = (err as { statusCode?: number }).statusCode
    if (statusCode === 410 || statusCode === 404) {
      // Subscription hết hạn → xóa khỏi DB
      await supabase.from('push_subscriptions').delete().eq('id', row.id)
    }
    // Các lỗi khác: silent fail (không throw)
  }
}
