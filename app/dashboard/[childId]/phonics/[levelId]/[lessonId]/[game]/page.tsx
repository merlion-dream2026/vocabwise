'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { initPhonicsSync } from '@/lib/phonicsSync'
import phonicsLevels from '@/data/phonicsLevels.json'
import GameSoundToggle from '@/components/GameSoundToggle'

const MinimalPairsGame     = dynamic(() => import('@/components/MinimalPairsGame'),     { ssr: false })
const ListenPickPhonicsGame = dynamic(() => import('@/components/ListenPickPhonicsGame'), { ssr: false })
const PhonicsSpeak          = dynamic(() => import('@/components/PhonicsSpeak'),          { ssr: false })
const SortWordsGame         = dynamic(() => import('@/components/SortWordsGame'),         { ssr: false })
const SortRuleGame          = dynamic(() => import('@/components/SortRuleGame'),          { ssr: false })
const SentenceRhythmGame    = dynamic(() => import('@/components/SentenceRhythmGame'),    { ssr: false })

type Level  = typeof phonicsLevels.levels[number]
type Lesson = Level['lessons'][number]
type Sound  = { symbol: string; keyword: string; emoji: string; vi: string; wikiAudio: string | null; learnAudio: string | null }
type Pair   = { id: string; sounds: Sound[]; practice_words: string[] }

function makePairGroup(lesson: Lesson, level: Level, pairs: Pair[]) {
  return {
    id: lesson.id,
    title: lesson.title,
    emoji: lesson.emoji,
    gradient: level.gradient,
    bg: level.bg,
    border: level.border,
    text: level.text,
    btn: level.btn,
    bar: level.bar,
    pairs,
  }
}

export default function GamePage() {
  const router = useRouter()
  const params = useParams<{ childId: string; levelId: string; lessonId: string; game: string }>()
  const childId  = params.childId
  const levelId  = decodeURIComponent(params.levelId)
  const lessonId = decodeURIComponent(params.lessonId)
  const game     = params.game
  const [ready, setReady] = useState(false)

  const level  = phonicsLevels.levels.find(l => l.id === levelId) as Level | undefined
  const lesson = level?.lessons.find(l => l.id === lessonId) as Lesson | undefined
  const backUrl = `/dashboard/${childId}/phonics/${levelId}/${lessonId}`

  useEffect(() => {
    if (!level || !lesson) { router.push(`/dashboard/${childId}/phonics`); return }
    fetch(`/api/sync/${childId}?level=phonics`)
      .then(r => r.json()).catch(() => null)
      .then(data => { initPhonicsSync(childId, data); setReady(true) })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childId, levelId, lessonId])

  if (!level || !lesson || !ready) return (
    <div className={`min-h-screen ${level?.bg ?? 'bg-gray-50'} flex items-center justify-center`}>
      <div className="text-4xl animate-pulse">{lesson?.emoji ?? '🔤'}</div>
    </div>
  )

  const isPair = lesson.type === 'pair'

  function renderGame() {
    if (!isPair) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ruleLesson = lesson as any
      if (game === 'sort-rule') return <SortRuleGame      lesson={ruleLesson} childId={childId} backUrl={backUrl} gradient={level!.gradient} btnColor={level!.btn} />
      if (game === 'rhythm')    return <SentenceRhythmGame lesson={ruleLesson} childId={childId} backUrl={backUrl} gradient={level!.gradient} btnColor={level!.btn} />
      if (game === 'speak')     return <PhonicsSpeak       lesson={ruleLesson} childId={childId} backUrl={backUrl} gradient={level!.gradient} btnColor={level!.btn} />
      router.push(backUrl); return null
    }

    // Pair lesson — build adapter groups
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pairLesson = lesson as any
    const targetPair: Pair = { id: lesson!.id, sounds: pairLesson.sounds, practice_words: pairLesson.practice_words }

    // All pairs in level (for listen-pick distractors)
    const allLevelPairs: Pair[] = level!.lessons
      .filter(l => l.type === 'pair')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map(l => { const p = l as any; return { id: l.id, sounds: p.sounds ?? [], practice_words: p.practice_words ?? [] } })

    // Single-pair group (for most games)
    const singleGroup = makePairGroup(lesson!, level!, [targetPair])
    // Multi-pair group (for listen-pick: needs level sounds as distractors)
    const multiGroup  = makePairGroup(lesson!, level!, allLevelPairs)

    const commonProps = { childId, backUrl }

    switch (game) {
      case 'minimal-pairs': return <MinimalPairsGame     group={singleGroup} {...commonProps} />
      case 'listen-pick':   return <ListenPickPhonicsGame group={multiGroup}  {...commonProps} lessonId={lessonId} />
      case 'speak':         return <PhonicsSpeak          lesson={pairLesson} {...commonProps} gradient={level!.gradient} btnColor={level!.btn} />
      case 'sort-words':    return <SortWordsGame         group={singleGroup} {...commonProps} />
      default: router.push(backUrl); return null
    }
  }

  return (
    <>
      {renderGame()}
      <GameSoundToggle />
    </>
  )
}
