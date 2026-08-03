import { describe, expect, it } from 'vitest'
import {
  IELTS_LINKED_SETS,
  IELTS_PART1_QUESTIONS,
  IELTS_PART1_TOPICS,
  IELTS_PART2_CUE_CARDS,
  IELTS_PART3_QUESTIONS,
  getPart1QuestionById,
  getPart2CueCardById,
  getPart3QuestionById,
  getQuestionsByTopic,
} from '@/lib/ieltsSpeakingQuestionBank'
import { getSpeakingReferenceByQuestionId } from '@/lib/ieltsSpeakingReferenceBank'

describe('IELTS Speaking complete question bank', () => {
  it('loads all Part 1 content', () => {
    expect(IELTS_PART1_TOPICS).toHaveLength(80)
    expect(IELTS_PART1_QUESTIONS).toHaveLength(401)
    expect(getQuestionsByTopic('Home')).toHaveLength(6)
    expect(getPart1QuestionById('p1-01-q01')?.question).toBe('Where do you live?')
  })

  it('loads 60 linked sets, 60 cue cards and 360 Part 3 questions', () => {
    expect(IELTS_LINKED_SETS).toHaveLength(60)
    expect(IELTS_PART2_CUE_CARDS).toHaveLength(60)
    expect(IELTS_PART3_QUESTIONS).toHaveLength(360)
  })

  it('resolves canonical Part 2 and Part 3 questions by stable ID', () => {
    const cueCard = getPart2CueCardById('p2-set-01')
    expect(cueCard?.prompt).toBe('Describe a person who taught you a useful skill.')
    expect(cueCard?.bulletPoints).toHaveLength(4)

    const part3 = getPart3QuestionById('s01-a-q01')
    expect(part3?.theme).toBe('Learning from other people')
    expect(part3?.question).toBe('Why are some people better teachers than others?')
  })

  it('links sampled questions from every part to private coursebook references', () => {
    const part1 = getSpeakingReferenceByQuestionId(1, 'p1-02-q02')
    const part2 = getSpeakingReferenceByQuestionId(2, 'p2-set-21')
    const part3 = getSpeakingReferenceByQuestionId(3, 's60-b-q03')

    for (const reference of [part1, part2, part3]) {
      expect(reference?.taRefined.length).toBeGreaterThan(20)
      expect(reference?.alternativeA.length).toBeGreaterThan(20)
      expect(reference?.alternativeB.length).toBeGreaterThan(20)
      expect(reference?.quickAnalysis.length).toBeGreaterThan(10)
    }
  })

  it('keeps client-safe Parts 2–3 question data free of model-answer fields', async () => {
    const questionBank = await import('@/data/ielts-speaking/parts2-3-question-bank.json')
    const serialized = JSON.stringify(questionBank.default)
    expect(serialized).not.toContain('ta_refined')
    expect(serialized).not.toContain('alternative_a')
    expect(serialized).not.toContain('model_answers')
  })
})
