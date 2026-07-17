import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { listNotifications, getUnreadCount } from '@/lib/notifications'

// GET /api/notifications?before=<ISO>
export async function GET(req: NextRequest) {
  const session = await getSession(req)
  if (!session || session.familyId === 'superadmin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const before = req.nextUrl.searchParams.get('before') ?? undefined

  const [items, unreadCount] = await Promise.all([
    listNotifications(session.familyId, 30, before),
    getUnreadCount(session.familyId),
  ])

  return NextResponse.json({ items, unreadCount })
}
