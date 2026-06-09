import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import wordsData from '@/data/words.json'

export async function GET(req: NextRequest, { params }: { params: { level: string } }) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const data = wordsData[params.level as keyof typeof wordsData]
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(data, {
    headers: { 'Cache-Control': 'private, max-age=3600' },
  })
}
