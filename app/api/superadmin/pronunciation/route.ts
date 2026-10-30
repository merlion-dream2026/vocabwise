import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseServer'
import { isAdminRequest, serverError } from '@/lib/api'
import { getPronunciationBars, savePronunciationBars } from '@/lib/pronunciationBars'
import { BAR_GROUPS, DEFAULT_BARS } from '@/lib/pronunciationScore'

const DAYS = 30

// Superadmin → Cài đặt → Ngưỡng phát âm: current bars + last-30-day pass/dispute rates per group
// (pronunciation_log, Azure-scored attempts only) + the latest disputes to listen for patterns.
export async function GET(req: NextRequest) {
  if (!await isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const since = new Date(Date.now() - DAYS * 86_400_000).toISOString()
  const count = async (grp: string, filter?: 'ok' | 'disputed') => {
    let q = supabase.from('pronunciation_log').select('id', { count: 'exact', head: true }).eq('grp', grp).gte('created_at', since)
    if (filter === 'ok') q = q.eq('ok', true)
    if (filter === 'disputed') q = q.not('disputed_at', 'is', null)
    const { count } = await q
    return count ?? 0
  }
  try {
    const [bars, stats, disputes] = await Promise.all([
      getPronunciationBars(),
      Promise.all(BAR_GROUPS.map(async g => {
        const [total, ok, disputed] = await Promise.all([count(g), count(g, 'ok'), count(g, 'disputed')])
        return { grp: g, total, ok, disputed }
      })),
      supabase.from('pronunciation_log')
        .select('id, source, level, grp, target, pron_score, completeness, detail, disputed_at')
        .not('disputed_at', 'is', null).order('disputed_at', { ascending: false }).limit(20)
        .then(r => r.data ?? []),
    ])
    return NextResponse.json({ bars, defaults: DEFAULT_BARS, days: DAYS, stats, disputes })
  } catch (e) {
    return serverError(e)
  }
}

export async function PATCH(req: NextRequest) {
  if (!await isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => null)
  if (!body?.bars) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  try {
    return NextResponse.json({ bars: await savePronunciationBars(body.bars) })
  } catch (e) {
    return serverError(e)
  }
}
