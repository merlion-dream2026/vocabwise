import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseServer'
import { isAdminRequest } from '@/lib/api'

export async function GET(req: NextRequest) {
  if (!await isAdminRequest(req)) {
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
