import { NextRequest, NextResponse } from 'next/server'
import { db, authorizeParent } from '@/lib/parentPin'

// GET /api/rewards/[childId] — stickers (with ids) + redemption history. Parent PIN required.
export async function GET(req: NextRequest, props: { params: Promise<{ childId: string }> }) {
  const { childId } = await props.params
  const auth = await authorizeParent(req, childId)
  if ('error' in auth) return auth.error

  const [stickers, redemptions] = await Promise.all([
    db.from('child_stickers').select('id, collection, level, topic_id, earned_at, legacy, redemption_id').eq('child_id', childId).order('earned_at', { ascending: false }),
    db.from('sticker_redemptions').select('id, sticker_count, note, created_at').eq('child_id', childId).order('created_at', { ascending: false }).limit(100),
  ])
  return NextResponse.json(
    { stickers: stickers.data ?? [], redemptions: redemptions.data ?? [] },
    { headers: { 'Cache-Control': 'private, no-store' } },
  )
}
