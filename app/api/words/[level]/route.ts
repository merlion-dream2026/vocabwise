import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { getSession } from '@/lib/auth'
import { getFamilyProfile } from '@/lib/security'
import { getEffectivePlan } from '@/lib/planUtils'

const ALLOWED_LEVELS = new Set(['seeker', 'starter', 'ranger', 'explorer', 'scholar', 'master'])

// Full level file (all topics, full word content) — only used by Level Test, which is
// Pro-only. Topic/revision pages use the slimmer, individually-gated routes instead.
export async function GET(req: NextRequest, { params }: { params: { level: string } }) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!ALLOWED_LEVELS.has(params.level)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (session.familyId !== 'superadmin') {
    const profile = await getFamilyProfile(session.familyId)
    if (!profile) return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    if (!getEffectivePlan(profile).isProActive) {
      return NextResponse.json({ error: 'Pro plan required for Level Test.' }, { status: 403 })
    }
  }

  try {
    const json = await readFile(join(process.cwd(), 'data', 'words', `${params.level}.json`), 'utf-8')
    return new NextResponse(json, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'private, max-age=3600',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
}
