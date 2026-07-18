import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAdminSession } from '@/lib/auth'
import {
  getXPAndBadge, getPhonicsProgress, getAllDailyProgress, getAllAcademicProgress,
  type SyncAllLevels,
} from '@/lib/childProgress'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function requireSuperAdmin(req: NextRequest) {
  const session = await getAdminSession(req)
  return session?.familyId === 'superadmin'
}

// GET /api/superadmin/families/[id]/children
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  if (!await requireSuperAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: children } = await supabase
    .from('children')
    .select('id, name, emoji, level, created_at')
    .eq('family_id', params.id)
    .order('created_at')

  if (!children || children.length === 0) return NextResponse.json([])

  const childIds = children.map(c => c.id)

  // Same columns as /api/sync/[childId] — guarantees consistent computation
  const { data: syncs } = await supabase
    .from('vocab_sync')
    .select('child_id, level, seen, mastery, history, streak, updated_at')
    .in('child_id', childIds)

  // Academic progress lives in vw_academic_sync, keyed by family (shared across all
  // children) — not per-child vocab_sync, which no longer receives level='academic' rows.
  const { data: academicSync } = await supabase
    .from('vw_academic_sync')
    .select('mastery, history')
    .eq('family_id', params.id)
    .single()

  // Shape into SyncAllLevels per child (same format kids page receives)
  const syncByChild: Record<string, SyncAllLevels> = {}
  const lastActiveByChild: Record<string, string> = {}
  const streakByChild: Record<string, { current: number; lastActive: string }> = {}

  for (const row of syncs ?? []) {
    const { child_id, level, seen, mastery, history, streak, updated_at } = row

    if (!syncByChild[child_id]) syncByChild[child_id] = {}
    syncByChild[child_id][level] = { seen, mastery, history }

    // last active: max updated_at across all levels
    if (!lastActiveByChild[child_id] || updated_at > lastActiveByChild[child_id]) {
      lastActiveByChild[child_id] = updated_at
    }

    // streak: same logic as /api/children — max current across all levels
    const s = streak as { current?: number; lastActive?: string } | null
    const cur = s?.current ?? 0
    const la  = s?.lastActive ?? ''
    const prev = streakByChild[child_id]
    if (!prev || cur > prev.current) {
      streakByChild[child_id] = { current: cur, lastActive: la }
    }
  }

  return NextResponse.json(children.map(c => {
    const sync    = syncByChild[c.id] ?? {}
    const { totalXP, badge } = getXPAndBadge(sync)
    const phonics            = getPhonicsProgress(sync['phonics'])
    const daily              = getAllDailyProgress(sync)
    const academic           = getAllAcademicProgress(academicSync ?? undefined)
    const streak             = streakByChild[c.id] ?? { current: 0, lastActive: '' }

    return {
      ...c,
      // raw counts (kept for back-compat)
      word_count:    daily.seenWords,
      phonics_count: phonics.seen,
      topics_count:  daily.topicsCompleted,
      last_active:   lastActiveByChild[c.id] ?? null,
      // rich stats
      total_xp:           totalXP,
      badge_icon:          badge?.icon  ?? null,
      badge_label:         badge?.label ?? null,
      badge_cls:           badge?.cls   ?? null,
      streak_current:      streak.current,
      streak_last_active:  streak.lastActive,
      phonics_seen:        phonics.seen,
      phonics_mastered:    phonics.mastered,
      phonics_total:       phonics.total,
      daily_words:         daily.seenWords,
      daily_words_total:   daily.totalWords,
      daily_topics:        daily.topicsCompleted,
      daily_topics_total:  daily.totalTopics,
      academic_completed:  academic.completed,
      academic_total:      academic.total,
    }
  }))
}
