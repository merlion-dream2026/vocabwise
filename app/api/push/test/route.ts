import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { sendPushToFamily } from '@/lib/pushNotifications'
import { serverError } from '@/lib/api'

// "Gửi thử" — sends only to the signed-in family's own subscription, so it's safe to
// use for testing on production without reaching any other customer.
export async function POST(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const result = await sendPushToFamily(session.familyId, {
      title: '🔔 Thông báo thử',
      body: 'Thông báo đã hoạt động! VocabWise sẽ nhắc bé học theo lịch bạn đã chọn.',
      url: '/kids',
    })
    return NextResponse.json({ result })
  } catch (e) {
    return serverError(e)
  }
}
