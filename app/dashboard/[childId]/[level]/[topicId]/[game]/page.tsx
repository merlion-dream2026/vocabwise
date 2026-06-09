'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { initGameSync } from '@/lib/gameSync'
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

type Child = { id: string; name: string; emoji: string; level: string }

export default function GamePage() {
  const router = useRouter()
  const { childId, level, topicId, game } = useParams<{ childId: string; level: string; topicId: string; game: string }>()
  const [ready, setReady] = useState(false)
  const [child, setChild] = useState<Child | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [topic, setTopic] = useState<any>(null)

  const backUrl = `/dashboard/${childId}/${level}/${topicId}`

  useEffect(() => {
    Promise.all([
      fetch('/api/children').then(r => r.json()),
      fetch(`/api/sync/${childId}?level=${level}`).then(r => r.json()).catch(() => null),
      fetch(`/api/words/${level}`).then(r => r.json()).catch(() => null),
    ]).then(([kids, syncData, levelData]) => {
      const found = (kids as Child[]).find(k => k.id === childId)
      if (!found) { router.push('/kids'); return }
      const foundTopic = levelData?.topics?.find((t: { id: string }) => t.id === topicId)
      if (!foundTopic) { router.push(backUrl); return }
      initGameSync(childId, level, syncData)
      setChild(found)
      setTopic(foundTopic)
      setReady(true)
    })
  }, [childId, level, topicId, backUrl, router])

  if (!ready || !child || !topic) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
      <p className="text-gray-400 font-bold">Đang tải...</p>
    </div>
  )

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
    default:
      router.push(backUrl)
      return null
  }
}
