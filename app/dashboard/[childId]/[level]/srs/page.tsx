'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { initGameSync, recordSrsAnswer, flush } from '@/lib/gameSync'
import { speak as speakWord } from '@/lib/speak'
import UpgradeModal from '@/components/UpgradeModal'
import { canAccessSRS } from '@/lib/planUtils'

type Session = { plan: string; username: string; plan_end_date?: string | null; bonus_pro_expires_at?: string | null; free_trial_expires_at?: string | null }

type Word = { word: string; meaning: string; emoji: string }

const LEVEL_LABELS: Record<string, string> = {
  seeker: 'Seeker', starter: 'Starter', ranger: 'Ranger',
  explorer: 'Explorer', scholar: 'Scholar', master: 'Master',
}

export default function SrsReviewPage() {
  const router = useRouter()
  const { childId, level } = useParams<{ childId: string; level: string }>()
  const [session, setSession]   = useState<Session | null>(null)
  const [sessionLoaded, setSessionLoaded] = useState(false)
  const [dueWords, setDueWords] = useState<Word[]>([])
  const [idx, setIdx] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [done, setDone] = useState(false)
  const [correct, setCorrect] = useState(0)
  const [loading, setLoading] = useState(true)

  const backUrl = `/dashboard/${childId}/${level}`
  const speak = useCallback((t: string) => speakWord(t, { rate: 0.85 }), [])

  useEffect(() => {
    fetch('/api/auth/me', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : null)
      .then(s => { setSession(s); setSessionLoaded(true) })
  }, [])

  useEffect(() => {
    async function load() {
      const [syncData, levelData] = await Promise.all([
        fetch(`/api/sync/${childId}?level=${level}`).then(r => r.json()).catch(() => null),
        fetch(`/api/words/${level}`).then(r => r.json()).catch(() => null),
      ])
      initGameSync(childId, level, syncData)

      const today = new Date().toISOString().split('T')[0]
      const srs = (syncData?.srs ?? {}) as Record<string, { due: string }>

      if (!levelData) { router.push(backUrl); return }

      const wordMap = new Map<string, Word>()
      for (const t of levelData.topics) {
        for (const w of t.words as Word[]) wordMap.set(w.word, w)
      }

      const due = Object.entries(srs)
        .filter(([, e]) => e.due <= today)
        .map(([word]) => wordMap.get(word))
        .filter(Boolean) as Word[]

      setDueWords(due)
      setLoading(false)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childId, level])

  const current = dueWords[idx]

  useEffect(() => {
    if (current) { const t = setTimeout(() => speak(current.word), 250); return () => clearTimeout(t) }
  }, [idx, current, speak])

  function rate(isCorrect: boolean) {
    if (!current) return
    recordSrsAnswer(current.word, isCorrect)
    if (isCorrect) setCorrect(c => c + 1)
    const next = idx + 1
    if (next >= dueWords.length) {
      flush()
      setDone(true)
    } else {
      setIdx(next)
      setRevealed(false)
    }
  }

  if (!sessionLoaded || loading) return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50 flex items-center justify-center">
      <div className="text-4xl animate-pulse">📅</div>
    </div>
  )

  if (session && !canAccessSRS(session)) return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50 flex flex-col items-center justify-center px-4 text-center">
      <UpgradeModal onClose={() => router.back()} username={session.username} />
    </div>
  )

  if (done || dueWords.length === 0) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-teal-50 to-cyan-50">
        <div className="bg-gradient-to-br from-teal-500 to-cyan-500 px-4 pt-12 pb-8 text-white">
          <button onClick={() => router.back()} className="text-teal-100 font-bold text-sm flex items-center gap-1 mb-4">← {LEVEL_LABELS[level]}</button>
          <h1 className="text-2xl font-black">📅 Ôn SRS</h1>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 text-center">
          {dueWords.length === 0 ? (
            <>
              <div className="text-7xl mb-4">🎉</div>
              <h2 className="text-2xl font-black text-gray-800 mb-2">Tất cả đã ôn rồi!</h2>
              <p className="text-gray-500 font-semibold mb-8">Không có từ nào cần ôn hôm nay. Quay lại sau nhé!</p>
            </>
          ) : (
            <>
              <div className="text-7xl mb-4">{correct === dueWords.length ? '🏆' : correct >= dueWords.length * 0.7 ? '⭐' : '💪'}</div>
              <h2 className="text-3xl font-black text-gray-800 mb-1">{correct}/{dueWords.length} từ</h2>
              <p className="text-gray-500 font-bold text-lg mb-2">{Math.round((correct / dueWords.length) * 100)}% nhớ được</p>
              <p className="text-gray-400 text-sm mb-8">Các từ đã được lên lịch ôn lại tự động.</p>
            </>
          )}
          <button onClick={() => router.back()}
            className="w-full max-w-xs bg-teal-500 text-white font-black text-xl py-4 rounded-2xl shadow-lg">
            ← Quay lại
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="bg-gradient-to-br from-teal-500 to-cyan-500 px-4 pt-12 pb-4 text-white">
        <button onClick={() => router.back()} className="text-teal-100 font-bold text-sm flex items-center gap-1 mb-3">← {LEVEL_LABELS[level]}</button>
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-black">📅 Ôn SRS</h1>
          <span className="bg-white/20 px-3 py-1 rounded-full font-black text-sm">{idx + 1}/{dueWords.length}</span>
        </div>
        <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full bg-white/70 rounded-full transition-all" style={{ width: `${((idx + 1) / dueWords.length) * 100}%` }} />
        </div>
      </div>

      <div className="flex-1 bg-gradient-to-b from-teal-50 to-cyan-50 flex flex-col items-center justify-center px-4 gap-5">
        {/* Word card */}
        <button
          onClick={() => { if (!revealed) { setRevealed(true); speak(current.word) } }}
          className="bg-white rounded-3xl p-8 shadow-md w-full text-center active:scale-95 transition-transform">
          <div className="text-7xl mb-4">{current.emoji}</div>
          <p className="text-3xl font-black text-gray-800">{current.word}</p>
          {revealed ? (
            <p className="text-xl text-teal-600 font-bold mt-3">{current.meaning}</p>
          ) : (
            <p className="text-gray-400 font-semibold mt-3 text-sm">Bấm để xem nghĩa</p>
          )}
        </button>

        {/* Listen button */}
        <button onClick={() => speak(current.word)}
          className="bg-teal-100 text-teal-600 font-bold px-6 py-2.5 rounded-xl text-sm flex items-center gap-2 active:scale-90 transition-all">
          🔊 Nghe lại
        </button>

        {/* Rating buttons — shown after reveal */}
        {revealed ? (
          <div className="w-full flex gap-3">
            <button onClick={() => rate(false)}
              className="flex-1 bg-red-100 border-2 border-red-300 text-red-600 font-black text-lg py-4 rounded-2xl active:scale-95 transition-all">
              👎 Quên rồi
            </button>
            <button onClick={() => rate(true)}
              className="flex-1 bg-green-100 border-2 border-green-300 text-green-700 font-black text-lg py-4 rounded-2xl active:scale-95 transition-all">
              👍 Nhớ rồi
            </button>
          </div>
        ) : (
          <p className="text-gray-400 font-semibold text-sm">Thử nhớ nghĩa của từ này trước</p>
        )}
      </div>
    </div>
  )
}
