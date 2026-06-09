import Link from 'next/link'
import { notFound } from 'next/navigation'
import fs from 'fs'
import path from 'path'

type TopicMeta = {
  topic_id: string; topic_number: number; topic_title: string
  theme_number: number; theme_title: string; status: string; combo: string
}

const BOOK_INFO: Record<string, { title: string; cefr: string; color: string; emoji: string }> = {
  book1: { title: 'VocabWise Starter', cefr: 'A1–A2', color: 'from-green-400 to-emerald-500', emoji: '🌱' },
  book2: { title: 'VocabWise Progress', cefr: 'B1–B2', color: 'from-blue-500 to-cyan-500', emoji: '🚀' },
  book3: { title: 'VocabWise Mastery', cefr: 'C1–C2', color: 'from-purple-600 to-violet-600', emoji: '🎓' },
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

const STATUS_BADGE: Record<string, string> = {
  final:   'bg-green-100 text-green-700',
  qa_pass: 'bg-blue-100 text-blue-700',
  draft:   'bg-gray-100 text-gray-500',
}

export default async function BookPage({ params }: { params: Promise<{ book: string }> }) {
  const { book } = await params
  const info = BOOK_INFO[book]
  if (!info) notFound()

  const topics  = loadTopics(book)
  const byTheme = topics.reduce<Record<string, TopicMeta[]>>((acc, t) => {
    const key = `${t.theme_number}|${t.theme_title}`
    acc[key] = [...(acc[key] ?? []), t]
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className={`bg-gradient-to-r ${info.color} px-4 pt-12 pb-6 text-white`}>
        <Link href="/vocabwise" className="text-white/70 font-bold text-sm flex items-center gap-1 mb-4">← Chọn sách</Link>
        <div className="flex items-center gap-3">
          <span className="text-4xl">{info.emoji}</span>
          <div>
            <h1 className="text-2xl font-black">{info.title}</h1>
            <p className="text-white/80 text-sm">{info.cefr} · {topics.length} chủ đề có sẵn</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {topics.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 font-bold">Chưa có chủ đề nào — đang phát triển...</p>
          </div>
        ) : (
          Object.entries(byTheme).map(([themeKey, themeTopics]) => {
            const [, themeTitle] = themeKey.split('|')
            return (
              <div key={themeKey}>
                <h2 className="font-black text-gray-600 text-sm uppercase tracking-wide mb-3 px-1">
                  {themeTitle}
                </h2>
                <div className="space-y-2">
                  {themeTopics.map(t => (
                    <Link key={t.topic_id} href={`/vocabwise/${book}/${t.topic_id}`}
                      className="flex items-center gap-4 bg-white rounded-2xl px-4 py-3.5 border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 active:scale-[0.99] transition-all">
                      <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-500 font-black text-sm flex items-center justify-center flex-shrink-0">
                        {t.topic_number}
                      </span>
                      <div className="flex-1">
                        <p className="font-black text-gray-800 text-sm">{t.topic_title}</p>
                        <p className="text-gray-400 text-xs">Combo {t.combo}</p>
                      </div>
                      <span className={`text-xs font-black px-2 py-0.5 rounded-full ${STATUS_BADGE[t.status] ?? STATUS_BADGE.draft}`}>
                        {t.status === 'qa_pass' ? '✓ QA' : t.status === 'final' ? '✓ Final' : 'draft'}
                      </span>
                      <span className="text-gray-300 font-bold">›</span>
                    </Link>
                  ))}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
