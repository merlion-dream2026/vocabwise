'use client'
import { Journey, WordPreview, HubStyles, MascotNextStep, MasteredHero, tap, PRESS, type JourneyNode, type NextAction } from '@/components/TopicHub'
import { HubList, HubRow, type RowStatus } from '@/components/TopicRounds'
import type { HubTheme } from '@/components/hubTheme'
import { EX_ICONS, EX_NAMES, type ExPhase } from './VWExerciseRunner'
import type { ExercisesData } from './types'

// Overview ("Tổng quan") tab of an Academic topic — the counterpart of the Daily Topic Hub, in the
// book's colour: word chips, status + journey (Đọc → Bài tập → Thạo → Sticker), the mascot beside
// the next-step button, the exercise list and the bonus challenge. Presentation only: scores and
// the mastery rule (best score per exercise, total ≥20) still live in TopicViewer.
const PHASES: ExPhase[] = ['ex1', 'ex2', 'ex3', 'ex4', 'ex5', 'ex6']
export const MASTERY_POINTS = 20

// Academic scores are 0–5 per exercise: 5 = 3★, 3–4 = 2★, 1–2 = 1★.
const starsFor = (score: number | undefined) => (score === undefined ? 0 : score >= 5 ? 3 : score >= 3 ? 2 : score >= 1 ? 1 : 0)
const scoreText = (score: number) => `${'⭐'.repeat(starsFor(score)) || '☆'} · ${score}/5`

function exInfo(exercises: ExercisesData, phase: ExPhase): { type: string } | null {
  const n = Number(phase.replace('ex', ''))
  const key = Object.keys(exercises).find((k) => k.startsWith(`ex${n}_`))
  return key ? ((exercises as unknown as Record<string, { type: string }>)[key]) : null
}

export type AcademicHubProps = {
  emoji?: string
  theme: HubTheme
  words: { word: string; meaning_vi: string }[]
  exercises: ExercisesData
  exScores: Record<string, number> | undefined
  read: boolean
  completed: boolean
  mastered: boolean
  onOpenTab: (tab: 'passage' | 'glossary' | 'grammar' | 'exercises') => void
  onStartExercise: (phase: ExPhase) => void
  onOpenAlbum: () => void
}

