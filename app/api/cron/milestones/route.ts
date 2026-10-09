import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from '@/lib/email'
import { levelUpEmailHtml } from '@/lib/emailTemplates'
import {
  hasEmailBeenSent,
  hasEngagementEmailInDays,
  logEmail,
  getFamilyStats,
  dateStrDaysAgo,
  NEXT_DAILY_LEVEL,
  DAILY_LEVEL_LABELS,
} from '@/lib/emailLog'
import {
  getDailyProgress,
  getGlobalStreak,
  DAILY_LEVEL_ORDER,
  DAILY_TOTAL_TOPICS,
} from '@/lib/childProgress'
import { runInBatches } from '@/lib/batchProcess'

export const maxDuration = 60

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Daily cron: one milestone email — a child finished a Daily level (rare, meaningful).
 * Streak 7/30 and "first topic mastered" emails were dropped: the app already shows
 * streaks/badges, and they made the inbox feel pushy.
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: families, error } = await supabase
    .from('families')
    .select('id, username, name, email')
    .eq('disabled', false)
    .not('email', 'is', null)
    .neq('email', '')

  if (error || !families?.length) return NextResponse.json({ sent: 0, note: 'no families' })

  // Only congratulate levels finished recently (activity on that level in the last 2 days),
  // so levels completed long ago — e.g. while this cron was down — never get a late email.
  const recentSince = dateStrDaysAgo(2)

  let sent = 0
  const errors: string[] = []

  await runInBatches(families, 5, async (family) => {
    const famId = family.id as string
    const displayName = (family.name as string | null) ?? (family.username as string)

    try {
      const stats = await getFamilyStats(famId)

      for (const child of stats.children) {
        const childSync = stats.syncByChild[child.id]
        if (!childSync) continue

        for (const level of DAILY_LEVEL_ORDER) {
          if (!(level in NEXT_DAILY_LEVEL)) continue  // 'master' has no next level
          const levelSync = childSync[level]
          if (!levelSync) continue

          const progress = getDailyProgress(levelSync, level)
          if (progress.topicsCompleted < DAILY_TOTAL_TOPICS) continue

          const lastActiveOnLevel = Object.keys(levelSync.history ?? {}).sort().at(-1) ?? ''
          if (lastActiveOnLevel < recentSince) continue

          const emailType = `level_up_${child.id}_${level}`
          if (await hasEmailBeenSent(famId, emailType)) continue
          if (await hasEngagementEmailInDays(famId)) return  // cap hit — try again tomorrow

          let levelGames = 0
          for (const entry of Object.values(levelSync.history ?? {})) {
            levelGames += (entry as { games?: number }).games ?? 0
          }

          const nextInfo = NEXT_DAILY_LEVEL[level]
          const childStreak = getGlobalStreak(childSync).current

          await sendEmail({
            to: family.email as string,
            subject: `🎓 Bé ${child.name} vừa lên level — chúc mừng!`,
            html: levelUpEmailHtml(
              displayName,
              child.name,
              DAILY_LEVEL_LABELS[level] ?? level,
              nextInfo.label,
              nextInfo.desc,
              progress.seenWords,
              levelGames,
              childStreak,
              progress.topicsCompleted,  // all topics mastered = excellence
            ),
          })
          await logEmail(famId, emailType)
          sent++
          return  // one email per family per run
        }
      }
    } catch (e) {
      errors.push(`${family.username}: ${String(e)}`)
    }
  })

  return NextResponse.json({ sent, errors })
}
