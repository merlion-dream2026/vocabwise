import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { sentence, cefr } = await req.json()
  if (!sentence) return NextResponse.json({ error: 'Missing sentence' }, { status: 400 })

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'GROQ_API_KEY not configured' }, { status: 500 })

  const prompt = `Bạn là giáo viên IELTS. Phân tích câu sau cho học sinh Việt Nam học tiếng Anh (trình độ ${cefr ?? 'B1-C1'}):

"${sentence}"

Giải thích ngắn gọn bằng tiếng Việt:
- Thì động từ / cấu trúc ngữ pháp chính
- Loại mệnh đề (nếu phức tạp)
- Collocations hoặc cụm từ đáng chú ý (nếu có)

Tối đa 3 điểm, mỗi điểm 1–2 câu ngắn. Không lặp lại câu gốc.`

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 200,
      temperature: 0.5,
    }),
  })

  if (!res.ok) {
    console.error('Groq grammar-note error:', res.status)
    return NextResponse.json({ error: 'AI unavailable' }, { status: 502 })
  }

  const d = await res.json()
  const note = d.choices?.[0]?.message?.content?.trim() ?? ''
  return NextResponse.json({ note })
}
