import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSession } from '@/lib/auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/children — list children for current family (includes streak data)
export async function GET(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('children')
    .select('id, name, emoji, level, theme, pin, created_at')
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

async function getEffectiveMaxKids(familyId: string, plan: string): Promise<{ maxKids: number; isEffectivelyPro: boolean }> {
  const [{ data: family }, { data: configs }] = await Promise.all([
    supabase.from('families').select('max_kids, bonus_pro_expires_at').eq('id', familyId).single(),
    supabase.from('admin_config').select('key, value'),
  ])
  const configMap: Record<string, number> = {}
  for (const row of configs ?? []) configMap[row.key] = parseInt(row.value)
  const isBonusProActive = !!family?.bonus_pro_expires_at && new Date(family.bonus_pro_expires_at) > new Date()
  const isEffectivelyPro = plan !== 'free' || isBonusProActive
  const globalDefault = isEffectivelyPro ? (configMap.pro_max_kids ?? 3) : (configMap.free_max_kids ?? 1)
  return { maxKids: family?.max_kids ?? globalDefault, isEffectivelyPro }
}

// POST /api/children — add a child
export async function POST(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [{ count }, { maxKids, isEffectivelyPro }] = await Promise.all([
    supabase.from('children').select('id', { count: 'exact', head: true }).eq('family_id', session.familyId),
    getEffectiveMaxKids(session.familyId, session.plan),
  ])
  if ((count ?? 0) >= maxKids) {
    return NextResponse.json({
      error: `Tài khoản ${isEffectivelyPro ? 'Pro' : 'Free'} chỉ được tối đa ${maxKids} hồ sơ bé.${!isEffectivelyPro ? ' Nâng cấp để thêm thêm bé.' : ''}`,
    }, { status: 403 })
  }

  const { name, emoji, level, theme } = await req.json().catch(() => ({}))
  if (!name || !level) return NextResponse.json({ error: 'Thiếu tên hoặc level' }, { status: 400 })

  const { data, error } = await supabase
    .from('children')
    .insert({ family_id: session.familyId, name: name.trim(), emoji: emoji || '🧒', level, theme: theme || 'pink' })
    .select('id, name, emoji, level, theme, pin, created_at')
    .single()

  if (error) return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
