import { NextRequest, NextResponse } from 'next/server'
import { sendScheduledPush } from '@/lib/pushNotifications'

// Triggered every 15 min by Supabase pg_cron (net.http_post, see migration
// 20261010000000_push_schedule.sql) — not by vercel.json, whose Hobby crons run once a day.
// GET kept for manual testing with curl.
async function handle(req: NextRequest) {
  const auth = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await sendScheduledPush()
    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export const GET = handle
export const POST = handle
