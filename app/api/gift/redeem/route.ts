import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSession } from '@/lib/auth'
import { addBonusDays } from '@/lib/planUtils'
import { createNotification } from '@/lib/notifications'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST /api/gift/redeem
// Body: { token: string }
// Validates gift token, grants 14 days Pro bonus to current user, marks token as used.
export async function POST(req: NextRequest) {
  const session = await getSession(req)
  if (!session || session.familyId === 'superadmin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { token } = await req.json().catch(() => ({}))
  if (!token || typeof token !== 'string') {
    return NextResponse.json({ error: 'Mã quà tặng không hợp lệ' }, { status: 400 })
  }

  const normalised = token.toUpperCase().trim()

  // Find family with this gift token
  const { data: gifter } = await supabase
    .from('families')
    .select('id')
    .eq('gift_token', normalised)
    .single()

  if (!gifter) {
    return NextResponse.json({ error: 'Mã quà tặng không tồn tại hoặc đã được dùng' }, { status: 404 })
  }

  if (gifter.id === session.familyId) {
    return NextResponse.json({ error: 'Bạn không thể dùng mã của chính mình' }, { status: 400 })
  }

  // Get recipient's current bonus state
  const { data: recipient } = await supabase
    .from('families')
    .select('bonus_pro_expires_at')
    .eq('id', session.familyId)
    .single()

  const newBonusExpiry = addBonusDays(recipient?.bonus_pro_expires_at, 14)

  // Mark token as used + grant bonus (parallel)
  const [{ error: e1 }, { error: e2 }] = await Promise.all([
    supabase.from('families').update({ gift_token: null }).eq('id', gifter.id),
    supabase.from('families').update({ bonus_pro_expires_at: newBonusExpiry }).eq('id', session.familyId),
  ])

  if (e1 || e2) return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 })

  createNotification({
    familyId: session.familyId,
    type: 'gift_redeemed',
    title: '🎁 Đã đổi quà thành công!',
    body: 'Bạn vừa nhận +14 ngày Pro miễn phí.',
    url: '/dashboard',
    metadata: { days: 14, bonusExpiresAt: newBonusExpiry },
  }).catch(() => {})

  return NextResponse.json({ ok: true, bonusExpiresAt: newBonusExpiry })
}
