import type {
  EvaluateSpeakingRequest,
  IeltsSpeakingPart,
  SpeakingReferenceContext,
} from '@/lib/ieltsSpeakingTypes'

function answerLengthGuidance(part: IeltsSpeakingPart): string {
  if (part === 1) {
    return `Part 1 model-answer guidance:
- Band 6: about 35–55 words, normally 2–4 natural sentences.
- Band 7.5: about 50–75 words.
- Band 9: about 60–90 words.
- Alternative answer: about 45–75 words.
- Develop one central idea rather than listing several shallow points.`
  }
  if (part === 2) {
    return `Part 2 model-answer guidance:
- Band 6: about 170–210 words with clear cue-card coverage.
- Band 7.5: about 210–240 words with a coherent story and selective detail.
- Band 9: about 230–260 words at a relaxed, speakable pace.
- Alternative answer: about 210–250 words using a genuinely different story.
- Use the cue points as coverage checks, but organize the answer as ANCHOR → SCENE → 2–3 SELECTED DETAILS with reactions → REFLECTION / wish.
- Do not write four disconnected mini-answers or an essay.`
  }
  return `Part 3 model-answer guidance:
- Band 6: about 60–90 words.
- Band 7.5: about 80–120 words.
- Band 9: about 90–140 words.
- Alternative answer: about 80–120 words.
- Prefer direct position → explanation → illustration → nuance.
- Do not turn the response into a formal essay or a list of unrelated points.`
}

function partSpecificAssessment(part: IeltsSpeakingPart): string {
  if (part === 1) {
    return `PART 1 COACHING FOCUS
- Check whether the learner answers immediately and remains personal and relevant.
- Reward one clearly developed idea, a concrete detail, and a natural reaction or closing thought.
- Do not demand Part 3-level abstraction or Part 2-length development.`
  }
  if (part === 2) {
    return `PART 2 COACHING FOCUS
- Check whether the long turn has a clear anchor, scene, selected details, emotional movement, and reflection.
- Check cue-card coverage, story flow, tense control, and the ability to sustain an answer without padding.
- A transcript can show organization and language, but it cannot fully prove live fluency or pronunciation. Keep confidence cautious when the answer is short.`
  }
  return `PART 3 COACHING FOCUS
- Check whether the learner gives a direct position and develops it through cause, mechanism, comparison, example, consequence, or qualification.
- Reward depth and nuance, but do not require an essay-style introduction or conclusion.
- Penalize lists of shallow ideas more than a single well-developed argument.`
}

function formatQuestionDetails(details?: string[]): string {
  if (!details || details.length === 0) return ''
  return `\nCue-card points:\n${details.map(detail => `- ${detail}`).join('\n')}`
}

