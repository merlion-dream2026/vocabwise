'use client'
import { useState, useRef } from 'react'
import type { ExercisesData } from './types'
import ShareCardModal from './ShareCardModal'
import E1Matching        from './E1Matching'
import E3MCQContext      from './E3MCQContext'
import E4GapFill        from './E4GapFill'
import E5TFNG           from './E5TFNG'
import E6WordForms      from './E6WordForms'
import E7SentenceBuilding from './E7SentenceBuilding'
import E8ErrorFix       from './E8ErrorFix'
import EOddOneOut       from './EOddOneOut'
import ESDSameDiff      from './ESDSameDiff'
import ECategorize      from './ECategorize'
import ESynSub          from './ESynSub'
import ECollocBuilder   from './ECollocBuilder'
import WritingCheck     from './WritingCheck'

type ExPhase = 'ex1' | 'ex2' | 'ex3' | 'ex4' | 'ex5' | 'ex6'
type Phase   = 'menu' | ExPhase | 'results'

type Props = {
  exercises:      ExercisesData
  answerKey:      Record<string, Record<string, string>>
  topicTitle:     string
  cefr?:          string
  prevScores?:    Record<string, number>
  glossaryWords?: string[]
  isPro?:         boolean
  onBack:         () => void
  onComplete?:    (scores: number[]) => void
}

const EX_NAMES: Record<string, string> = {
  E1: 'Matching',       E2: 'MCQ — Meaning',
  E3: 'MCQ — Context',  E4: 'Gap Fill',
  E5: 'True/False/NG',  E6: 'Word Forms',
  E7: 'Reordering',     E8: 'Error Fix',
  E_ODD: 'Odd One Out', E_SD: 'Same or Different',
  E_CAT: 'Categorize',  E_SUB: 'Synonym Substitute',
  E_COL: 'Collocation Builder',
}

const EX_ICONS: Record<string, string> = {
  E1: '🔗', E2: '🅰️', E3: '🧠', E4: '✏️',
  E5: '✅', E6: '📝', E7: '🔄', E8: '🔍',
  E_ODD: '🔎', E_SD: '⚖️', E_CAT: '🗂️', E_SUB: '🔁', E_COL: '🧩',
}

const PHASE_ORDER: ExPhase[] = ['ex1', 'ex2', 'ex3', 'ex4', 'ex5', 'ex6']

function getExData(exercises: ExercisesData, phase: ExPhase) {
  const n    = Number(phase.replace('ex', ''))
  const keys = Object.keys(exercises).filter(k => k.startsWith(`ex${n}_`))
  if (!keys.length) return null
  return (exercises as Record<string, unknown>)[keys[0]] as
    { type: string; instruction: string; [k: string]: unknown } | undefined
}

function scoreBar(score: number) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className={`w-3.5 h-1.5 rounded-full ${i < score ? 'bg-green-400' : 'bg-gray-200'}`} />
      ))}
    </div>
  )
}

