import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from '@/lib/email'
import {
  inactive3dEmailHtml,
  inactive7dEmailHtml,
  inactive14dEmailHtml,
  winback30dEmailHtml,
} from '@/lib/emailTemplates'
import {
  hasEmailBeenSentInDays,
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
 * Daily cron: re-engagement emails when a family goes inactive.
 * 3d · 7d · 14d (Pro only) · 30d (win-back)
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const day3  = dateStrDaysAgo(3)
  const day7  = dateStrDaysAgo(7)
  const day14 = dateStrDaysAgo(14)
  const day30 = dateStrDaysAgo(30)

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
    const isPro       = (family.plan as string) !== 'free'

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
      if (familyLastActive === day3) {
        if (await hasEmailBeenSentInDays(famId, 'inactive_3d', 7)) return
        await sendEmail({
          to: family.email as string,
          subject: `📚 ${focusChild.name} chưa học 3 ngày — 5 phút thôi!`,
          html: inactive3dEmailHtml(displayName, focusChild.name, focusChildStreak),
        })
        await logEmail(famId, 'inactive_3d')
        sent++
      } else if (familyLastActive === day7) {
        if (await hasEmailBeenSentInDays(famId, 'inactive_7d', 14)) return
        await sendEmail({
          to: family.email as string,
          subject: `📚 ${focusChild.name} chưa học 1 tuần — nhắc bé học hôm nay nhé!`,
          html: inactive7dEmailHtml(displayName, focusChild.name, focusChildStreak, 0),
        })
        await logEmail(famId, 'inactive_7d')
        sent++
      } else if (familyLastActive === day14 && isPro) {
        if (await hasEmailBeenSentInDays(famId, 'inactive_14d', 30)) return
        const planEnd = family.plan_end_date
          ? new Date(family.plan_end_date as string).toLocaleDateString('vi-VN', {
              day: '2-digit', month: '2-digit', year: 'numeric',
            })
          : '—'
        await sendEmail({
          to: family.email as string,
          subject: 'Chúng tôi nhớ bạn 🙏 — mọi thứ có ổn không?',
          html: inactive14dEmailHtml(displayName, planEnd),
        })
        await logEmail(famId, 'inactive_14d')
        sent++
      } else if (familyLastActive === day30) {
        if (await hasEmailBeenSentInDays(famId, 'winback_30d', 90)) return
        const childName = kids.length === 1 ? kids[0].name : undefined
        await sendEmail({
          to: family.email as string,
          subject: 'VocabWise có gì mới — bạn có muốn xem không? 👀',
          html: winback30dEmailHtml(displayName, childName),
        })
        await logEmail(famId, 'winback_30d')
        sent++
      }
    } catch (e) {
      errors.push(`${family.username}: ${String(e)}`)
    }
  })

  return NextResponse.json({ sent, errors })
}
