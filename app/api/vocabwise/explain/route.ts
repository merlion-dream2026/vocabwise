import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { supabase } from '@/lib/supabaseServer'
import { checkAndIncrementAITextUsage } from '@/lib/rateLimit'

export async function POST(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!(await checkAndIncrementAITextUsage(session.familyId))) {
    return NextResponse.json({ error: 'Đã đạt giới hạn dùng AI hôm nay. Vui lòng thử lại vào ngày mai.' }, { status: 429 })
  }

  const { word, pos, meaning_vi, example_en, mode } = await req.json()
  if (!word) return NextResponse.json({ error: 'Missing word' }, { status: 400 })

  // Check DB cache first
  if (mode === 'kids') {
    const { data } = await supabase
      .from('kids_explanations')
      .select('explanation_vi')
      .eq('word', word.toLowerCase())
      .single()
    if (data?.explanation_vi) return NextResponse.json({ explanation: data.explanation_vi })
  }

  const prompt = mode === 'kids'
    ? `Giải thích từ tiếng Anh "${word}"${pos ? ` (${pos})` : ''} cho học sinh Việt Nam học tiếng Anh.
Nghĩa: ${meaning_vi}
Ví dụ: ${example_en}

Viết 2-3 câu ngắn bằng tiếng Việt: khi nào dùng từ này trong cuộc sống, và 1 ví dụ mới gần gũi dễ nhớ. Không lặp lại ví dụ gốc. Dùng ngôn ngữ đơn giản, dễ hiểu.`
    : `Giải thích từ tiếng Anh "${word}"${pos ? ` (${pos})` : ''} cho học sinh Việt Nam học IELTS.
Nghĩa: ${meaning_vi}
Ví dụ: ${example_en}

Viết 3-4 câu ngắn bằng tiếng Việt: ngữ cảnh thường dùng, phân biệt với từ đồng nghĩa nếu có, và 1 ví dụ mới dễ nhớ. Không lặp lại ví dụ gốc.`

  let res: Response
  try {
    res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 250,
        temperature: 0.7,
      }),
    })
  } catch (e) {
    console.error('Groq explain fetch failed:', e)
    return NextResponse.json({ error: 'AI unavailable' }, { status: 502 })
  }

  if (!res.ok) {
    console.error('Groq explain error:', res.status)
    return NextResponse.json({ error: 'AI unavailable' }, { status: 502 })
  }

  const d = await res.json()
  const explanation = d.choices?.[0]?.message?.content?.trim() ?? ''

  // Save to DB for future requests
  if (mode === 'kids' && explanation) {
    await supabase.from('kids_explanations').upsert({ word: word.toLowerCase(), explanation_vi: explanation })
  }

  return NextResponse.json({ explanation })
}
