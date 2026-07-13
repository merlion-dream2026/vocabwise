import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { checkAndIncrementWritingCheckUsage } from '@/lib/rateLimit'
import { aiChat } from '@/lib/aiChat'

export async function POST(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!(await checkAndIncrementWritingCheckUsage(session.familyId))) {
    return NextResponse.json({ error: 'Đã đạt giới hạn chấm bài viết hôm nay (40 bài/ngày). Vui lòng thử lại vào ngày mai.' }, { status: 429 })
  }

  const { targetWord, sentence, cefr } = await req.json()
  if (!targetWord || !sentence) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

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

  const raw = await aiChat({ order: ['cerebras', 'groq'], prompt, maxTokens: 300, temperature: 0.4, json: true })
  if (raw === null) return NextResponse.json({ error: 'AI unavailable' }, { status: 502 })

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
