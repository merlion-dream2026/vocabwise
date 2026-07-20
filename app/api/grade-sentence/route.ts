import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { checkAndIncrementSentenceGradingUsage } from '@/lib/rateLimit'
import { aiChat } from '@/lib/aiChat'
import { getFamilyProfile } from '@/lib/security'
import { getEffectivePlan } from '@/lib/planUtils'

type Item = { targetWord: string; exampleVi: string; cefr?: string; sentence: string }
type GradedItem = { score: number; passed: boolean; used_correctly: boolean; grammar_ok: boolean; feedback_vi: string; improved: string }

const MAX_ITEMS = 12

// POST /api/grade-sentence — grades a batch of Vietnamese-cue → English-sentence
// answers in a single AI call. Shared by Module Test's mandatory Production round
// and the optional "Bonus — Viết câu" round (Level Test / revision tests), so the
// prompt and rate limit here are generic, not tied to any one test surface.
export async function POST(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (session.familyId !== 'superadmin') {
    const profile = await getFamilyProfile(session.familyId)
    if (!profile) return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    if (!getEffectivePlan(profile).isProActive) {
      return NextResponse.json({ error: 'Pro plan required.' }, { status: 403 })
    }
  }

  if (!(await checkAndIncrementSentenceGradingUsage(session.familyId))) {
    return NextResponse.json({ error: 'Đã đạt giới hạn chấm câu hôm nay. Vui lòng thử lại vào ngày mai.' }, { status: 429 })
  }

  const body = await req.json().catch(() => ({}))
  const items: Item[] = Array.isArray(body.items) ? body.items : []
  if (!items.length || items.length > MAX_ITEMS) {
    return NextResponse.json({ error: 'Invalid items' }, { status: 400 })
  }
  for (const it of items) {
    if (!it.targetWord || !it.exampleVi) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const cefr = items.find(it => it.cefr)?.cefr ?? 'A1-C2'
  const questionsBlock = items.map((it, i) => `
Câu ${i + 1}:
- Từ mục tiêu: "${it.targetWord}"
- Câu tiếng Việt cần dịch: "${it.exampleVi}"
- Câu học sinh viết: "${it.sentence?.trim() || '(bỏ trống)'}"`).join('\n')

  const prompt = `Bạn là giáo viên chấm bài dịch câu cho học sinh Việt Nam học tiếng Anh (trình độ ${cefr}).
Học sinh dịch từng câu tiếng Việt sang tiếng Anh, bắt buộc dùng đúng từ mục tiêu của câu đó.
${questionsBlock}

Chấm từng câu và trả lời đúng định dạng JSON sau (không thêm text ngoài JSON), mảng "results" phải có đúng ${items.length} phần tử theo đúng thứ tự câu:
{
  "results": [
    { "score": <số nguyên 0-10>, "passed": <true/false>, "used_correctly": <true/false>, "grammar_ok": <true/false>, "feedback_vi": "<1 câu nhận xét ngắn>", "improved": "<câu tiếng Anh đã cải thiện, để trống '' nếu câu bỏ trống hoặc đã tốt>" }
  ]
}
"passed" = true nếu câu diễn đạt đúng ý gốc và có thể hiểu được, dù còn vài lỗi nhỏ (chính tả, giới từ, thì...) — tức là độ chính xác + khả năng hiểu tổng thể đạt khoảng 80% trở lên. "passed" = false nếu sai nghĩa, thiếu từ mục tiêu, hoặc câu khó hiểu.
Nếu câu học sinh viết bị bỏ trống, chấm score=0, passed=false, used_correctly=false, grammar_ok=false, feedback_vi="Chưa trả lời câu này."`

  const maxTokens = Math.min(1800, 150 * items.length + 200)
  const raw = await aiChat({ order: ['cerebras', 'groq'], prompt, maxTokens, temperature: 0.4, json: true })
  if (raw === null) return NextResponse.json({ error: 'AI unavailable' }, { status: 502 })

  try {
    const parsed = JSON.parse(raw)
    const rawResults: unknown[] = Array.isArray(parsed.results) ? parsed.results : []
    const results: GradedItem[] = items.map((_, i) => {
      const r = (rawResults[i] ?? {}) as Record<string, unknown>
      const feedback = String(r.feedback_vi ?? '').trim()
      return {
        score:          Number(r.score ?? 0),
        passed:         !!r.passed,
        used_correctly: !!r.used_correctly,
        grammar_ok:     !!r.grammar_ok,
        feedback_vi:    feedback || 'Không có nhận xét chi tiết — so sánh câu của em với gợi ý bên dưới nhé.',
        improved:       String(r.improved ?? ''),
      }
    })
    return NextResponse.json({ results })
  } catch {
    return NextResponse.json({ error: 'Invalid AI response' }, { status: 502 })
  }
}
