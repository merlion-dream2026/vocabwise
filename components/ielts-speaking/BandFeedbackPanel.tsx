'use client'

import { useState } from 'react'
import AnswerActions from '@/components/ielts-speaking/AnswerActions'
import type { CriterionFeedback, IeltsSpeakingEvaluation, ModelAnswer } from '@/lib/ieltsSpeakingTypes'

type ModelTab = 'band6' | 'band7_5' | 'band9'

type Props = {
  evaluation: IeltsSpeakingEvaluation
  previousEvaluation?: IeltsSpeakingEvaluation
}

const CRITERIA: Array<{
  key: 'fluencyAndCoherence' | 'lexicalResource' | 'grammaticalRangeAndAccuracy' | 'pronunciation'
  label: string
  shortLabel: string
}> = [
  { key: 'fluencyAndCoherence', label: 'Fluency & Coherence', shortLabel: 'Fluency' },
  { key: 'lexicalResource', label: 'Lexical Resource', shortLabel: 'Vocabulary' },
  { key: 'grammaticalRangeAndAccuracy', label: 'Grammatical Range & Accuracy', shortLabel: 'Grammar' },
  { key: 'pronunciation', label: 'Pronunciation', shortLabel: 'Pronunciation' },
]

function scoreClass(score: number): string {
  if (score >= 8) return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  if (score >= 6.5) return 'border-indigo-200 bg-indigo-50 text-indigo-700'
  if (score >= 5.5) return 'border-amber-200 bg-amber-50 text-amber-700'
  return 'border-rose-200 bg-rose-50 text-rose-700'
}

const CONFIDENCE_STYLE: Record<'low' | 'medium' | 'high', string> = {
  high: 'bg-emerald-400 text-emerald-950',
  medium: 'bg-amber-400 text-amber-950',
  low: 'bg-rose-400 text-rose-950',
}

const CONFIDENCE_LABEL: Record<'low' | 'medium' | 'high', string> = {
  high: 'Cao',
  medium: 'Trung bình',
  low: 'Thấp',
}

