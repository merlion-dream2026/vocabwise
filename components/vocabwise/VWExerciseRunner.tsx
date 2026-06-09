'use client'
import { useState } from 'react'
import type { ExercisesData } from './types'
import E1Matching        from './E1Matching'
import E3MCQContext      from './E3MCQContext'
import E4GapFill        from './E4GapFill'
import E5TFNG           from './E5TFNG'
import E6WordForms      from './E6WordForms'
import E7SentenceBuilding from './E7SentenceBuilding'
import E8ErrorFix       from './E8ErrorFix'

type Props = {
  exercises:  ExercisesData
  answerKey:  Record<string, Record<string, string>>
  topicTitle: string
  onBack:     () => void
  onComplete?: (scores: number[]) => void
}

type Phase = 'ex1' | 'ex2' | 'ex3' | 'ex4' | 'ex5' | 'results'

const EX_NAMES: Record<string, string> = {
  E1: 'Matching',        E2: 'MCQ — Meaning',
  E3: 'MCQ — Context',   E4: 'Gap-fill',
  E5: 'True/False/NG',   E6: 'Word Forms',
  E7: 'Sentence Building', E8: 'Error Fix',
}

const PHASE_ORDER: Phase[] = ['ex1', 'ex2', 'ex3', 'ex4', 'ex5']

function getExData(exercises: ExercisesData, phase: Phase) {
  const n = Number(phase.replace('ex', ''))
  const keys = Object.keys(exercises).filter(k => k.startsWith(`ex${n}_`))
  if (!keys.length) return null
  return (exercises as Record<string, unknown>)[keys[0]] as { type: string; instruction: string; [k: string]: unknown } | undefined
}

function scoreBar(score: number, max = 5) {
  const pct = Math.round((score / max) * 100)
  const color = pct === 100 ? 'bg-green-500' : pct >= 60 ? 'bg-yellow-400' : 'bg-red-400'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-black text-gray-600 w-8 text-right">{score}/{max}</span>
    </div>
  )
}

export default function VWExerciseRunner({ exercises, answerKey, topicTitle, onBack, onComplete }: Props) {
  const [phase, setPhase]   = useState<Phase>('ex1')
  const [scores, setScores] = useState<Record<string, number>>({})

  const advance = (current: Phase, score: number) => {
    setScores(s => ({ ...s, [current]: score }))
    const idx   = PHASE_ORDER.indexOf(current)
    const next  = PHASE_ORDER[idx + 1]
    // Skip phases with no data
    const findNext = (from: number): Phase => {
      for (let i = from; i < PHASE_ORDER.length; i++) {
        if (getExData(exercises, PHASE_ORDER[i])) return PHASE_ORDER[i]
      }
      return 'results'
    }
    const nextPhase = next ? findNext(idx + 1) : 'results'
    if (nextPhase === 'results') {
      const allScores = { ...scores, [current]: score }
      onComplete?.(Object.values(allScores))
    }
    setPhase(nextPhase)
  }

  const exData = getExData(exercises, phase)
  const exNum  = phase === 'results' ? 5 : Number(phase.replace('ex', ''))
  const phaseCount = PHASE_ORDER.filter(p => getExData(exercises, p)).length

  // Find which ordinal this phase is (1-based, skipping missing)
  const phaseIdx = PHASE_ORDER.filter(p => getExData(exercises, p)).indexOf(phase) + 1

  if (phase === 'results') {
    const total    = Object.values(scores).reduce((s, v) => s + v, 0)
    const maxScore = phaseCount * 5
    const pct      = Math.round((total / maxScore) * 100)
    const medal    = pct === 100 ? '🏆' : pct >= 80 ? '⭐' : pct >= 60 ? '👏' : '💪'

    return (
      <div className="flex flex-col gap-4 pb-8">
        <div className="text-center py-6">
          <div className="text-6xl mb-3">{medal}</div>
          <h2 className="text-2xl font-black text-gray-800">Hoàn thành!</h2>
          <p className="text-gray-500 text-sm mt-1">{topicTitle}</p>
          <div className="mt-4 inline-flex items-baseline gap-1">
            <span className="text-4xl font-black text-purple-600">{total}</span>
            <span className="text-gray-400 font-bold text-lg">/ {maxScore}</span>
          </div>
          <p className="text-gray-400 text-sm">{pct}%</p>
        </div>

        <div className="bg-white rounded-2xl border-2 border-gray-100 p-4 space-y-3">
          {PHASE_ORDER.map((p, i) => {
            const d = getExData(exercises, p)
            if (!d) return null
            const s = scores[p] ?? 0
            return (
              <div key={p}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-gray-500">Bài {i + 1} — {EX_NAMES[d.type] ?? d.type}</span>
                </div>
                {scoreBar(s)}
              </div>
            )
          })}
        </div>

        <button onClick={onBack}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-black py-3.5 rounded-2xl shadow-lg active:scale-95 transition-all">
          ← Quay lại chủ đề
        </button>
      </div>
    )
  }

  if (!exData) {
    // Auto-skip
    const idx = PHASE_ORDER.indexOf(phase)
    const next = PHASE_ORDER.slice(idx + 1).find(p => getExData(exercises, p))
    if (next) setPhase(next); else setPhase('results')
    return null
  }

  const ak = answerKey[`ex${exNum}`] ?? {}

  return (
    <div className="flex flex-col gap-4">
      {/* Exercise header */}
      <div className="flex items-center gap-3 pb-2 border-b border-gray-100">
        <button onClick={onBack} className="text-gray-400 font-bold text-sm hover:text-gray-600">← {topicTitle}</button>
        <span className="ml-auto text-xs font-black text-gray-400">Bài {phaseIdx}/{phaseCount}</span>
      </div>

      {/* Ex type label */}
      <div className="flex items-center gap-2">
        <span className="bg-purple-100 text-purple-700 text-xs font-black px-2.5 py-1 rounded-full">
          Bài {exNum}
        </span>
        <span className="font-black text-gray-700 text-sm">{EX_NAMES[exData.type] ?? exData.type}</span>
      </div>

      {/* Exercise component — cast via unknown to satisfy TS */}
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {(() => { const d = exData as any; const done = (s: number) => advance(phase, s)
        if (d.type === 'E1') return <E1Matching instruction={d.instruction} items={d.items} options={d.options} answerKey={ak} onDone={done} />
        if (d.type === 'E2' || d.type === 'E3') return <E3MCQContext instruction={d.instruction} items={d.items} onDone={done} />
        if (d.type === 'E4') return <E4GapFill instruction={d.instruction} wordBank={d.word_bank ?? []} items={d.items} onDone={done} />
        if (d.type === 'E5') return <E5TFNG instruction={d.instruction} items={d.items} onDone={done} />
        if (d.type === 'E6') return <E6WordForms instruction={d.instruction} items={d.items} onDone={done} />
        if (d.type === 'E7') return <E7SentenceBuilding instruction={d.instruction} items={d.items} onDone={done} />
        if (d.type === 'E8') return <E8ErrorFix instruction={d.instruction} items={d.items} onDone={done} />
        return null
      })()}
    </div>
  )
}
