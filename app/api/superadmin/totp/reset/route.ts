// Emergency 2FA reset — no session required, uses CRON_SECRET as bearer token.
// Usage: DELETE /api/superadmin/totp/reset
//   Authorization: Bearer <CRON_SECRET>
// This removes the totp_secret from admin_config, disabling 2FA immediately.
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { rateLimit } from '@/lib/rateLimit'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function DELETE(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown'
  if (!(await rateLimit(`totp-reset:${ip}`, 3, 300)).allowed) {
    return NextResponse.json({ error: 'Quá nhiều lần thử. Vui lòng thử lại sau 5 phút.' }, { status: 429 })
  }

  const auth = req.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await supabase.from('admin_config').delete().eq('key', 'totp_secret')
  return NextResponse.json({ ok: true, message: '2FA disabled. Login with password only.' })
}
