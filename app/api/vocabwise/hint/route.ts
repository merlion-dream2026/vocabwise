import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { exerciseType, question, options, baseWord } = await req.json()
  if (!question) return NextResponse.json({ error: 'Missing question' }, { status: 400 })

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'GROQ_API_KEY not configured' }, { status: 500 })

  let prompt = ''

  if (exerciseType === 'E3') {
    prompt = `Bạn là giáo viên IELTS. Học sinh Việt Nam đang làm bài điền từ vào chỗ trống:
Câu: "${question}"
Các lựa chọn: ${(options as string[])?.join(', ')}

Hãy cho một gợi ý ngắn bằng tiếng Việt giúp họ tìm đáp án NHƯNG KHÔNG tiết lộ trực tiếp đáp án.
Tập trung vào: nghĩa từ trong ngữ cảnh, cách loại trừ, hoặc cấu trúc ngữ pháp.
Tối đa 2 câu ngắn gọn.`
  } else if (exerciseType === 'E4') {
    prompt = `Bạn là giáo viên IELTS. Học sinh Việt Nam đang chọn từ điền vào chỗ trống:
Câu: "${question}"
Hộp từ: ${(options as string[])?.join(', ')}

Gợi ý bằng tiếng Việt giúp chọn từ đúng NHƯNG KHÔNG nói đáp án.
Gợi ý về nghĩa, collocations, hoặc ngữ cảnh câu. Tối đa 2 câu.`
  } else if (exerciseType === 'E5') {
    prompt = `Bạn là giáo viên IELTS. Học sinh đang làm bài True/False/Not Given:
Câu nhận định: "${question}"

Gợi ý bằng tiếng Việt cách phân tích câu này KHÔNG nói đáp án.
Hướng dẫn cách đọc tín hiệu ngôn ngữ để phân biệt True, False, hay Not Given. Tối đa 2 câu.`
  } else if (exerciseType === 'E6') {
    prompt = `Bạn là giáo viên IELTS. Học sinh điền dạng từ vào chỗ trống:
Câu: "${question}"
Từ gốc: ${baseWord}

Gợi ý bằng tiếng Việt về từ loại cần dùng (noun/verb/adj/adv) KHÔNG nói đáp án.
Giải thích vị trí từ trong câu yêu cầu từ loại gì. Tối đa 2 câu.`
  } else if (exerciseType === 'E8') {
    prompt = `Bạn là giáo viên IELTS. Học sinh đang tìm cách sửa lỗi trong câu:
Câu: "${question}"
Các phương án sửa: ${(options as string[])?.join(' | ')}

Gợi ý bằng tiếng Việt về loại lỗi cần tìm NHƯNG KHÔNG tiết lộ đáp án.
Gợi ý: kiểm tra ngữ pháp, collocation, hay từ vựng. Tối đa 2 câu.`
  } else {
    prompt = `Bạn là giáo viên IELTS. Học sinh đang gặp khó với bài tập:
"${question}"

Cho một gợi ý ngắn bằng tiếng Việt, không tiết lộ đáp án. Tối đa 2 câu.`
  }

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 150,
      temperature: 0.7,
    }),
  })

  if (!res.ok) {
    console.error('Groq hint error:', res.status)
    return NextResponse.json({ error: 'AI unavailable' }, { status: 502 })
  }

  const d = await res.json()
  const hint = d.choices?.[0]?.message?.content?.trim() ?? ''
  return NextResponse.json({ hint })
}
