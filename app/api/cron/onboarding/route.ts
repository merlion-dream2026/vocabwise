import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from '@/lib/email'
import {
  onboardingD1EmailHtml,
  onboardingD3EmailHtml,
  onboardingD7EmailHtml,
} from '@/lib/emailTemplates'
import {
  hasEmailBeenSent,
  logEmail,
  getFamilyStats,
  getFamilyLastActive,
  daysSince,
} from '@/lib/emailLog'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Daily cron: onboarding drip emails for new users.
 * D+1 (no activity) · D+3 (has activity, streak summary) · D+7 (week summary)
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch families created in last 8 days with email
  const since = new Date(Date.now() - 8 * 86_400_000).toISOString()
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

  for (const family of families) {
    const famId = family.id as string
    const displayName = (family.name as string | null) ?? (family.username as string)
    const daysOld = daysSince(family.created_at as string)

    try {
      if (daysOld === 1) {
        if (await hasEmailBeenSent(famId, 'onboarding_d1')) continue
        const lastActive = await getFamilyLastActive(famId)
        if (lastActive) continue  // has activity — skip D+1, will catch at D+3
        await sendEmail({
          to: family.email as string,
          subject: '⏱ Bắt đầu hành trình tiếng Anh chỉ mất 5 phút',
          html: onboardingD1EmailHtml(displayName),
        })
        await logEmail(famId, 'onboarding_d1')
        sent++
      } else if (daysOld === 3) {
        if (await hasEmailBeenSent(famId, 'onboarding_d3')) continue
        const lastActive = await getFamilyLastActive(famId)
        if (!lastActive) continue  // no activity yet — skip
        const stats = await getFamilyStats(famId)
        await sendEmail({
          to: family.email as string,
          subject: `🔥 ${stats.streak} ngày học liên tiếp — bạn đang đi đúng hướng!`,
          html: onboardingD3EmailHtml(
            displayName,
            stats.streak,
            stats.totalWords,
            stats.totalTopics,
          ),
        })
        await logEmail(famId, 'onboarding_d3')
        sent++
      } else if (daysOld === 7) {
        if (await hasEmailBeenSent(famId, 'onboarding_d7')) continue
        const lastActive = await getFamilyLastActive(famId)
        const hasActivity = lastActive !== null
        let streak = 0, words = 0, topics = 0
        if (hasActivity) {
          const stats = await getFamilyStats(famId)
          streak = stats.streak
          words  = stats.totalWords
          topics = stats.totalTopics
        }
        await sendEmail({
          to: family.email as string,
          subject: '📖 1 tuần với VocabWise — nhìn lại hành trình của bạn',
          html: onboardingD7EmailHtml(displayName, streak, words, topics, hasActivity),
        })
        await logEmail(famId, 'onboarding_d7')
        sent++
      }
    } catch (e) {
      errors.push(`${family.username}: ${String(e)}`)
    }
  }

  return NextResponse.json({ sent, errors })
}
