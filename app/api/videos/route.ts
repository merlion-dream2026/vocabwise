import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import videos from '@/data/videos/videos.json'

// Suggested YouTube videos for one topic (curated by scripts/fetch-topic-videos.mjs).
// key = "daily/{level}/{topicId}" (Daily ids repeat across levels) or "academic/{topicId}".
// Optional extra for everyone (trial and free included), so no plan gate — only a login.

export type TopicVideo = { id: string; title: string; channel: string; sec: number }

const ALL = videos as Record<string, TopicVideo[]>

export async function GET(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const key = req.nextUrl.searchParams.get('key') ?? ''
  return NextResponse.json(
    { videos: Object.hasOwn(ALL, key) ? ALL[key] : [] },
    { headers: { 'Cache-Control': 'private, max-age=86400' } },
  )
}
