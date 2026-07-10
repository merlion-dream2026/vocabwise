import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSession } from '@/lib/auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export type LeaderboardEntry = {
  rank: number
  childId: string
  name: string
  emoji: string
  totalXP: number
  streak: number
  isCurrentFamily: boolean
}

type SyncRow = {
  child_id: string
  history: Record<string, { xp?: number }> | null
  streak: { current?: number } | null
}

// In-memory cache: 5 minutes
let cache: { at: number; entries: LeaderboardEntry[] } | null = null
const CACHE_TTL = 5 * 60_000

// Other families only see a first-name-style nickname, not the child's full real name.
function maskName(name: string): string {
  const first = name.trim().split(/\s+/)[0]
  return first || name
}

export async function GET(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const now = Date.now()
  if (cache && now - cache.at < CACHE_TTL) {
    // Re-mark current family's children, then mask names for everyone else
    const familyChildIds = await getFamilyChildIds(session.familyId)
    const marked = cache.entries.map(e => {
      const isCurrentFamily = familyChildIds.has(e.childId)
      return { ...e, isCurrentFamily, name: isCurrentFamily ? e.name : maskName(e.name) }
    })
    return NextResponse.json(marked, { headers: { 'Cache-Control': 'private, max-age=60' } })
  }

  // Batch fetch all children + their vocab_sync data
  const { data: children } = await supabase
    .from('children')
    .select('id, name, emoji, family_id')

  if (!children?.length) return NextResponse.json([])

  const childIds = children.map(c => c.id)

  // Fetch vocab_sync (all levels, all children) for XP + streak
  const { data: syncRows } = await supabase
    .from('vocab_sync')
    .select('child_id, history, streak')
    .in('child_id', childIds)

  // Aggregate per child: sum XP across all levels + max streak
  const childXP: Record<string, number> = {}
  const childStreak: Record<string, number> = {}

  for (const row of (syncRows as SyncRow[]) ?? []) {
    const cid = row.child_id
    // Sum XP from all history entries
    for (const hist of Object.values(row.history ?? {})) {
      childXP[cid] = (childXP[cid] ?? 0) + (hist.xp ?? 0)
    }
    // Max streak across all levels
    const cur = row.streak?.current ?? 0
    childStreak[cid] = Math.max(childStreak[cid] ?? 0, cur)
  }

  // Build ranked list (sort by XP desc, then streak desc)
  const ranked = children
    .map(c => ({
      childId: c.id,
      familyId: c.family_id as string,
      name: c.name as string,
      emoji: (c.emoji as string) || '🧒',
      totalXP: childXP[c.id] ?? 0,
      streak: childStreak[c.id] ?? 0,
    }))
    .filter(c => c.totalXP > 0)
    .sort((a, b) => b.totalXP - a.totalXP || b.streak - a.streak)
    .slice(0, 20)
    .map((c, i) => ({
      rank: i + 1,
      childId: c.childId,
      name: c.name,
      emoji: c.emoji,
      totalXP: c.totalXP,
      streak: c.streak,
      isCurrentFamily: false,
    }))

  cache = { at: now, entries: ranked }

  // Mark current family, then mask names for everyone else
  const familyChildIds = await getFamilyChildIds(session.familyId)
  const result = ranked.map(e => {
    const isCurrentFamily = familyChildIds.has(e.childId)
    return { ...e, isCurrentFamily, name: isCurrentFamily ? e.name : maskName(e.name) }
  })

  return NextResponse.json(result, { headers: { 'Cache-Control': 'private, max-age=60' } })
}

async function getFamilyChildIds(familyId: string): Promise<Set<string>> {
  const { data } = await supabase.from('children').select('id').eq('family_id', familyId)
  return new Set((data ?? []).map(c => c.id))
}
