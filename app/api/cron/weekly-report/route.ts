import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from '@/lib/email'
import { buildReportHtml, ChildRow, SyncRow } from '@/lib/reportHtml'
import { runInBatches } from '@/lib/batchProcess'
import { createNotification } from '@/lib/notifications'

export const maxDuration = 60

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)


type ReportSettings = { enabled?: boolean; schedule?: string; day?: number; hour?: number }

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || auth !== `Bearer ${cronSecret}`) {
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

  // Chủ Nhật (day=0 giờ VN): tự động gửi cho TẤT CẢ families có email
  // Ngày khác: chỉ gửi cho families đã opt-in report_settings
  const scheduled = vnDay === 0
    ? families
    : families.filter(f => {
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
      createNotification({
        familyId: family.id,
        type: 'weekly_report',
        title: '📚 Báo cáo tuần đã sẵn sàng',
        body: 'Xem tổng kết học tập tuần này của cả nhà.',
        url: '/dashboard',
      }).catch(() => {})
      sent++
    } catch (e) {
      errors.push(`${family.username}: ${e}`)
    }
  })

  return NextResponse.json({ sent, errors })
}
