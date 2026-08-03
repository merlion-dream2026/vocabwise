import part1QuestionBank from '@/data/ielts-speaking/part1-question-bank.json'
import parts23QuestionBank from '@/data/ielts-speaking/parts2-3-question-bank.json'
import type {
  Part2CueCard,
  Part3Group,
  Part3Question,
  SpeakingLinkedSet,
  SpeakingQuestion,
  SpeakingTopic,
} from '@/lib/ieltsSpeakingTypes'

type SourcePart1Question = {
  id: string
  number: number
  text: string
  quick_analysis: string
}

type SourcePart1Topic = {
  id: string
  number: number
  title: string
  teaching_focus: string
  questions: SourcePart1Question[]
}

type SourcePart3Question = {
  id: string
  number: number
  text: string
  quick_analysis: string
}

type SourcePart3Group = {
  id: string
  theme: string
  questions: SourcePart3Question[]
}

type SourceLinkedSet = {
  id: string
  number: number
  family: string
  linked_topic: string
  part2: {
    id: string
    cue_card: {
      prompt: string
      bullet_points: string[]
    }
    response_framework: string
  }
  part3_groups: SourcePart3Group[]
}

const sourceTopics = part1QuestionBank.topics as SourcePart1Topic[]
const sourceSets = parts23QuestionBank.sets as SourceLinkedSet[]

export const IELTS_PART1_TOPICS: SpeakingTopic[] = sourceTopics.map(topic => ({
  id: topic.id,
  number: topic.number,
  topic: topic.title,
  teachingFocus: topic.teaching_focus,
  questionCount: topic.questions.length,
}))

export const IELTS_PART1_QUESTIONS: SpeakingQuestion[] = sourceTopics.flatMap(topic =>
  topic.questions.map(question => ({
    id: question.id,
    part: 1 as const,
    topic: topic.title,
    topicNumber: topic.number,
    questionNumber: question.number,
    question: question.text,
    quickAnalysis: question.quick_analysis,
  })),
)

export const IELTS_LINKED_SETS: SpeakingLinkedSet[] = sourceSets.map(set => {
  const part2: Part2CueCard = {
    id: set.part2.id,
    part: 2,
    setId: set.id,
    setNumber: set.number,
    family: set.family,
    linkedTopic: set.linked_topic,
    prompt: set.part2.cue_card.prompt,
    bulletPoints: set.part2.cue_card.bullet_points,
    responseFramework: set.part2.response_framework,
  }

  const part3Groups: Part3Group[] = set.part3_groups.map(group => ({
    id: group.id,
    theme: group.theme,
    questions: group.questions.map(question => ({
      id: question.id,
      part: 3 as const,
      setId: set.id,
      setNumber: set.number,
      family: set.family,
      linkedTopic: set.linked_topic,
      groupId: group.id,
      theme: group.theme,
      questionNumber: question.number,
      question: question.text,
      quickAnalysis: question.quick_analysis,
    })),
  }))

  return {
    id: set.id,
    number: set.number,
    family: set.family,
    linkedTopic: set.linked_topic,
    part2,
    part3Groups,
  }
})

export const IELTS_PART2_CUE_CARDS: Part2CueCard[] = IELTS_LINKED_SETS.map(set => set.part2)
export const IELTS_PART3_QUESTIONS: Part3Question[] = IELTS_LINKED_SETS.flatMap(set =>
  set.part3Groups.flatMap(group => group.questions),
)

const part1QuestionsById = new Map(IELTS_PART1_QUESTIONS.map(question => [question.id, question]))
const linkedSetsById = new Map(IELTS_LINKED_SETS.map(set => [set.id, set]))
const part2ById = new Map(IELTS_PART2_CUE_CARDS.map(cueCard => [cueCard.id, cueCard]))
const part3ById = new Map(IELTS_PART3_QUESTIONS.map(question => [question.id, question]))

export function getQuestionsByTopic(topic: string): SpeakingQuestion[] {
  return IELTS_PART1_QUESTIONS.filter(question => question.topic === topic)
}

export function getPart1QuestionById(questionId: string): SpeakingQuestion | undefined {
  return part1QuestionsById.get(questionId)
}

export function getLinkedSetById(setId: string): SpeakingLinkedSet | undefined {
  return linkedSetsById.get(setId)
}

export function getPart2CueCardById(questionId: string): Part2CueCard | undefined {
  return part2ById.get(questionId)
}

export function getPart3QuestionById(questionId: string): Part3Question | undefined {
  return part3ById.get(questionId)
}
