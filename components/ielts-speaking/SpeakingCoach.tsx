'use client'

import { useEffect, useMemo, useState, type ChangeEvent } from 'react'
import AnswerActions from '@/components/ielts-speaking/AnswerActions'
import BandFeedbackPanel from '@/components/ielts-speaking/BandFeedbackPanel'
import IeltsShareCardModal from '@/components/ielts-speaking/IeltsShareCardModal'
import Part2PreparationTimer from '@/components/ielts-speaking/Part2PreparationTimer'
import RecordAnswerButton from '@/components/ielts-speaking/RecordAnswerButton'
import {
  IELTS_LINKED_SETS,
  IELTS_PART1_QUESTIONS,
  IELTS_PART1_TOPICS,
  getLinkedSetById,
  getQuestionsByTopic,
} from '@/lib/ieltsSpeakingQuestionBank'
import type {
  AnswerSource,
  IeltsSpeakingEvaluation,
  IeltsSpeakingPart,
  Part3Question,
  SpeakingQuestion,
} from '@/lib/ieltsSpeakingTypes'

type InputMode = 'type' | 'record'

type ActivePractice = {
  questionId: string
  topic: string
  theme?: string
  question: string
  maxRecordingSeconds: number
  targetLabel: string
  placeholder: string
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

const WELCOME_KEY = 'vw_ielts_speaking_welcome_v1'

const PARTS: Array<{ part: IeltsSpeakingPart; label: string; subtitle: string }> = [
  { part: 1, label: 'Part 1', subtitle: 'Personal interview' },
  { part: 2, label: 'Part 2', subtitle: 'Long turn' },
  { part: 3, label: 'Part 3', subtitle: 'Discussion' },
]

function firstPart1Question(topic: string): SpeakingQuestion {
  return getQuestionsByTopic(topic)[0] ?? IELTS_PART1_QUESTIONS[0]
}

function nextPart1Question(current: SpeakingQuestion): SpeakingQuestion {
  const questions = getQuestionsByTopic(current.topic)
  const index = questions.findIndex(question => question.id === current.id)
  return questions[(index + 1) % questions.length] ?? current
}

function firstPart3Question(setId: string, groupId: string): Part3Question {
  const set = getLinkedSetById(setId) ?? IELTS_LINKED_SETS[0]
  const group = set.part3Groups.find(item => item.id === groupId) ?? set.part3Groups[0]
  return group.questions[0]
}

function groupSetsByFamily(): Array<[string, typeof IELTS_LINKED_SETS]> {
  const groups = new Map<string, typeof IELTS_LINKED_SETS>()
  for (const set of IELTS_LINKED_SETS) {
    const list = groups.get(set.family)
    if (list) list.push(set)
    else groups.set(set.family, [set])
  }
  return Array.from(groups.entries())
}

// Static data — computed once, not per render.
const LINKED_SETS_BY_FAMILY = groupSetsByFamily()

export default function SpeakingCoach() {
  const initialTopic = IELTS_PART1_TOPICS[0]?.topic ?? 'Home'
  const initialSet = IELTS_LINKED_SETS[0]
  const initialGroup = initialSet.part3Groups[0]

  const [part, setPart] = useState<IeltsSpeakingPart>(1)
  const [part1Topic, setPart1Topic] = useState(initialTopic)
  const [part1Question, setPart1Question] = useState<SpeakingQuestion>(() => firstPart1Question(initialTopic))
  const [linkedSetId, setLinkedSetId] = useState(initialSet.id)
  const [part3GroupId, setPart3GroupId] = useState(initialGroup.id)
  const [part3QuestionId, setPart3QuestionId] = useState(initialGroup.questions[0].id)
  const [inputMode, setInputMode] = useState<InputMode>('record')
  const [answer, setAnswer] = useState('')
  const [source, setSource] = useState<AnswerSource>('typed')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [attempts, setAttempts] = useState<IeltsSpeakingEvaluation[]>([])
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null)
  const [showShare, setShowShare] = useState(false)
  const [tipIndex, setTipIndex] = useState(0)
  const [welcomeDismissed, setWelcomeDismissed] = useState(true)

  useEffect(() => {
    setWelcomeDismissed(!!localStorage.getItem(WELCOME_KEY))
  }, [])

  const dismissWelcome = () => {
    localStorage.setItem(WELCOME_KEY, '1')
    setWelcomeDismissed(true)
  }

  // Revoke the previous object URL whenever a new recording replaces it, and on unmount.
  useEffect(() => {
    return () => {
      if (recordingUrl) URL.revokeObjectURL(recordingUrl)
    }
  }, [recordingUrl])

  // Rotate a short coaching tip while the evaluate call is in flight (it can take 5-15s).
  useEffect(() => {
    if (!loading) return
    setTipIndex(Math.floor(Math.random() * LOADING_TIPS.length))
    const timer = setInterval(() => setTipIndex(i => (i + 1) % LOADING_TIPS.length), 3000)
    return () => clearInterval(timer)
  }, [loading])

  const selectedSet = getLinkedSetById(linkedSetId) ?? initialSet
  const selectedGroup = selectedSet.part3Groups.find(group => group.id === part3GroupId)
    ?? selectedSet.part3Groups[0]
  const selectedPart3Question = selectedGroup.questions.find(question => question.id === part3QuestionId)
    ?? selectedGroup.questions[0]

  const activePractice: ActivePractice = part === 1
    ? {
        questionId: part1Question.id,
        topic: part1Question.topic,
        question: part1Question.question,
        maxRecordingSeconds: 75,
        targetLabel: 'Mục tiêu thường dùng: 15–25 giây, 2–4 câu tự nhiên.',
        placeholder: 'Ví dụ: I enjoy living in my hometown because...',
      }
    : part === 2
      ? {
          questionId: selectedSet.part2.id,
          topic: selectedSet.linkedTopic,
          theme: selectedSet.family,
          question: selectedSet.part2.prompt,
          maxRecordingSeconds: 130,
          targetLabel: 'Mục tiêu: chuẩn bị 1 phút, nói khoảng 1:45–2:00.',
          placeholder: 'Bạn có thể ghi âm hoặc nhập toàn bộ Part 2 long turn tại đây...',
        }
      : {
          questionId: selectedPart3Question.id,
          topic: selectedSet.linkedTopic,
          theme: selectedPart3Question.theme,
          question: selectedPart3Question.question,
          maxRecordingSeconds: 90,
          targetLabel: 'Mục tiêu thường dùng: khoảng 30–45 giây với một ý được phát triển sâu.',
          placeholder: 'Give a direct position, explain it, add an example, and finish with nuance...',
        }

  const evaluation = attempts.at(-1)
  const previousEvaluation = attempts.length > 1 ? attempts[attempts.length - 2] : undefined
  const wordCount = useMemo(() => answer.trim().split(/\s+/).filter(Boolean).length, [answer])

  const resetAnswerState = () => {
    setAnswer('')
    setSource('typed')
    setAttempts([])
    setError(null)
    setRecordingUrl(null)
    setShowShare(false)
  }

  const selectPart = (nextPart: IeltsSpeakingPart) => {
    setPart(nextPart)
    resetAnswerState()
  }

  const selectPart1Topic = (nextTopic: string) => {
    setPart1Topic(nextTopic)
    setPart1Question(firstPart1Question(nextTopic))
    resetAnswerState()
  }

  const selectLinkedSet = (nextSetId: string) => {
    const nextSet = getLinkedSetById(nextSetId) ?? initialSet
    const nextGroup = nextSet.part3Groups[0]
    setLinkedSetId(nextSet.id)
    setPart3GroupId(nextGroup.id)
    setPart3QuestionId(nextGroup.questions[0].id)
    resetAnswerState()
  }

  const selectPart3Group = (nextGroupId: string) => {
    setPart3GroupId(nextGroupId)
    setPart3QuestionId(firstPart3Question(linkedSetId, nextGroupId).id)
    resetAnswerState()
  }

  const chooseNextQuestion = () => {
    if (part === 1) {
      setPart1Question(current => nextPart1Question(current))
      resetAnswerState()
      return
    }

    if (part === 2) {
      const index = IELTS_LINKED_SETS.findIndex(set => set.id === linkedSetId)
      const nextSet = IELTS_LINKED_SETS[(index + 1) % IELTS_LINKED_SETS.length] ?? initialSet
      selectLinkedSet(nextSet.id)
      return
    }

    const questions = selectedGroup.questions
    const index = questions.findIndex(question => question.id === selectedPart3Question.id)
    const nextQuestion = questions[(index + 1) % questions.length] ?? questions[0]
    setPart3QuestionId(nextQuestion.id)
    resetAnswerState()
  }

  const prepareRetry = () => {
    setAnswer('')
    setError(null)
    setRecordingUrl(null)
    setShowShare(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleTranscript = (transcript: string) => {
    setAnswer(transcript)
    setSource('audio')
    setInputMode('record')
    setError(null)
  }

  const evaluate = async () => {
    const trimmed = answer.trim()
    if (!trimmed || loading) return
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/ielts-speaking/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          part,
          topic: activePractice.topic,
          theme: activePractice.theme,
          questionId: activePractice.questionId,
          question: activePractice.question,
          answer: trimmed,
          source,
          attemptNumber: attempts.length + 1,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data?.error || 'Không thể chấm câu trả lời.')
      setAttempts(previous => [...previous, data as IeltsSpeakingEvaluation])
      window.setTimeout(() => {
        document.getElementById('ielts-feedback')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Không thể chấm câu trả lời. Hãy thử lại.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-white pb-28">
      <div className="mx-auto max-w-2xl px-4 py-5 sm:py-8">
        <header className="mb-5 rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-600 px-5 py-5 text-white shadow-lg shadow-indigo-100">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-200">VocabWise Speaking</p>
          <h1 className="mt-1 text-2xl font-black sm:text-3xl">IELTS Speaking Coach</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-indigo-100">
            Luyện đủ ba phần với 80 Part 1 topics và 60 linked Part 2–3 sets, sau đó phát triển chính câu trả lời của bạn từ Band 6 đến Band 9.
          </p>
        </header>

        {!welcomeDismissed && (
          <div className="mb-5 rounded-3xl border-2 border-indigo-100 bg-gradient-to-br from-indigo-50 to-purple-50 p-5">
            <div className="mb-4 flex items-start justify-between gap-2">
              <div>
                <h3 className="text-base font-black text-gray-800">👋 Chào mừng đến AI Speak!</h3>
                <p className="mt-0.5 text-xs font-semibold text-gray-400">IELTS Speaking Coach · Part 1, 2 & 3</p>
              </div>
              <button
                type="button"
                onClick={dismissWelcome}
                aria-label="Đóng thông báo chào mừng"
                className="flex-shrink-0 text-lg leading-none text-gray-300 hover:text-gray-500"
              >
                ✕
              </button>
            </div>
            <div className="mb-4 space-y-2.5">
              {[
                { n: '1', icon: '🎯', title: 'Chọn câu hỏi', desc: 'Part 1 theo chủ đề, Part 2/3 theo linked set' },
                { n: '2', icon: '🎤', title: 'Ghi âm hoặc gõ câu trả lời', desc: 'Có thể sửa transcript trước khi chấm' },
                { n: '3', icon: '✨', title: 'Nhận band + model answers', desc: 'Feedback theo tiêu chí, Band 6/7.5/9 giữ ý của bạn' },
              ].map(step => (
                <div key={step.n} className="flex items-center gap-3">
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-indigo-500 text-xs font-black text-white">
                    {step.n}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-700">{step.icon} {step.title}</p>
                    <p className="text-xs text-gray-400">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={dismissWelcome}
              className="w-full rounded-2xl bg-indigo-500 py-3 text-sm font-black text-white transition-all active:scale-95 hover:bg-indigo-600"
            >
              Bắt đầu luyện tập →
            </button>
          </div>
        )}

        <section className="rounded-3xl border-2 border-indigo-100 bg-white p-4 shadow-sm sm:p-5">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-gray-500">1 · Chọn phần thi</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {PARTS.map(item => (
                <button
                  key={item.part}
                  type="button"
                  onClick={() => selectPart(item.part)}
                  className={`rounded-2xl border-2 px-2 py-3 text-center transition-colors ${
                    part === item.part
                      ? 'border-indigo-500 bg-indigo-600 text-white'
                      : 'border-gray-100 bg-gray-50 text-gray-600 hover:border-indigo-200'
                  }`}
                >
                  <span className="block text-sm font-black">{item.label}</span>
                  <span className={`mt-0.5 block text-[10px] font-bold ${part === item.part ? 'text-indigo-100' : 'text-gray-400'}`}>
                    {item.subtitle}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {part === 1 && (
            <div className="mt-4">
              <p className="text-xs font-black uppercase tracking-wide text-gray-500">2 · Chọn chủ đề Part 1</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto]">
                <select
                  value={part1Topic}
                  onChange={(event: ChangeEvent<HTMLSelectElement>) => selectPart1Topic(event.target.value)}
                  className="w-full rounded-xl border-2 border-indigo-100 bg-white px-3 py-3 text-sm font-black text-indigo-800 outline-none transition-colors focus:border-indigo-400"
                >
                  {IELTS_PART1_TOPICS.map(item => (
                    <option key={item.id} value={item.topic}>
                      {String(item.number).padStart(2, '0')} · {item.topic} ({item.questionCount})
                    </option>
                  ))}
                </select>
                <span className="self-center text-xs font-bold text-gray-400">80 topics · 401 câu hỏi</span>
              </div>
            </div>
          )}

          {(part === 2 || part === 3) && (
            <div className="mt-4">
              <p className="text-xs font-black uppercase tracking-wide text-gray-500">2 · Chọn linked set</p>
              <select
                value={linkedSetId}
                onChange={(event: ChangeEvent<HTMLSelectElement>) => selectLinkedSet(event.target.value)}
                className="mt-2 w-full rounded-xl border-2 border-indigo-100 bg-white px-3 py-3 text-sm font-black text-indigo-800 outline-none transition-colors focus:border-indigo-400"
              >
                {LINKED_SETS_BY_FAMILY.map(([family, sets]) => (
                  <optgroup key={family} label={family}>
                    {sets.map(set => (
                      <option key={set.id} value={set.id}>
                        Set {String(set.number).padStart(2, '0')} · {set.linkedTopic}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <p className="mt-1.5 text-xs text-gray-400">60 sets · Part 2 cue card liên kết tự nhiên với hai nhóm câu hỏi Part 3</p>
            </div>
          )}

          {part === 3 && (
            <div className="mt-3">
              <p className="text-xs font-black uppercase tracking-wide text-gray-500">3 · Chọn nhóm thảo luận</p>
              <select
                value={selectedGroup.id}
                onChange={(event: ChangeEvent<HTMLSelectElement>) => selectPart3Group(event.target.value)}
                className="mt-2 w-full rounded-xl border-2 border-cyan-100 bg-white px-3 py-3 text-sm font-black text-cyan-800 outline-none transition-colors focus:border-cyan-400"
              >
                {selectedSet.part3Groups.map(group => (
                  <option key={group.id} value={group.id}>
                    Group {group.id} · {group.theme}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className={`mt-4 rounded-2xl border px-4 py-4 ${
            part === 1
              ? 'border-purple-100 bg-purple-50'
              : part === 2
                ? 'border-amber-100 bg-amber-50'
                : 'border-cyan-100 bg-cyan-50'
          }`}>
            <div className="flex items-center justify-between gap-3">
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-white ${
                part === 1 ? 'bg-purple-600' : part === 2 ? 'bg-amber-600' : 'bg-cyan-600'
              }`}>
                Part {part}
              </span>
              <button
                type="button"
                onClick={chooseNextQuestion}
                className={`text-xs font-black ${part === 1 ? 'text-purple-700' : part === 2 ? 'text-amber-700' : 'text-cyan-700'}`}
              >
                {part === 2 ? 'Cue card tiếp theo ↻' : 'Đổi câu hỏi ↻'}
              </button>
            </div>

            {part === 2 && (
              <p className="mt-3 text-xs font-black uppercase tracking-wide text-amber-700">
                {selectedSet.family} · Set {String(selectedSet.number).padStart(2, '0')}
              </p>
            )}
            {part === 3 && (
              <p className="mt-3 text-xs font-black uppercase tracking-wide text-cyan-700">
                {selectedPart3Question.theme}
              </p>
            )}

            <p className={`mt-2 text-lg font-black leading-relaxed ${
              part === 1 ? 'text-purple-950' : part === 2 ? 'text-amber-950' : 'text-cyan-950'
            }`}>
              {activePractice.question}
            </p>

            <AnswerActions
              text={part === 2
                ? `${activePractice.question}. You should say: ${selectedSet.part2.bulletPoints.join('; ')}`
                : activePractice.question}
              compact
            />

            {part === 2 && (
              <div className="mt-3 rounded-xl bg-white/70 px-3 py-3">
                <p className="text-xs font-black text-amber-800">You should say:</p>
                <ul className="mt-1.5 space-y-1 text-sm leading-relaxed text-amber-950">
                  {selectedSet.part2.bulletPoints.map(point => (
                    <li key={point}>• {point}</li>
                  ))}
                </ul>
                <p className="mt-3 border-t border-amber-100 pt-2 text-xs leading-relaxed text-amber-800">
                  Khung phát triển: {selectedSet.part2.responseFramework}
                </p>
              </div>
            )}

            {part === 1 && (
              <p className="mt-2 text-xs leading-relaxed text-purple-700">
                Gợi ý phát triển: {part1Question.quickAnalysis}
              </p>
            )}
            {part === 3 && (
              <p className="mt-2 text-xs leading-relaxed text-cyan-700">
                Gợi ý lập luận: {selectedPart3Question.quickAnalysis}
              </p>
            )}
            <p className="mt-2 text-xs font-bold text-gray-500">{activePractice.targetLabel}</p>
          </div>

          {part === 2 && (
            <div className="mt-3" key={selectedSet.part2.id}>
              <Part2PreparationTimer />
            </div>
          )}

          <div className="mt-4">
            <p className="text-xs font-black uppercase tracking-wide text-gray-500">
              {part === 3 ? '4' : '3'} · Trả lời bằng giọng nói hoặc văn bản
            </p>
            <div className="mt-2 grid grid-cols-2 rounded-xl bg-gray-100 p-1">
              <button
                type="button"
                onClick={() => setInputMode('record')}
                className={`rounded-lg px-3 py-2 text-sm font-black transition-colors ${
                  inputMode === 'record' ? 'bg-white text-rose-600 shadow-sm' : 'text-gray-500'
                }`}
              >
                🎤 Ghi âm
              </button>
              <button
                type="button"
                onClick={() => { setInputMode('type'); setSource('typed') }}
                className={`rounded-lg px-3 py-2 text-sm font-black transition-colors ${
                  inputMode === 'type' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'
                }`}
              >
                ⌨️ Nhập câu trả lời
              </button>
            </div>

            {inputMode === 'record' && (
              <div className="mt-3">
                <RecordAnswerButton
                  question={activePractice.question}
                  disabled={loading}
                  maxSeconds={activePractice.maxRecordingSeconds}
                  onTranscript={handleTranscript}
                  onRecordingReady={setRecordingUrl}
                />
                {recordingUrl && (
                  <button
                    type="button"
                    onClick={() => new Audio(recordingUrl).play()}
                    className="mt-2 w-full rounded-2xl border-2 border-rose-100 bg-white py-2.5 text-sm font-bold text-rose-500 transition-all active:scale-[0.98]"
                  >
                    ▶️ Nghe lại giọng của bạn
                  </button>
                )}
                <p className="mt-2 text-center text-xs leading-relaxed text-gray-400">
                  Ghi tối đa {activePractice.maxRecordingSeconds} giây. Audio chỉ được gửi để tạo transcript và không được lưu trong MVP này.
                </p>
              </div>
            )}

            <div className="mt-3">
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <label htmlFor="ielts-answer" className="text-xs font-black text-gray-600">
                  {source === 'audio' ? 'Transcript — bạn có thể sửa trước khi chấm' : 'Câu trả lời của bạn'}
                </label>
                <span className="text-xs font-bold text-gray-400">{wordCount} từ</span>
              </div>
              <textarea
                id="ielts-answer"
                value={answer}
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setAnswer(event.target.value)}
                placeholder={activePractice.placeholder}
                rows={part === 2 ? 10 : 6}
                maxLength={12_000}
                className="w-full resize-none rounded-2xl border-2 border-indigo-100 px-4 py-3 text-sm leading-7 text-gray-800 outline-none transition-colors placeholder:text-gray-300 focus:border-indigo-400"
              />
            </div>

            <button
              type="button"
              onClick={evaluate}
              disabled={!answer.trim() || loading}
              className={`mt-3 w-full rounded-2xl py-3.5 text-sm font-black transition-all active:scale-[0.98] ${
                answer.trim() && !loading
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-100'
                  : 'cursor-not-allowed bg-gray-100 text-gray-400'
              }`}
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Đang phân tích và tạo model answers...
                </span>
              ) : attempts.length > 0 ? 'Chấm lần trả lời mới' : '✨ Phân tích câu trả lời'}
            </button>
            {loading && (
              <p className="mt-2 text-center text-xs leading-relaxed text-indigo-400">💡 {LOADING_TIPS[tipIndex]}</p>
            )}
            {error && <p className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-center text-xs text-red-600">{error}</p>}
          </div>
        </section>

        {evaluation && (
          <div id="ielts-feedback" className="mt-6 scroll-mt-4 space-y-4">
            {showShare && (
              <IeltsShareCardModal
                part={part}
                topic={activePractice.topic}
                band={evaluation.estimatedBand.overall}
                onClose={() => setShowShare(false)}
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
                onClick={() => setShowShare(true)}
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
                onClick={chooseNextQuestion}
                className="rounded-2xl border-2 border-indigo-200 bg-white px-4 py-3.5 text-sm font-black text-indigo-700 active:scale-[0.98]"
              >
                {part === 2 ? 'Cue card tiếp theo →' : 'Câu hỏi tiếp theo →'}
              </button>
            </div>
          </div>
        )}

        <p className="mt-6 text-center text-xs leading-relaxed text-gray-400">
          Band score là ước lượng hỗ trợ luyện tập, không phải kết quả chính thức của IELTS.
          Pronunciation chưa được chấm vì evaluator không trực tiếp phân tích tín hiệu âm thanh.
        </p>
      </div>
    </main>
  )
}
