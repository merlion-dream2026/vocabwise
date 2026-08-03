import type {
  CriterionFeedback,
  IeltsSpeakingEvaluation,
  ModelAnswer,
  SentenceCorrection,
  UsefulExpression,
} from '@/lib/ieltsSpeakingTypes'

type UnknownRecord = Record<string, unknown>

function asRecord(value: unknown): UnknownRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as UnknownRecord
    : {}
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value.trim() : fallback
}

function asStringArray(value: unknown, max = 5): string[] {
  if (!Array.isArray(value)) return []
  return value
    .map(item => asString(item))
    .filter(Boolean)
    .slice(0, max)
}

function roundHalf(value: number): number {
  return Math.round(value * 2) / 2
}

function asBand(value: unknown, fallback = 0): number {
  const numeric = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(numeric)) return fallback
  return Math.min(9, Math.max(0, roundHalf(numeric)))
}

function asConfidence(value: unknown): 'low' | 'medium' | 'high' {
  return value === 'high' || value === 'medium' ? value : 'low'
}

function parseCriterion(value: unknown, scoreFallback: number | null): CriterionFeedback {
  const record = asRecord(value)
  return {
    score: scoreFallback === null ? null : asBand(record.score, scoreFallback),
    strengthVi: asString(record.strength_vi),
    weaknessVi: asString(record.weakness_vi),
    evidence: asStringArray(record.evidence, 4),
    improvementVi: asString(record.improvement_vi),
  }
}

function parseCorrections(value: unknown): SentenceCorrection[] {
  if (!Array.isArray(value)) return []
  const allowedCategories = new Set(['grammar', 'vocabulary', 'naturalness', 'coherence'])
  return value.slice(0, 3).flatMap(item => {
    const record = asRecord(item)
    const original = asString(record.original)
    const improved = asString(record.improved)
    const reasonVi = asString(record.reason_vi)
    const rawCategory = asString(record.category)
    if (!original || !improved || !reasonVi) return []
    const category = allowedCategories.has(rawCategory)
      ? rawCategory as SentenceCorrection['category']
      : 'naturalness'
    return [{ original, improved, reasonVi, category }]
  })
}

function parseModelAnswer(value: unknown): ModelAnswer {
  const record = asRecord(value)
  return {
    answer: asString(record.answer),
    upgradesVi: asStringArray(record.upgrades_vi, 4),
  }
}

function parseExpressions(value: unknown): UsefulExpression[] {
  if (!Array.isArray(value)) return []
  return value.slice(0, 5).flatMap(item => {
    const record = asRecord(item)
    const expression = asString(record.expression)
    const meaningVi = asString(record.meaning_vi)
    const example = asString(record.example)
    if (!expression || !meaningVi || !example) return []
    return [{ expression, meaningVi, example }]
  })
}

function averageBand(a: number, b: number, c: number): number {
  return roundHalf((a + b + c) / 3)
}

export function parseIeltsSpeakingEvaluation(
  raw: string,
  question: string,
  answer: string,
): IeltsSpeakingEvaluation | null {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }

  const root = asRecord(parsed)
  const estimated = asRecord(root.estimated_band)
  const criteria = asRecord(root.criteria)
  const summary = asRecord(root.summary)
  const modelAnswers = asRecord(root.model_answers)
  const alternativeIdea = asRecord(root.alternative_idea)
  const retry = asRecord(root.retry)

  const fluency = asBand(estimated.fluency_and_coherence)
  const lexical = asBand(estimated.lexical_resource)
  const grammar = asBand(estimated.grammatical_range_and_accuracy)
  const calculatedOverall = averageBand(fluency, lexical, grammar)
  const requestedOverall = asBand(estimated.overall, calculatedOverall)
  const overall = Math.abs(requestedOverall - calculatedOverall) <= 0.5
    ? requestedOverall
    : calculatedOverall

  const band6 = parseModelAnswer(modelAnswers.band_6)
  const band7_5 = parseModelAnswer(modelAnswers.band_7_5)
  const band9 = parseModelAnswer(modelAnswers.band_9)
  const expressions = parseExpressions(root.useful_expressions)

  if (!band6.answer || !band7_5.answer || !band9.answer) return null
  if (!asString(alternativeIdea.answer)) return null
  if (expressions.length < 3) return null

  return {
    question,
    answer,
    estimatedBand: {
      overall,
      fluencyAndCoherence: fluency,
      lexicalResource: lexical,
      grammaticalRangeAndAccuracy: grammar,
      pronunciation: null,
      confidence: asConfidence(estimated.confidence),
      disclaimerVi: asString(
        estimated.disclaimer_vi,
        'Điểm số chỉ là ước lượng từ một câu trả lời và không phải kết quả IELTS chính thức.',
      ),
    },
    summary: {
      whatWorkedVi: asString(summary.what_worked_vi),
      topPriorityVi: asString(summary.top_priority_vi),
    },
    criteria: {
      fluencyAndCoherence: parseCriterion(criteria.fluency_and_coherence, fluency),
      lexicalResource: parseCriterion(criteria.lexical_resource, lexical),
      grammaticalRangeAndAccuracy: parseCriterion(criteria.grammatical_range_and_accuracy, grammar),
      pronunciation: {
        score: null,
        strengthVi: 'Không đánh giá từ transcript.',
        weaknessVi: 'Không đủ dữ liệu âm thanh để đánh giá.',
        evidence: [],
        improvementVi: 'Cần phân tích audio riêng để nhận xét phát âm đáng tin cậy.',
      },
    },
    corrections: parseCorrections(root.corrections),
    modelAnswers: {
      band6,
      band7_5,
      band9,
    },
    alternativeIdea: {
      ideaSummaryVi: asString(alternativeIdea.idea_summary_vi),
      answer: asString(alternativeIdea.answer),
    },
    usefulExpressions: expressions,
    retry: {
      focusVi: asString(retry.focus_vi),
      instructionVi: asString(retry.instruction_vi),
    },
  }
}
