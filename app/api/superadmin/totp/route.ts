import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSession } from '@/lib/auth'
import { generateTotpSecret, verifyTotp, totpUri } from '@/lib/totp'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function requireSuperadmin(req: NextRequest) {
  const session = await getSession(req)
  return session?.familyId === 'superadmin' ? session : null
}

async function getTotpSecret(): Promise<string | null> {
  const { data } = await supabase.from('admin_config').select('value').eq('key', 'totp_secret').single()
  return data?.value ?? null
}

// GET — return status + setup URI (generates pending secret stored temporarily)
export async function GET(req: NextRequest) {
  if (!await requireSuperadmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const existing = await getTotpSecret()
  if (existing) {
    return NextResponse.json({ enabled: true })
  }

  const secret = generateTotpSecret()
  const uri = totpUri(secret, 'VocabWise Admin', 'superadmin')
  return NextResponse.json({ enabled: false, secret, uri })
}

// POST { secret, code } — verify code then save secret
export async function POST(req: NextRequest) {
  if (!await requireSuperadmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { secret, code } = await req.json().catch(() => ({}))
  if (!secret || !code) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const valid = await verifyTotp(secret, code)
  if (!valid) return NextResponse.json({ error: 'Mã xác thực không đúng. Kiểm tra lại đồng hồ thiết bị.' }, { status: 400 })

  await supabase.from('admin_config').upsert({ key: 'totp_secret', value: secret }, { onConflict: 'key' })
  return NextResponse.json({ ok: true })
}

// DELETE — disable TOTP
export async function DELETE(req: NextRequest) {
  if (!await requireSuperadmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await supabase.from('admin_config').delete().eq('key', 'totp_secret')
  return NextResponse.json({ ok: true })
}
