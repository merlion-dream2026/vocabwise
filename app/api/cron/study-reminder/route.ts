import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from '@/lib/email'
import { inactive7dEmailHtml } from '@/lib/emailTemplates'
import {
  hasEmailBeenSentInDays,
  hasEngagementEmailInDays,
  logEmail,
  dateStrDaysAgo,
} from '@/lib/emailLog'
import { getGlobalStreak, type SyncAllLevels } from '@/lib/childProgress'
import { runInBatches } from '@/lib/batchProcess'

export const maxDuration = 60

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Daily cron: one gentle re-engagement email when a family has been inactive exactly 7 days
 * (max once per 30 days). Day-to-day nudging is the parent-scheduled push, not email.
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const day7 = dateStrDaysAgo(7)

  const { data: families, error: famErr } = await supabase
    .from('families')
    .select('id, username, name, email, plan, plan_end_date')
    .eq('disabled', false)
    .not('email', 'is', null)
    .neq('email', '')

  if (famErr || !families?.length) return NextResponse.json({ sent: 0, note: 'no families' })

  const famIds = families.map(f => f.id as string)

  const { data: children } = await supabase
    .from('children')
    .select('id, family_id, name')
    .in('family_id', famIds)

  if (!children?.length) return NextResponse.json({ sent: 0, note: 'no children' })

  const childIds = children.map(c => c.id as string)

  const { data: syncRows } = await supabase
    .from('vocab_sync')
    .select('child_id, level, streak, history, mastery')
    .in('child_id', childIds)

  // Build per-child: lastActive and syncAllLevels
  const lastActiveMap: Record<string, string> = {}
  const syncByChild: Record<string, SyncAllLevels> = {}
  for (const row of syncRows ?? []) {
    const cid = row.child_id as string
    const la = (row.streak as { lastActive?: string } | null)?.lastActive ?? ''
    if (la > (lastActiveMap[cid] ?? '')) lastActiveMap[cid] = la
    if (!syncByChild[cid]) syncByChild[cid] = {}
    syncByChild[cid][row.level as string] = {
      seen:    [],
      mastery: row.mastery ?? {},
      history: row.history ?? {},
    }
  }

  // Group children by family
  const byFamily: Record<string, typeof children> = {}
  for (const child of children) {
    if (!byFamily[child.family_id]) byFamily[child.family_id] = []
    byFamily[child.family_id].push(child)
  }

  let sent = 0
  const errors: string[] = []

  await runInBatches(families, 5, async (family) => {
    const famId = family.id as string
    const kids  = byFamily[famId] ?? []
    if (!kids.length) return

    const displayName = (family.name as string | null) ?? (family.username as string)

    // Family-level lastActive = max across all children
    let familyLastActive = ''
    for (const kid of kids) {
      const la = lastActiveMap[kid.id] ?? ''
      if (la > familyLastActive) familyLastActive = la
    }
    if (!familyLastActive) return  // never learned → handled by onboarding cron

    // Pick the child with the oldest lastActive to highlight in the email
    let focusChild = kids[0]
    let focusChildLA = lastActiveMap[kids[0].id] ?? ''
    for (const kid of kids) {
      const la = lastActiveMap[kid.id] ?? ''
      if (!la || la < focusChildLA) {
        focusChild = kid
        focusChildLA = la
      }
    }

    const focusChildStreak = getGlobalStreak(syncByChild[focusChild.id] ?? {}).current

    try {
      if (familyLastActive !== day7) return
      if (await hasEmailBeenSentInDays(famId, 'inactive_7d', 30)) return
      if (await hasEngagementEmailInDays(famId)) return
      await sendEmail({
        to: family.email as string,
        subject: `📚 ${focusChild.name} chưa học 1 tuần — nhắc bé học hôm nay nhé!`,
        html: inactive7dEmailHtml(displayName, focusChild.name, focusChildStreak, 0),
      })
      await logEmail(famId, 'inactive_7d')
      sent++
    } catch (e) {
      errors.push(`${family.username}: ${String(e)}`)
    }
  })

  return NextResponse.json({ sent, errors })
}
