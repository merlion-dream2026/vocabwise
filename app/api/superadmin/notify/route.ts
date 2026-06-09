import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { sendEmail } from '@/lib/email'

async function requireSuperAdmin(req: NextRequest) {
  const session = await getSession(req)
  return session?.familyId === 'superadmin'
}

export async function POST(req: NextRequest) {
  if (!await requireSuperAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { to, subject, html } = await req.json().catch(() => ({}))
  if (!to || !subject || !html) return NextResponse.json({ error: 'Thiếu thông tin email' }, { status: 400 })

  try {
    await sendEmail({ to, subject, html })
  } catch {
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
