import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseServer'
import { getSession } from '@/lib/auth'
import { getEffectivePlan } from '@/lib/planUtils'

export type ReportSettings = {
  enabled: boolean
  schedule: 'manual' | 'weekly'
  day: number          // 0=CN, 1=T2, ..., 6=T7
  monthly_recap: boolean  // Pro 6m only
}

const DEFAULT_SETTINGS: ReportSettings = { enabled: false, schedule: 'manual', day: 1, monthly_recap: false }

export async function GET(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('families')
    .select('report_settings')
    .eq('id', session.familyId)
    .single()

  return NextResponse.json(data?.report_settings ?? DEFAULT_SETTINGS)
}

export async function PUT(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))

  // Weekly report + monthly recap: any active Pro (paid or bonus days), checked fresh from DB.
  const { data: family } = await supabase
    .from('families')
    .select('plan, plan_end_date, free_trial_expires_at, bonus_pro_expires_at, bonus_features')
    .eq('id', session.familyId)
    .single()
  const isPro = !!family && getEffectivePlan(family).isProActive

  const settings: ReportSettings = {
    enabled: isPro && !!body.enabled,
    schedule: isPro && body.schedule === 'weekly' ? 'weekly' : 'manual',
    day: typeof body.day === 'number' ? Math.min(6, Math.max(0, body.day)) : 1,
    monthly_recap: isPro ? !!body.monthly_recap : false,
  }

  const { error } = await supabase
    .from('families')
    .update({ report_settings: settings })
    .eq('id', session.familyId)

  if (error) return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 })
  return NextResponse.json(settings)
}
