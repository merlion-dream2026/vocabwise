import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseServer'
import { sendEmail } from '@/lib/email'
import { buildReportHtml, ChildRow, SyncRow } from '@/lib/reportHtml'
import { runInBatches } from '@/lib/batchProcess'
import { hasBearer } from '@/lib/api'

export const maxDuration = 60


type ReportSettings = { enabled?: boolean; schedule?: string; day?: number; hour?: number }

export async function GET(req: NextRequest) {
  if (!hasBearer(req, process.env.CRON_SECRET)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Cron runs daily at 1:00 UTC = 8:00 AM Vietnam time (UTC+7)
  // Check which VN weekday it is right now
  const vnDay = new Date(Date.now() + 7 * 3600 * 1000).getUTCDay()

  const { data: families } = await supabase
    .from('families')
    .select('id, username, email, plan, report_settings')
    .eq('disabled', false)
    .not('email', 'is', null)
    .neq('email', '')

  if (!families?.length) return NextResponse.json({ sent: 0, skipped: 'no families with email' })

  // Opt-in only: families who turned on the weekly report and picked today's weekday.
  // (Previously every family with an email also got one each Sunday — dropped as too pushy.)
  const scheduled = families.filter(f => {
    const s = (f.report_settings ?? {}) as ReportSettings
    return s.enabled && s.schedule === 'weekly' && s.day === vnDay
  })

  if (!scheduled.length) return NextResponse.json({ sent: 0, skipped: `no families scheduled for day=${vnDay} VN` })

  let sent = 0
  const errors: string[] = []

  await runInBatches(scheduled, 5, async (family) => {
    try {
      const { data: children } = await supabase
        .from('children')
        .select('id, name, emoji, level')
        .eq('family_id', family.id)

      if (!children?.length) return

      const rows = await Promise.all(
        children.map(async (child: ChildRow) => {
          const { data: sync } = await supabase
            .from('vocab_sync')
            .select('seen, weak_words, streak, battle, mastery')
            .eq('child_id', child.id)
            .eq('level', child.level)
            .maybeSingle()
          return { child, sync: sync as SyncRow }
        })
      )

      const html = buildReportHtml(family.username, rows)
      await sendEmail({ to: family.email, subject: '📚 Báo cáo học tập tuần này — VocabWise', html })
      sent++
    } catch (e) {
      errors.push(`${family.username}: ${e}`)
    }
  })

  return NextResponse.json({ sent, errors })
}
