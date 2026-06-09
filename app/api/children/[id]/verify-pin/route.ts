import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST — verify PIN for a child (no auth required, called by child on home screen)
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { pin } = await req.json().catch(() => ({}))
  if (!pin) return NextResponse.json({ ok: false })

  const { data: child } = await supabase
    .from('children')
    .select('pin')
    .eq('id', params.id)
    .single()

  if (!child || !child.pin) return NextResponse.json({ ok: false })
  return NextResponse.json({ ok: child.pin === pin })
}
