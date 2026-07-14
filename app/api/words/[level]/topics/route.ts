import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { getSession } from '@/lib/auth'

const ALLOWED_LEVELS = new Set(['seeker', 'starter', 'ranger', 'explorer', 'scholar', 'master'])

type LevelWord = { word: string; meaning: string; emoji: string }
type LevelTopic = { id: string; name: string; emoji: string; color: string; words: LevelWord[] }
type LevelFile = { label: string; emoji: string; color: string; description: string; topics: LevelTopic[] }

// Slim topic list — id/name/emoji/color + word/meaning/emoji only (no ipa/class/examples,
// the heaviest fields). The level page needs `word` for seen/weak/total counts; SRS
// review (ReviewSession.tsx) needs word+meaning+emoji to build MCQ distractor choices —
// this single shared shape covers both without either fetching the full ~190KB level file.
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
      words: words.map(w => ({ word: w.word, meaning: w.meaning, emoji: w.emoji })),
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
