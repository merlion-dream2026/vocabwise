import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseServer'
import { getSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const topicId = req.nextUrl.searchParams.get('topic_id')
  let query = supabase
    .from('vw_saved_words')
    .select('*')
    .eq('family_id', session.familyId)
    .order('saved_at', { ascending: false })
  if (topicId) query = (query as typeof query).eq('topic_id', topicId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ saved: data ?? [] })
}

export async function POST(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { word, meaning_vi, pos, ipa, example_en, book_id, topic_id, topic_title, list_id, source } = await req.json()
  if (!word || !book_id || !topic_id) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const { error } = await supabase.from('vw_saved_words').upsert(
    {
      family_id: session.familyId, word, meaning_vi, pos, ipa, example_en,
      book_id, topic_id, topic_title,
      list_id: list_id ?? null,
      source: source ?? 'academic',
    },
    { onConflict: 'family_id,word,topic_id' }
  )
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { word, topic_id } = await req.json()
  if (!word || !topic_id) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const { error } = await supabase
    .from('vw_saved_words')
    .delete()
    .eq('family_id', session.familyId)
    .eq('word', word)
    .eq('topic_id', topic_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
