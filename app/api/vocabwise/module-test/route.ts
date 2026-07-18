import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseServer'
import { getSession } from '@/lib/auth'
import { getFamilyProfile } from '@/lib/security'
import { getEffectivePlan } from '@/lib/planUtils'

const BOOK_PREFIXES: Record<string, string> = { book1: 'b1', book2: 'b2', book3: 'b3' }

// GET /api/vocabwise/module-test?book=book1 — full-book glossary (all ~60 topics) for
// the Module Test, with each word's topic CEFR level attached (used to scope the
// AI-graded production prompts to the book's actual difficulty). Pro-only.
export async function GET(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (session.familyId !== 'superadmin') {
    const profile = await getFamilyProfile(session.familyId)
    if (!profile) return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    if (!getEffectivePlan(profile).isProActive) {
      return NextResponse.json({ error: 'Pro plan required for Module Test.' }, { status: 403 })
    }
  }

  const book = req.nextUrl.searchParams.get('book') ?? 'book1'
  const prefix = BOOK_PREFIXES[book]
  if (!prefix) return NextResponse.json({ error: 'Invalid book' }, { status: 400 })

  const [{ data: glossaryRows, error: glossaryErr }, { data: topicRows, error: topicErr }] = await Promise.all([
    supabase
      .from('vw_glossary')
      .select('word, pos, meaning_vi, example_en, example_vi, topic_id')
      .like('topic_id', `${prefix}-%`)
      .eq('item_type', 'word')
      .order('topic_id')
      .order('item_order'),
    supabase
      .from('vw_topics')
      .select('topic_id, cefr_level')
      .like('topic_id', `${prefix}-%`),
  ])

  if (glossaryErr) return NextResponse.json({ error: glossaryErr.message }, { status: 500 })
  if (topicErr) return NextResponse.json({ error: topicErr.message }, { status: 500 })

  const cefrByTopic = new Map((topicRows ?? []).map(t => [t.topic_id, t.cefr_level as string | null]))
  const glossary = (glossaryRows ?? []).map(row => ({
    ...row,
    cefr_level: cefrByTopic.get(row.topic_id) ?? null,
  }))

  return NextResponse.json({ book, glossary }, { headers: { 'Cache-Control': 'private, max-age=300' } })
}
