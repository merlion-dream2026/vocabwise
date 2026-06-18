import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAdminSession } from '@/lib/auth'
import { logAudit } from '@/lib/auditLog'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function requireSuperAdmin(req: NextRequest) {
  const session = await getAdminSession(req)
  return session?.familyId === 'superadmin'
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

// POST /api/superadmin/families/bulk
// { action: 'disable' | 'enable' | 'extend', ids: string[], days?: number }
export async function POST(req: NextRequest) {
  if (!await requireSuperAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { action, ids, days } = await req.json().catch(() => ({}))
  if (!action || !Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'Thiếu action hoặc ids' }, { status: 400 })
  }

  if (action === 'disable' || action === 'enable') {
    const { error } = await supabase
      .from('families')
      .update({ disabled: action === 'disable' })
      .in('id', ids)
    if (error) return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 })
    ids.forEach(id => logAudit('update_family', id, id, { bulk_action: action }))
    return NextResponse.json({ ok: true, count: ids.length })
  }

  if (action === 'extend') {
    if (!days || typeof days !== 'number') return NextResponse.json({ error: 'Thiếu days' }, { status: 400 })
    const { data: fams } = await supabase
      .from('families')
      .select('id, username, plan, plan_end_date, free_trial_expires_at, plan_start_date')
      .in('id', ids)
    if (!fams) return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 })

    const today = new Date().toISOString().split('T')[0]
    const updates = fams.map(f => {
      const base = (f.plan !== 'free' ? f.plan_end_date : f.free_trial_expires_at) ?? today
      const newDate = addDays(base, days)
      return f.plan !== 'free'
        ? { id: f.id, plan_end_date: newDate }
        : { id: f.id, free_trial_expires_at: newDate }
    })

    await Promise.all(updates.map(u => {
      const { id, ...patch } = u
      return supabase.from('families').update(patch).eq('id', id)
    }))
    fams.forEach(f => logAudit('update_family', f.id, f.username, { bulk_action: 'extend', days }))
    return NextResponse.json({ ok: true, count: ids.length })
  }

  return NextResponse.json({ error: 'Action không hợp lệ' }, { status: 400 })
}