export function buildIeltsSpeakingEvaluationPrompt(
  input: EvaluateSpeakingRequest,
  reference?: SpeakingReferenceContext,
): string {
  const topicLine = input.topic ? `Topic: ${input.topic}` : 'Topic: not provided'
  const themeLine = input.theme ? `Part 3 theme: ${input.theme}` : ''
  const referenceSection = reference
    ? `\nCURATED COURSEBOOK REFERENCE — PRIVATE COACHING CALIBRATION ONLY
Reference development route: ${reference.quickAnalysis}
TA-refined route: ${reference.taRefined}
Alternative route A: ${reference.alternativeA}
Alternative route B: ${reference.alternativeB}

Use these routes only to calibrate natural length, structure, level of development, and plausible alternative angles. Do not copy distinctive wording, names, locations, incidents, opinions, or personal details. Do not mention the reference material to the learner. The Band 6 / 7.5 / 9 models must be newly written from the learner's own central ideas. The alternative answer must use a genuinely different main idea or story.\n`
    : ''

  return `You are an expert IELTS Speaking coach for Vietnamese learners.
Your job is to give practical, evidence-based coaching after ONE submitted response.
This is not an official IELTS score. It is a cautious estimate based on the transcript only.

IELTS Speaking part: ${input.part}
${topicLine}
${themeLine}
Question: ${JSON.stringify(input.question)}${formatQuestionDetails(input.questionDetails)}
Learner answer: ${JSON.stringify(input.answer)}
Answer source: ${input.source ?? 'typed'}
Attempt number: ${input.attemptNumber ?? 1}
${referenceSection}
${partSpecificAssessment(input.part)}

NON-NEGOTIABLE ASSESSMENT RULES
1. Assess Fluency and Coherence, Lexical Resource, and Grammatical Range and Accuracy on the 0–9 IELTS half-band scale.
2. Pronunciation MUST be null. Never infer pronunciation, accent, stress, intonation, or sound accuracy from a transcript.
3. Treat fluency as a limited transcript-based estimate. Do not pretend to know pause length, hesitation frequency, or delivery speed unless audio-derived metrics are supplied; none are supplied here.
4. Overall should normally be the average of the three scored criteria rounded to the nearest 0.5. Never include pronunciation.
5. Every important judgment must be supported by wording found in the learner answer. Evidence quotations must appear verbatim in the answer.
6. Do not penalize natural spoken-English features merely because they are less formal than writing.
7. Do not reward rare words, idioms, or long sentences unless they are natural, accurate, and relevant.
8. Select only the 1–3 most useful sentence-level corrections. Do not correct everything.
9. If the answer is extremely short, incomplete, off-topic, or does not sustain the task required for its part, lower confidence and explain the main issue constructively.
10. Feedback and explanations must be in clear Vietnamese. Model answers and example sentences must be in natural English.

MODEL-ANSWER RULES
1. band_6, band_7_5, and band_9 MUST preserve the learner's central idea(s), personal details, intended meaning, and chosen story where possible.
2. They should show a visible progression in development, precision, flexibility, and naturalness.
3. Band 6 must be a good, usable answer, not an intentionally faulty answer.
4. Band 7.5 should add clearer development, more flexible grammar, and more precise vocabulary without sounding memorized.
5. Band 9 should be highly natural, precise, coherent, and nuanced, but still sound like spontaneous spoken English—not an essay or speech.
6. Do not invent specific names, dates, places, achievements, or dramatic incidents that the learner did not provide. Where a small linking detail is needed, keep it generic and compatible with the learner's answer.
7. The alternative_idea answer MUST use a genuinely different main idea, position, or story. It must not merely paraphrase the learner's answer.
8. Give exactly 3–5 useful expressions. Choose expressions the learner can realistically reuse in speaking.
9. The retry instruction should target ONE priority only.

${answerLengthGuidance(input.part)}

Return ONLY one valid JSON object with exactly this shape and no markdown:
{
  "estimated_band": {
    "overall": 0,
    "fluency_and_coherence": 0,
    "lexical_resource": 0,
    "grammatical_range_and_accuracy": 0,
    "pronunciation": null,
    "confidence": "low",
    "disclaimer_vi": ""
  },
  "summary": {
    "what_worked_vi": "",
    "top_priority_vi": ""
  },
  "criteria": {
    "fluency_and_coherence": {
      "score": 0,
      "strength_vi": "",
      "weakness_vi": "",
      "evidence": [""],
      "improvement_vi": ""
    },
    "lexical_resource": {
      "score": 0,
      "strength_vi": "",
      "weakness_vi": "",
      "evidence": [""],
      "improvement_vi": ""
    },
    "grammatical_range_and_accuracy": {
      "score": 0,
      "strength_vi": "",
      "weakness_vi": "",
      "evidence": [""],
      "improvement_vi": ""
    },
    "pronunciation": {
      "score": null,
      "strength_vi": "Không đánh giá từ transcript.",
      "weakness_vi": "Không đủ dữ liệu âm thanh để đánh giá.",
      "evidence": [],
      "improvement_vi": "Cần phân tích audio riêng để nhận xét phát âm đáng tin cậy."
    }
  },
  "corrections": [
    {
      "original": "",
      "improved": "",
      "reason_vi": "",
      "category": "grammar"
    }
  ],
  "model_answers": {
    "band_6": {
      "answer": "",
      "upgrades_vi": [""]
    },
    "band_7_5": {
      "answer": "",
      "upgrades_vi": [""]
    },
    "band_9": {
      "answer": "",
      "upgrades_vi": [""]
    }
  },
  "alternative_idea": {
    "idea_summary_vi": "",
    "answer": ""
  },
  "useful_expressions": [
    {
      "expression": "",
      "meaning_vi": "",
      "example": ""
    }
  ],
  "retry": {
    "focus_vi": "",
    "instruction_vi": ""
  }
}`
}

export function buildJsonRepairPrompt(raw: string): string {
  return `Repair the following attempted IELTS Speaking evaluation into valid JSON.
Return JSON only. Do not add markdown or commentary.
Preserve the original meaning where possible, but make every required field present.
pronunciation and criteria.pronunciation.score must be null.
useful_expressions must contain 3–5 items.
corrections must contain 0–3 items.
All three model answers and the alternative answer must be non-empty.

Attempted output:
${raw}`
}
