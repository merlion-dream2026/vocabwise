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
  initVapid()

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

function initVapid() {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? 'mailto:vocab.kids.pro@gmail.com',
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  )
}

/** Smart daily push — only targets families where no child studied today (Vietnam time UTC+7) */
export async function sendSmartDailyPush(): Promise<{ sent: number; skipped: number; failed: number; removed: number }> {
  initVapid()

  // Today's date in Vietnam timezone (UTC+7) → "YYYY-MM-DD"
  const nowVN = new Date(Date.now() + 7 * 3600_000)
  const todayVN = nowVN.toISOString().slice(0, 10)

  const { data: subs, error: subErr } = await supabase
    .from('push_subscriptions')
    .select('id, subscription, family_id')
  if (subErr) throw subErr
  if (!subs?.length) return { sent: 0, skipped: 0, failed: 0, removed: 0 }

  const familyIds = [...new Set(subs.map(s => s.family_id).filter(Boolean))]

  // Batch-fetch children for these families
  const { data: allChildren } = await supabase
    .from('children')
    .select('id, name, family_id')
    .in('family_id', familyIds)

  const childIds = (allChildren ?? []).map(c => c.id)

  // Batch-fetch vocab_sync streak data
  const { data: syncRows } = childIds.length
    ? await supabase.from('vocab_sync').select('child_id, streak').in('child_id', childIds)
    : { data: [] }

  // Build per-child: { lastActive: string, streakCurrent: number }
  type ChildMeta = { lastActive: string; streakCurrent: number }
  const childMeta: Record<string, ChildMeta> = {}
  for (const row of syncRows ?? []) {
    const s = row.streak as { current?: number; lastActive?: string } | null
    const cur = s?.current ?? 0
    const la = s?.lastActive ?? ''
    const prev = childMeta[row.child_id]
    if (!prev || cur > prev.streakCurrent) {
      childMeta[row.child_id] = { streakCurrent: cur, lastActive: la }
    }
  }

  // Build per-family: children list
  const familyChildren: Record<string, Array<{ id: string; name: string }>> = {}
  for (const c of allChildren ?? []) {
    if (!familyChildren[c.family_id]) familyChildren[c.family_id] = []
    familyChildren[c.family_id].push({ id: c.id, name: c.name })
  }

  let sent = 0; let skipped = 0; let failed = 0; let removed = 0

  await Promise.all(subs.map(async (row) => {
    const fid = row.family_id
    const children = familyChildren[fid] ?? []

    // Skip if any child already studied today
    const studiedToday = children.some(c => (childMeta[c.id]?.lastActive ?? '').startsWith(todayVN))
    if (studiedToday) { skipped++; return }

    // Personalize: pick child with highest streak
    const bestChild = children.reduce<{ name: string; streak: number } | null>((best, c) => {
      const streak = childMeta[c.id]?.streakCurrent ?? 0
      return !best || streak > best.streak ? { name: c.name, streak } : best
    }, null)

    let title = '📚 Học từ vựng hôm nay nào!'
    let body = 'Duy trì streak — bé học 10 phút mỗi ngày!'
    if (bestChild) {
      if (bestChild.streak > 0) {
        title = `🔥 ${bestChild.name} đang có streak ${bestChild.streak} ngày!`
        body = `Đừng để mất streak — học 10 phút thôi là đủ 💪`
      } else {
        title = `📚 ${bestChild.name} chưa học hôm nay!`
        body = 'Bắt đầu streak mới ngay hôm nay — chỉ 10 phút thôi!'
      }
    }

    try {
      await webpush.sendNotification(
        row.subscription as webpush.PushSubscription,
        JSON.stringify({ title, body, url: '/kids' })
      )
      sent++
    } catch (err: unknown) {
      const statusCode = (err as { statusCode?: number }).statusCode
      if (statusCode === 410 || statusCode === 404) {
        await supabase.from('push_subscriptions').delete().eq('id', row.id)
        removed++
      } else { failed++ }
    }
  }))

  return { sent, skipped, failed, removed }
}

/** Gửi push notification đến 1 family cụ thể (dùng cho referral rewards) */
export async function sendPushToFamily(familyId: string, payload: PushPayload): Promise<void> {
  initVapid()

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
