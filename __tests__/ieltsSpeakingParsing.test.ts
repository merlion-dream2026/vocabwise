import { describe, expect, it } from 'vitest'
import { parseIeltsSpeakingEvaluation } from '@/lib/ieltsSpeakingParsing'

const validPayload = {
  estimated_band: {
    overall: 6.5,
    fluency_and_coherence: 6.5,
    lexical_resource: 6,
    grammatical_range_and_accuracy: 6.5,
    pronunciation: 8,
    confidence: 'medium',
    disclaimer_vi: 'Ước lượng từ một câu trả lời.',
  },
  summary: {
    what_worked_vi: 'Câu trả lời liên quan và có lý do.',
    top_priority_vi: 'Phát triển ví dụ rõ hơn.',
  },
  criteria: {
    fluency_and_coherence: {
      score: 6.5,
      strength_vi: 'Có trình tự rõ.',
      weakness_vi: 'Ý còn ngắn.',
      evidence: ['because it is convenient'],
      improvement_vi: 'Thêm một ví dụ cụ thể.',
    },
    lexical_resource: {
      score: 6,
      strength_vi: 'Từ vựng phù hợp.',
      weakness_vi: 'Từ còn cơ bản.',
      evidence: ['very good'],
      improvement_vi: 'Dùng tính từ chính xác hơn.',
    },
    grammatical_range_and_accuracy: {
      score: 6.5,
      strength_vi: 'Câu nhìn chung chính xác.',
      weakness_vi: 'Ít cấu trúc phức.',
      evidence: ['I like it because'],
      improvement_vi: 'Kết hợp mệnh đề linh hoạt hơn.',
    },
    pronunciation: {
      score: 8,
      strength_vi: 'Should be ignored.',
      weakness_vi: '',
      evidence: ['invented'],
      improvement_vi: '',
    },
  },
  corrections: [
    {
      original: 'I very like it.',
      improved: 'I really like it.',
      reason_vi: 'Dùng really trước động từ like.',
      category: 'grammar',
    },
  ],
  model_answers: {
    band_6: { answer: 'I really like it because it is convenient.', upgrades_vi: ['Sửa ngữ pháp.'] },
    band_7_5: { answer: 'I enjoy it mainly because it makes my daily routine easier.', upgrades_vi: ['Từ vựng chính xác hơn.'] },
    band_9: { answer: 'What appeals to me most is the convenience it brings to my daily routine.', upgrades_vi: ['Diễn đạt tự nhiên và linh hoạt.'] },
  },
  alternative_idea: {
    idea_summary_vi: 'Tập trung vào cơ hội giao tiếp.',
    answer: 'Another reason I enjoy it is that it gives me a chance to meet people.',
  },
  useful_expressions: [
    { expression: 'what appeals to me most', meaning_vi: 'điều hấp dẫn tôi nhất', example: 'What appeals to me most is the atmosphere.' },
    { expression: 'daily routine', meaning_vi: 'thói quen hằng ngày', example: 'It is part of my daily routine.' },
    { expression: 'gives me a chance to', meaning_vi: 'cho tôi cơ hội để', example: 'It gives me a chance to relax.' },
  ],
  retry: {
    focus_vi: 'Phát triển ý bằng ví dụ.',
    instruction_vi: 'Trả lời lại và thêm một tình huống cụ thể.',
  },
}

describe('parseIeltsSpeakingEvaluation', () => {
  it('parses a valid evaluation and always removes pronunciation scoring', () => {
    const result = parseIeltsSpeakingEvaluation(
      JSON.stringify(validPayload),
      'What do you like?',
      'I very like it because it is convenient.',
    )

    expect(result).not.toBeNull()
    expect(result?.estimatedBand.overall).toBe(6.5)
    expect(result?.estimatedBand.pronunciation).toBeNull()
    expect(result?.criteria.pronunciation.score).toBeNull()
    expect(result?.criteria.pronunciation.evidence).toEqual([])
    expect(result?.usefulExpressions).toHaveLength(3)
  })

  it('rejects invalid JSON', () => {
    expect(parseIeltsSpeakingEvaluation('not json', 'Question', 'Answer')).toBeNull()
  })

  it('rejects incomplete model answers', () => {
    const incomplete = structuredClone(validPayload)
    incomplete.model_answers.band_9.answer = ''
    expect(parseIeltsSpeakingEvaluation(JSON.stringify(incomplete), 'Question', 'Answer')).toBeNull()
  })

  it('recalculates an implausible overall score from the three scored criteria', () => {
    const inconsistent = structuredClone(validPayload)
    inconsistent.estimated_band.overall = 9
    const result = parseIeltsSpeakingEvaluation(JSON.stringify(inconsistent), 'Question', 'Answer')
    expect(result?.estimatedBand.overall).toBe(6.5)
  })
})
