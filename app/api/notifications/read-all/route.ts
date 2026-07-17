import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { markAllRead } from '@/lib/notifications'

// POST /api/notifications/read-all
export async function POST(req: NextRequest) {
  const session = await getSession(req)
  if (!session || session.familyId === 'superadmin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await markAllRead(session.familyId)
  return NextResponse.json({ ok: true })
}
