import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { getSession } from '@/lib/auth'
import { getFamilyProfile } from '@/lib/security'
import { getRevisionLimit } from '@/lib/planUtils'

const ALLOWED_LEVELS = new Set(['seeker', 'starter', 'ranger', 'explorer', 'scholar', 'master'])
const REV_ID_RE = /^r(\d{2,3})$/

// Gated equivalent of GET /api/words/[level] for revision — returns only the 5 topics a
// given revision number covers, never the full level file, so plan limits can't be
// bypassed by reading the raw per-level source that revision used to fetch directly.
export async function GET(req: NextRequest, { params }: { params: { level: string; revId: string } }) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!ALLOWED_LEVELS.has(params.level)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  const match = REV_ID_RE.exec(params.revId)
  if (!match) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const revNum = parseInt(match[1], 10)

  if (session.familyId !== 'superadmin') {
    const profile = await getFamilyProfile(session.familyId)
    if (!profile) return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    const limit = getRevisionLimit(profile)
    if (limit !== null && revNum > limit) {
      return NextResponse.json({ error: 'Upgrade to Pro to access this revision test.' }, { status: 403 })
    }
  }

  try {
    const raw = await readFile(join(process.cwd(), 'data', 'words', `${params.level}.json`), 'utf-8')
    const data = JSON.parse(raw) as { topics: unknown[] }
    const startIdx = (revNum - 1) * 5
    const topics = data.topics.slice(startIdx, startIdx + 5)
    if (!topics.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({ topics }, { headers: { 'Cache-Control': 'private, max-age=300' } })
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
}
