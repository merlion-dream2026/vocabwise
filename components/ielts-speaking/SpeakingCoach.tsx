'use client'

import { useState } from 'react'
import PracticeScreen, { emptyQuestionState, type QuestionState } from '@/components/ielts-speaking/PracticeScreen'
import QuestionListScreen from '@/components/ielts-speaking/QuestionListScreen'
import SetupScreen from '@/components/ielts-speaking/SetupScreen'
import { randomBatchQuestion, type BatchQuestion, type PracticeMode } from '@/components/ielts-speaking/batchQuestion'
import type { IeltsSpeakingPart } from '@/lib/ieltsSpeakingTypes'

type FlowStep = 'setup' | 'list' | 'practice'

export default function SpeakingCoach() {
  const [step, setStep] = useState<FlowStep>('setup')
  const [part, setPart] = useState<IeltsSpeakingPart>(1)
  const [mode, setMode] = useState<PracticeMode>('choose')
  const [batch, setBatch] = useState<BatchQuestion[]>([])
  const [activeQuestionId, setActiveQuestionId] = useState<string>('')
  const [questionStates, setQuestionStates] = useState<Record<string, QuestionState>>({})

  const startPractice = (nextBatch: BatchQuestion[]) => {
    const states: Record<string, QuestionState> = {}
    for (const question of nextBatch) states[question.questionId] = emptyQuestionState()
    setBatch(nextBatch)
    setQuestionStates(states)
    setActiveQuestionId(nextBatch[0]?.questionId ?? '')
    setStep('practice')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleStart = () => {
    if (mode === 'random') {
      startPractice([randomBatchQuestion(part)])
    } else {
      setStep('list')
    }
  }

  const updateQuestionState = (
    id: string,
    patch: Partial<QuestionState> | ((prev: QuestionState) => Partial<QuestionState>),
  ) => {
    setQuestionStates(previous => {
      const current = previous[id] ?? emptyQuestionState()
      const delta = typeof patch === 'function' ? patch(current) : patch
      return { ...previous, [id]: { ...current, ...delta } }
    })
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-white pb-28">
      <div className="mx-auto max-w-2xl px-4 py-5 sm:py-8">
        {step === 'setup' && (
          <SetupScreen
            part={part}
            onSelectPart={setPart}
            mode={mode}
            onSelectMode={setMode}
            onStart={handleStart}
          />
        )}

        {step === 'list' && (
          <QuestionListScreen
            part={part}
            onBack={() => setStep('setup')}
            onSubmit={startPractice}
          />
        )}

        {step === 'practice' && batch.length > 0 && (
          <PracticeScreen
            part={part}
            mode={mode}
            batch={batch}
            activeQuestionId={activeQuestionId}
            onSelectQuestion={setActiveQuestionId}
            questionStates={questionStates}
            onUpdateQuestionState={updateQuestionState}
            onBack={() => setStep(mode === 'choose' ? 'list' : 'setup')}
            onRequestFreshQuestion={() => {
              if (mode === 'random') {
                startPractice([randomBatchQuestion(part)])
              } else {
                setStep('list')
              }
            }}
          />
        )}
      </div>
    </main>
  )
}
