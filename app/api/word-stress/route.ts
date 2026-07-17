import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getFamilyProfile } from '@/lib/security'
import { canAccessWordStress } from '@/lib/planUtils'
import wordStressData from '@/data/wordStress.json'

export async function GET(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (session.familyId !== 'superadmin') {
    const profile = await getFamilyProfile(session.familyId)
    if (!profile) return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    if (!canAccessWordStress(profile)) {
      return NextResponse.json({ error: 'Upgrade to Pro 3 months+ to access Word Stress.' }, { status: 403 })
    }
  }

  return NextResponse.json({ groups: wordStressData.groups }, { headers: { 'Cache-Control': 'private, max-age=300' } })
}
