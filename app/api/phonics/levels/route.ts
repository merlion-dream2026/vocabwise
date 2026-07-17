import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import phonicsLevels from '@/data/phonicsLevels.json'

// Navigation metadata only — level/lesson names, counts, mastery-game lists, and the light
// symbol/keyword/vi sound info used by the "weak sounds" review feature. Deliberately excludes
// the actual teaching content (tip, practice_words, practice_sentences, buckets, sentences,
// audio URLs) — that's gated per-lesson behind /api/phonics/lesson/[levelId]/[lessonId].
export async function GET(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const levels = phonicsLevels.levels.map(level => ({
    id: level.id, title: level.title, titleVi: level.titleVi, subtitle: level.subtitle, emoji: level.emoji,
    gradient: level.gradient, bg: level.bg, border: level.border, text: level.text, bar: level.bar, btn: level.btn,
    lessons: level.lessons.map(lesson => {
      const sounds = (lesson as { sounds?: { symbol: string; keyword: string; emoji: string; vi: string }[] }).sounds
      return {
        id: lesson.id, type: lesson.type, title: lesson.title, subtitle: lesson.subtitle, emoji: lesson.emoji,
        masteryGames: lesson.masteryGames, games: lesson.games,
        sounds: sounds?.map(s => ({ symbol: s.symbol, keyword: s.keyword, emoji: s.emoji, vi: s.vi })),
      }
    }),
  }))

  return NextResponse.json({ levels }, { headers: { 'Cache-Control': 'private, max-age=300' } })
}
