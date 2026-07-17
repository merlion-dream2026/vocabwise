import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'
import { getEffectivePlan } from '@/lib/planUtils'

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
    process.env.VAPID_SUBJECT ?? `mailto:${process.env.ADMIN_ALERT_EMAIL ?? process.env.GMAIL_USER ?? 'admin@vocabwise.id.vn'}`,
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

  const { data: rawSubs, error: subErr } = await supabase
    .from('push_subscriptions')
    .select('id, subscription, family_id')
  if (subErr) throw subErr
  if (!rawSubs?.length) return { sent: 0, skipped: 0, failed: 0, removed: 0 }

  // Push is a Pro-only perk — drop subscriptions for families whose plan has since lapsed
  // (subscribe is gated too, but a family can downgrade after subscribing).
  const rawFamilyIds = [...new Set(rawSubs.map(s => s.family_id).filter(Boolean))]
  const { data: families } = await supabase
    .from('families')
    .select('id, plan, plan_end_date, bonus_pro_expires_at, bonus_features')
    .in('id', rawFamilyIds)
  const proFamilyIds = new Set(
    (families ?? []).filter(f => getEffectivePlan(f).isProActive).map(f => f.id)
  )
  const staleSubIds = rawSubs.filter(s => !proFamilyIds.has(s.family_id)).map(s => s.id)
  if (staleSubIds.length) {
    await supabase.from('push_subscriptions').delete().in('id', staleSubIds)
  }
  const subs = rawSubs.filter(s => proFamilyIds.has(s.family_id))
  let removed = staleSubIds.length
  if (!subs.length) return { sent: 0, skipped: 0, failed: 0, removed }

  const familyIds = [...new Set(subs.map(s => s.family_id).filter(Boolean))]

  // Batch-fetch children for these families
  const { data: allChildren } = await supabase
    .from('children')
    .select('id, name, family_id')
    .in('family_id', familyIds)

  const childIds = (allChildren ?? []).map(c => c.id)

  // Batch-fetch vocab_sync streak + SRS data (one row per child per level)
  const { data: syncRows } = childIds.length
    ? await supabase.from('vocab_sync').select('child_id, streak, srs').in('child_id', childIds)
    : { data: [] }

  // Build per-child: { lastActive: string, streakCurrent: number, dueCount: number }
  // dueCount = words whose SM-2 `due` date (set by applySrsAnswer in GameSyncContext)
  // has arrived — i.e. words the forgetting curve says are about to be forgotten,
  // summed across all Daily levels the child has progress in.
  type ChildMeta = { lastActive: string; streakCurrent: number; dueCount: number }
  const childMeta: Record<string, ChildMeta> = {}
  for (const row of syncRows ?? []) {
    const s = row.streak as { current?: number; lastActive?: string } | null
    const cur = s?.current ?? 0
    const la = s?.lastActive ?? ''
    const srsMap = (row.srs as Record<string, { due?: string }> | null) ?? {}
    const dueHere = Object.values(srsMap).filter(e => (e?.due ?? '') <= todayVN).length

    const prev = childMeta[row.child_id]
    if (!prev) {
      childMeta[row.child_id] = { streakCurrent: cur, lastActive: la, dueCount: dueHere }
    } else {
      prev.dueCount += dueHere
      if (cur > prev.streakCurrent) { prev.streakCurrent = cur; prev.lastActive = la }
    }
  }

  // Build per-family: children list
  const familyChildren: Record<string, Array<{ id: string; name: string }>> = {}
  for (const c of allChildren ?? []) {
    if (!familyChildren[c.family_id]) familyChildren[c.family_id] = []
    familyChildren[c.family_id].push({ id: c.id, name: c.name })
  }

  let sent = 0; let skipped = 0; let failed = 0

  await Promise.all(subs.map(async (row) => {
    const fid = row.family_id
    const children = familyChildren[fid] ?? []

    // Skip if any child already studied today
    const studiedToday = children.some(c => (childMeta[c.id]?.lastActive ?? '').startsWith(todayVN))
    if (studiedToday) { skipped++; return }

    // Personalize: pick child with highest streak (for streak copy) and sum due
    // reviews across all children (for forgetting-curve copy)
    const bestChild = children.reduce<{ name: string; streak: number } | null>((best, c) => {
      const streak = childMeta[c.id]?.streakCurrent ?? 0
      return !best || streak > best.streak ? { name: c.name, streak } : best
    }, null)
    const familyDueCount = children.reduce((sum, c) => sum + (childMeta[c.id]?.dueCount ?? 0), 0)

    let title = '📚 Học từ vựng hôm nay nào!'
    let body = 'Duy trì streak — bé học 10 phút mỗi ngày!'
    if (familyDueCount > 0) {
      // Forgetting-curve nudge takes priority — these words are past their SM-2 due
      // date, i.e. the model predicts they're about to be forgotten.
      title = `⏰ ${familyDueCount} từ sắp quên!`
      body = 'Ôn lại ngay trước khi bé quên hẳn — chỉ mất 5 phút với chế độ Ôn tập 🧠'
    } else if (bestChild) {
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
