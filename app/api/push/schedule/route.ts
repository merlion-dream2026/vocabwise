import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseServer'
import { getSession } from '@/lib/auth'
import { parsePushSchedule, DEFAULT_PUSH_SCHEDULE } from '@/lib/pushSchedule'
import { serverError } from '@/lib/api'

export async function GET(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase.from('families').select('push_schedule').eq('id', session.familyId).maybeSingle()
  return NextResponse.json({ schedule: parsePushSchedule(data?.push_schedule) ?? DEFAULT_PUSH_SCHEDULE })
}

export async function PUT(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const schedule = parsePushSchedule(body?.schedule)
  if (!schedule) return NextResponse.json({ error: 'Lịch nhắc không hợp lệ' }, { status: 400 })

  const { error } = await supabase.from('families').update({ push_schedule: schedule }).eq('id', session.familyId)
  if (error) return serverError(error)
  return NextResponse.json({ ok: true, schedule })
}
