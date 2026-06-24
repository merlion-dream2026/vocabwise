import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { targetWord, sentence, cefr } = await req.json()
  if (!targetWord || !sentence) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const apiKey = process.env.CEREBRAS_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'CEREBRAS_API_KEY not configured' }, { status: 500 })

  const prompt = `Bạn là giáo viên IELTS chấm bài viết câu cho học sinh Việt Nam (trình độ ${cefr ?? 'B1-C1'}).

Từ mục tiêu: "${targetWord}"
Câu học sinh viết: "${sentence}"

Hãy đánh giá và trả lời theo đúng format JSON sau (không thêm text ngoài JSON):
{
  "score": <số nguyên 0-10>,
  "used_correctly": <true/false — từ được dùng đúng nghĩa/cú pháp không>,
  "grammar_ok": <true/false — câu đúng ngữ pháp không>,
  "feedback_vi": "<2-3 câu nhận xét bằng tiếng Việt: điểm tốt + điểm cần sửa>",
  "improved": "<câu đã được cải thiện nếu cần, giữ ý nghĩa gốc. Để trống '' nếu câu đã tốt>"
}`

  const res = await fetch('https://api.cerebras.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-oss-120b',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 300,
      temperature: 0.4,
      response_format: { type: 'json_object' },
    }),
  })

  if (!res.ok) {
    console.error('Groq writing-check error:', res.status)
    return NextResponse.json({ error: 'AI unavailable' }, { status: 502 })
  }

  const d = await res.json()
  const raw = d.choices?.[0]?.message?.content?.trim() ?? '{}'

  try {
    const result = JSON.parse(raw)
    return NextResponse.json({
      score:         Number(result.score ?? 0),
      used_correctly: !!result.used_correctly,
      grammar_ok:    !!result.grammar_ok,
      feedback_vi:   String(result.feedback_vi ?? ''),
      improved:      String(result.improved ?? ''),
    })
  } catch {
    return NextResponse.json({ error: 'Invalid AI response' }, { status: 502 })
  }
}
