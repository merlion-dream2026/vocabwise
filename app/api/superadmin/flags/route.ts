import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseServer'
import { isAdminRequest } from '@/lib/api'

/** GET /api/superadmin/flags — list mass_register flags (30 ngày gần nhất) */
export async function GET(req: NextRequest) {
  if (!await isAdminRequest(req)) {
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
