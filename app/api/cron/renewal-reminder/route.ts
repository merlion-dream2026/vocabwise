import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from '@/lib/email'
import {
  renewalReminderEmailHtml,
  trialD4EmailHtml,
  trialD6EmailHtml,
  trialD7EmailHtml,
  trialD8EmailHtml,
  proExpiry14dEmailHtml,
  proExpiryD1EmailHtml,
  proExpiryD7EmailHtml,
} from '@/lib/emailTemplates'
import {
  hasEmailBeenSent,
  logEmail,
  getFamilyStats,
} from '@/lib/emailLog'
import { runInBatches } from '@/lib/batchProcess'
import { createNotification } from '@/lib/notifications'

export const maxDuration = 60

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const PLAN_LABELS: Record<string, string> = {
  '1month':  '1 tháng',
  '3months': '3 tháng',
  '6months': '6 tháng',
}

function daysUntilFloor(dateStr: string): number {
  return Math.floor((new Date(dateStr).getTime() - Date.now()) / 86_400_000)
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

/**
 * Daily cron: renewal & expiry reminders.
 *
 * Free/Trial:
 *  daysLeft=3  (D+4)  → trialD4EmailHtml
 *  daysLeft=1  (D+6)  → trialD6EmailHtml
 *  daysLeft=0  (D+7)  → trialD7EmailHtml  (expired today)
 *  daysLeft=-1 (D+8)  → trialD8EmailHtml  (expired yesterday)
 *
 * Pro:
 *  daysLeft=14        → proExpiry14dEmailHtml
 *  daysLeft=7 or 1    → renewalReminderEmailHtml (existing)
 *  daysLeft=-1 (D+1)  → proExpiryD1EmailHtml
 *  daysLeft=-7 (D+7)  → proExpiryD7EmailHtml
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let sent = 0
  let skipped = 0
  const errors: string[] = []

  try {
    const { data: families, error } = await supabase
      .from('families')
      .select('id, username, name, email, plan, plan_start_date, plan_end_date, free_trial_expires_at, disabled')
      .eq('disabled', false)
      .not('email', 'is', null)
      .neq('email', '')

    if (error) throw error
    if (!families?.length) return NextResponse.json({ sent: 0, skipped: 0, errors: [], note: 'no families' })

    await runInBatches(families, 5, async (family) => {
      const famId      = family.id as string
      const displayName = (family.name as string | null) ?? (family.username as string)
      const planLabel  = PLAN_LABELS[family.plan as string] ?? (family.plan as string)

      try {
        if (family.plan !== 'free') {
          // ── Pro user ──────────────────────────────────────────────────────
          if (!family.plan_end_date) { skipped++; return }
          const daysLeft = daysUntilFloor(family.plan_end_date as string)

          if (daysLeft === 14) {
            if (await hasEmailBeenSent(famId, 'pro_expiry_14d')) { skipped++; return }
            const stats = await getFamilyStats(famId)
            await sendEmail({
              to: family.email as string,
              subject: '⏰ Pro còn 2 tuần — gia hạn sớm để không bị gián đoạn',
              html: proExpiry14dEmailHtml(
                displayName,
                planLabel,
                fmtDate(family.plan_end_date as string),
                stats.firstChildName || displayName,
                stats.totalWords,
                stats.streak,
                stats.totalTopics,
              ),
            })
            await logEmail(famId, 'pro_expiry_14d')
            createNotification({
              familyId: famId,
              type: 'pro_expiry_14d',
              title: '⏰ Pro còn 2 tuần',
              body: 'Gia hạn sớm để không bị gián đoạn quá trình học.',
              url: '/dashboard',
            }).catch(() => {})
            sent++
          } else if (daysLeft === 7 || daysLeft === 1) {
            const emailType = `renewal_reminder_${daysLeft}d`
            if (await hasEmailBeenSent(famId, emailType)) { skipped++; return }
            const subject = daysLeft <= 1
              ? '⏰ Tài khoản Pro sắp hết hạn hôm nay — Gia hạn ngay!'
              : `⏰ Còn ${daysLeft} ngày — Gia hạn VocabWise`
            await sendEmail({
              to: family.email as string,
              subject,
              html: renewalReminderEmailHtml(displayName, daysLeft, planLabel),
            })
            await logEmail(famId, emailType)
            createNotification({
              familyId: famId,
              type: emailType,
              title: subject,
              body: `Gói ${planLabel} sắp hết hạn — gia hạn để không mất tiến độ.`,
              url: '/dashboard',
            }).catch(() => {})
            sent++
          } else if (daysLeft === -1) {
            if (await hasEmailBeenSent(famId, 'pro_expiry_d1')) { skipped++; return }
            const stats = await getFamilyStats(famId)
            await sendEmail({
              to: family.email as string,
              subject: 'Tài khoản Pro vừa hết hạn — gia hạn trong 7 ngày để giữ toàn bộ',
              html: proExpiryD1EmailHtml(
                displayName,
                planLabel,
                stats.firstChildName || displayName,
              ),
            })
            await logEmail(famId, 'pro_expiry_d1')
            createNotification({
              familyId: famId,
              type: 'pro_expiry_d1',
              title: 'Tài khoản Pro vừa hết hạn',
              body: 'Gia hạn trong 7 ngày để giữ toàn bộ dữ liệu và tiến độ học.',
              url: '/dashboard',
            }).catch(() => {})
            sent++
          } else if (daysLeft === -7) {
            if (await hasEmailBeenSent(famId, 'pro_expiry_d7')) { skipped++; return }
            const stats = await getFamilyStats(famId)
            await sendEmail({
              to: family.email as string,
              subject: 'Nhắc lần cuối — bé vẫn ở đây khi bạn sẵn sàng 🐣',
              html: proExpiryD7EmailHtml(displayName, stats.firstChildName || undefined),
            })
            await logEmail(famId, 'pro_expiry_d7')
            createNotification({
              familyId: famId,
              type: 'pro_expiry_d7',
              title: 'Nhắc lần cuối 🐣',
              body: 'Bé vẫn ở đây khi bạn sẵn sàng quay lại.',
              url: '/dashboard',
            }).catch(() => {})
            sent++
          } else {
            skipped++
          }
        } else {
          // ── Free/Trial user ───────────────────────────────────────────────
          if (!family.free_trial_expires_at) { skipped++; return }
          const daysLeft = daysUntilFloor(family.free_trial_expires_at as string)

          if (daysLeft === 3) {
            if (await hasEmailBeenSent(famId, 'trial_d4')) { skipped++; return }
            await sendEmail({
              to: family.email as string,
              subject: '⏰ Còn 3 ngày dùng thử — bạn đã thử hết chưa?',
              html: trialD4EmailHtml(displayName),
            })
            await logEmail(famId, 'trial_d4')
            createNotification({
              familyId: famId,
              type: 'trial_d4',
              title: '⏰ Còn 3 ngày dùng thử',
              body: 'Bạn đã thử hết các tính năng chưa?',
              url: '/dashboard',
            }).catch(() => {})
            sent++
          } else if (daysLeft === 1) {
            if (await hasEmailBeenSent(famId, 'trial_d6')) { skipped++; return }
            const stats = await getFamilyStats(famId)
            await sendEmail({
              to: family.email as string,
              subject: 'Ngày cuối dùng thử 🚨 — đừng để mất đà học',
              html: trialD6EmailHtml(displayName, stats.totalWords),
            })
            await logEmail(famId, 'trial_d6')
            createNotification({
              familyId: famId,
              type: 'trial_d6',
              title: 'Ngày cuối dùng thử 🚨',
              body: 'Đừng để mất đà học — nâng cấp để tiếp tục.',
              url: '/dashboard',
            }).catch(() => {})
            sent++
          } else if (daysLeft === 0) {
            if (await hasEmailBeenSent(famId, 'trial_d7')) { skipped++; return }
            await sendEmail({
              to: family.email as string,
              subject: 'Tài khoản Free từ hôm nay — đây là những gì bạn vẫn có',
              html: trialD7EmailHtml(displayName),
            })
            await logEmail(famId, 'trial_d7')
            createNotification({
              familyId: famId,
              type: 'trial_d7',
              title: 'Tài khoản Free từ hôm nay',
              body: 'Đây là những gì bạn vẫn có — xem chi tiết gói Free.',
              url: '/dashboard',
            }).catch(() => {})
            sent++
          } else if (daysLeft === -1) {
            if (await hasEmailBeenSent(famId, 'trial_d8')) { skipped++; return }
            await sendEmail({
              to: family.email as string,
              subject: 'Còn phân vân? Đây là câu trả lời 🤔',
              html: trialD8EmailHtml(displayName),
            })
            await logEmail(famId, 'trial_d8')
            createNotification({
              familyId: famId,
              type: 'trial_d8',
              title: 'Còn phân vân? 🤔',
              body: 'Đây là câu trả lời — xem gói Pro phù hợp cho gia đình bạn.',
              url: '/dashboard',
            }).catch(() => {})
            sent++
          } else {
            skipped++
          }
        }
      } catch (e) {
        errors.push(`${family.username}: ${String(e)}`)
      }
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }

  // Cleanup: referrals pending > 14 days → mark expired
  try {
    const fourteenDaysAgo = new Date(Date.now() - 14 * 86_400_000).toISOString()
    await supabase
      .from('referrals')
      .update({ status: 'expired' })
      .eq('status', 'pending')
      .lt('created_at', fourteenDaysAgo)
  } catch (e) {
    console.error('[cron] referral cleanup error:', e)
  }

  return NextResponse.json({ sent, skipped, errors })
}
