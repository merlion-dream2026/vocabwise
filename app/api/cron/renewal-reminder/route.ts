import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from '@/lib/email'
import {
  renewalReminderEmailHtml,
  trialD6EmailHtml,
  proExpiryD1EmailHtml,
} from '@/lib/emailTemplates'
import {
  hasEmailBeenSent,
  logEmail,
  getFamilyStats,
} from '@/lib/emailLog'
import { runInBatches } from '@/lib/batchProcess'

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

/**
 * Daily cron: renewal & expiry reminders — kept to the 3 moments that matter.
 *  Free/Trial: daysLeft=1 (last trial day) → trialD6EmailHtml
 *  Pro:        daysLeft=3                  → renewalReminderEmailHtml
 *              daysLeft=-1 (expired D+1)   → proExpiryD1EmailHtml
 * Also expires referrals pending > 14 days.
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
          // ── Pro user: 3 days before expiry · 1 day after ─────────────────
          if (!family.plan_end_date) { skipped++; return }
          const daysLeft = daysUntilFloor(family.plan_end_date as string)

          if (daysLeft === 3) {
            if (await hasEmailBeenSent(famId, 'renewal_reminder_3d')) { skipped++; return }
            await sendEmail({
              to: family.email as string,
              subject: '⏰ Còn 3 ngày — Gia hạn VocabWise',
              html: renewalReminderEmailHtml(displayName, daysLeft, planLabel),
            })
            await logEmail(famId, 'renewal_reminder_3d')
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
            sent++
          } else {
            skipped++
          }
        } else {
          // ── Free/Trial user: last day of the trial only ───────────────────
          if (!family.free_trial_expires_at) { skipped++; return }
          const daysLeft = daysUntilFloor(family.free_trial_expires_at as string)

          if (daysLeft === 1) {
            if (await hasEmailBeenSent(famId, 'trial_d6')) { skipped++; return }
            const stats = await getFamilyStats(famId)
            await sendEmail({
              to: family.email as string,
              subject: 'Ngày cuối dùng thử 🚨 — đừng để mất đà học',
              html: trialD6EmailHtml(displayName, stats.totalWords),
            })
            await logEmail(famId, 'trial_d6')
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
