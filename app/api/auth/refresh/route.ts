import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSession, createSession, sessionCookieOptions, clearSessionCookie } from '@/lib/auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Re-reads plan + disabled from DB, re-issues JWT if changed.
export async function POST() {
  const session = await getSession()
  if (!session) return NextResponse.json(null)

  const [{ data: family }, { data: configs }] = await Promise.all([
    supabase
      .from('families')
      .select('username, plan, disabled, free_trial_expires_at, plan_end_date, plan_start_date, max_kids, bonus_pro_expires_at')
      .eq('id', session.familyId)
      .single(),
    supabase.from('admin_config').select('key, value'),
  ])

  if (!family) return NextResponse.json(null)

  if (family.disabled) {
    const res = NextResponse.json({ error: 'locked' }, { status: 403 })
    res.cookies.set(clearSessionCookie())
    return res
  }

  const configMap: Record<string, number> = {}
  for (const row of configs ?? []) configMap[row.key] = parseInt(row.value)
  const globalDefault = family.plan === 'free' ? (configMap.free_max_kids ?? 1) : (configMap.pro_max_kids ?? 3)

  const payload = {
    familyId: session.familyId,
    username: family.username,
    plan: family.plan,
    free_trial_expires_at: family.free_trial_expires_at ?? null,
    plan_end_date: family.plan_end_date ?? null,
    plan_start_date: family.plan_start_date ?? null,
    bonus_pro_expires_at: family.bonus_pro_expires_at ?? null,
    max_kids: family.max_kids ?? globalDefault,
  }

  // If plan changed, issue new JWT
  if (family.plan !== session.plan || family.username !== session.username) {
    const token = await createSession({
      familyId: session.familyId,
      username: family.username,
      plan: family.plan,
    })
    const res = NextResponse.json(payload)
    res.cookies.set(sessionCookieOptions(token))
    return res
  }

  return NextResponse.json(payload)
}
