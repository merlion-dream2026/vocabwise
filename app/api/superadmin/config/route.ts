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

export async function GET(req: NextRequest) {
  if (!await requireSuperAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase.from('admin_config').select('key, value')
  const configMap: Record<string, string> = {}
  for (const row of data ?? []) configMap[row.key] = row.value

  return NextResponse.json({
    free_max_kids: parseInt(configMap.free_max_kids ?? '1'),
    pro_max_kids: parseInt(configMap.pro_max_kids ?? '3'),
  })
}

export async function PATCH(req: NextRequest) {
  if (!await requireSuperAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const updates: { key: string; value: string }[] = []

  if (typeof body.free_max_kids === 'number') updates.push({ key: 'free_max_kids', value: String(body.free_max_kids) })
  if (typeof body.pro_max_kids === 'number') updates.push({ key: 'pro_max_kids', value: String(body.pro_max_kids) })

  if (updates.length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })

  for (const u of updates) {
    await supabase.from('admin_config').upsert(u, { onConflict: 'key' })
  }

  return NextResponse.json({ ok: true })
}
