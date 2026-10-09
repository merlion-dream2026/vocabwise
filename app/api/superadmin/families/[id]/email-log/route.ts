import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseServer'
import { isAdminRequest } from '@/lib/api'

// GET /api/superadmin/families/[id]/email-log
export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  if (!(await isAdminRequest(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('email_log')
    .select('id, email_type, sent_at, metadata')
    .eq('family_id', params.id)
    .order('sent_at', { ascending: false })
    .limit(100)

  if (error) return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 })
  return NextResponse.json(data ?? [])
}
