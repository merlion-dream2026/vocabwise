import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseServer'
import { getSession } from '@/lib/auth'
import { isMascotCharacter } from '@/lib/mascots'
import { getEffectivePlan, getMaxKids } from '@/lib/planUtils'

// GET /api/children — list children for current family (includes streak data)
export async function GET(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('children')
    .select('id, name, emoji, level, theme, mascot, mascot_intro_seen_at, pin, created_at')
    .eq('family_id', session.familyId)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 })
  if (!data?.length) return NextResponse.json([], { headers: { 'Cache-Control': 'no-store' } })

  // Enrich with streak data from vocab_sync (one query, all levels)
  const childIds = data.map(c => c.id)
  const { data: syncRows } = await supabase
    .from('vocab_sync')
    .select('child_id, streak')
    .in('child_id', childIds)

  // Per child: find max streak.current + its lastActive across all levels
  const streakMap: Record<string, { current: number; lastActive: string }> = {}
  for (const row of syncRows ?? []) {
    const s = row.streak as { current?: number; lastActive?: string } | null
    if (!s) continue
    const cur = s.current ?? 0
    const la  = s.lastActive ?? ''
    const prev = streakMap[row.child_id]
    if (!prev || cur > prev.current || (cur === prev.current && la > prev.lastActive)) {
      streakMap[row.child_id] = { current: cur, lastActive: la }
    }
  }

  const result = data.map(c => ({
    ...c,
    streak: streakMap[c.id] ?? { current: 0, lastActive: '' },
  }))

  return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } })
}

async function getEffectiveMaxKids(familyId: string): Promise<{ maxKids: number; isEffectivelyPro: boolean }> {
  const { data: family } = await supabase
    .from('families')
    .select('plan, plan_end_date, free_trial_expires_at, bonus_pro_expires_at, bonus_features, max_kids')
    .eq('id', familyId).single()
  if (!family) return { maxKids: 0, isEffectivelyPro: false }
  return { maxKids: getMaxKids(family), isEffectivelyPro: getEffectivePlan(family).isProActive }
}

// POST /api/children — add a child
export async function POST(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [{ count }, { maxKids, isEffectivelyPro }] = await Promise.all([
    supabase.from('children').select('id', { count: 'exact', head: true }).eq('family_id', session.familyId),
    getEffectiveMaxKids(session.familyId),
  ])
  if ((count ?? 0) >= maxKids) {
    return NextResponse.json({
      error: `Gói hiện tại cho tối đa ${maxKids} hồ sơ bé.${isEffectivelyPro ? ' Gói 3 tháng: 2 bé · 6 tháng: 3 bé.' : ' Nâng cấp Pro để thêm bé.'}`,
    }, { status: 403 })
  }

  const { name, emoji, level, theme, mascot } = await req.json().catch(() => ({}))
  if (!name || !level) return NextResponse.json({ error: 'Thiếu tên hoặc level' }, { status: 400 })

  const { data, error } = await supabase
    .from('children')
    .insert({ family_id: session.familyId, name: name.trim(), emoji: emoji || '🧒', level, theme: theme || 'pink', mascot: isMascotCharacter(mascot) ? mascot : null })
    .select('id, name, emoji, level, theme, mascot, mascot_intro_seen_at, pin, created_at')
    .single()

  if (error) return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
