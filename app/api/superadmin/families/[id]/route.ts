import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAdminSession, hashPassword } from '@/lib/auth'

function generateGiftToken(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}
import { sendEmail } from '@/lib/email'
import { proActivatedEmailHtml } from '@/lib/emailTemplates'
import { triggerPaidReward } from '@/lib/referralUtils'
import { logAudit } from '@/lib/auditLog'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function requireSuperAdmin(req: NextRequest) {
  const session = await getAdminSession(req)
  return session?.familyId === 'superadmin'
}

// PATCH /api/superadmin/families/[id] — update username, plan, disabled, email, password
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!await requireSuperAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const updates: Record<string, unknown> = {}

  if (body.username) updates.username = body.username.trim().toLowerCase()
  if (body.plan !== undefined) updates.plan = body.plan
  if (body.disabled !== undefined) updates.disabled = body.disabled
  if (body.email !== undefined) updates.email = body.email || null
  if ('plan_start_date' in body) updates.plan_start_date = body.plan_start_date || null
  if ('plan_end_date' in body) updates.plan_end_date = body.plan_end_date || null
  if ('free_trial_expires_at' in body) updates.free_trial_expires_at = body.free_trial_expires_at || null
  if ('admin_note' in body) updates.admin_note = body.admin_note || null
  if ('max_kids' in body) updates.max_kids = body.max_kids === null || body.max_kids === '' ? null : parseInt(body.max_kids)
  if ('email_verified' in body) updates.email_verified = body.email_verified

  if (body.password) {
    updates.password_hash = await hashPassword(body.password)
  }

  // Auto-generate gift_token when activating a 6m plan (one-time, never overwrite existing)
  if (body.plan === '6months') {
    const { data: cur } = await supabase
      .from('families')
      .select('gift_token')
      .eq('id', params.id)
      .single()
    if (!cur?.gift_token) updates.gift_token = generateGiftToken()
  }

  const { data, error } = await supabase
    .from('families')
    .update(updates)
    .eq('id', params.id)
    .select('id, username, email, name, phone, referral_source, plan, plan_start_date, plan_end_date, free_trial_expires_at, disabled, created_at, max_kids, email_verified, admin_note')
    .single()

  if (error) return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 })

  // Send Pro activation email when plan changes to a paid plan
  const PLAN_LABELS: Record<string, string> = { '1month': '1 tháng', '3months': '3 tháng', '6months': '6 tháng' }
  const newPlan = body.plan
  if (newPlan && PLAN_LABELS[newPlan]) {
    if (data.email) {
      const endDate = data.plan_end_date
        ? new Date(data.plan_end_date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
        : '—'
      sendEmail({
        to: data.email,
        subject: '⭐ Tài khoản Pro đã được kích hoạt — Bắt đầu ngay!',
        html: proActivatedEmailHtml(data.name || data.username, PLAN_LABELS[newPlan], endDate),
      }).catch(err => console.error('[superadmin] pro email error:', err))
    }

    // 2C: Trigger paid referral reward cho referrer (nếu family này được giới thiệu)
    // Fire-and-forget — không block admin response
    triggerPaidReward(params.id).catch(err =>
      console.error('[superadmin] referral paid reward error:', err)
    )
  }

  const changedFields = Object.keys(updates).filter(k => k !== 'password_hash')
  logAudit('update_family', params.id, data.username, { changed: changedFields, plan: data.plan })

  return NextResponse.json(data)
}

// DELETE /api/superadmin/families/[id] — delete family + all children + sync data
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!await requireSuperAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: toDelete } = await supabase.from('families').select('username').eq('id', params.id).single()
  logAudit('delete_family', params.id, toDelete?.username ?? params.id, {})

  // Get child IDs first to cascade-delete vocab_sync
  const { data: children } = await supabase
    .from('children')
    .select('id')
    .eq('family_id', params.id)

  if (children && children.length > 0) {
    const childIds = children.map((c: { id: string }) => c.id)
    await supabase.from('vocab_sync').delete().in('child_id', childIds)
    await supabase.from('children').delete().eq('family_id', params.id)
  }

  const { error } = await supabase.from('families').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
