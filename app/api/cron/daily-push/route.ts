import { NextRequest, NextResponse } from 'next/server'
import { sendPushToAll } from '@/lib/pushNotifications'

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await sendPushToAll({
      title: '📚 Học từ vựng hôm nay nào!',
      body: 'Duy trì streak — bé học 10 phút mỗi ngày!',
      url: '/kids',
    })
    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
