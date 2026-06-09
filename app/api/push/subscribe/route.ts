/**
 * SQL to run in Supabase before using this route:
 *
 * CREATE TABLE push_subscriptions (
 *   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
 *   family_id uuid REFERENCES families(id) ON DELETE CASCADE,
 *   subscription jsonb NOT NULL,
 *   created_at timestamptz DEFAULT now()
 * );
 * ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "deny_all_push_subscriptions" ON push_subscriptions FOR ALL USING (false);
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSession } from '@/lib/auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let subscription: unknown
  try {
    const body = await req.json()
    subscription = body.subscription
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!subscription || typeof subscription !== 'object') {
    return NextResponse.json({ error: 'Missing subscription' }, { status: 400 })
  }

  try {
    // Upsert: one subscription per family (update if already exists)
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert(
        { family_id: session.familyId, subscription },
        { onConflict: 'family_id' }
      )

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('family_id', session.familyId)

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
