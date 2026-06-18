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

export async function GET(req: NextRequest) {
  if (!await requireSuperAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('admin_audit_log')
    .select('id, action, target_username, details, created_at')
    .order('created_at', { ascending: false })
    .limit(100)

  // Return empty array if table doesn't exist yet (before migration)
  if (error) return NextResponse.json([])
  return NextResponse.json(data ?? [])
}
