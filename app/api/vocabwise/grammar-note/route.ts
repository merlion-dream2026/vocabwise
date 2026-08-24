import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getFamilyProfile } from '@/lib/security'
import { getAITextLimit } from '@/lib/planUtils'
import { checkAndIncrementAITextUsage } from '@/lib/rateLimit'
import { aiChat } from '@/lib/aiChat'

export async function POST(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (session.familyId !== 'superadmin') {
    const profile = await getFamilyProfile(session.familyId)
    const aiLimit = profile ? getAITextLimit(profile) : 0
    if (aiLimit !== null && !(await checkAndIncrementAITextUsage(session.familyId, aiLimit))) {
      return NextResponse.json({ error: 'Đã đạt giới hạn dùng AI hôm nay. Vui lòng thử lại vào ngày mai.' }, { status: 429 })
    }
  }

  const { sentence, cefr } = await req.json()
  if (!sentence) return NextResponse.json({ error: 'Missing sentence' }, { status: 400 })

  const prompt = `Bạn là giáo viên IELTS. Phân tích câu sau cho học sinh Việt Nam học tiếng Anh (trình độ ${cefr ?? 'B1-C1'}):

"${sentence}"

Giải thích ngắn gọn bằng tiếng Việt:
- Thì động từ / cấu trúc ngữ pháp chính
- Loại mệnh đề (nếu phức tạp)
- Collocations hoặc cụm từ đáng chú ý (nếu có)

Tối đa 3 điểm, mỗi điểm 1–2 câu ngắn. Không lặp lại câu gốc.`

  const note = await aiChat({ order: ['groq', 'cerebras'], prompt, maxTokens: 200, temperature: 0.5 })
  if (note === null) return NextResponse.json({ error: 'AI unavailable' }, { status: 502 })
  return NextResponse.json({ note })
}
