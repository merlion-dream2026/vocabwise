import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseServer'
import { getSession, createSession, sessionCookieOptions, clearSessionCookie } from '@/lib/auth'
import { getMaxKids } from '@/lib/planUtils'

// Re-reads plan + disabled from DB, re-issues JWT if changed.
export async function POST() {
  const session = await getSession()
  if (!session) return NextResponse.json(null)

  const { data: family } = await supabase
    .from('families')
    .select('username, plan, disabled, free_trial_expires_at, plan_end_date, plan_start_date, max_kids, bonus_pro_expires_at, session_version')
    .eq('id', session.familyId)
    .single()

  if (!family) return NextResponse.json(null)

  if (family.disabled) {
    const res = NextResponse.json({ error: 'locked' }, { status: 403 })
    res.cookies.set(clearSessionCookie())
    return res
  }


  const payload = {
    familyId: session.familyId,
    username: family.username,
    plan: family.plan,
    free_trial_expires_at: family.free_trial_expires_at ?? null,
    plan_end_date: family.plan_end_date ?? null,
    plan_start_date: family.plan_start_date ?? null,
    bonus_pro_expires_at: family.bonus_pro_expires_at ?? null,
    max_kids: getMaxKids(family),
  }

  // If plan changed, issue new JWT
  if (family.plan !== session.plan || family.username !== session.username) {
    const token = await createSession({
      familyId: session.familyId,
      username: family.username,
      plan: family.plan,
      sv: family.session_version ?? 0,
    })
    const res = NextResponse.json(payload)
    res.cookies.set(sessionCookieOptions(token))
    return res
  }

  return NextResponse.json(payload)
}
