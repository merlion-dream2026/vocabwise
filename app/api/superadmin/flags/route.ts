import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAdminSession } from '@/lib/auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function requireSuperAdmin(req: NextRequest) {
  const session = await getAdminSession(req)
  return session?.familyId === 'superadmin'
}

/** GET /api/superadmin/flags — list mass_register flags (30 ngày gần nhất) */
export async function GET(req: NextRequest) {
  if (!await requireSuperAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const { data, error } = await supabase
    .from('ip_flags')
    .select('id, ip, count, flagged_at, reviewed')
    .eq('event_type', 'mass_register')
    .gte('flagged_at', since30d)
    .order('flagged_at', { ascending: false })

  if (error) return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 })
  return NextResponse.json(data ?? [])
}
