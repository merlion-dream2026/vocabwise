'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type Step = {
  id: string
  label: string
  hint: string
  done: boolean
  action?: () => void
  actionLabel?: string
}

type Props = {
  familyId: string
  hasChildren: boolean
  childId?: string
  childLevel?: string
  hasPlayedGame: boolean   // từ vocab_sync: bất kỳ mastery nào có games > 0
  hasViewedFlashcard: boolean  // từ vocab_sync: bất kỳ mastery.*.flashcard === true
}

const STORAGE_KEY = (id: string) => `onboarding_dismissed_${id}`
const LEVEL_VISITED_KEY = (id: string) => `onboarding_level_${id}`

export default function OnboardingChecklist({
  familyId, hasChildren, childId, childLevel, hasPlayedGame, hasViewedFlashcard,
}: Props) {
  const router = useRouter()
  const [dismissed, setDismissed] = useState(false)
  const [levelVisited, setLevelVisited] = useState(false)

  useEffect(() => {
    setDismissed(!!localStorage.getItem(STORAGE_KEY(familyId)))
    setLevelVisited(!!localStorage.getItem(LEVEL_VISITED_KEY(familyId)))
  }, [familyId])

  const steps: Step[] = [
    {
      id: 'profile',
      label: 'Tạo hồ sơ bé',
      hint: 'Vào phần Bé của tôi → Thêm bé',
      done: hasChildren,
    },
    {
      id: 'level',
      label: 'Chọn level phù hợp và vào học',
      hint: 'Bấm vào hồ sơ bé → chọn chủ đề đầu tiên',
      done: levelVisited || hasViewedFlashcard || hasPlayedGame,
      action: hasChildren && childId && childLevel
        ? () => {
            localStorage.setItem(LEVEL_VISITED_KEY(familyId), '1')
            router.push(`/dashboard/${childId}/${childLevel}`)
          }
        : undefined,
      actionLabel: 'Vào học →',
    },
    {
      id: 'flashcard',
      label: 'Học thử 1 Flashcard',
      hint: 'Mở chủ đề bất kỳ → bấm Flashcard',
      done: hasViewedFlashcard,
    },
    {
      id: 'game',
      label: 'Chơi thử 1 game',
      hint: 'Sau flashcard, thử game Đúng/Sai hoặc Ghép cặp',
      done: hasPlayedGame,
    },
  ]

  const completedCount = steps.filter(s => s.done).length
  const allDone = completedCount === steps.length

  // Ẩn sau khi đã xong tất cả hoặc đã dismiss
  if (dismissed || allDone) return null

  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-100 rounded-3xl p-5 mb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-black text-gray-800 text-base">🚀 Bắt đầu cùng VocabKids</h3>
          <p className="text-xs text-gray-400 font-semibold mt-0.5">{completedCount}/{steps.length} bước hoàn thành</p>
        </div>
        <button
          onClick={() => { localStorage.setItem(STORAGE_KEY(familyId), '1'); setDismissed(true) }}
          className="text-gray-300 hover:text-gray-500 text-lg leading-none transition-colors"
          aria-label="Đóng"
        >
          ✕
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-purple-100 rounded-full mb-4 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full transition-all duration-500"
          style={{ width: `${(completedCount / steps.length) * 100}%` }}
        />
      </div>

      {/* Steps */}
      <div className="space-y-2.5">
        {steps.map((step) => (
          <div key={step.id} className={`flex items-start gap-3 ${step.done ? 'opacity-60' : ''}`}>
            <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black mt-0.5 transition-all ${
              step.done
                ? 'bg-green-500 text-white'
                : 'bg-white border-2 border-purple-200 text-purple-400'
            }`}>
              {step.done ? '✓' : ''}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-bold leading-snug ${step.done ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                {step.label}
              </p>
              {!step.done && (
                <p className="text-xs text-gray-400 mt-0.5">{step.hint}</p>
              )}
            </div>
            {!step.done && step.action && (
              <button
                onClick={step.action}
                className="flex-shrink-0 text-xs bg-purple-500 text-white font-bold px-3 py-1.5 rounded-full active:scale-95 transition-transform whitespace-nowrap"
              >
                {step.actionLabel}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
