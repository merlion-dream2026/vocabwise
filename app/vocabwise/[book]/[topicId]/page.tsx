import { notFound } from 'next/navigation'
import fs from 'fs'
import path from 'path'
import TopicViewer from '@/components/vocabwise/TopicViewer'
import type { TopicData } from '@/components/vocabwise/TopicViewer'

function loadTopic(book: string, topicId: string): TopicData | null {
  if (!/^book[123]$/.test(book) || !/^b[123]-t\d{2,3}(-\w+)?$/.test(topicId)) return null
  const dir = path.join(process.cwd(), 'data', 'vocabwise', book)
  if (!fs.existsSync(dir)) return null
  const files = fs.readdirSync(dir)
  const file = files.find(f => f.startsWith(topicId.split('-').slice(0, 2).join('-')) && f.endsWith('.json'))
  if (!file) return null
  try {
    return JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8')) as TopicData
  } catch {
    return null
  }
}

export default async function TopicPage({ params }: { params: Promise<{ book: string; topicId: string }> }) {
  const { book, topicId } = await params
  const data = loadTopic(book, topicId)
  if (!data) notFound()
  return <TopicViewer data={data} book={book} topicId={topicId} />
}