function CriterionCard({ label, feedback }: { label: string; feedback: CriterionFeedback }) {
  return (
    <details className="group rounded-2xl border border-gray-200 bg-white open:border-indigo-200 open:shadow-sm">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
        <div>
          <p className="text-sm font-black text-gray-800">{label}</p>
          <p className="mt-0.5 text-xs text-gray-500 line-clamp-1">
            {feedback.score === null ? 'Chưa đánh giá' : feedback.improvementVi}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-lg border px-2.5 py-1 text-sm font-black ${
            feedback.score === null
              ? 'border-gray-200 bg-gray-50 text-gray-500'
              : scoreClass(feedback.score)
          }`}>
            {feedback.score === null ? '—' : feedback.score.toFixed(1)}
          </span>
          <span className="text-gray-400 transition-transform group-open:rotate-180">⌄</span>
        </div>
      </summary>
      <div className="space-y-3 border-t border-gray-100 px-4 py-3 text-sm">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-emerald-600">Điểm làm tốt</p>
          <p className="mt-1 leading-relaxed text-gray-700">{feedback.strengthVi || 'Chưa có đủ bằng chứng rõ ràng.'}</p>
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-amber-600">Điểm cần cải thiện</p>
          <p className="mt-1 leading-relaxed text-gray-700">{feedback.weaknessVi || feedback.improvementVi}</p>
        </div>
        {feedback.evidence.length > 0 && (
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-indigo-600">Bằng chứng từ câu trả lời</p>
            <div className="mt-1.5 space-y-1.5">
              {feedback.evidence.map((evidence, index) => (
                <blockquote key={`${evidence}-${index}`} className="rounded-xl bg-gray-50 px-3 py-2 text-xs italic text-gray-700">
                  “{evidence}”
                </blockquote>
              ))}
            </div>
          </div>
        )}
        <div className="rounded-xl bg-indigo-50 px-3 py-2.5">
          <p className="text-xs font-black text-indigo-600">Cách cải thiện</p>
          <p className="mt-1 text-xs leading-relaxed text-indigo-900">{feedback.improvementVi}</p>
        </div>
      </div>
    </details>
  )
}

function ModelAnswerCard({ answer }: { answer: ModelAnswer }) {
  return (
    <div className="space-y-3">
      <p className="whitespace-pre-wrap text-sm leading-7 text-gray-800">{answer.answer}</p>
      <AnswerActions text={answer.answer} compact />
      {answer.upgradesVi.length > 0 && (
        <div className="rounded-xl border border-purple-100 bg-purple-50 px-3 py-2.5">
          <p className="text-xs font-black text-purple-700">Phiên bản này nâng cấp gì?</p>
          <ul className="mt-1.5 space-y-1 text-xs leading-relaxed text-purple-900">
            {answer.upgradesVi.map((upgrade, index) => (
              <li key={`${upgrade}-${index}`}>• {upgrade}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default function BandFeedbackPanel({ evaluation, previousEvaluation }: Props) {
  const [modelTab, setModelTab] = useState<ModelTab>('band7_5')
  const bandDelta = previousEvaluation
    ? evaluation.estimatedBand.overall - previousEvaluation.estimatedBand.overall
    : null

  const modelTabs: Array<{ key: ModelTab; label: string; value: ModelAnswer }> = [
    { key: 'band6', label: 'Band 6', value: evaluation.modelAnswers.band6 },
    { key: 'band7_5', label: 'Band 7.5', value: evaluation.modelAnswers.band7_5 },
    { key: 'band9', label: 'Band 9', value: evaluation.modelAnswers.band9 },
  ]
  const selectedModel = modelTabs.find(tab => tab.key === modelTab) ?? modelTabs[1]

  return (
    <div className="space-y-5">
      {bandDelta !== null && (
        <div className={`rounded-2xl border-2 px-4 py-3 ${
          bandDelta > 0
            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
            : bandDelta < 0
              ? 'border-amber-200 bg-amber-50 text-amber-800'
              : 'border-blue-200 bg-blue-50 text-blue-800'
        }`}>
          <p className="text-sm font-black">
            Lần trả lời này: {bandDelta > 0 ? '+' : ''}{bandDelta.toFixed(1)} band so với lần trước
          </p>
          <p className="mt-1 text-xs leading-relaxed">
            {bandDelta > 0
              ? 'Bạn đã áp dụng feedback hiệu quả. Tiếp tục tập trung vào ưu tiên mới bên dưới.'
              : bandDelta === 0
                ? 'Điểm ước lượng chưa đổi, nhưng hãy xem từng tiêu chí để nhận ra cải thiện nhỏ.'
                : 'Điểm có thể dao động giữa các lần nói. Tập trung vào một mục tiêu thay vì cố sửa mọi thứ cùng lúc.'}
          </p>
        </div>
      )}

      <section className="overflow-hidden rounded-3xl border-2 border-indigo-100 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-4 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-200">Estimated Band</p>
              <p className="mt-1 text-4xl font-black">{evaluation.estimatedBand.overall.toFixed(1)}</p>
            </div>
            <div className="rounded-xl bg-white/15 px-3 py-2 text-right">
              <p className="text-[10px] font-bold uppercase tracking-wide text-indigo-100">Độ tin cậy</p>
              <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-black ${CONFIDENCE_STYLE[evaluation.estimatedBand.confidence]}`}>
                {CONFIDENCE_LABEL[evaluation.estimatedBand.confidence]}
              </span>
            </div>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-indigo-100">{evaluation.estimatedBand.disclaimerVi}</p>
        </div>

        <div className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-4">
          {CRITERIA.map(criterion => {
            const feedback = evaluation.criteria[criterion.key]
            return (
              <div key={criterion.key} className={`rounded-xl border px-3 py-2.5 ${
                feedback.score === null
                  ? 'border-gray-200 bg-gray-50 text-gray-500'
                  : scoreClass(feedback.score)
              }`}>
                <p className="text-[10px] font-black uppercase tracking-wide">{criterion.shortLabel}</p>
                <p className="mt-1 text-xl font-black">{feedback.score === null ? '—' : feedback.score.toFixed(1)}</p>
              </div>
            )
          })}
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <p className="text-xs font-black uppercase tracking-wide text-emerald-700">✅ Bạn đã làm tốt</p>
          <p className="mt-1.5 text-sm leading-relaxed text-emerald-950">{evaluation.summary.whatWorkedVi}</p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-xs font-black uppercase tracking-wide text-amber-700">🎯 Ưu tiên số 1</p>
          <p className="mt-1.5 text-sm leading-relaxed text-amber-950">{evaluation.summary.topPriorityVi}</p>
        </div>
      </section>

      <section id="ielts-criteria" className="scroll-mt-4 space-y-2">
        <div>
          <h2 className="text-lg font-black text-gray-900">Nhận xét theo tiêu chí IELTS</h2>
          <p className="text-xs text-gray-500">Mở từng tiêu chí để xem bằng chứng và cách cải thiện.</p>
        </div>
        {CRITERIA.map(criterion => (
          <CriterionCard
            key={criterion.key}
            label={criterion.label}
            feedback={evaluation.criteria[criterion.key]}
          />
        ))}
      </section>

      <section id="ielts-corrections" className="scroll-mt-4 rounded-3xl border-2 border-rose-100 bg-white p-4">
        <h2 className="text-lg font-black text-gray-900">Sửa những điểm quan trọng</h2>
        <p className="mt-0.5 text-xs text-gray-500">Chỉ tập trung vào 1–3 thay đổi có lợi nhất.</p>
        {evaluation.corrections.length === 0 ? (
          <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800">
            Không có lỗi nổi bật cần sửa ở cấp độ câu. Hãy tập trung vào phát triển ý và độ tự nhiên.
          </p>
        ) : (
          <div className="mt-3 space-y-3">
            {evaluation.corrections.map((correction, index) => (
              <div key={`${correction.original}-${index}`} className="rounded-2xl border border-gray-200 p-3">
                <div className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-800">
                  <span className="font-black">✗ </span>{correction.original}
                </div>
                <div className="mt-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">
                  <span className="font-black">✓ </span>{correction.improved}
                </div>
                <p className="mt-2 text-xs leading-relaxed text-gray-600">{correction.reasonVi}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section id="ielts-models" className="scroll-mt-4 overflow-hidden rounded-3xl border-2 border-purple-100 bg-white">
        <div className="border-b border-purple-100 bg-purple-50 px-4 py-3">
          <h2 className="text-lg font-black text-purple-950">Grow My Answer</h2>
          <p className="text-xs text-purple-700">Ba phiên bản đều giữ ý tưởng cốt lõi của bạn.</p>
        </div>
        <div className="grid grid-cols-3 border-b border-gray-100">
          {modelTabs.map(tab => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setModelTab(tab.key)}
              className={`px-2 py-3 text-sm font-black transition-colors ${
                modelTab === tab.key
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-500 hover:bg-purple-50 hover:text-purple-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="p-4">
          <ModelAnswerCard answer={selectedModel.value} />
        </div>
      </section>

      <section id="ielts-alternative" className="scroll-mt-4 rounded-3xl border-2 border-cyan-100 bg-cyan-50 p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">💡</span>
          <div>
            <h2 className="text-lg font-black text-cyan-950">Một hướng trả lời khác</h2>
            <p className="mt-0.5 text-xs font-bold text-cyan-700">{evaluation.alternativeIdea.ideaSummaryVi}</p>
          </div>
        </div>
        <div className="mt-3 rounded-2xl bg-white/80 px-4 py-3">
          <p className="whitespace-pre-wrap text-sm leading-7 text-gray-800">
            {evaluation.alternativeIdea.answer}
          </p>
          <AnswerActions text={evaluation.alternativeIdea.answer} compact />
        </div>
      </section>

      <section id="ielts-expressions" className="scroll-mt-4 rounded-3xl border-2 border-amber-100 bg-white p-4">
        <h2 className="text-lg font-black text-gray-900">Expressions đáng học</h2>
        <p className="mt-0.5 text-xs text-gray-500">Chỉ 3–5 cụm từ có thể tái sử dụng ngay.</p>
        <div className="mt-3 space-y-2.5">
          {evaluation.usefulExpressions.map((item, index) => (
            <div key={`${item.expression}-${index}`} className="rounded-2xl border border-amber-100 bg-amber-50 px-3 py-2.5">
              <p className="font-black text-amber-900">{item.expression}</p>
              <p className="mt-0.5 text-xs text-amber-800">{item.meaningVi}</p>
              <p className="mt-1 text-xs italic leading-relaxed text-gray-700">“{item.example}”</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border-2 border-indigo-200 bg-indigo-50 p-4">
        <p className="text-xs font-black uppercase tracking-wide text-indigo-600">Nói lại với một mục tiêu</p>
        <p className="mt-1 text-base font-black text-indigo-950">{evaluation.retry.focusVi}</p>
        <p className="mt-1 text-sm leading-relaxed text-indigo-800">{evaluation.retry.instructionVi}</p>
      </section>
    </div>
  )
}
