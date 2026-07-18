import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { supabase } from '@/lib/supabaseServer'
import { DAILY_LEVEL_ORDER } from '@/lib/childProgress'
import seekerWords from '@/data/words/seeker.json'
import starterWords from '@/data/words/starter.json'
import rangerWords from '@/data/words/ranger.json'
import explorerWords from '@/data/words/explorer.json'
import scholarWords from '@/data/words/scholar.json'
import masterWords from '@/data/words/master.json'

// Name-only index (id → tên tiếng Việt) cho Daily (theo level) và Academic —
// dùng bởi LearningHistoryPanel để hiển thị đúng tên chủ đề thay vì chỉ đếm số lượng.
// Không kèm từ vựng/nội dung game nên không cần gate theo plan, chỉ cần đăng nhập.

type DailyLevelFile = { topics: { id: string; name: string }[] }

const LEVEL_FILES: Record<string, DailyLevelFile> = {
  seeker: seekerWords, starter: starterWords, ranger: rangerWords,
  explorer: explorerWords, scholar: scholarWords, master: masterWords,
}

export async function GET(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const daily: Record<string, Record<string, string>> = {}
  for (const level of DAILY_LEVEL_ORDER) {
    daily[level] = Object.fromEntries(LEVEL_FILES[level].topics.map(t => [t.id, t.name]))
  }

  const { data } = await supabase.from('vw_topics').select('topic_id, topic_title_vi')
  const academic: Record<string, string> = {}
  for (const row of data ?? []) {
    if (row.topic_title_vi) academic[row.topic_id] = row.topic_title_vi
  }

  return NextResponse.json({ daily, academic }, { headers: { 'Cache-Control': 'private, max-age=3600' } })
}
