'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useGameSync, type SyncData } from '@/lib/GameSyncContext'
import { loadDailyTopicOffline, loadLastSync } from '@/lib/offlineStorage'
import dynamic from 'next/dynamic'

const FlashcardViewer    = dynamic(() => import('@/components/FlashcardViewer'),    { ssr: false })
const ListenGame         = dynamic(() => import('@/components/ListenGame'),          { ssr: false })
const MatchGame          = dynamic(() => import('@/components/MatchGame'),           { ssr: false })
const MemoryGame         = dynamic(() => import('@/components/MemoryGame'),          { ssr: false })
const BubbleGame         = dynamic(() => import('@/components/BubbleGame'),          { ssr: false })
const SpellGame          = dynamic(() => import('@/components/SpellGame'),           { ssr: false })
const QuizGame           = dynamic(() => import('@/components/QuizGame'),            { ssr: false })
const GapFillGame        = dynamic(() => import('@/components/GapFillGame'),         { ssr: false })
const TypingGame         = dynamic(() => import('@/components/TypingGame'),          { ssr: false })
const TrueFalseGame      = dynamic(() => import('@/components/TrueFalseGame'),       { ssr: false })
const FillLetterGame     = dynamic(() => import('@/components/FillLetterGame'),      { ssr: false })
const DefinitionMatchGame = dynamic(() => import('@/components/DefinitionMatchGame'), { ssr: false })
const SentenceOrderGame  = dynamic(() => import('@/components/SentenceOrderGame'),   { ssr: false })
const SpeakGame          = dynamic(() => import('@/components/SpeakGame'),           { ssr: false })
const SpeedRoundGame     = dynamic(() => import('@/components/SpeedRoundGame'),      { ssr: false })

type Child = { id: string; name: string; emoji: string; level: string }

export default function GamePage() {
  const router = useRouter()
  const { initGameSync } = useGameSync()
  const { childId, level, topicId, game } = useParams<{ childId: string; level: string; topicId: string; game: string }>()
  const [ready, setReady] = useState(false)
  const [child, setChild] = useState<Child | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [topic, setTopic] = useState<any>(null)
  const [isOffline, setIsOffline] = useState(false)

  const backUrl = `/dashboard/${childId}/${level}/${topicId}`

  useEffect(() => {
    // Offline path: read topic from localStorage, init sync from last-known server state
    if (!navigator.onLine) {
      const cached = loadDailyTopicOffline(level, topicId)
      if (cached) {
        const childInfo = JSON.parse(localStorage.getItem('vw_child_' + childId) ?? 'null') as Child | null
        setChild(childInfo ?? { id: childId, name: '', emoji: '🧒', level })
        setTopic(cached.topic)
        const lastSync = loadLastSync(childId, level)
        initGameSync(childId, level, lastSync as SyncData, topicId, cached.topic.name)
        setIsOffline(true)
        setReady(true)
      } else {
        router.push(backUrl)
      }
      return
    }

    Promise.all([
      fetch(`/api/children/${childId}`).then(r => r.ok ? r.json() : null),
      fetch(`/api/sync/${childId}?level=${level}`).then(r => r.json()).catch(() => null),
      fetch(`/api/words/${level}/${topicId}`).then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(([found, syncData, foundTopic]) => {
      if (!found) { router.push('/kids'); return }
      if (!foundTopic) { router.push(backUrl); return }
      initGameSync(childId, level, syncData, topicId, foundTopic.name)
      setChild(found)
      setTopic(foundTopic)
      setReady(true)
    })
  }, [childId, level, topicId, backUrl, router, initGameSync])

  if (!ready || !child || !topic) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
      <p className="text-gray-400 font-bold">Đang tải...</p>
    </div>
  )

  // AI Speak requires internet — show friendly message when offline
  if (game === 'speak' && isOffline) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 p-8">
        <div className="text-6xl mb-4">📴</div>
        <h2 className="text-xl font-black text-gray-800 mb-2 text-center">Phát âm cùng AI cần internet</h2>
        <p className="text-gray-500 text-sm mb-6 text-center max-w-xs">Game này dùng AI nhận diện giọng nói — không khả dụng khi offline.</p>
        <button
          onClick={() => router.push(backUrl)}
          className="bg-purple-500 text-white font-bold px-6 py-3 rounded-2xl active:scale-95 transition-all"
        >
          ← Quay lại chủ đề
        </button>
      </div>
    )
  }

  const isSimpleLevel = ['seeker', 'starter', 'ranger'].includes(level)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const props = { topic: topic as any, level, backUrl }

  switch (game) {
    case 'flashcard':
      return <FlashcardViewer {...props} isStarter={isSimpleLevel} />
    case 'listen':
      return <ListenGame {...props} isStarter={isSimpleLevel} />
    case 'match':
      return <MatchGame {...props} />
    case 'memory':
      return <MemoryGame {...props} />
    case 'bubble':
      return <BubbleGame {...props} />
    case 'spell':
      return <SpellGame {...props} />
    case 'quiz':
      return <QuizGame {...props} />
    case 'gapfill':
      return <GapFillGame {...props} />
    case 'typing':
      return <TypingGame {...props} />
    case 'truefalse':
      return <TrueFalseGame {...props} />
    case 'fillletter':
      return <FillLetterGame {...props} />
    case 'definitionmatch':
      return <DefinitionMatchGame {...props} />
    case 'sentenceorder':
      return <SentenceOrderGame {...props} isStarter={isSimpleLevel} />
    case 'speak':
      return <SpeakGame {...props} isStarter={isSimpleLevel} />
    case 'speedround':
      return <SpeedRoundGame {...props} />
    default:
      router.push(backUrl)
      return null
  }
}
