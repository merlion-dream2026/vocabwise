import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { checkAndIncrementAITextUsage } from '@/lib/rateLimit'

type GlossaryEntry = { word: string; meaning_vi: string }
type MCQItem = { id: number; sentence: string; options: string[]; answer: string }

function validateItems(items: unknown[]): items is MCQItem[] {
  return items.every(
    (it: unknown) =>
      it !== null &&
      typeof it === 'object' &&
      'sentence' in it && typeof (it as Record<string,unknown>).sentence === 'string' &&
      ((it as Record<string,unknown>).sentence as string).includes('_____') &&
      'options' in it && Array.isArray((it as Record<string,unknown>).options) &&
      ((it as Record<string,unknown>).options as unknown[]).length === 4 &&
      'answer' in it && typeof (it as Record<string,unknown>).answer === 'string' &&
      ((it as Record<string,unknown>).options as string[]).includes((it as Record<string,unknown>).answer as string)
  )
}

export async function POST(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!(await checkAndIncrementAITextUsage(session.familyId))) {
    return NextResponse.json({ error: 'Đã đạt giới hạn dùng AI hôm nay. Vui lòng thử lại vào ngày mai.' }, { status: 429 })
  }

  const { glossary, topicTitle, cefr } = await req.json() as {
    glossary: GlossaryEntry[]
    topicTitle: string
    cefr: string
  }

  if (!glossary || glossary.length < 5) {
    return NextResponse.json({ error: 'Not enough vocabulary' }, { status: 400 })
  }

  const apiKey = process.env.CEREBRAS_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'CEREBRAS_API_KEY not configured' }, { status: 500 })

  const wordList = glossary
    .map(g => `${g.word} (${g.meaning_vi})`)
    .join('\n')

  const prompt = `You are an IELTS vocabulary test maker. Create 5 fill-in-the-blank MCQ questions.

Topic: "${topicTitle}" (CEFR: ${cefr})
Vocabulary list:
${wordList}

Rules:
- Each question uses one vocabulary word as the correct answer
- The sentence must contain exactly "_____" for the blank
- Provide exactly 4 options: the correct answer + 3 plausible distractors from the vocabulary list
- Shuffle options so the correct answer is NOT always first
- Sentences must be different from any typical textbook examples
- Cover at least 5 different vocabulary words across the 5 questions

Return ONLY this JSON (no extra text):
{
  "items": [
    {"id": 1, "sentence": "The team _____  their goals within the deadline.", "options": ["achieved", "extended", "confirmed", "avoided"], "answer": "achieved"},
    {"id": 2, ...},
    {"id": 3, ...},
    {"id": 4, ...},
    {"id": 5, ...}
  ]
}`

  let res: Response
  try {
    res = await fetch('https://api.cerebras.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-oss-120b',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 800,
        temperature: 0.8,
        response_format: { type: 'json_object' },
      }),
    })
  } catch (e) {
    console.error('Cerebras generate-exercises fetch failed:', e)
    return NextResponse.json({ error: 'AI unavailable' }, { status: 502 })
  }

  if (!res.ok) {
    console.error('Groq generate-exercises error:', res.status)
    return NextResponse.json({ error: 'AI unavailable' }, { status: 502 })
  }

  const d = await res.json()
  const raw = d.choices?.[0]?.message?.content?.trim() ?? '{}'

  try {
    const parsed = JSON.parse(raw)
    const items: unknown[] = parsed.items ?? []

    if (!Array.isArray(items) || items.length < 3) {
      return NextResponse.json({ error: 'Generated exercises invalid' }, { status: 502 })
    }

    // Keep only valid items, up to 5
    const valid = items.slice(0, 5).map((it: unknown, i) => ({
      ...(it as object),
      id: i + 1,
    }))

    if (!validateItems(valid)) {
      return NextResponse.json({ error: 'Generated exercises malformed' }, { status: 502 })
    }

    return NextResponse.json({ items: valid })
  } catch {
    return NextResponse.json({ error: 'Invalid AI response' }, { status: 502 })
  }
}
