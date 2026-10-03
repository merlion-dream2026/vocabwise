import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getFamilyProfile } from '@/lib/security'
import { getAITextLimit } from '@/lib/planUtils'
import { checkAndIncrementAITextUsage } from '@/lib/rateLimit'
import { aiChat } from '@/lib/aiChat'

// Daily's "✍️ Đặt câu cùng AI" game — grades a learner's own free-form sentence for a
// target word. Shares the AI text-helper quota pool with explain/hint/grammar-note
// (getAITextLimit), not the Academic writing-check pool — this is the same kind of
// per-word AI call as "Giải nghĩa", just graded instead of explained.
export async function POST(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { word, meaning, sentence } = await req.json()
  if (!word || !sentence) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  if (session.familyId !== 'superadmin') {
    const profile = await getFamilyProfile(session.familyId)
    const aiLimit = profile ? getAITextLimit(profile) : 0
    if (aiLimit !== null && !(await checkAndIncrementAITextUsage(session.familyId, aiLimit))) {
      return NextResponse.json({ error: 'Đã đạt giới hạn dùng AI hôm nay. Vui lòng thử lại vào ngày mai.' }, { status: 429 })
    }
  }

  const prompt = `Bạn là trợ lý thân thiện giúp học sinh Việt Nam học tiếng Anh.
Một bạn học sinh vừa tự đặt 1 câu tiếng Anh có dùng từ "${word}" (nghĩa: ${meaning}).

Câu học sinh viết: "${sentence}"

Hãy đánh giá và trả lời theo ĐÚNG format JSON sau (không thêm text ngoài JSON):
{
  "used_correctly": <true/false — từ "${word}" có được dùng đúng nghĩa và đúng ngữ cảnh không (chấp nhận các dạng biến đổi của từ, ví dụ số nhiều, thì động từ)>,
  "grammar_ok": <true/false — câu có đúng ngữ pháp cơ bản không>,
  "feedback_vi": "<1-2 câu nhận xét ngắn gọn, tích cực, bằng tiếng Việt — khen điểm tốt, nhẹ nhàng chỉ ra điều cần sửa nếu có>",
  "improved": "<nếu câu cần sửa, viết lại câu đã cải thiện, giữ ý gốc. Để trống '' nếu câu đã tốt>"
}

Giữ giọng văn khích lệ, phù hợp học sinh nhỏ tuổi. Chỉ trả JSON, không thêm chữ nào khác.`

  const raw = await aiChat({ order: ['groq', 'cerebras'], prompt, maxTokens: 300, temperature: 0.4, json: true })
  if (raw === null) return NextResponse.json({ error: 'AI unavailable' }, { status: 502 })

  try {
    const result = JSON.parse(raw)
    return NextResponse.json({
      used_correctly: !!result.used_correctly,
      grammar_ok: !!result.grammar_ok,
      feedback_vi: String(result.feedback_vi ?? ''),
      improved: String(result.improved ?? ''),
    })
  } catch {
    return NextResponse.json({ error: 'Invalid AI response' }, { status: 502 })
  }
}
