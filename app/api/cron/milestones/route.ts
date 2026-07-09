import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from '@/lib/email'
import {
  streak7EmailHtml,
  streak30EmailHtml,
  levelUpEmailHtml,
  topicMasteredEmailHtml,
} from '@/lib/emailTemplates'
import {
  hasEmailBeenSent,
  logEmail,
  getFamilyStats,
  daysSince,
  NEXT_DAILY_LEVEL,
  DAILY_LEVEL_LABELS,
} from '@/lib/emailLog'
import {
  getDailyProgress,
  getGlobalStreak,
  DAILY_LEVEL_ORDER,
  DAILY_TOTAL_TOPICS,
  type SyncLevel,
} from '@/lib/childProgress'
import { runInBatches } from '@/lib/batchProcess'

export const maxDuration = 60

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Daily cron: milestone emails — streak 7/30, Daily level-up, Academic topic mastered.
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

  // Recently completed academic topics (last 25 hours)
  const since25h = new Date(Date.now() - 25 * 3600_000).toISOString()
  const { data: recentTopics } = await supabase
    .from('vw_user_topic_progress')
    .select('child_id, topic_id, total_score, completed_at')
    .not('completed_at', 'is', null)
    .gte('completed_at', since25h)

  // Join topic titles
  const topicIds = [...new Set((recentTopics ?? []).map(r => r.topic_id as string))]
  const topicTitleMap: Record<string, string> = {}
  if (topicIds.length > 0) {
    const { data: topicRows } = await supabase
      .from('vw_topics')
      .select('topic_id, topic_title')
      .in('topic_id', topicIds)
    for (const t of topicRows ?? []) {
      topicTitleMap[t.topic_id as string] = t.topic_title as string
    }
  }

  // Map childId → completed topics today
  const recentByChild: Record<string, typeof recentTopics> = {}
  for (const row of recentTopics ?? []) {
    const cid = row.child_id as string
    if (!recentByChild[cid]) recentByChild[cid] = []
    recentByChild[cid]!.push(row)
  }

  let sent = 0
  const errors: string[] = []

  await runInBatches(families, 5, async (family) => {
    const famId = family.id as string
    const displayName = (family.name as string | null) ?? (family.username as string)

    try {
      const stats = await getFamilyStats(famId)

      // ── Streak milestones ──────────────────────────────────────────────────
      if (stats.streak === 7 && !await hasEmailBeenSent(famId, 'streak_7')) {
        await sendEmail({
          to: family.email as string,
          subject: '🔥 7 ngày liên tiếp — bạn thuộc top 10% người học!',
          html: streak7EmailHtml(
            displayName,
            stats.totalWords,
            stats.dailyTopics + stats.academicTopics,
            stats.totalGames,
          ),
        })
        await logEmail(famId, 'streak_7')
        sent++
      }

      if (stats.streak === 30 && !await hasEmailBeenSent(famId, 'streak_30')) {
        // totalActiveDays: families with >0 history entries across all children
        let activeDays = 0
        for (const childSync of Object.values(stats.syncByChild)) {
          const dates = new Set<string>()
          for (const lv of Object.values(childSync)) {
            for (const [date] of Object.entries((lv as SyncLevel).history ?? {})) {
              dates.add(date)
            }
          }
          activeDays = Math.max(activeDays, dates.size)
        }
        await sendEmail({
          to: family.email as string,
          subject: '🏆 30 ngày không nghỉ — bạn chính thức là người học kỷ luật nhất!',
          html: streak30EmailHtml(
            displayName,
            stats.totalWords,
            stats.dailyTopics + stats.academicTopics,
            activeDays,
          ),
        })
        await logEmail(famId, 'streak_30')
        sent++
      }

      // ── Daily level-up (per child, per level) ─────────────────────────────
      for (const child of stats.children) {
        const childSync = stats.syncByChild[child.id]
        if (!childSync) continue

        for (const level of DAILY_LEVEL_ORDER) {
          if (!(level in NEXT_DAILY_LEVEL)) continue  // 'master' has no next level
          const levelSync = childSync[level]
          if (!levelSync) continue

          const progress = getDailyProgress(levelSync, level)
          if (progress.topicsCompleted < DAILY_TOTAL_TOPICS) continue

          const emailType = `level_up_${child.id}_${level}`
          if (await hasEmailBeenSent(famId, emailType)) continue

          // Count games for this level
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
        }
      }

      // ── Academic topic mastered (first mastered topic per family) ──────────
      const emailTypeFirstTopicMastered = 'topic_mastered_first'
      if (!await hasEmailBeenSent(famId, emailTypeFirstTopicMastered)) {
        // Find a recently-completed topic by any child in this family
        for (const child of stats.children) {
          const childRecent = recentByChild[child.id]
          if (!childRecent?.length) continue

          const topicRow = childRecent[0]!
          const topicTitle = topicTitleMap[topicRow.topic_id as string] ?? (topicRow.topic_id as string)
          const totalScore = (topicRow.total_score as number) ?? 0
          const pct = Math.round(totalScore / 25 * 100)

          await sendEmail({
            to: family.email as string,
            subject: '✅ Topic MASTERED — bạn đang học đúng cách!',
            html: topicMasteredEmailHtml(
              displayName,
              topicTitle,
              totalScore,
              25,
              pct,
              undefined,
            ),
          })
          await logEmail(famId, emailTypeFirstTopicMastered)
          sent++
          break
        }
      }

    } catch (e) {
      errors.push(`${family.username}: ${String(e)}`)
    }
  })

  return NextResponse.json({ sent, errors })
}
