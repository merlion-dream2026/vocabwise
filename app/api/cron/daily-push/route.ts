import { NextRequest, NextResponse } from 'next/server'
import { sendPushToAll } from '@/lib/pushNotifications'

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
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
