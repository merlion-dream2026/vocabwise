import {
  IELTS_LINKED_SETS,
  IELTS_PART1_QUESTIONS,
  IELTS_PART3_QUESTIONS,
  getLinkedSetById,
  getQuestionsByTopic,
} from '@/lib/ieltsSpeakingQuestionBank'
import type {
  IeltsSpeakingPart,
  Part3Question,
  SpeakingLinkedSet,
  SpeakingQuestion,
} from '@/lib/ieltsSpeakingTypes'

export type PracticeMode = 'random' | 'choose'

/** One practice-able question, normalized across Parts 1/2/3 for the list and practice screens. */
export type BatchQuestion = {
  questionId: string
  pillLabel: string
  topic: string
  theme?: string
  question: string
  quickAnalysis: string
  questionDetails?: string[]
  responseFramework?: string
  maxRecordingSeconds: number
  targetLabel: string
  placeholder: string
}

const PART1_TARGET_LABEL = 'Mục tiêu thường dùng: 15–25 giây, 2–4 câu tự nhiên.'
const PART1_PLACEHOLDER = 'Ví dụ: I enjoy living in my hometown because...'
const PART2_TARGET_LABEL = 'Mục tiêu: chuẩn bị 1 phút, nói khoảng 1:45–2:00.'
const PART2_PLACEHOLDER = 'Bạn có thể ghi âm hoặc nhập toàn bộ Part 2 long turn tại đây...'
const PART3_TARGET_LABEL = 'Mục tiêu thường dùng: khoảng 30–45 giây với một ý được phát triển sâu.'
const PART3_PLACEHOLDER = 'Give a direct position, explain it, add an example, and finish with nuance...'

function part1ToBatchQuestion(question: SpeakingQuestion, index: number): BatchQuestion {
  return {
    questionId: question.id,
    pillLabel: `Câu ${index + 1}`,
    topic: question.topic,
    question: question.question,
    quickAnalysis: question.quickAnalysis,
    maxRecordingSeconds: 75,
    targetLabel: PART1_TARGET_LABEL,
    placeholder: PART1_PLACEHOLDER,
  }
}

function part2ToBatchQuestion(set: SpeakingLinkedSet): BatchQuestion {
  return {
    questionId: set.part2.id,
    pillLabel: `Set ${String(set.number).padStart(2, '0')}`,
    topic: set.linkedTopic,
    theme: set.family,
    question: set.part2.prompt,
    quickAnalysis: '',
    questionDetails: set.part2.bulletPoints,
    responseFramework: set.part2.responseFramework,
    maxRecordingSeconds: 130,
    targetLabel: PART2_TARGET_LABEL,
    placeholder: PART2_PLACEHOLDER,
  }
}

function part3ToBatchQuestion(question: Part3Question, index: number): BatchQuestion {
  return {
    questionId: question.id,
    pillLabel: `Câu ${index + 1}`,
    topic: question.linkedTopic,
    theme: question.theme,
    question: question.question,
    quickAnalysis: question.quickAnalysis,
    maxRecordingSeconds: 90,
    targetLabel: PART3_TARGET_LABEL,
    placeholder: PART3_PLACEHOLDER,
  }
}

/** Part 1: every question in one topic (typically 4-6). */
export function buildPart1Batch(topic: string): BatchQuestion[] {
  return getQuestionsByTopic(topic).map(part1ToBatchQuestion)
}

/** Part 2: a single cue card — kept as a one-item "batch" so the practice screen stays uniform. */
export function buildPart2Batch(setId: string): BatchQuestion[] {
  const set = getLinkedSetById(setId) ?? IELTS_LINKED_SETS[0]
  return [part2ToBatchQuestion(set)]
}

/** Part 3: every question in one discussion group (always 3). */
export function buildPart3Batch(setId: string, groupId: string): BatchQuestion[] {
  const set = getLinkedSetById(setId) ?? IELTS_LINKED_SETS[0]
  const group = set.part3Groups.find(item => item.id === groupId) ?? set.part3Groups[0]
  return group.questions.map(part3ToBatchQuestion)
}

/** "Đề ngẫu nhiên" mode: one random question from the full pool for that part. */
export function randomBatchQuestion(part: IeltsSpeakingPart): BatchQuestion {
  if (part === 1) {
    const question = IELTS_PART1_QUESTIONS[Math.floor(Math.random() * IELTS_PART1_QUESTIONS.length)]
    return part1ToBatchQuestion(question, 0)
  }
  if (part === 2) {
    const set = IELTS_LINKED_SETS[Math.floor(Math.random() * IELTS_LINKED_SETS.length)]
    return part2ToBatchQuestion(set)
  }
  const question = IELTS_PART3_QUESTIONS[Math.floor(Math.random() * IELTS_PART3_QUESTIONS.length)]
  return part3ToBatchQuestion(question, 0)
}
