'use client'

import { useEffect, useMemo, type ChangeEvent } from 'react'
import AnswerActions from '@/components/ielts-speaking/AnswerActions'
import BandFeedbackPanel from '@/components/ielts-speaking/BandFeedbackPanel'
import IeltsShareCardModal from '@/components/ielts-speaking/IeltsShareCardModal'
import Part2PreparationTimer from '@/components/ielts-speaking/Part2PreparationTimer'
import RecordAnswerButton from '@/components/ielts-speaking/RecordAnswerButton'
import StepDots from '@/components/ielts-speaking/StepDots'
import type { BatchQuestion, PracticeMode } from '@/components/ielts-speaking/batchQuestion'
import type {
  AnswerSource,
  IeltsSpeakingEvaluation,
  IeltsSpeakingPart,
} from '@/lib/ieltsSpeakingTypes'

export type QuestionState = {
  inputMode: 'type' | 'record'
  answer: string
  source: AnswerSource
  recordingUrl: string | null
  loading: boolean
  error: string | null
  attempts: IeltsSpeakingEvaluation[]
  showShare: boolean
  tipIndex: number
}

export function emptyQuestionState(): QuestionState {
  return {
    inputMode: 'record',
    answer: '',
    source: 'typed',
    recordingUrl: null,
    loading: false,
    error: null,
    attempts: [],
    showShare: false,
    tipIndex: 0,
  }
}

type StatePatch = Partial<QuestionState> | ((prev: QuestionState) => Partial<QuestionState>)

type Props = {
  part: IeltsSpeakingPart
  mode: PracticeMode
  batch: BatchQuestion[]
  activeQuestionId: string
  onSelectQuestion: (id: string) => void
  questionStates: Record<string, QuestionState>
  onUpdateQuestionState: (id: string, patch: StatePatch) => void
  onBack: () => void
  /** Called when there is no "next" item left in the current batch (single-question batches). */
  onRequestFreshQuestion: () => void
}

const LOADING_TIPS = [
  'Band 7+ thường trả lời trực tiếp trong 2 giây đầu, không vòng vo.',
  'IELTS thích một ví dụ cụ thể hơn là liệt kê nhiều ý chung chung.',
  'Một ý phát triển sâu ăn điểm hơn ba ý hời hợt.',
  'Ngập ngừng tự nhiên không bị trừ điểm — lặp từ vô nghĩa mới bị.',
  'Từ vựng chính xác, đúng ngữ cảnh quan trọng hơn từ vựng nghe "to tát".',
]

const FEEDBACK_SECTIONS = [
  { id: 'ielts-criteria', label: 'Tiêu chí' },
  { id: 'ielts-corrections', label: 'Sửa câu' },
  { id: 'ielts-models', label: 'Model answers' },
  { id: 'ielts-alternative', label: 'Hướng khác' },
  { id: 'ielts-expressions', label: 'Từ hay' },
]

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const PART_STYLE: Record<IeltsSpeakingPart, { badge: string; box: string; text: string; label: string }> = {
  1: { badge: 'bg-purple-600', box: 'border-purple-100 bg-purple-50', text: 'text-purple-950', label: 'text-purple-700' },
  2: { badge: 'bg-amber-600', box: 'border-amber-100 bg-amber-50', text: 'text-amber-950', label: 'text-amber-700' },
  3: { badge: 'bg-cyan-600', box: 'border-cyan-100 bg-cyan-50', text: 'text-cyan-950', label: 'text-cyan-700' },
}

