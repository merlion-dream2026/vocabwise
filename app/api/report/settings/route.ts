import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSession } from '@/lib/auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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

  // monthly_recap only allowed for active Pro 6m plans
  const { data: family } = await supabase
    .from('families')
    .select('plan, plan_end_date')
    .eq('id', session.familyId)
    .single()
  const is6m = family?.plan === '6months' && !!family?.plan_end_date && new Date(family.plan_end_date) > new Date()

  const settings: ReportSettings = {
    enabled: !!body.enabled,
    schedule: body.schedule === 'weekly' ? 'weekly' : 'manual',
    day: typeof body.day === 'number' ? Math.min(6, Math.max(0, body.day)) : 1,
    monthly_recap: is6m ? !!body.monthly_recap : false,
  }

  const { error } = await supabase
    .from('families')
    .update({ report_settings: settings })
    .eq('id', session.familyId)

  if (error) return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 })
  return NextResponse.json(settings)
}
