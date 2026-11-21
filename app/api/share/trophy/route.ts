import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseServer'
import { getSession } from '@/lib/auth'
import { serverError } from '@/lib/api'
import { isMascotCharacter, DEFAULT_MASCOT } from '@/lib/mascots'
import { createTrophyToken, findDailyTopic } from '@/lib/trophyShare'

// POST /api/share/trophy { childId, level, topicId } → { url, cardUrl }
// Issues a signed /c/{token} link for a "topic conquered" share. Name/mascot come from the DB
// (the child must belong to this family), topic name from data/words — never from the client.
export async function POST(req: NextRequest) {
  const session = await getSession(req)
  if (!session || session.familyId === 'superadmin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { childId, level, topicId } = await req.json() as { childId?: string; level?: string; topicId?: string }
    if (typeof childId !== 'string' || typeof level !== 'string' || typeof topicId !== 'string') {
      return NextResponse.json({ error: 'Thiếu thông tin' }, { status: 400 })
    }
    const [{ data: child }, { data: family }, topic] = await Promise.all([
      supabase.from('children').select('name, mascot').eq('id', childId).eq('family_id', session.familyId).maybeSingle(),
      supabase.from('families').select('referral_code').eq('id', session.familyId).maybeSingle(),
      findDailyTopic(level, topicId),
    ])
    if (!child || !topic) return NextResponse.json({ error: 'Không tìm thấy' }, { status: 404 })
    const token = createTrophyToken({
      name: child.name, level, topicId,
      mascot: isMascotCharacter(child.mascot) ? child.mascot : DEFAULT_MASCOT,
      referralCode: family?.referral_code ?? null,
    })
    const origin = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || req.nextUrl.origin
    return NextResponse.json({ url: `${origin}/c/${token}`, cardUrl: `/c/${token}/card.png` }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    return serverError(err)
  }
}
