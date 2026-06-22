import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAdminSession } from '@/lib/auth'
import { generateTotpSecret, verifyTotp, totpUri } from '@/lib/totp'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function requireSuperadmin(req: NextRequest) {
  const session = await getAdminSession(req)
  return session?.familyId === 'superadmin' ? session : null
}

async function getTotpSecret(): Promise<string | null> {
  const { data } = await supabase.from('admin_config').select('value').eq('key', 'totp_secret').single()
  return data?.value ?? null
}

// GET — return status; if not enabled, persist a pending secret so refreshing doesn't break QR
export async function GET(req: NextRequest) {
  if (!await requireSuperadmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const existing = await getTotpSecret()
  if (existing) return NextResponse.json({ enabled: true })

  // Reuse pending secret if already generated (survives page refresh)
  const { data: pendingRow } = await supabase.from('admin_config').select('value').eq('key', 'totp_pending_secret').single()
  const secret = pendingRow?.value ?? generateTotpSecret()

  if (!pendingRow?.value) {
    await supabase.from('admin_config').upsert({ key: 'totp_pending_secret', value: secret }, { onConflict: 'key' })
  }

  const uri = totpUri(secret, 'VocabWise Admin', 'superadmin')
  return NextResponse.json({ enabled: false, secret, uri })
}

// POST { code } — verify pending secret then promote to active
export async function POST(req: NextRequest) {
  if (!await requireSuperadmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { code } = await req.json().catch(() => ({}))
  if (!code) return NextResponse.json({ error: 'Missing code' }, { status: 400 })

  const { data: pendingRow } = await supabase.from('admin_config').select('value').eq('key', 'totp_pending_secret').single()
  if (!pendingRow?.value) return NextResponse.json({ error: 'Không tìm thấy secret. Vui lòng tải lại trang.' }, { status: 400 })

  const valid = await verifyTotp(pendingRow.value, code)
  if (!valid) return NextResponse.json({ error: 'Mã xác thực không đúng. Kiểm tra lại đồng hồ thiết bị.' }, { status: 400 })

  await supabase.from('admin_config').upsert({ key: 'totp_secret', value: pendingRow.value }, { onConflict: 'key' })
  await supabase.from('admin_config').delete().eq('key', 'totp_pending_secret')
  return NextResponse.json({ ok: true })
}

// DELETE — disable TOTP
export async function DELETE(req: NextRequest) {
  if (!await requireSuperadmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await supabase.from('admin_config').delete().in('key', ['totp_secret', 'totp_pending_secret'])
  return NextResponse.json({ ok: true })
}
