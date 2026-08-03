import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { aiChat } from '@/lib/aiChat'
import { rateLimit } from '@/lib/rateLimit'
import { buildIeltsSpeakingEvaluationPrompt, buildJsonRepairPrompt } from '@/lib/ieltsSpeakingPrompts'
import { parseIeltsSpeakingEvaluation } from '@/lib/ieltsSpeakingParsing'
import {
  getPart1QuestionById,
  getPart2CueCardById,
  getPart3QuestionById,
} from '@/lib/ieltsSpeakingQuestionBank'
import { getSpeakingReferenceByQuestionId } from '@/lib/ieltsSpeakingReferenceBank'
import type { AnswerSource, EvaluateSpeakingRequest, IeltsSpeakingPart } from '@/lib/ieltsSpeakingTypes'

export const maxDuration = 60

const MAX_QUESTION_LENGTH = 700
const MAX_QUESTION_ID_LENGTH = 80
const MAX_ANSWER_LENGTH = 12_000
const DAILY_EVALUATION_LIMIT = 30

function isPart(value: unknown): value is IeltsSpeakingPart {
  return value === 1 || value === 2 || value === 3
}

function isSource(value: unknown): value is AnswerSource {
  return value === 'typed' || value === 'audio'
}

function parseRequestBody(value: unknown): EvaluateSpeakingRequest | null {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return null
  const body = value as Record<string, unknown>
  const part = Number(body.part)
  const questionId = typeof body.questionId === 'string' ? body.questionId.trim() : undefined
  const question = typeof body.question === 'string' ? body.question.trim() : ''
  const answer = typeof body.answer === 'string' ? body.answer.trim() : ''
  const topic = typeof body.topic === 'string' ? body.topic.trim() : undefined
  const theme = typeof body.theme === 'string' ? body.theme.trim() : undefined
  const source = isSource(body.source) ? body.source : 'typed'
  const attemptNumberRaw = Number(body.attemptNumber ?? 1)
  const attemptNumber = Number.isFinite(attemptNumberRaw)
    ? Math.max(1, Math.min(10, Math.round(attemptNumberRaw)))
    : 1

  if (!isPart(part)) return null
  if (questionId && questionId.length > MAX_QUESTION_ID_LENGTH) return null
  if (!question || question.length > MAX_QUESTION_LENGTH) return null
  if (answer.length < 2 || answer.length > MAX_ANSWER_LENGTH) return null

  return { part, questionId, question, answer, topic, theme, source, attemptNumber }
}

function resolveCanonicalInput(input: EvaluateSpeakingRequest): EvaluateSpeakingRequest | null {
  if (!input.questionId) return input

  if (input.part === 1) {
    const question = getPart1QuestionById(input.questionId)
    if (!question) return null
    return {
      ...input,
      topic: question.topic,
      question: question.question,
      questionDetails: undefined,
      theme: undefined,
    }
  }

  if (input.part === 2) {
    const cueCard = getPart2CueCardById(input.questionId)
    if (!cueCard) return null
    return {
      ...input,
      topic: cueCard.linkedTopic,
      question: cueCard.prompt,
      questionDetails: cueCard.bulletPoints,
      theme: cueCard.family,
    }
  }

  const question = getPart3QuestionById(input.questionId)
  if (!question) return null
  return {
    ...input,
    topic: question.linkedTopic,
    theme: question.theme,
    question: question.question,
    questionDetails: undefined,
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { allowed } = await rateLimit(
    `ielts-speaking:evaluate:${session.familyId}`,
    DAILY_EVALUATION_LIMIT,
    86_400,
  )
  if (!allowed) {
    return NextResponse.json(
      { error: 'Bạn đã đạt giới hạn 30 lượt chấm IELTS Speaking trong 24 giờ.' },
      { status: 429 },
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const parsedInput = parseRequestBody(body)
  if (!parsedInput) {
    return NextResponse.json({ error: 'Missing or invalid fields' }, { status: 400 })
  }

  const input = resolveCanonicalInput(parsedInput)
  if (!input) {
    return NextResponse.json({ error: 'Unknown IELTS Speaking question ID' }, { status: 400 })
  }

  const reference = input.questionId
    ? getSpeakingReferenceByQuestionId(input.part, input.questionId)
    : undefined
  const maxTokens = input.part === 2 ? 4200 : 3200
  const prompt = buildIeltsSpeakingEvaluationPrompt(input, reference)
  const raw = await aiChat({
    order: ['cerebras', 'groq'],
    prompt,
    maxTokens,
    temperature: 0.35,
    json: true,
  })

  if (raw === null) {
    return NextResponse.json({ error: 'AI unavailable' }, { status: 502 })
  }

  let result = parseIeltsSpeakingEvaluation(raw, input.question, input.answer)

  if (!result) {
    const repaired = await aiChat({
      order: ['cerebras', 'groq'],
      prompt: buildJsonRepairPrompt(raw),
      maxTokens,
      temperature: 0,
      json: true,
    })
    if (repaired !== null) {
      result = parseIeltsSpeakingEvaluation(repaired, input.question, input.answer)
    }
  }

  if (!result) {
    console.error('[ieltsSpeaking] Invalid AI evaluation response')
    return NextResponse.json({ error: 'Invalid AI response' }, { status: 502 })
  }

  return NextResponse.json(result)
}
