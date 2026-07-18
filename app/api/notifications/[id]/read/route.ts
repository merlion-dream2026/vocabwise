import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { markRead } from '@/lib/notifications'

// POST /api/notifications/[id]/read
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession(req)
  if (!session || session.familyId === 'superadmin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await markRead(session.familyId, params.id)
  return NextResponse.json({ ok: true })
}
