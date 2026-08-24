import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { supabase } from '@/lib/supabaseServer'
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

  const { word, pos, meaning_vi, example_en, mode, topic_id } = await req.json()
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

  const explanation = await aiChat({ order: ['groq', 'cerebras'], prompt, maxTokens: 400, temperature: 0.7 })
  if (explanation === null) return NextResponse.json({ error: 'AI unavailable' }, { status: 502 })

  // Save to DB for future requests — Academic caches onto the specific glossary row
  // (word can repeat across topics/books, so topic_id is required to target the right one)
  if (explanation) {
    if (mode === 'kids') {
      await supabase.from('kids_explanations').upsert({ word: word.toLowerCase(), explanation_vi: explanation })
    } else if (topic_id) {
      await supabase.from('vw_glossary').update({ explanation_vi: explanation }).eq('topic_id', topic_id).eq('word', word)
    }
  }

  return NextResponse.json({ explanation })
}
