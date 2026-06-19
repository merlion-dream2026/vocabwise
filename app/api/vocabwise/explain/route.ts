import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { word, pos, meaning_vi, example_en } = await req.json()
  if (!word) return NextResponse.json({ error: 'Missing word' }, { status: 400 })

  const prompt = `Giải thích từ tiếng Anh "${word}"${pos ? ` (${pos})` : ''} cho học sinh Việt Nam học IELTS.
Nghĩa: ${meaning_vi}
Ví dụ: ${example_en}

Viết 3-4 câu ngắn bằng tiếng Việt: ngữ cảnh thường dùng, phân biệt với từ đồng nghĩa nếu có, và 1 ví dụ mới dễ nhớ. Không lặp lại ví dụ gốc.`

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 250,
      temperature: 0.7,
    }),
  })

  if (!res.ok) {
    console.error('Groq explain error:', res.status)
    return NextResponse.json({ error: 'AI unavailable' }, { status: 502 })
  }

  const d = await res.json()
  const explanation = d.choices?.[0]?.message?.content?.trim() ?? ''
  return NextResponse.json({ explanation })
}
