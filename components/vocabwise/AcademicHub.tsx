'use client'
import { Journey, Stars, WordPreview, HubStyles, PRESS, type JourneyNode } from '@/components/TopicHub'
import Sticker from '@/components/Sticker'
import Mascot from '@/components/Mascot'
import { EX_ICONS, EX_NAMES, type ExPhase } from './VWExerciseRunner'
import type { ExercisesData } from './types'

// Overview ("Tổng quan") tab of an Academic topic — the counterpart of the Daily Topic Hub:
// word chips, status + journey (Đọc → Bài tập → Thạo → Sticker), next-step button, the exercise tiles
// and shortcuts into the reading / vocabulary / grammar tabs. Presentation only: scores and the
// mastery rule (best score per exercise, total ≥20) still live in TopicViewer.
const PHASES: ExPhase[] = ['ex1', 'ex2', 'ex3', 'ex4', 'ex5', 'ex6']
export const MASTERY_POINTS = 20

// Academic scores are 0–5 per exercise: 5 = 3★, 3–4 = 2★, 1–2 = 1★.
const starsFor = (score: number | undefined) => (score === undefined ? 0 : score >= 5 ? 3 : score >= 3 ? 2 : score >= 1 ? 1 : 0)

function exInfo(exercises: ExercisesData, phase: ExPhase): { type: string } | null {
  const n = Number(phase.replace('ex', ''))
  const key = Object.keys(exercises).find((k) => k.startsWith(`ex${n}_`))
  return key ? ((exercises as unknown as Record<string, { type: string }>)[key]) : null
}

export type AcademicHubProps = {
  emoji?: string
  words: { word: string; meaning_vi: string }[]
  exercises: ExercisesData
  exScores: Record<string, number> | undefined
  read: boolean
  completed: boolean
  mastered: boolean
  hasGrammar: boolean
  onOpenTab: (tab: 'passage' | 'glossary' | 'grammar' | 'exercises') => void
  onStartExercise: (phase: ExPhase) => void
  onOpenAlbum: () => void
}

