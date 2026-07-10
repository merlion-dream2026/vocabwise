import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { getSession } from '@/lib/auth'

const ALLOWED_LEVELS = new Set(['seeker', 'starter', 'ranger', 'explorer', 'scholar', 'master'])
// Topic ids are slugs like "family-home" — reject anything else before touching the filesystem.
const TOPIC_ID_RE = /^[a-z0-9-]+$/

export async function GET(req: NextRequest, { params }: { params: { level: string; topicId: string } }) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!ALLOWED_LEVELS.has(params.level) || !TOPIC_ID_RE.test(params.topicId)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
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
