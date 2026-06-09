import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import storiesData from '@/data/stories.json'

export async function GET(req: NextRequest, { params }: { params: { level: string; topicId: string } }) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const key = `${params.level}.${params.topicId}`
  const story = (storiesData as Record<string, unknown>)[key] ?? null

  return NextResponse.json(story, {
    headers: { 'Cache-Control': 'private, max-age=3600' },
  })
}
