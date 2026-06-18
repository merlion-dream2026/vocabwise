import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from '@/lib/email'
import { buildMonthlyRecapHtml, calcMonthStats, AllLevelSync, ChildRow, SyncRow } from '@/lib/reportHtml'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type ReportSettings = { monthly_recap?: boolean }

// Runs on the 1st of each month (vercel.json: "0 1 1 * *" = 8:00 AM VN)
// Sends monthly recap to Pro 6m families with monthly_recap enabled
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Allow ?force=true for manual testing
  const force = req.nextUrl.searchParams.get('force') === 'true'
  const vnNow = new Date(Date.now() + 7 * 3600 * 1000)
  if (!force && vnNow.getUTCDate() !== 1) {
    return NextResponse.json({ skipped: `not 1st of month (VN date=${vnNow.getUTCDate()})` })
  }

  // Month being summarised = the month that just ended
  const recapMonth  = new Date(Date.UTC(vnNow.getUTCFullYear(), vnNow.getUTCMonth() - 1, 1))
  const prevMonth   = new Date(Date.UTC(vnNow.getUTCFullYear(), vnNow.getUTCMonth() - 2, 1))

  const toYM    = (d: Date) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
  const toLabel = (d: Date) => `Tháng ${d.getUTCMonth() + 1}/${d.getUTCFullYear()}`

  const recapYM      = toYM(recapMonth)
  const prevYM       = toYM(prevMonth)
  const monthLabel   = toLabel(recapMonth)
  const prevMonthLabel = toLabel(prevMonth)

  // Fetch active Pro 6m families with email
  const { data: families } = await supabase
    .from('families')
    .select('id, username, email, plan, plan_end_date, report_settings')
    .eq('plan', '6months')
    .gt('plan_end_date', new Date().toISOString())
    .eq('disabled', false)
    .not('email', 'is', null)
    .neq('email', '')

  if (!families?.length) return NextResponse.json({ sent: 0, reason: 'no eligible families' })

  const eligible = families.filter(f => {
    const s = (f.report_settings ?? {}) as ReportSettings
    return s.monthly_recap === true
  })

  if (!eligible.length) return NextResponse.json({ sent: 0, reason: 'monthly_recap not enabled' })

  let sent = 0
  const errors: string[] = []

  for (const family of eligible) {
    try {
      const { data: children } = await supabase
        .from('children')
        .select('id, name, emoji, level')
        .eq('family_id', family.id)

      if (!children?.length) continue

      const childIds = (children as ChildRow[]).map(c => c.id)

      // Fetch ALL level syncs for each child (history spans across levels)
      const { data: rawSyncs } = await supabase
        .from('vocab_sync')
        .select('child_id, level, history, streak, mastery, seen, battle, weak_words')
        .in('child_id', childIds)

      const syncsByChild: Record<string, AllLevelSync[]> = {}
      for (const row of rawSyncs ?? []) {
        if (!syncsByChild[row.child_id]) syncsByChild[row.child_id] = []
        syncsByChild[row.child_id].push(row as AllLevelSync)
      }

      const rows = (children as ChildRow[]).map(child => {
        const syncs      = syncsByChild[child.id] ?? []
        const thisMonth  = calcMonthStats(syncs, recapYM)
        const prevMonthStats = calcMonthStats(syncs, prevYM)
        const primarySync = (syncs.find(s => s.level === child.level) ?? syncs[0] ?? null) as SyncRow
        return { child, thisMonth, prevMonth: prevMonthStats, primarySync }
      })

      const html = buildMonthlyRecapHtml(family.username, rows, monthLabel, prevMonthLabel, recapYM)
      await sendEmail({
        to: family.email,
        subject: `📅 Tổng kết ${monthLabel} — VocabWise`,
        html,
      })
      sent++
    } catch (e) {
      errors.push(`${family.username}: ${e}`)
    }
  }

  return NextResponse.json({ sent, errors: errors.length ? errors : undefined })
}
