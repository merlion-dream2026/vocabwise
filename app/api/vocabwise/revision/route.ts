import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseServer'
import { getSession } from '@/lib/auth'

const BOOK_PREFIXES: Record<string, string> = { book1: 'b1', book2: 'b2', book3: 'b3' }

export async function GET(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const book = searchParams.get('book') ?? 'book1'
  const rev = parseInt(searchParams.get('rev') ?? '1', 10)

  const prefix = BOOK_PREFIXES[book]
  if (!prefix || rev < 1 || rev > 12) {
    return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
  }

  const startTopic = (rev - 1) * 5 + 1
  const topicIds = Array.from({ length: 5 }, (_, i) =>
    `${prefix}-t${String(startTopic + i).padStart(2, '0')}`
  )

  const { data, error } = await supabase
    .from('vw_glossary')
    .select('word, pos, meaning_vi, example_en, topic_id, item_type')
    .in('topic_id', topicIds)
    .eq('item_type', 'word')
    .order('topic_id')
    .order('item_order')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    book,
    revNum: rev,
    topicRange: `${startTopic}–${startTopic + 4}`,
    glossary: data ?? [],
  }, { headers: { 'Cache-Control': 'private, max-age=300' } })
}
