import { NextRequest, NextResponse } from 'next/server'
import { sendPushToAll, PushPayload } from '@/lib/pushNotifications'

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let payload: PushPayload
  try {
    const body = await req.json()
    if (!body.title || !body.body) {
      return NextResponse.json({ error: 'Missing title or body' }, { status: 400 })
    }
    payload = { title: body.title as string, body: body.body as string, url: body.url as string | undefined }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  try {
    const result = await sendPushToAll(payload)
    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