export default function VWExerciseRunner({
  exercises, answerKey, topicTitle, cefr, prevScores, glossaryWords, isPro, onBack, onComplete,
}: Props) {
  const [phase,     setPhase]     = useState<Phase>('menu')
  const [scores,    setScores]    = useState<Record<string, number>>({})
  const [showShare, setShowShare] = useState(false)
  const savedRef = useRef(false)

  const availablePhases = PHASE_ORDER.filter(p => getExData(exercises, p))
  const doneCount  = availablePhases.filter(p => scores[p] !== undefined).length
  const totalScore = availablePhases.reduce((s, p) => s + (scores[p] ?? 0), 0)
  const maxScore   = availablePhases.length * 5
  const pct        = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0

  // Previous session total
  const prevTotal = prevScores
    ? Object.values(prevScores).reduce((s, v) => s + v, 0)
    : 0

  const handleExDone = (exPhase: ExPhase, score: number) => {
    const newScores = { ...scores, [exPhase]: score }
    setScores(newScores)
    setPhase('menu')
    // Auto-save when last exercise completes — user doesn't need to click Nộp bài
    const newDone = availablePhases.filter(p => newScores[p] !== undefined).length
    if (newDone === availablePhases.length && !savedRef.current) {
      savedRef.current = true
      const scoreArray = PHASE_ORDER.map(p => newScores[p] ?? 0)
      onComplete?.(scoreArray)
    }
  }

  const handleFinish = () => {
    if (!savedRef.current) {
      savedRef.current = true
      const scoreArray = PHASE_ORDER.map(p => scores[p] ?? 0)
      onComplete?.(scoreArray)
    }
    setPhase('results')
  }

  // ── RESULTS ────────────────────────────────────────────────────────────────
  if (phase === 'results') {
    const medal = pct === 100 ? '🏆' : pct >= 80 ? '⭐' : pct >= 60 ? '👏' : '💪'
    return (
      <div className="flex flex-col gap-4 pb-8">
        {showShare && (
          <ShareCardModal
            topicTitle={topicTitle}
            score={totalScore}
            maxScore={maxScore}
            pct={pct}
            cefr={cefr}
            onClose={() => setShowShare(false)}
          />
        )}
        <div role="status" aria-live="polite" className="text-center py-6">
          <div className="text-6xl mb-3">{medal}</div>
          <h2 className="text-2xl font-black text-gray-800">Hoàn thành!</h2>
          <p className="text-gray-500 text-sm mt-1">{topicTitle}</p>
          <div className="mt-4 inline-flex items-baseline gap-1">
            <span className="text-4xl font-black text-purple-600">{totalScore}</span>
            <span className="text-gray-400 font-bold text-lg">/ {maxScore}</span>
          </div>
          <p className="text-gray-400 text-sm">{pct}%</p>
          {pct >= 80 && (
            <p className="text-xs font-black text-yellow-600 mt-1">🏆 Thành thạo chủ đề này!</p>
          )}
        </div>

        <div className="bg-white rounded-2xl border-2 border-gray-100 p-4 space-y-3">
          {availablePhases.map((p, i) => {
            const d = getExData(exercises, p)
            if (!d) return null
            const s    = scores[p] ?? 0
            const spct = Math.round((s / 5) * 100)
            const bar  = spct === 100 ? 'bg-green-500' : spct >= 60 ? 'bg-yellow-400' : 'bg-red-400'
            return (
              <div key={p}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-gray-500">
                    {EX_ICONS[d.type] ?? ''} {p === 'ex6' ? 'Bài thêm' : `Bài ${i + 1}`} — {EX_NAMES[d.type] ?? d.type}
                  </span>
                  <span className="text-xs font-black text-gray-600">{s}/5</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${bar} rounded-full transition-all`} style={{ width: `${spct}%` }} />
                </div>
              </div>
            )
          })}
        </div>

        {isPro && glossaryWords && glossaryWords.length > 0 ? (
          <WritingCheck words={glossaryWords} cefr={cefr ?? 'B1-C1'} />
        ) : (
          <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4">
            <p className="text-indigo-800 text-sm font-black">✍️ Thực hành viết câu</p>
            <p className="text-indigo-600 text-xs mt-1 leading-relaxed">
              Nâng cấp Pro để dùng AI chấm câu viết — chọn từ vừa học, viết câu, nhận nhận xét và gợi ý cải thiện ngay lập tức.
            </p>
          </div>
        )}

        <button
          onClick={() => setShowShare(true)}
          className="w-full flex items-center justify-center gap-2 bg-white border-2 border-purple-200 text-purple-600 font-black py-3 rounded-2xl active:scale-95 transition-all"
        >
          📤 Chia sẻ kết quả
        </button>

        <button onClick={onBack}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-black py-3.5 rounded-2xl shadow-lg active:scale-95 transition-all">
          ← Quay lại chủ đề
        </button>
      </div>
    )
  }

  // ── EXERCISE (ex1–ex5) ─────────────────────────────────────────────────────
  if (phase !== 'menu') {
    const exPhase  = phase as ExPhase
    const exData   = getExData(exercises, exPhase)
    const exNum    = Number(exPhase.replace('ex', ''))
    const phaseIdx = availablePhases.indexOf(exPhase) + 1
    const ak       = answerKey[`ex${exNum}`] ?? {}
    const done     = (score: number) => handleExDone(exPhase, score)

    if (!exData) { setPhase('menu'); return null }

    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 pb-2 border-b border-gray-100">
          <button onClick={() => setPhase('menu')}
            className="text-gray-400 font-bold text-sm hover:text-gray-600">
            ← Danh sách bài
          </button>
          <span className="ml-auto text-xs font-black text-gray-400">
            Bài {phaseIdx}/{availablePhases.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {exPhase === 'ex6'
            ? <span className="bg-amber-100 text-amber-700 text-xs font-black px-2.5 py-1 rounded-full">
                {EX_ICONS[exData.type] ?? ''} Bài thêm
              </span>
            : <span className="bg-purple-100 text-purple-700 text-xs font-black px-2.5 py-1 rounded-full">
                {EX_ICONS[exData.type] ?? ''} Bài {phaseIdx}
              </span>
          }
          <span className="font-black text-gray-700 text-sm">
            {EX_NAMES[exData.type] ?? exData.type}
          </span>
        </div>

        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {(() => { const d = exData as any
          if (d.type === 'E1') return <E1Matching instruction={d.instruction} items={d.items} options={d.options} answerKey={ak} onDone={done} />
          if (d.type === 'E2' || d.type === 'E3') return <E3MCQContext instruction={d.instruction} items={d.items} onDone={done} />
          if (d.type === 'E4') return <E4GapFill instruction={d.instruction} wordBank={d.word_bank ?? []} items={d.items} onDone={done} />
          if (d.type === 'E5') return <E5TFNG instruction={d.instruction} items={d.items} onDone={done} />
          if (d.type === 'E6') return <E6WordForms instruction={d.instruction} items={d.items} onDone={done} />
          if (d.type === 'E7') return <E7SentenceBuilding instruction={d.instruction} items={d.items} onDone={done} />
          if (d.type === 'E8') return <E8ErrorFix instruction={d.instruction} items={d.items} onDone={done} />
          if (d.type === 'E_ODD') return <EOddOneOut instruction={d.instruction} items={d.items} onDone={done} />
          if (d.type === 'E_SD')  return <ESDSameDiff instruction={d.instruction} items={d.items} onDone={done} />
          if (d.type === 'E_CAT') return <ECategorize instruction={d.instruction} categories={d.categories ?? []} items={d.items} onDone={done} />
          if (d.type === 'E_SUB') return <ESynSub instruction={d.instruction} items={d.items} onDone={done} />
          if (d.type === 'E_COL') return <ECollocBuilder instruction={d.instruction} items={d.items} onDone={done} />
          return null
        })()}
      </div>
    )
  }

  // ── MENU ───────────────────────────────────────────────────────────────────
  const hasPrev   = prevTotal > 0 && doneCount === 0
  const allDone   = doneCount === availablePhases.length

  return (
    <div className="flex flex-col gap-4 pb-4">
      {/* Header */}
      <div className="flex items-center gap-3 pb-2 border-b border-gray-100">
        <button onClick={onBack} className="inline-flex items-center gap-1.5 bg-purple-50 hover:bg-purple-100 text-purple-600 font-bold text-sm px-3 py-1.5 rounded-full transition-all active:scale-95">
          ← {topicTitle}
        </button>
        <span className="ml-auto text-xs font-black text-gray-400">
          {doneCount}/{availablePhases.length} bài đã làm
        </span>
      </div>

      {/* Previous session banner */}
      {hasPrev && (
        <div className="bg-purple-50 border border-purple-100 rounded-2xl px-4 py-2.5 text-center">
          <p className="text-xs text-purple-600 font-bold">
            Lần trước: <span className="text-purple-700">{prevTotal}/{maxScore} điểm</span>
            {prevTotal >= maxScore * 0.8 ? ' 🏆' : ' · làm lại để cải thiện!'}
          </p>
        </div>
      )}

      {/* Session progress bar */}
      {doneCount > 0 && (
        <div>
          <div className="flex justify-between text-xs font-bold text-gray-400 mb-1">
            <span>Tiến độ phiên này</span>
            <span>{totalScore}/{maxScore} · {pct}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      {/* Exercise list */}
      <div className="space-y-2.5">
        {availablePhases.map((exPhase, i) => {
          const d       = getExData(exercises, exPhase)
          if (!d) return null
          const done    = scores[exPhase] !== undefined
          const s       = scores[exPhase] ?? 0
          const isBonus = exPhase === 'ex6'
          return (
            <button key={exPhase} onClick={() => setPhase(exPhase)}
              className={`w-full flex items-center gap-3 bg-white border-2 rounded-2xl px-4 py-3.5 active:scale-[0.99] transition-all text-left hover:shadow-sm ${
                isBonus ? 'border-amber-100 hover:border-amber-300' : 'border-gray-100 hover:border-purple-200'
              }`}>
              {/* Icon */}
              <span className={`w-10 h-10 rounded-xl font-black text-lg flex items-center justify-center flex-shrink-0 ${
                done ? 'bg-green-50 text-green-500'
                : isBonus ? 'bg-amber-50 text-amber-500'
                : 'bg-purple-50 text-purple-400'
              }`}>
                {done ? '✓' : EX_ICONS[d.type] ?? `${i+1}`}
              </span>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-black text-gray-800 text-sm">
                  {isBonus ? 'Bài thêm' : `Bài ${i + 1}`} — {EX_NAMES[d.type] ?? d.type}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{isBonus ? '10 câu' : '5 câu'} · tối đa 5 điểm</p>
              </div>

              {/* Status */}
              {done ? (
                <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
                  <span className="text-sm font-black text-green-600">{s}/5</span>
                  {scoreBar(s)}
                </div>
              ) : (
                <span className={`text-xs font-black px-3 py-1.5 rounded-full flex-shrink-0 ${
                  isBonus ? 'text-amber-600 bg-amber-50' : 'text-purple-500 bg-purple-50'
                }`}>
                  Làm →
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Submit */}
      <button onClick={handleFinish}
        className={`w-full font-black py-3.5 rounded-2xl transition-all active:scale-95 mt-1 ${
          allDone
            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
            : 'bg-gray-100 text-gray-500 border-2 border-gray-200'
        }`}>
        {allDone
          ? '✅ Nộp bài — Xem kết quả'
          : `Nộp bài (${doneCount}/${availablePhases.length} bài đã làm)`}
      </button>
    </div>
  )
}
