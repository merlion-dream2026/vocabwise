import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseServer'
import { sendEmail } from '@/lib/email'
import { isAdminRequest } from '@/lib/api'

// POST /api/superadmin/notify/bulk
// { subject, html, ids }  — sends email to all selected families that have an email address
export async function POST(req: NextRequest) {
  if (!await isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { subject, html, ids } = await req.json().catch(() => ({}))
  if (!subject || !html || !Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'Thiếu subject, html, hoặc ids' }, { status: 400 })
  }

  const { data: families } = await supabase
    .from('families')
    .select('id, email, name, username')
    .in('id', ids)
    .not('email', 'is', null)

  if (!families || families.length === 0) {
    return NextResponse.json({ sent: 0, skipped: ids.length })
  }

  let sent = 0
  const skipped = ids.length - families.length

  await Promise.all(families.map(async f => {
    if (!f.email) return
    try {
      await sendEmail({ to: f.email, subject, html })
      sent++
    } catch {
      // continue on individual failure
    }
  }))

  return NextResponse.json({ sent, skipped })
}
