import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSession } from '@/lib/auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function ownedByFamily(childId: string, familyId: string) {
  const { data } = await supabase
    .from('children')
    .select('id')
    .eq('id', childId)
    .eq('family_id', familyId)
    .single()
  return !!data
}

// PATCH /api/children/[id] — edit name, emoji, level
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!await ownedByFamily(params.id, session.familyId)) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { name, emoji, level, theme } = await req.json().catch(() => ({}))
  const updates: Record<string, unknown> = {}
  if (name) updates.name = name.trim()
  if (emoji) updates.emoji = emoji
  if (level) updates.level = level
  if (theme) updates.theme = theme

  const { data, error } = await supabase
    .from('children')
    .update(updates)
    .eq('id', params.id)
    .select('id, name, emoji, level, theme, pin, created_at')
    .single()

  if (error) return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE /api/children/[id]
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!await ownedByFamily(params.id, session.familyId)) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { error } = await supabase.from('children').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
