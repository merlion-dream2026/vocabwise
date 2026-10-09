// Emergency 2FA reset — no session required, uses ADMIN_RECOVERY_SECRET as bearer token.
// Deliberately NOT CRON_SECRET: that one is stored in pg_cron job definitions in the DB, so anyone
// able to read cron.job could otherwise switch off admin 2FA. Unset env var = endpoint disabled.
// Usage: DELETE /api/superadmin/totp/reset
//   Authorization: Bearer <ADMIN_RECOVERY_SECRET>
// This removes the totp_secret from admin_config, disabling 2FA immediately.
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseServer'
import { rateLimit } from '@/lib/rateLimit'
import { hasBearer } from '@/lib/api'

export async function DELETE(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown'
  if (!(await rateLimit(`totp-reset:${ip}`, 3, 300)).allowed) {
    return NextResponse.json({ error: 'Quá nhiều lần thử. Vui lòng thử lại sau 5 phút.' }, { status: 429 })
  }

  if (!hasBearer(req, process.env.ADMIN_RECOVERY_SECRET)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await supabase.from('admin_config').delete().eq('key', 'totp_secret')
  return NextResponse.json({ ok: true, message: '2FA disabled. Login with password only.' })
}