export default function AcademicHub({
  emoji, words, exercises, exScores, read, completed, mastered, hasGrammar, onOpenTab, onStartExercise, onOpenAlbum,
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

  const nodes: JourneyNode[] = [
    { icon: '📄', label: 'Đọc bài', done: read || completed },
    { icon: '✏️', label: `Bài tập ${mainDone}/${main.length}`, done: main.length > 0 && mainDone >= main.length },
    { icon: '🏆', label: 'Thạo', done: mastered },
    { icon: '🎁', label: mastered ? 'Sticker' : 'Quà', done: mastered, last: true, sticker: mastered ? sticker : null },
  ]
  const title = mastered ? 'Bạn đã thạo topic này! 🎉'
    : completed ? `Còn ${left} điểm nữa là thạo! 💪`
    : read ? 'Làm bài tập để lên điểm nào! ✏️'
    : 'Cùng khám phá topic này nhé! 🚀'
  const owl = mastered ? 'Quá đỉnh! Sticker này là của bạn rồi!' : completed ? `Cần tổng ${MASTERY_POINTS} điểm bài tập để thạo.` : 'Mỗi ngày một chút, bạn sẽ giỏi!'

  const cta1 = !read && !completed
    ? { emoji: '📄', title: 'Đọc bài Passage', sub: 'Bước đầu tiên, nghe và xem dịch nếu cần', run: () => onOpenTab('passage') }
    : !mastered && nextTile
    ? { emoji: EX_ICONS[nextTile.type] ?? '✏️', title: nextTile.score === undefined ? `Làm ${EX_NAMES[nextTile.type] ?? 'bài tập'}` : `Làm lại ${EX_NAMES[nextTile.type] ?? 'bài tập'} để lên điểm`, sub: nextTile.score === undefined ? 'Chỉ mất vài phút' : `Đang có ${nextTile.score}/5 điểm`, run: () => onStartExercise(nextTile.phase) }
    : null

  return (
    <div className="space-y-3">
      <HubStyles />
      <WordPreview words={words.map((w) => ({ word: w.word, meaning: w.meaning_vi, emoji: '📘' }))} onDetail={() => onOpenTab('glossary')} />

      <section className={`rounded-3xl border-2 border-b-[4px] p-4 ${mastered ? 'border-amber-300 border-b-amber-500 bg-amber-50' : 'border-slate-200 border-b-slate-300 bg-white'}`}>
        <div className="flex items-center gap-3">
          {mastered
            ? <button type="button" onClick={onOpenAlbum} aria-label="Xem bộ sưu tập sticker"><Sticker emoji={sticker} size="md" tilt={-8} /></button>
            : <span className="flex h-16 w-16 flex-shrink-0 -rotate-6 items-center justify-center rounded-2xl bg-blue-100 text-4xl shadow-md ring-4 ring-white">{emoji ?? '📘'}</span>}
          <div className="min-w-0 flex-1">
            <p className="text-lg font-bold leading-tight text-blue-900">{title}</p>
            <p className="mt-0.5 text-xs font-semibold text-slate-500">{total} điểm bài tập{mastered ? '' : ` · cần ${MASTERY_POINTS} để thạo`}</p>
          </div>
        </div>
        <Journey nodes={nodes} onTrophy={onOpenAlbum} />
        <div className="mt-2 flex items-center gap-3 rounded-2xl bg-slate-50 px-3 py-1.5">
          <Mascot shot={mastered ? 'pose-cheer' : 'pose-idle'} size={48} blink />
          <p className="min-w-0 flex-1 text-sm font-bold text-slate-600">{owl}</p>
        </div>
      </section>

      {cta1 && (
        <button type="button" onClick={cta1.run}
          className={`flex min-h-[64px] w-full items-center gap-3 rounded-2xl border-b-[4px] border-blue-700 bg-blue-500 px-4 py-3 text-left text-white ${PRESS}`}>
          <span className="flex h-12 w-12 flex-shrink-0 rotate-6 items-center justify-center rounded-2xl bg-white text-3xl shadow">{cta1.emoji}</span>
          <div className="min-w-0 flex-1">
            <p className="text-base font-bold leading-tight">{cta1.title}</p>
            <p className="mt-0.5 text-xs font-semibold text-white/80">{cta1.sub}</p>
          </div>
          <span className="flex-shrink-0 text-xl font-bold">→</span>
        </button>
      )}

      {tiles.length > 0 && (
        <section className="rounded-3xl border-2 border-b-[4px] border-blue-200 border-b-blue-300 bg-blue-50 p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border-b-[3px] border-blue-800 bg-blue-600 px-3 py-1.5 text-sm font-bold text-white">✏️ Bài tập từ vựng</span>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-blue-700">{total} điểm</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2.5">
            {main.map((t, i) => <ExerciseTile key={t.phase} t={t} tilt={i % 2 === 0 ? '-rotate-6' : 'rotate-6'} onStart={onStartExercise} />)}
            {bonus && <div className="col-span-2"><ExerciseTile t={bonus} tilt="-rotate-6" bonus onStart={onStartExercise} /></div>}
          </div>
        </section>
      )}

      <div className={`grid gap-2.5 ${hasGrammar ? 'grid-cols-3' : 'grid-cols-2'}`}>
        {([['passage', '📄', 'Đọc bài'], ['glossary', '📚', 'Từ vựng'], ...(hasGrammar ? [['grammar', '📖', 'Ngữ pháp']] : [])] as const).map(([k, icon, label]) => (
          <button key={k} type="button" onClick={() => onOpenTab(k as 'passage' | 'glossary' | 'grammar')}
            className={`flex flex-col items-center gap-1 rounded-2xl border-2 border-b-[4px] border-slate-200 border-b-slate-300 bg-white py-3 ${PRESS}`}>
            <span className="text-2xl">{icon}</span>
            <span className="text-xs font-bold text-slate-700">{label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function ExerciseTile({ t, tilt, bonus, onStart }: { t: { phase: ExPhase; type: string; score: number | undefined }; tilt: string; bonus?: boolean; onStart: (p: ExPhase) => void }) {
  const stars = starsFor(t.score)
  const done = stars === 3
  const surface = done ? 'border-emerald-300 border-b-emerald-500 bg-emerald-50' : t.score !== undefined ? 'border-amber-200 border-b-amber-400 bg-white' : 'border-slate-200 border-b-slate-300 bg-white'
  return (
    <button type="button" onClick={() => onStart(t.phase)}
      className={`relative flex min-h-[56px] w-full items-center gap-2.5 rounded-2xl border-2 border-b-[4px] px-2.5 py-2 text-left ${PRESS} ${surface}`}>
      <span className="relative flex-shrink-0">
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl bg-white text-2xl leading-none shadow ${tilt}`}>{EX_ICONS[t.type] ?? '✏️'}</span>
        {done && <span className="absolute -bottom-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-emerald-500 text-[10px] font-bold text-white">✓</span>}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold leading-tight text-slate-800">{bonus ? '🎁 Thử thách: ' : ''}{EX_NAMES[t.type] ?? t.type}</span>
        <span className="mt-1 flex items-center justify-between gap-1">
          <Stars filled={stars} animate />
          <span className="text-xs font-bold text-slate-500">{t.score ?? 0}/5</span>
        </span>
      </span>
    </button>
  )
}
