import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from '@/lib/email'
import { getSession } from '@/lib/auth'
import { buildReportHtml, ChildRow, SyncRow } from '@/lib/reportHtml'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: family } = await supabase
    .from('families')
    .select('id, username, email')
    .eq('id', session.familyId)
    .single()

  if (!family?.email) return NextResponse.json({ error: 'Tài khoản chưa có email' }, { status: 400 })

  const { data: children } = await supabase
    .from('children')
    .select('id, name, emoji, level')
    .eq('family_id', session.familyId)

  if (!children?.length) return NextResponse.json({ error: 'Chưa có hồ sơ bé nào' }, { status: 400 })

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
  await sendEmail({ to: family.email, subject: '📚 Báo cáo học tập — VocabKids', html })
  return NextResponse.json({ ok: true })
}
