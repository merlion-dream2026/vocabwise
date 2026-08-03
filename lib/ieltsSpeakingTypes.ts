export type IeltsSpeakingPart = 1 | 2 | 3
export type AnswerSource = 'typed' | 'audio'
export type CriterionKey =
  | 'fluency_and_coherence'
  | 'lexical_resource'
  | 'grammatical_range_and_accuracy'
  | 'pronunciation'

export type SpeakingQuestion = {
  id: string
  part: 1
  topic: string
  topicNumber: number
  questionNumber: number
  question: string
  quickAnalysis: string
}

export type SpeakingTopic = {
  id: string
  number: number
  topic: string
  teachingFocus: string
  questionCount: number
}

export type Part2CueCard = {
  id: string
  part: 2
  setId: string
  setNumber: number
  family: string
  linkedTopic: string
  prompt: string
  bulletPoints: string[]
  responseFramework: string
}

export type Part3Question = {
  id: string
  part: 3
  setId: string
  setNumber: number
  family: string
  linkedTopic: string
  groupId: string
  theme: string
  questionNumber: number
  question: string
  quickAnalysis: string
}

export type Part3Group = {
  id: string
  theme: string
  questions: Part3Question[]
}

export type SpeakingLinkedSet = {
  id: string
  number: number
  family: string
  linkedTopic: string
  part2: Part2CueCard
  part3Groups: Part3Group[]
}

export type SpeakingReferenceContext = {
  part: IeltsSpeakingPart
  questionId: string
  question: string
  topic: string
  quickAnalysis: string
  taRefined: string
  alternativeA: string
  alternativeB: string
}

export type CriterionFeedback = {
  score: number | null
  strengthVi: string
  weaknessVi: string
  evidence: string[]
  improvementVi: string
}

export type SentenceCorrection = {
  original: string
  improved: string
  reasonVi: string
  category: 'grammar' | 'vocabulary' | 'naturalness' | 'coherence'
}

export type ModelAnswer = {
  answer: string
  upgradesVi: string[]
}

export type UsefulExpression = {
  expression: string
  meaningVi: string
  example: string
}

export type IeltsSpeakingEvaluation = {
  question: string
  answer: string
  estimatedBand: {
    overall: number
    fluencyAndCoherence: number
    lexicalResource: number
    grammaticalRangeAndAccuracy: number
    pronunciation: null
    confidence: 'low' | 'medium' | 'high'
    disclaimerVi: string
  }
  summary: {
    whatWorkedVi: string
    topPriorityVi: string
  }
  criteria: {
    fluencyAndCoherence: CriterionFeedback
    lexicalResource: CriterionFeedback
    grammaticalRangeAndAccuracy: CriterionFeedback
    pronunciation: CriterionFeedback
  }
  corrections: SentenceCorrection[]
  modelAnswers: {
    band6: ModelAnswer
    band7_5: ModelAnswer
    band9: ModelAnswer
  }
  alternativeIdea: {
    ideaSummaryVi: string
    answer: string
  }
  usefulExpressions: UsefulExpression[]
  retry: {
    focusVi: string
    instructionVi: string
  }
}

export type EvaluateSpeakingRequest = {
  part: IeltsSpeakingPart
  questionId?: string
  topic?: string
  theme?: string
  question: string
  questionDetails?: string[]
  answer: string
  source?: AnswerSource
  attemptNumber?: number
}
