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

const FREE_WORDS_LIMIT = 20

export async function POST(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { word, meaning_vi, pos, ipa, example_en, book_id, topic_id, topic_title, list_id, source } = await req.json()
  if (!word || !book_id || !topic_id) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  // Free plan: enforce 20-word limit (upsert on existing word is always OK)
  if (session.plan === 'free') {
    const { count: existingCount } = await supabase
      .from('vw_saved_words')
      .select('*', { count: 'exact', head: true })
      .eq('family_id', session.familyId)
      .eq('word', word)
      .eq('topic_id', topic_id)
    const isExisting = (existingCount ?? 0) > 0

    if (!isExisting) {
      const { count: total } = await supabase
        .from('vw_saved_words')
        .select('*', { count: 'exact', head: true })
        .eq('family_id', session.familyId)
      if ((total ?? 0) >= FREE_WORDS_LIMIT) {
        return NextResponse.json({ error: 'limit_reached', limit: FREE_WORDS_LIMIT }, { status: 403 })
      }
    }
  }

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

export async function PATCH(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, list_id } = await req.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const { error } = await supabase
    .from('vw_saved_words')
    .update({ list_id: list_id ?? null })
    .eq('id', id)
    .eq('family_id', session.familyId)

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
