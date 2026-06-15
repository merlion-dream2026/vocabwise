import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabaseServer'
import BookPageClient from '@/components/vocabwise/BookPageClient'

export const revalidate = 3600

type TopicMeta = {
  topic_id: string; topic_number: number; topic_title: string; topic_title_vi?: string
  theme_number: number; theme_title: string; theme_title_vi?: string
  emoji?: string; status: string; combo: string; word_count?: number
}

const BOOK_INFO: Record<string, { title: string; cefr: string; color: string; emoji: string }> = {
  book1: { title: 'VocabWise Foundation',  cefr: 'A1–A2', color: 'from-green-400 to-emerald-500', emoji: '🌱' },
  book2: { title: 'VocabWise Progress', cefr: 'B1–B2', color: 'from-blue-500 to-cyan-500',     emoji: '🚀' },
  book3: { title: 'VocabWise Mastery',  cefr: 'C1–C2', color: 'from-purple-600 to-violet-600', emoji: '🎓' },
}

const BOOK_ID: Record<string, number> = { book1: 1, book2: 2, book3: 3 }

async function loadTopics(book: string): Promise<TopicMeta[]> {
  const bookId = BOOK_ID[book]
  if (!bookId) return []

  const { data, error } = await supabase
    .from('vw_topics')
    .select(`
      topic_id, topic_number, topic_title, topic_title_vi,
      emoji, cefr_level, status, combo,
      vw_themes!inner ( theme_number, theme_title, theme_title_vi )
    `)
    .eq('book_id', bookId)
    .order('topic_number')

  if (error || !data) return []

  return data.map((t: any) => ({
    topic_id:       t.topic_id,
    topic_number:   t.topic_number,
    topic_title:    t.topic_title,
    topic_title_vi: t.topic_title_vi ?? undefined,
    emoji:          t.emoji ?? undefined,
    status:         t.status,
    combo:          t.combo,
    theme_number:   t.vw_themes.theme_number,
    theme_title:    t.vw_themes.theme_title,
    theme_title_vi: t.vw_themes.theme_title_vi ?? undefined,
    word_count:     15,
  }))
}

export default async function BookPage({ params }: { params: Promise<{ book: string }> }) {
  const { book } = await params
  const info = BOOK_INFO[book]
  if (!info) notFound()

  const topics = await loadTopics(book)
  const byTheme = topics.reduce<Record<string, TopicMeta[]>>((acc, t) => {
    const key = `${t.theme_number}|${t.theme_title}`
    acc[key] = [...(acc[key] ?? []), t]
    return acc
  }, {})

  return <BookPageClient book={book} info={info} topics={topics} byTheme={byTheme} />
}
