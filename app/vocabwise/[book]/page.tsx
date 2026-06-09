import { notFound } from 'next/navigation'
import fs from 'fs'
import path from 'path'
import BookPageClient from '@/components/vocabwise/BookPageClient'

type TopicMeta = {
  topic_id: string; topic_number: number; topic_title: string
  theme_number: number; theme_title: string; status: string; combo: string
}

const BOOK_INFO: Record<string, { title: string; cefr: string; color: string; emoji: string }> = {
  book1: { title: 'VocabWise Starter',  cefr: 'A1–A2', color: 'from-green-400 to-emerald-500', emoji: '🌱' },
  book2: { title: 'VocabWise Progress', cefr: 'B1–B2', color: 'from-blue-500 to-cyan-500',     emoji: '🚀' },
  book3: { title: 'VocabWise Mastery',  cefr: 'C1–C2', color: 'from-purple-600 to-violet-600', emoji: '🎓' },
}

function loadTopics(book: string): TopicMeta[] {
  const dir = path.join(process.cwd(), 'data', 'vocabwise', book)
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.json'))
    .sort()
    .map(f => {
      const raw = fs.readFileSync(path.join(dir, f), 'utf8')
      return JSON.parse(raw).meta as TopicMeta
    })
}

export default async function BookPage({ params }: { params: Promise<{ book: string }> }) {
  const { book } = await params
  const info = BOOK_INFO[book]
  if (!info) notFound()

  const topics = loadTopics(book)
  const byTheme = topics.reduce<Record<string, TopicMeta[]>>((acc, t) => {
    const key = `${t.theme_number}|${t.theme_title}`
    acc[key] = [...(acc[key] ?? []), t]
    return acc
  }, {})

  return <BookPageClient book={book} info={info} topics={topics} byTheme={byTheme} />
}
