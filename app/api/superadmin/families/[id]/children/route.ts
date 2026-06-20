import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAdminSession } from '@/lib/auth'

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
  const { data: syncs } = await supabase
    .from('vocab_sync')
    .select('child_id, level, seen, mastery, updated_at')
    .in('child_id', childIds)

  const syncMap: Record<string, { wordCount: number; phonicsCount: number; topicsCount: number; lastActive: string | null }> = {}

  for (const s of syncs ?? []) {
    const entry = syncMap[s.child_id] ?? { wordCount: 0, phonicsCount: 0, topicsCount: 0, lastActive: null }

    if (s.level === 'phonics') {
      // phonicsCount = number of sound pairs with at least flashcard done
      const mastery = s.mastery as Record<string, { flashcard?: boolean }> | null
      if (mastery) {
        entry.phonicsCount += Object.values(mastery).filter(p => p?.flashcard).length
      }
    } else {
      // wordCount = total words seen across all vocab levels
      const seen = s.seen as string[] | null
      entry.wordCount += seen?.length ?? 0

      // topicsCount = topics with mastery progress
      const mastery = s.mastery as Record<string, unknown> | null
      if (mastery) entry.topicsCount += Object.keys(mastery).length
    }

    if (!entry.lastActive || s.updated_at > entry.lastActive) entry.lastActive = s.updated_at
    syncMap[s.child_id] = entry
  }

  return NextResponse.json(children.map(c => ({
    ...c,
    word_count:    syncMap[c.id]?.wordCount    ?? 0,
    phonics_count: syncMap[c.id]?.phonicsCount ?? 0,
    topics_count:  syncMap[c.id]?.topicsCount  ?? 0,
    last_active:   syncMap[c.id]?.lastActive   ?? null,
  })))
}
