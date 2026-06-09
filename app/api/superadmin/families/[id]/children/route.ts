import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSession } from '@/lib/auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function requireSuperAdmin(req: NextRequest) {
  const session = await getSession(req)
  return session?.familyId === 'superadmin'
}

// GET /api/superadmin/families/[id]/children
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  if (!await requireSuperAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: children } = await supabase
    .from('children')
    .select('id, name, avatar, color, level, created_at')
    .eq('family_id', params.id)
    .order('created_at')

  if (!children || children.length === 0) return NextResponse.json([])

  const childIds = children.map(c => c.id)
  const { data: syncs } = await supabase
    .from('vocab_sync')
    .select('child_id, level, data, updated_at')
    .in('child_id', childIds)

  const MASTERY_GAMES = ['minimal-pairs', 'listen-pick', 'speak']
  const syncMap: Record<string, { wordCount: number; phonicsCount: number; lastActive: string | null }> = {}

  for (const s of syncs ?? []) {
    const entry = syncMap[s.child_id] ?? { wordCount: 0, phonicsCount: 0, lastActive: null }

    if (s.level === 'phonics') {
      const mastery = (s.data as Record<string, unknown>)?.mastery
      if (mastery && typeof mastery === 'object') {
        for (const pair of Object.values(mastery as Record<string, unknown>)) {
          if (pair && typeof pair === 'object') {
            const p = pair as { flashcard?: boolean; games?: string[] }
            if (p.flashcard && MASTERY_GAMES.every(g => p.games?.includes(g))) {
              entry.phonicsCount++
            }
          }
        }
      }
    } else {
      if (s.data && typeof s.data === 'object') {
        for (const level of Object.values(s.data as Record<string, unknown>)) {
          if (level && typeof level === 'object') {
            for (const topic of Object.values(level as Record<string, unknown>)) {
              if (topic && typeof topic === 'object') {
                const words = (topic as Record<string, unknown>).words
                if (Array.isArray(words)) {
                  entry.wordCount += words.filter((w: unknown) =>
                    w && typeof w === 'object' && (w as Record<string, unknown>).mastered
                  ).length
                }
              }
            }
          }
        }
      }
      if (!entry.lastActive || s.updated_at > entry.lastActive) entry.lastActive = s.updated_at
    }

    syncMap[s.child_id] = entry
  }

  return NextResponse.json(children.map(c => ({
    ...c,
    word_count:    syncMap[c.id]?.wordCount    ?? 0,
    phonics_count: syncMap[c.id]?.phonicsCount ?? 0,
    last_active:   syncMap[c.id]?.lastActive   ?? null,
  })))
}
