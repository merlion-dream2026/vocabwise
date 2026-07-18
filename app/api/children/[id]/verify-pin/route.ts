import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSession, verifyPin, hashPin, bcryptCost } from '@/lib/auth'
import { rateLimit } from '@/lib/rateLimit'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// PIN hashes created before the cost-8 switch are still cost 12 (~250-300ms
// to compare in bcryptjs). Once one verifies successfully, quietly rehash it
// at the cheaper cost so the family's next tap is fast too.
const LEGACY_PIN_COST = 8

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ ok: false }, { status: 401 })

  const { pin } = await req.json().catch(() => ({}))
  if (!pin) return NextResponse.json({ ok: false })

  // Rate-limit check and child lookup are independent — run them together
  // instead of paying two sequential network round-trips.
  const [rl, { data: child }] = await Promise.all([
    rateLimit(`verify-pin:${params.id}`, 5, 300),
    supabase.from('children').select('pin, family_id').eq('id', params.id).single(),
  ])

  if (!rl.allowed) return NextResponse.json({ ok: false }, { status: 429 })

  if (!child || child.family_id !== session.familyId) {
    return NextResponse.json({ ok: false })
  }

  // Support both bcrypt hashes (new) and legacy plaintext PINs (pre-migration)
  const isHashed = child.pin?.startsWith('$2')
  const ok = isHashed
    ? await verifyPin(pin, child.pin!)
    : child.pin === pin

  if (ok && isHashed && (bcryptCost(child.pin!) ?? 0) > LEGACY_PIN_COST) {
    hashPin(pin)
      .then(rehashed => supabase.from('children').update({ pin: rehashed }).eq('id', params.id))
      .catch(() => {})
  }

  return NextResponse.json({ ok })
}
