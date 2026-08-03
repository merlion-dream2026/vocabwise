import part1ReferenceBank from '@/data/ielts-speaking/part1-reference-answers.json'
import sets01To20 from '@/data/ielts-speaking/parts2-3-sets-01-20.json'
import sets21To40 from '@/data/ielts-speaking/parts2-3-sets-21-40.json'
import sets41To60 from '@/data/ielts-speaking/parts2-3-sets-41-60.json'
import type { IeltsSpeakingPart, SpeakingReferenceContext } from '@/lib/ieltsSpeakingTypes'

type SourcePart1Reference = {
  id: string
  topic: string
  question: string
  quick_analysis: string
  answers: {
    ta_refined: string
    alternative_a: string
    alternative_b: string
  }
}

type SourceModelAnswer = {
  answer: string
  route_focus: string
  approximate_words: number
}

type SourcePart3Question = {
  id: string
  number: number
  text: string
  answers: {
    ta_route: string
    alternative_a: string
    alternative_b: string
  }
  quick_analysis: string
}

type SourceSet = {
  id: string
  number: number
  family: string
  linked_topic: string
  part2: {
    cue_card: {
      prompt: string
      bullet_points: string[]
    }
    model_answers: {
      ta_refined: SourceModelAnswer
      alternative_a: SourceModelAnswer
      alternative_b: SourceModelAnswer
    }
  }
  part3_groups: Array<{
    id: string
    theme: string
    questions: SourcePart3Question[]
  }>
}

const part1ById = new Map(
  (part1ReferenceBank.questions as SourcePart1Reference[]).map(item => [item.id, item]),
)

const sourceSets = [
  ...(sets01To20.sets as SourceSet[]),
  ...(sets21To40.sets as SourceSet[]),
  ...(sets41To60.sets as SourceSet[]),
]

const part2ById = new Map<string, SpeakingReferenceContext>()
const part3ById = new Map<string, SpeakingReferenceContext>()

for (const set of sourceSets) {
  const models = set.part2.model_answers
  part2ById.set(`p2-${set.id}`, {
    part: 2,
    questionId: `p2-${set.id}`,
    question: set.part2.cue_card.prompt,
    topic: set.linked_topic,
    quickAnalysis: [
      'Use the cue points as coverage checks, but organize the response as one coherent story.',
      'TA flow: ANCHOR → SCENE → 2–3 SELECTED DETAILS with reactions → REFLECTION / wish.',
      `Primary route focus: ${models.ta_refined.route_focus}`,
    ].join(' '),
    taRefined: models.ta_refined.answer,
    alternativeA: models.alternative_a.answer,
    alternativeB: models.alternative_b.answer,
  })

  for (const group of set.part3_groups) {
    for (const question of group.questions) {
      part3ById.set(question.id, {
        part: 3,
        questionId: question.id,
        question: question.text,
        topic: `${set.linked_topic} · ${group.theme}`,
        quickAnalysis: question.quick_analysis,
        taRefined: question.answers.ta_route,
        alternativeA: question.answers.alternative_a,
        alternativeB: question.answers.alternative_b,
      })
    }
  }
}

export function getPart1ReferenceByQuestionId(questionId: string): SpeakingReferenceContext | undefined {
  const item = part1ById.get(questionId)
  if (!item) return undefined
  return {
    part: 1,
    questionId: item.id,
    question: item.question,
    topic: item.topic,
    quickAnalysis: item.quick_analysis,
    taRefined: item.answers.ta_refined,
    alternativeA: item.answers.alternative_a,
    alternativeB: item.answers.alternative_b,
  }
}

export function getPart2ReferenceByQuestionId(questionId: string): SpeakingReferenceContext | undefined {
  return part2ById.get(questionId)
}

export function getPart3ReferenceByQuestionId(questionId: string): SpeakingReferenceContext | undefined {
  return part3ById.get(questionId)
}

export function getSpeakingReferenceByQuestionId(
  part: IeltsSpeakingPart,
  questionId: string,
): SpeakingReferenceContext | undefined {
  if (part === 1) return getPart1ReferenceByQuestionId(questionId)
  if (part === 2) return getPart2ReferenceByQuestionId(questionId)
  return getPart3ReferenceByQuestionId(questionId)
}
