import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSession } from '@/lib/auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST — set or clear PIN. body: { pin: "1234" } to set, { pin: null } to clear
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { pin } = await req.json().catch(() => ({}))

  const { data: child } = await supabase
    .from('children')
    .select('id')
    .eq('id', params.id)
    .eq('family_id', session.familyId)
    .single()

  if (!child) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (pin !== null && pin !== undefined && !/^\d{4}$/.test(pin)) {
    return NextResponse.json({ error: 'PIN phải là 4 chữ số' }, { status: 400 })
  }

  const { error } = await supabase
    .from('children')
    .update({ pin: pin ?? null })
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
