import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from '@/lib/email'
import { onboardingD1EmailHtml } from '@/lib/emailTemplates'
import {
  hasEmailBeenSent,
  hasEngagementEmailInDays,
  logEmail,
  getFamilyLastActive,
  daysSince,
} from '@/lib/emailLog'
import { runInBatches } from '@/lib/batchProcess'

export const maxDuration = 60

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Daily cron: one onboarding email — D+1, only if the family hasn't started learning yet.
 * (Former D+3 / D+7 drips dropped: D+7 overlapped the weekly report.)
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch families created in the last 2 days with email
  const since = new Date(Date.now() - 2 * 86_400_000).toISOString()
  const { data: families, error } = await supabase
    .from('families')
    .select('id, username, name, email, created_at')
    .eq('disabled', false)
    .not('email', 'is', null)
    .neq('email', '')
    .gte('created_at', since)

  if (error || !families?.length) return NextResponse.json({ sent: 0, note: 'no new families' })

  let sent = 0
  const errors: string[] = []

  await runInBatches(families, 5, async (family) => {
    const famId = family.id as string
    const displayName = (family.name as string | null) ?? (family.username as string)
    const daysOld = daysSince(family.created_at as string)

    try {
      if (daysOld !== 1) return
      if (await hasEmailBeenSent(famId, 'onboarding_d1')) return
      const lastActive = await getFamilyLastActive(famId)
      if (lastActive) return  // already learning — no nudge needed
      if (await hasEngagementEmailInDays(famId)) return
      await sendEmail({
        to: family.email as string,
        subject: '⏱ Bắt đầu hành trình tiếng Anh chỉ mất 5 phút',
        html: onboardingD1EmailHtml(displayName),
      })
      await logEmail(famId, 'onboarding_d1')
      sent++
    } catch (e) {
      errors.push(`${family.username}: ${String(e)}`)
    }
  })

  return NextResponse.json({ sent, errors })
}