export default function PracticeScreen({
  part,
  mode,
  batch,
  activeQuestionId,
  onSelectQuestion,
  questionStates,
  onUpdateQuestionState,
  onBack,
  onRequestFreshQuestion,
}: Props) {
  const activeQuestion = batch.find(q => q.questionId === activeQuestionId) ?? batch[0]
  const activeState = questionStates[activeQuestionId] ?? emptyQuestionState()
  const style = PART_STYLE[part]

  const evaluation = activeState.attempts.at(-1)
  const previousEvaluation = activeState.attempts.length > 1 ? activeState.attempts[activeState.attempts.length - 2] : undefined
  const wordCount = useMemo(() => activeState.answer.trim().split(/\s+/).filter(Boolean).length, [activeState.answer])

  // Revoke every recording URL still held across the batch when leaving the practice screen.
  useEffect(() => {
    return () => {
      for (const state of Object.values(questionStates)) {
        if (state.recordingUrl) URL.revokeObjectURL(state.recordingUrl)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Rotate a short coaching tip while the active question's evaluate call is in flight.
  useEffect(() => {
    if (!activeState.loading) return
    onUpdateQuestionState(activeQuestionId, { tipIndex: Math.floor(Math.random() * LOADING_TIPS.length) })
    const timer = setInterval(() => {
      onUpdateQuestionState(activeQuestionId, prev => ({ tipIndex: (prev.tipIndex + 1) % LOADING_TIPS.length }))
    }, 3000)
    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeState.loading, activeQuestionId])

  const handleRecordingReady = (url: string) => {
    if (activeState.recordingUrl) URL.revokeObjectURL(activeState.recordingUrl)
    onUpdateQuestionState(activeQuestionId, { recordingUrl: url })
  }

  const handleTranscript = (transcript: string) => {
    onUpdateQuestionState(activeQuestionId, { answer: transcript, source: 'audio', inputMode: 'record', error: null })
  }

  const prepareRetry = () => {
    if (activeState.recordingUrl) URL.revokeObjectURL(activeState.recordingUrl)
    onUpdateQuestionState(activeQuestionId, { answer: '', error: null, recordingUrl: null, showShare: false })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleNext = () => {
    const currentIndex = batch.findIndex(q => q.questionId === activeQuestionId)
    if (batch.length > 1) {
      const nextIndex = (currentIndex + 1) % batch.length
      onSelectQuestion(batch[nextIndex].questionId)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      onRequestFreshQuestion()
    }
  }

  const evaluate = async () => {
    const trimmed = activeState.answer.trim()
    if (!trimmed || activeState.loading) return
    onUpdateQuestionState(activeQuestionId, { loading: true, error: null })
    try {
      const response = await fetch('/api/ielts-speaking/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          part,
          topic: activeQuestion.topic,
          theme: activeQuestion.theme,
          questionId: activeQuestion.questionId,
          question: activeQuestion.question,
          answer: trimmed,
          source: activeState.source,
          attemptNumber: activeState.attempts.length + 1,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data?.error || 'Không thể chấm câu trả lời.')
      onUpdateQuestionState(activeQuestionId, prev => ({ attempts: [...prev.attempts, data as IeltsSpeakingEvaluation] }))
      window.setTimeout(() => {
        document.getElementById('ielts-feedback')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    } catch (caught) {
      onUpdateQuestionState(activeQuestionId, {
        error: caught instanceof Error ? caught.message : 'Không thể chấm câu trả lời. Hãy thử lại.',
      })
    } finally {
      onUpdateQuestionState(activeQuestionId, { loading: false })
    }
  }

  return (
    <div>
      <StepDots current={3} />
      <div className="mb-4 flex items-center gap-2">
        <button type="button" onClick={onBack} aria-label="Quay lại" className="text-xl text-indigo-400 hover:text-indigo-600">
          ←
        </button>
        <p className="text-sm font-black text-gray-700">Part {part}</p>
      </div>

      {batch.length > 1 && (
        <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto">
          {batch.map(question => {
            const state = questionStates[question.questionId] ?? emptyQuestionState()
            const graded = state.attempts.length > 0
            const answered = state.answer.trim().length > 0
            const isActive = question.questionId === activeQuestionId
            return (
              <button
                key={question.questionId}
                type="button"
                onClick={() => onSelectQuestion(question.questionId)}
                className={`flex-shrink-0 rounded-full border-2 px-3 py-1.5 text-xs font-black transition-all ${
                  isActive
                    ? 'border-indigo-500 bg-indigo-600 text-white'
                    : graded
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : answered
                        ? 'border-amber-200 bg-amber-50 text-amber-700'
                        : 'border-gray-200 bg-white text-gray-500'
                }`}
              >
                {graded ? '✓ ' : ''}{question.pillLabel}
              </button>
            )
          })}
        </div>
      )}

      <section className="rounded-3xl border-2 border-indigo-100 bg-white p-4 shadow-sm sm:p-5">
        <div className={`rounded-2xl border px-4 py-4 ${style.box}`}>
          <div className="flex items-center justify-between gap-3">
            <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-white ${style.badge}`}>
              Part {part}
            </span>
          </div>

          {activeQuestion.theme && (
            <p className={`mt-3 text-xs font-black uppercase tracking-wide ${style.label}`}>{activeQuestion.theme}</p>
          )}

          <p className={`mt-2 text-lg font-black leading-relaxed ${style.text}`}>{activeQuestion.question}</p>

          <AnswerActions
            text={activeQuestion.questionDetails
              ? `${activeQuestion.question}. You should say: ${activeQuestion.questionDetails.join('; ')}`
              : activeQuestion.question}
            compact
          />

          {activeQuestion.questionDetails && (
            <div className="mt-3 rounded-xl bg-white/70 px-3 py-3">
              <p className="text-xs font-black text-amber-800">You should say:</p>
              <ul className="mt-1.5 space-y-1 text-sm leading-relaxed text-amber-950">
                {activeQuestion.questionDetails.map(point => <li key={point}>• {point}</li>)}
              </ul>
              {activeQuestion.responseFramework && (
                <p className="mt-3 border-t border-amber-100 pt-2 text-xs leading-relaxed text-amber-800">
                  Khung phát triển: {activeQuestion.responseFramework}
                </p>
              )}
            </div>
          )}

          {part === 1 && activeQuestion.quickAnalysis && (
            <p className="mt-2 text-xs leading-relaxed text-purple-700">Gợi ý phát triển: {activeQuestion.quickAnalysis}</p>
          )}
          {part === 3 && activeQuestion.quickAnalysis && (
            <p className="mt-2 text-xs leading-relaxed text-cyan-700">Gợi ý lập luận: {activeQuestion.quickAnalysis}</p>
          )}
          <p className="mt-2 text-xs font-bold text-gray-500">{activeQuestion.targetLabel}</p>
        </div>

        {part === 2 && (
          <div className="mt-3" key={activeQuestion.questionId}>
            <Part2PreparationTimer />
          </div>
        )}

        <div className="mt-4">
          <p className="text-xs font-black uppercase tracking-wide text-gray-500">Trả lời bằng giọng nói hoặc văn bản</p>
          <div className="mt-2 grid grid-cols-2 rounded-xl bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => onUpdateQuestionState(activeQuestionId, { inputMode: 'record' })}
              className={`rounded-lg px-3 py-2 text-sm font-black transition-colors ${
                activeState.inputMode === 'record' ? 'bg-white text-rose-600 shadow-sm' : 'text-gray-500'
              }`}
            >
              🎤 Ghi âm
            </button>
            <button
              type="button"
              onClick={() => onUpdateQuestionState(activeQuestionId, { inputMode: 'type', source: 'typed' })}
              className={`rounded-lg px-3 py-2 text-sm font-black transition-colors ${
                activeState.inputMode === 'type' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'
              }`}
            >
              ⌨️ Nhập câu trả lời
            </button>
          </div>

          {activeState.inputMode === 'record' && (
            <div className="mt-3">
              <RecordAnswerButton
                key={activeQuestion.questionId}
                question={activeQuestion.question}
                disabled={activeState.loading}
                maxSeconds={activeQuestion.maxRecordingSeconds}
                onTranscript={handleTranscript}
                onRecordingReady={handleRecordingReady}
              />
              {activeState.recordingUrl && (
                <button
                  type="button"
                  onClick={() => new Audio(activeState.recordingUrl!).play()}
                  className="mt-2 w-full rounded-2xl border-2 border-rose-100 bg-white py-2.5 text-sm font-bold text-rose-500 transition-all active:scale-[0.98]"
                >
                  ▶️ Nghe lại giọng của bạn
                </button>
              )}
              <p className="mt-2 text-center text-xs leading-relaxed text-gray-400">
                Ghi tối đa {activeQuestion.maxRecordingSeconds} giây. Audio chỉ được gửi để tạo transcript và không được lưu trong MVP này.
              </p>
            </div>
          )}

          <div className="mt-3">
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <label htmlFor="ielts-answer" className="text-xs font-black text-gray-600">
                {activeState.source === 'audio' ? 'Transcript — bạn có thể sửa trước khi chấm' : 'Câu trả lời của bạn'}
              </label>
              <span className="text-xs font-bold text-gray-400">{wordCount} từ</span>
            </div>
            <textarea
              id="ielts-answer"
              value={activeState.answer}
              onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onUpdateQuestionState(activeQuestionId, { answer: event.target.value })}
              placeholder={activeQuestion.placeholder}
              rows={part === 2 ? 10 : 6}
              maxLength={12_000}
              className="w-full resize-none rounded-2xl border-2 border-indigo-100 px-4 py-3 text-sm leading-7 text-gray-800 outline-none transition-colors placeholder:text-gray-300 focus:border-indigo-400"
            />
          </div>

          <button
            type="button"
            onClick={evaluate}
            disabled={!activeState.answer.trim() || activeState.loading}
            className={`mt-3 w-full rounded-2xl py-3.5 text-sm font-black transition-all active:scale-[0.98] ${
              activeState.answer.trim() && !activeState.loading
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-100'
                : 'cursor-not-allowed bg-gray-100 text-gray-400'
            }`}
          >
            {activeState.loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Đang phân tích và tạo model answers...
              </span>
            ) : activeState.attempts.length > 0 ? 'Chấm lần trả lời mới' : '✨ Phân tích câu trả lời'}
          </button>
          {activeState.loading && (
            <p className="mt-2 text-center text-xs leading-relaxed text-indigo-400">💡 {LOADING_TIPS[activeState.tipIndex]}</p>
          )}
          {activeState.error && <p className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-center text-xs text-red-600">{activeState.error}</p>}
        </div>
      </section>

      {evaluation && (
        <div id="ielts-feedback" className="mt-6 scroll-mt-4 space-y-4">
          {activeState.showShare && (
            <IeltsShareCardModal
              part={part}
              topic={activeQuestion.topic}
              band={evaluation.estimatedBand.overall}
              onClose={() => onUpdateQuestionState(activeQuestionId, { showShare: false })}
            />
          )}
          <div className="flex items-center gap-2">
            <div className="no-scrollbar flex flex-1 gap-1.5 overflow-x-auto">
              {FEEDBACK_SECTIONS.map(sectionItem => (
                <button
                  key={sectionItem.id}
                  type="button"
                  onClick={() => scrollToSection(sectionItem.id)}
                  className="flex-shrink-0 rounded-full border border-indigo-200 bg-white px-3 py-1.5 text-xs font-bold text-indigo-600 active:scale-95 transition-all"
                >
                  {sectionItem.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => onUpdateQuestionState(activeQuestionId, { showShare: true })}
              aria-label="Chia sẻ kết quả"
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border-2 border-indigo-200 bg-white text-base shadow-sm active:scale-95 transition-all"
            >
              📤
            </button>
          </div>
          <BandFeedbackPanel evaluation={evaluation} previousEvaluation={previousEvaluation} />
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={prepareRetry}
              className="rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3.5 text-sm font-black text-white shadow active:scale-[0.98]"
            >
              🎤 Trả lời lại câu này
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="rounded-2xl border-2 border-indigo-200 bg-white px-4 py-3.5 text-sm font-black text-indigo-700 active:scale-[0.98]"
            >
              {batch.length > 1 ? 'Câu hỏi tiếp theo →' : mode === 'random' ? 'Câu khác (ngẫu nhiên) →' : 'Chọn câu khác →'}
            </button>
          </div>
        </div>
      )}

      <p className="mt-6 text-center text-xs leading-relaxed text-gray-400">
        Band score là ước lượng hỗ trợ luyện tập, không phải kết quả chính thức của IELTS.
        Pronunciation chưa được chấm vì evaluator không trực tiếp phân tích tín hiệu âm thanh.
      </p>
    </div>
  )
}
