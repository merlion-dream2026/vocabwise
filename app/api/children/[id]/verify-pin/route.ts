import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSession, verifyPassword } from '@/lib/auth'
import { rateLimit } from '@/lib/rateLimit'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ ok: false }, { status: 401 })

  // 5 attempts per 5 min per child (prevents PIN brute-force)
  const rl = await rateLimit(`verify-pin:${params.id}`, 5, 300)
  if (!rl.allowed) return NextResponse.json({ ok: false }, { status: 429 })

  const { pin } = await req.json().catch(() => ({}))
  if (!pin) return NextResponse.json({ ok: false })

  // Verify child exists AND belongs to this family (ownership check)
  const { data: child } = await supabase
    .from('children')
    .select('pin, family_id')
    .eq('id', params.id)
    .single()

  if (!child || child.family_id !== session.familyId) {
    return NextResponse.json({ ok: false })
  }

  // Support both bcrypt hashes (new) and legacy plaintext PINs (pre-migration)
  const isHashed = child.pin?.startsWith('$2')
  const ok = isHashed
    ? await verifyPassword(pin, child.pin!)
    : child.pin === pin
  return NextResponse.json({ ok })
}
