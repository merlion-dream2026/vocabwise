import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { getSession } from '@/lib/auth'

const ALLOWED_LEVELS = new Set(['seeker', 'starter', 'ranger', 'explorer', 'scholar', 'master'])

type LevelTopic = { id: string; name: string; emoji: string; color: string; words: { word: string }[] }
type LevelFile = { label: string; emoji: string; color: string; description: string; topics: LevelTopic[] }

// Slim topic list — id/name/emoji/color + word strings only (no ipa/meaning/examples).
// The level page needs the `word` field to compute per-topic seen/weak/total counts,
// but not the rest — this cuts the payload from ~190KB to ~12KB per level.
export async function GET(req: NextRequest, { params }: { params: { level: string } }) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!ALLOWED_LEVELS.has(params.level)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    const raw = await readFile(join(process.cwd(), 'data', 'words', `${params.level}.json`), 'utf-8')
    const data = JSON.parse(raw) as LevelFile
    const topics = data.topics.map(({ id, name, emoji, color, words }) => ({
      id, name, emoji, color,
      words: words.map(w => ({ word: w.word })),
    }))
    // Bare array (not wrapped in {topics}) — existing callers (topicId page,
    // useOfflineDailyDownload.ts) consume this as an array directly.
    return NextResponse.json(topics, {
      headers: { 'Cache-Control': 'private, max-age=3600' },
    })
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
}