export default function AcademicHub({
  emoji, theme, words, exercises, exScores, read, completed, mastered, onOpenTab, onStartExercise, onOpenAlbum,
}: AcademicHubProps) {
  const sticker = emoji ?? '⭐'
  const tiles = PHASES.map((p) => {
    const info = exInfo(exercises, p)
    return info ? { phase: p, type: info.type, score: exScores?.[info.type] } : null
  }).filter((t): t is { phase: ExPhase; type: string; score: number | undefined } => t !== null)
  const main = tiles.filter((t) => t.phase !== 'ex6')
  const bonus = tiles.find((t) => t.phase === 'ex6')
  const total = Object.values(exScores ?? {}).reduce((s, v) => s + v, 0)
  const mainDone = main.filter((t) => t.score !== undefined).length
  const left = Math.max(0, MASTERY_POINTS - total)
  const nextTile = main.find((t) => (t.score ?? 0) < 5) ?? main[0]
  const nextPhase = !mastered && (read || completed) ? nextTile?.phase : undefined

  const nodes: JourneyNode[] = [
    { icon: '📄', label: 'Đọc bài', done: read || completed },
    { icon: '✏️', label: `Bài tập ${mainDone}/${main.length}`, done: main.length > 0 && mainDone >= main.length },
    { icon: '🏆', label: 'Thạo', done: mastered },
    { icon: '🎁', label: mastered ? 'Sticker' : 'Quà', done: mastered, last: true, sticker: mastered ? sticker : null },
  ]
  const title = completed ? `Còn ${left} điểm nữa là thạo! 💪`
    : read ? 'Làm bài tập để lên điểm nào! ✏️'
    : 'Cùng khám phá topic này nhé! 🚀'

  const action: NextAction | null = !read && !completed
    ? { emoji: '📄', title: 'Đọc bài Passage', sub: 'Bước đầu tiên, nghe và xem dịch nếu cần', run: () => onOpenTab('passage') }
    : !mastered && nextTile
    ? { emoji: EX_ICONS[nextTile.type] ?? '✏️', title: `${nextTile.score === undefined ? 'Làm' : 'Làm lại'} ${EX_NAMES[nextTile.type] ?? 'bài tập'}`, sub: nextTile.score === undefined ? 'Chỉ mất vài phút' : `Đang có ${nextTile.score}/5 điểm`, run: () => onStartExercise(nextTile.phase) }
    : null
  const says = !read && !completed ? 'Đọc bài trước nhé, từ mới sẽ dễ nhớ hơn nhiều!'
    : nextTile?.score === undefined ? 'Bài này chỉ mất vài phút thôi, thử ngay nhé!'
    : 'Làm lại bài này là gom thêm điểm nhanh nhất đó!'

  const rowOf = (t: { phase: ExPhase; score: number | undefined }): { status: RowStatus; sub: string } =>
    t.score === 5 ? { status: 'done', sub: scoreText(5) }
    : t.phase === nextPhase ? { status: 'next', sub: t.score === undefined ? 'Làm tiếp bài này' : `${scoreText(t.score)} · Làm tiếp bài này` }
    : t.score !== undefined ? { status: 'started', sub: scoreText(t.score) }
    : { status: 'todo', sub: 'Chưa làm' }

  return (
    <div className="space-y-3">
      <HubStyles />
      <WordPreview words={words} theme={theme} onDetail={() => onOpenTab('glossary')} />

      {mastered ? (
        <section className="rounded-3xl border-2 border-b-[4px] border-amber-300 border-b-amber-500 bg-amber-50 p-4">
          <MasteredHero title="Bạn đã thạo topic này! 🎉">
            <p className="text-xs font-semibold text-amber-700">{total} điểm bài tập</p>
            <button type="button" onClick={() => { tap(); onOpenAlbum() }}
              className={`mt-2 rounded-full border-b-[3px] border-amber-600 bg-amber-400 px-3 py-1 text-xs font-bold text-amber-950 ${PRESS}`}>
              {sticker} Xem sticker
            </button>
          </MasteredHero>
          <Journey nodes={nodes} theme={theme} onTrophy={onOpenAlbum} />
        </section>
      ) : (
        <section className={`rounded-3xl border-2 border-b-[4px] bg-white p-4 ${theme.card}`}>
          <div className="flex items-baseline gap-2">
            <p className={`min-w-0 flex-1 text-base font-bold leading-tight ${theme.title}`}>{title}</p>
            <span className="flex-shrink-0 text-xs font-bold text-slate-500">{total}/{MASTERY_POINTS} điểm</span>
          </div>
          <Journey nodes={nodes} theme={theme} onTrophy={onOpenAlbum} />
        </section>
      )}

      {action && <MascotNextStep says={says} action={action} activity={!read && !completed ? 'passage' : 'exercise'} theme={theme} />}

      {main.length > 0 && (
        <section className={`rounded-3xl border-2 border-b-[4px] p-3 ${theme.card} ${theme.tint}`}>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full border-b-[3px] px-3 py-1 text-sm font-bold ${theme.pill}`}>✏️ Bài tập từ vựng</span>
            <span className="flex-1" />
            <span className={`text-[13px] font-bold ${theme.accent}`}>{mainDone}/{main.length} bài · {total} điểm</span>
          </div>
          <HubList theme={theme}>
            {main.map((t) => (
              <HubRow key={t.phase} emoji={EX_ICONS[t.type] ?? '✏️'} label={EX_NAMES[t.type] ?? t.type} theme={theme}
                onClick={() => onStartExercise(t.phase)} {...rowOf(t)} />
            ))}
          </HubList>
        </section>
      )}

      {bonus && (
        <button type="button" onClick={() => { tap(); onStartExercise(bonus.phase) }}
          className={`flex min-h-[52px] w-full items-center gap-2.5 rounded-3xl border-2 border-dashed bg-white px-3.5 py-2 text-left ${theme.dashed}`}>
          <span className="text-xl" aria-hidden>🎁</span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold text-slate-800">Thử thách: {EX_NAMES[bonus.type] ?? bonus.type}</span>
            <span className="block text-xs font-semibold text-slate-500">
              {bonus.score === undefined ? '10 câu · gom thêm điểm, không bắt buộc' : `${scoreText(bonus.score)} · không bắt buộc`}
            </span>
          </span>
          <span className="text-lg font-bold text-slate-400" aria-hidden>›</span>
        </button>
      )}
    </div>
  )
}
