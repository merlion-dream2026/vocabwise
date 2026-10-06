import { NextRequest, NextResponse } from 'next/server'
import { db, authorizeParent } from '@/lib/parentPin'

// POST /api/rewards/[childId]/redeem { stickerIds: number[], note?: string }
// Marks the chosen stickers as exchanged and writes one history row. Legacy and already-redeemed
// stickers are refused. Parent PIN required.
export async function POST(req: NextRequest, props: { params: Promise<{ childId: string }> }) {
  const { childId } = await props.params
  const auth = await authorizeParent(req, childId)
  if ('error' in auth) return auth.error

  const body = await req.json().catch(() => ({}))
  const ids: number[] = Array.isArray(body.stickerIds) ? Array.from(new Set((body.stickerIds as unknown[]).map(Number))).filter(Number.isInteger) : []
  const note = typeof body.note === 'string' ? body.note.trim().slice(0, 200) || null : null
  if (ids.length === 0 || ids.length > 500) return NextResponse.json({ error: 'Chưa chọn sticker' }, { status: 400 })

  // Only this child's, redeemable (non-legacy), still-unredeemed stickers.
  const { data: eligible } = await db.from('child_stickers').select('id')
    .eq('child_id', childId).eq('legacy', false).is('redemption_id', null).in('id', ids)
  if ((eligible ?? []).length !== ids.length) {
    return NextResponse.json({ error: 'Có sticker không hợp lệ hoặc đã được đổi rồi. Hãy tải lại.' }, { status: 409 })
  }

  const { data: red, error: redErr } = await db.from('sticker_redemptions')
    .insert({ child_id: childId, family_id: auth.session.familyId, sticker_count: ids.length, note })
    .select('id, sticker_count, note, created_at').single()
  if (redErr || !red) return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 })

  // Guarded update: only rows still unredeemed. If a concurrent request got some first, undo ours.
  const { data: updated } = await db.from('child_stickers').update({ redemption_id: red.id })
    .eq('child_id', childId).is('redemption_id', null).in('id', ids).select('id')
  if ((updated ?? []).length !== ids.length) {
    await db.from('child_stickers').update({ redemption_id: null }).eq('redemption_id', red.id)
    await db.from('sticker_redemptions').delete().eq('id', red.id)
    return NextResponse.json({ error: 'Có sticker vừa được đổi ở nơi khác. Hãy tải lại.' }, { status: 409 })
  }
  return NextResponse.json({ ok: true, redemption: red })
}
