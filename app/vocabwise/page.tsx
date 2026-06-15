'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import UpgradeBanner from '@/components/UpgradeBanner'

type AcademicTopicSync = { completed: boolean; mastered: boolean }
type Session = { plan: string; username?: string; free_trial_expires_at?: string | null; plan_end_date?: string | null }

const BOOKS = [
  {
    id: 1, slug: 'book1', title: 'VocabWise Starter',
    cefr: 'A1–A2', maxTopics: 60, color: 'from-green-400 to-emerald-500',
    badge: 'bg-green-100 text-green-700', bar: 'bg-green-500', emoji: '🌱',
    themes: ['Daily Life', 'World Around Us', 'People & Relationships', 'Learning & School', 'Actions & Events', 'Everyday Communication'],
  },
  {
    id: 2, slug: 'book2', title: 'VocabWise Progress',
    cefr: 'B1–B2', maxTopics: 60, color: 'from-blue-500 to-cyan-500',
    badge: 'bg-blue-100 text-blue-700', bar: 'bg-blue-500', emoji: '🚀',
    themes: ['Mind & Society', 'Environment & Science', 'Business & Money', 'Arts Culture & Society', 'People & Issues', 'Media & Ideas'],
  },
  {
    id: 3, slug: 'book3', title: 'VocabWise Mastery',
    cefr: 'C1–C2', maxTopics: 60, color: 'from-purple-600 to-violet-600',
    badge: 'bg-purple-100 text-purple-700', bar: 'bg-purple-500', emoji: '🎓',
    themes: ['Self & Society', 'Health & the Human Body', 'The Modern World', 'Knowledge & Ideas', 'Language & Communication', 'Ethics & the Future'],
  },
]

function topicPrefix(slug: string) {
  return slug === 'book1' ? 'b1-' : slug === 'book2' ? 'b2-' : 'b3-'
}

export default function VocabWisePage() {
  const router = useRouter()
  const [syncMap, setSyncMap] = useState<Record<string, AcademicTopicSync>>({})
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    const cid = localStorage.getItem('vw_active_child')
    Promise.all([
      fetch('/api/auth/me').then(r => r.ok ? r.json() : null),
      cid ? fetch(`/api/sync/${cid}?level=academic`).then(r => r.ok ? r.json() : null) : Promise.resolve(null),
    ]).then(([sess, d]) => {
      setSession(sess)
      setSyncMap(d?.mastery ?? {})
    }).catch(() => {})
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <UpgradeBanner
        plan={session?.plan ?? 'free'}
        freeTrialExpiresAt={session?.free_trial_expires_at}
        planEndDate={session?.plan_end_date}
        username={session?.username}
      />
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => router.back()} className="text-white/70 hover:text-white text-xl flex-shrink-0">←</button>
          <span className="text-2xl flex-shrink-0">🎓</span>
          <div>
            <h1 className="font-bold text-lg leading-tight">VocabWise Academic</h1>
            <p className="text-blue-200 text-xs">Từ vựng học thuật · A1 → C2 · IELTS / SAT</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <p className="text-gray-500 text-sm text-center">Chọn cấp độ phù hợp với bạn</p>

        {BOOKS.map(book => {
          const prefix = topicPrefix(book.slug)
          const allSynced = Object.entries(syncMap).filter(([tid]) => tid.startsWith(prefix))
          const mastered  = allSynced.filter(([, s]) => s.mastered).length
          const completed = allSynced.filter(([, s]) => s.completed).length
          const pct       = book.maxTopics > 0 ? Math.round((mastered / book.maxTopics) * 100) : 0
          const hasProgress = completed > 0 || mastered > 0

          return (
            <Link key={book.id} href={`/vocabwise/${book.slug}`}
              className="block bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden active:scale-[0.99] transition-all">

              {/* Gradient header — same style as Daily level card */}
              <div className={`bg-gradient-to-r ${book.color} px-5 py-4 flex items-center gap-4`}>
                <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-4xl flex-shrink-0 shadow-sm">
                  {book.emoji}
                </div>
                <div className="flex-1 text-white min-w-0">
                  <h2 className="font-black text-lg leading-tight">{book.title}</h2>
                  <p className="text-white/80 text-sm">{book.cefr} · {book.maxTopics} chủ đề</p>
                  {hasProgress && (
                    <p className="text-white/90 text-xs font-bold mt-0.5">
                      {pct}% · {mastered} thành thạo · {completed} đã làm
                    </p>
                  )}
                </div>
                <span className="text-white/70 font-black text-xl flex-shrink-0">›</span>
              </div>

              {/* Body: progress bar OR theme chips */}
              <div className="px-5 py-3">
                {hasProgress ? (
                  <div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-1.5">
                      <div className={`h-full ${book.bar} rounded-full transition-all duration-500`}
                        style={{ width: `${Math.max(pct, mastered > 0 ? 2 : 0)}%` }} />
                    </div>
                    <div className="flex gap-3">
                      <span className="text-xs font-bold text-green-600">🏆 {mastered}/{book.maxTopics} thành thạo</span>
                      {completed > mastered && (
                        <span className="text-xs font-bold text-yellow-600">✅ {completed} đã làm</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {book.themes.map(t => (
                      <span key={t} className={`text-xs font-bold px-2.5 py-1 rounded-full ${book.badge}`}>{t}</span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          )
        })}

      </div>
    </div>
  )
}
