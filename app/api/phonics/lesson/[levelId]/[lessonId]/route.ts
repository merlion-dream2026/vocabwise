import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getFamilyProfile } from '@/lib/security'
import { canAccessPhonicsLesson } from '@/lib/planUtils'
import phonicsLevels from '@/data/phonicsLevels.json'
import phonicsKnowledge from '@/data/phonicsKnowledge.json'

type Level  = typeof phonicsLevels.levels[number]
type Lesson = Level['lessons'][number]

export async function GET(req: NextRequest, { params }: { params: { levelId: string; lessonId: string } }) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const levelId  = decodeURIComponent(params.levelId)
  const lessonId = decodeURIComponent(params.lessonId)

  const level = phonicsLevels.levels.find(l => l.id === levelId) as Level | undefined
  if (!level) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const lessonIdx = level.lessons.findIndex(l => l.id === lessonId)
  const lesson = level.lessons[lessonIdx] as Lesson | undefined
  if (!lesson) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (session.familyId !== 'superadmin') {
    const profile = await getFamilyProfile(session.familyId)
    if (!profile) return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    if (!canAccessPhonicsLesson(profile, levelId, lessonIdx)) {
      return NextResponse.json({ error: 'Upgrade to Pro to access this lesson.' }, { status: 403 })
    }
  }

  const prev = lessonIdx > 0 ? level.lessons[lessonIdx - 1] : null
  const next = lessonIdx < level.lessons.length - 1 ? level.lessons[lessonIdx + 1] : null

  // All pair-type lessons in the level — needed by the listen-pick game for distractor
  // options (it must draw wrong-answer choices from sibling sounds in the same level).
  const allLevelPairs = level.lessons
    .filter(l => l.type === 'pair')
    .map(l => {
      const p = l as Lesson & { sounds?: unknown; practice_words?: unknown }
      return { id: l.id, sounds: p.sounds ?? [], practice_words: p.practice_words ?? [] }
    })

  return NextResponse.json({
    level: {
      id: level.id, titleVi: level.titleVi, emoji: level.emoji,
      gradient: level.gradient, bg: level.bg, border: level.border, text: level.text, bar: level.bar, btn: level.btn,
    },
    lesson,
    prevLesson: prev ? { id: prev.id, title: prev.title, emoji: prev.emoji } : null,
    nextLesson: next ? { id: next.id, title: next.title, emoji: next.emoji } : null,
    knowledge: (phonicsKnowledge as Record<string, unknown>)[lessonId] ?? null,
    allLevelPairs,
  }, { headers: { 'Cache-Control': 'private, max-age=300' } })
}
