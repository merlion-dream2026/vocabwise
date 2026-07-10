import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { getSession } from '@/lib/auth'

const ALLOWED_LEVELS = new Set(['seeker', 'starter', 'ranger', 'explorer', 'scholar', 'master'])

type LevelTopic = { id: string; name: string; emoji: string; color: string; words: unknown[] }
type LevelFile = { label: string; emoji: string; color: string; description: string; topics: LevelTopic[] }

// Slim topic list (id/name/emoji/color, no word data) — used by the topic page for
// prev/next navigation and the "N/30" counter, without pulling the full level file
// (88-204KB) just for that. Pair with GET /api/words/[level]/[topicId] for the
// specific topic's actual word content.
export async function GET(req: NextRequest, { params }: { params: { level: string } }) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!ALLOWED_LEVELS.has(params.level)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    const raw = await readFile(join(process.cwd(), 'data', 'words', `${params.level}.json`), 'utf-8')
    const data = JSON.parse(raw) as LevelFile
    const topics = data.topics.map(({ id, name, emoji, color }) => ({ id, name, emoji, color }))
    return NextResponse.json(topics, {
      headers: { 'Cache-Control': 'private, max-age=3600' },
    })
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
}
