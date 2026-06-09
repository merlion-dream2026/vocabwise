import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from '@/lib/email'
import { inactiveChildEmailHtml } from '@/lib/emailTemplates'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function dateStr(daysAgo: number): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString().split('T')[0]
}

/**
 * Daily cron: tìm các bé chưa học đúng 3 hoặc 7 ngày → email ba mẹ nhắc nhở.
 * Dùng ngưỡng chính xác (3 và 7 ngày) để tránh spam.
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const day3 = dateStr(3)
  const day7 = dateStr(7)

  // Lấy tất cả families có email, còn active (không disabled)
  const { data: families, error: famErr } = await supabase
    .from('families')
    .select('id, username, name, email')
    .eq('disabled', false)
    .not('email', 'is', null)
    .neq('email', '')

  if (famErr || !families?.length) return NextResponse.json({ sent: 0, note: 'no families' })

  // Lấy tất cả children của các families này
  const famIds = families.map(f => f.id)
  const { data: children } = await supabase
    .from('children')
    .select('id, family_id, name, emoji')
    .in('family_id', famIds)

  if (!children?.length) return NextResponse.json({ sent: 0, note: 'no children' })

  // Lấy streak data (lastActive) cho tất cả children, tất cả levels
  const childIds = children.map(c => c.id)
  const { data: syncRows } = await supabase
    .from('vocab_sync')
    .select('child_id, streak')
    .in('child_id', childIds)

  // Build map: childId → max lastActive across all levels
  const lastActiveMap: Record<string, string> = {}
  for (const row of syncRows ?? []) {
    const la = (row.streak as { lastActive?: string } | null)?.lastActive ?? ''
    const prev = lastActiveMap[row.child_id] ?? ''
    if (la > prev) lastActiveMap[row.child_id] = la
  }

  // Group children by family
  const byFamily: Record<string, typeof children> = {}
  for (const child of children) {
    if (!byFamily[child.family_id]) byFamily[child.family_id] = []
    byFamily[child.family_id].push(child)
  }

  let sent = 0
  const errors: string[] = []

  for (const family of families) {
    const kids = byFamily[family.id] ?? []
    if (!kids.length) continue

    // Tìm các bé inactive đúng 3 hoặc 7 ngày
    const inactive3: typeof kids = []
    const inactive7: typeof kids = []

    for (const kid of kids) {
      const la = lastActiveMap[kid.id] ?? ''
      if (!la) continue  // chưa bao giờ học → skip (sẽ xử lý bằng onboarding email)
      if (la === day3) inactive3.push(kid)
      else if (la === day7) inactive7.push(kid)
    }

    // Ưu tiên: 7 ngày > 3 ngày (không gửi cả 2 cùng lúc cho cùng 1 bé)
    const toSend = inactive7.length > 0 ? inactive7 : inactive3
    if (!toSend.length) continue

    const daysInactive = inactive7.length > 0 ? 7 : 3
    const inactiveKids = toSend.map(k => ({ name: k.name, emoji: k.emoji, daysInactive }))

    const parentName = (family.name as string | null) ?? (family.username as string)
    const childNames = inactiveKids.map(k => k.name).join(', ')
    const subject = daysInactive >= 7
      ? `📚 ${childNames} chưa học 1 tuần rồi — nhắc bé học hôm nay nhé!`
      : `📚 ${childNames} chưa học ${daysInactive} ngày — 5 phút thôi!`

    try {
      const html = inactiveChildEmailHtml(parentName, inactiveKids)
      await sendEmail({ to: family.email as string, subject, html })
      sent++
    } catch (e) {
      errors.push(`${family.username}: ${String(e)}`)
    }
  }

  return NextResponse.json({ sent, errors })
}
