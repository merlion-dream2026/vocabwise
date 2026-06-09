import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSession, hashPassword } from '@/lib/auth'
import { sendEmail } from '@/lib/email'
import { welcomeEmailHtml, proActivatedEmailHtml } from '@/lib/emailTemplates'
import { logAudit } from '@/lib/auditLog'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function requireSuperAdmin(req: NextRequest) {
  const session = await getSession(req)
  return session?.familyId === 'superadmin'
}

// GET /api/superadmin/families — list all families
export async function GET(req: NextRequest) {
  if (!await requireSuperAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('families')
    .select('id, username, email, name, phone, referral_source, plan, plan_start_date, plan_end_date, free_trial_expires_at, disabled, created_at, max_kids, email_verified, admin_note')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 })

  // Merge last active dates from vocab_sync (graceful if RPC not yet created)
  let lastActiveMap: Record<string, string> = {}
  try {
    const { data: lastActive } = await supabase.rpc('get_family_last_active')
    if (lastActive) {
      for (const row of lastActive as { family_id: string; last_active: string }[]) {
        lastActiveMap[row.family_id] = row.last_active
      }
    }
  } catch { /* RPC not yet migrated */ }

  // Count actual children per family
  const childrenCountMap: Record<string, number> = {}
  try {
    const { data: childRows } = await supabase.from('children').select('family_id')
    for (const row of childRows ?? []) {
      childrenCountMap[row.family_id] = (childrenCountMap[row.family_id] ?? 0) + 1
    }
  } catch { /* graceful */ }

  return NextResponse.json((data ?? []).map(f => ({
    ...f,
    last_active: lastActiveMap[f.id] ?? null,
    children_count: childrenCountMap[f.id] ?? 0,
  })))
}

// POST /api/superadmin/families — create a new family account
export async function POST(req: NextRequest) {
  if (!await requireSuperAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { username, password, email, name, plan, plan_start_date, plan_end_date } = await req.json().catch(() => ({}))
  if (!username || !password) return NextResponse.json({ error: 'Thiếu username hoặc password' }, { status: 400 })

  const password_hash = await hashPassword(password)
  const effectivePlan = plan || 'free'

  const insert: Record<string, unknown> = {
    username: username.trim().toLowerCase(),
    password_hash,
    email: email || null,
    name: name || null,
    plan: effectivePlan,
    email_verified: true,
  }

  if (plan_start_date) insert.plan_start_date = plan_start_date
  if (plan_end_date) insert.plan_end_date = plan_end_date
  if (effectivePlan === 'free') {
    insert.free_trial_expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  }

  const { data, error } = await supabase
    .from('families')
    .insert(insert)
    .select('id, username, email, name, phone, referral_source, plan, plan_start_date, plan_end_date, free_trial_expires_at, disabled, created_at, max_kids, email_verified, admin_note')
    .single()

  if (error) return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 })

  const PLAN_LABELS: Record<string, string> = { '1month': '1 tháng', '3months': '3 tháng', '6months': '6 tháng' }

  if (data.email) {
    const displayName = data.name || data.username
    if (effectivePlan === 'free') {
      sendEmail({
        to: data.email,
        subject: 'Chào mừng bạn đến với VocabKids Pro! 🎉',
        html: welcomeEmailHtml(displayName, password),
      }).catch(err => console.error('[superadmin/create] welcome email error:', err))
    } else if (PLAN_LABELS[effectivePlan]) {
      const endDate = data.plan_end_date
        ? new Date(data.plan_end_date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
        : '—'
      sendEmail({
        to: data.email,
        subject: '⭐ Tài khoản Pro đã được kích hoạt — Bắt đầu ngay!',
        html: proActivatedEmailHtml(displayName, PLAN_LABELS[effectivePlan], endDate, password),
      }).catch(err => console.error('[superadmin/create] pro email error:', err))
    }
  }

  logAudit('create_family', data.id, data.username, { plan: effectivePlan, email: data.email || null })

  return NextResponse.json(data, { status: 201 })
}
