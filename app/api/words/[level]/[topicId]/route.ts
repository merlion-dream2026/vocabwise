import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { getSession } from '@/lib/auth'
import { getFamilyProfile } from '@/lib/security'
import { getKidsTopicLimit } from '@/lib/planUtils'

const ALLOWED_LEVELS = new Set(['seeker', 'starter', 'ranger', 'explorer', 'scholar', 'master'])
// Topic ids are slugs like "family-home" — reject anything else before touching the filesystem.
const TOPIC_ID_RE = /^[a-z0-9-]+$/

export async function GET(req: NextRequest, { params }: { params: { level: string; topicId: string } }) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!ALLOWED_LEVELS.has(params.level) || !TOPIC_ID_RE.test(params.topicId)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (session.familyId !== 'superadmin') {
    const profile = await getFamilyProfile(session.familyId)
    if (!profile) return NextResponse.json({ error: 'Account not found' }, { status: 404 })

    const limit = getKidsTopicLimit(profile)
    if (limit !== null) {
      const levelRaw = await readFile(join(process.cwd(), 'data', 'words', `${params.level}.json`), 'utf-8')
      const { topics } = JSON.parse(levelRaw) as { topics: { id: string }[] }
      const idx = topics.findIndex(t => t.id === params.topicId)
      if (idx === -1 || idx >= limit) {
        return NextResponse.json({ error: 'Upgrade to Pro to access this topic.' }, { status: 403 })
      }
    }
  }

  try {
    const json = await readFile(join(process.cwd(), 'data', 'words', params.level, `${params.topicId}.json`), 'utf-8')
    return new NextResponse(json, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'private, max-age=3600',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
}
