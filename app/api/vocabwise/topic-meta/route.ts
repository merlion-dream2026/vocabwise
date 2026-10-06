import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseServer'
import { getSession } from '@/lib/auth'

const BOOK_ID: Record<string, number> = { book1: 1, book2: 2, book3: 3 }

// GET /api/vocabwise/topic-meta?book=book1 — slim topic list (id, title, emoji, order) for sticker UIs.
// Titles/emoji are public catalogue data (the same the book page shows); no vocabulary content.
export async function GET(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const book = new URL(req.url).searchParams.get('book') ?? ''
  const bookId = BOOK_ID[book]
  if (!bookId) return NextResponse.json({ error: 'Invalid book' }, { status: 400 })
  const { data, error } = await supabase
    .from('vw_topics').select('topic_id, topic_title, emoji, topic_number').eq('book_id', bookId).order('topic_number')
  if (error) return NextResponse.json([], { headers: { 'Cache-Control': 'private, no-store' } })
  return NextResponse.json(
    (data ?? []).map((t: { topic_id: string; topic_title: string; emoji: string | null }) => ({ id: t.topic_id, name: t.topic_title, emoji: t.emoji ?? '⭐' })),
    { headers: { 'Cache-Control': 'private, max-age=3600' } },
  )
}
