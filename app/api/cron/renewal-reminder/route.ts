import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from '@/lib/email'
import { renewalReminderEmailHtml, trialExpiryReminderEmailHtml } from '@/lib/emailTemplates'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const PLAN_LABELS: Record<string, string> = {
  '1month': '1 tháng',
  '3months': '3 tháng',
  '6months': '6 tháng',
}

// Returns how many whole days until the given ISO date string.
// e.g. "exactly 7 days away" means floor = 7 (between 6.5 and 7.5 days)
function daysUntilFloor(dateStr: string): number {
  return Math.floor((new Date(dateStr).getTime() - Date.now()) / 86400000)
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let sent = 0
  let skipped = 0
  const errors: string[] = []

  try {
    const { data: families, error } = await supabase
      .from('families')
      .select('id, username, name, email, plan, plan_end_date, free_trial_expires_at, disabled')
      .eq('disabled', false)
      .not('email', 'is', null)
      .neq('email', '')

    if (error) throw error
    if (!families?.length) return NextResponse.json({ sent: 0, skipped: 0, errors: [], note: 'no families with email' })

    for (const family of families) {
      const displayName = (family.name as string | null) ?? (family.username as string)

      try {
        if (family.plan !== 'free') {
          // Pro user — remind at 7 or 1 days before plan_end_date
          if (!family.plan_end_date) { skipped++; continue }
          const daysLeft = daysUntilFloor(family.plan_end_date as string)
          if (daysLeft !== 7 && daysLeft !== 1) { skipped++; continue }

          const planLabel = PLAN_LABELS[family.plan as string] ?? (family.plan as string)
          const html = renewalReminderEmailHtml(displayName, daysLeft, planLabel)
          const subject = daysLeft <= 1
            ? '⏰ Tài khoản Pro sắp hết hạn hôm nay — Gia hạn ngay!'
            : `⏰ Còn ${daysLeft} ngày — Gia hạn VocabKids Pro`
          await sendEmail({ to: family.email as string, subject, html })
          sent++
        } else {
          // Free user — remind at 3 or 1 days before free_trial_expires_at
          if (!family.free_trial_expires_at) { skipped++; continue }
          const daysLeft = daysUntilFloor(family.free_trial_expires_at as string)
          if (daysLeft !== 3 && daysLeft !== 1) { skipped++; continue }

          const html = trialExpiryReminderEmailHtml(displayName, daysLeft)
          const subject = daysLeft <= 1
            ? '⏰ Hôm nay là ngày cuối dùng thử — Nâng cấp Pro!'
            : `⏰ Còn ${daysLeft} ngày dùng thử — Nâng cấp để học tiếp!`
          await sendEmail({ to: family.email as string, subject, html })
          sent++
        }
      } catch (e) {
        errors.push(`${family.username}: ${String(e)}`)
      }
    }
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }

  // Cleanup: referrals pending > 14 ngày → đánh dấu expired
  try {
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
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
