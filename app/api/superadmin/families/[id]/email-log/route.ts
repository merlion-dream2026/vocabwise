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

// GET /api/superadmin/families/[id]/email-log
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  if (!await requireSuperAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('email_log')
    .select('id, email_type, sent_at, metadata')
    .eq('family_id', params.id)
    .order('sent_at', { ascending: false })
    .limit(100)

  if (error) return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 })
  return NextResponse.json(data ?? [])
}
