// Per-child daily AI quotas. The active child travels in the `vw_child` cookie (set by
// ChildMascotProvider whenever a child-scoped screen resolves its child); the server only trusts it
// after checking the child belongs to the signed-in family. Without a valid cookie (parent screens,
// old tabs) usage falls back to one family-wide bucket with the same per-child limit.
import type { NextRequest } from 'next/server'
import { supabase } from './supabaseServer'
import { AI_FAIR_USE_CAP } from './plans'
import { checkAndIncrementAISpeakUsage, checkAndIncrementAITextUsage } from './rateLimit'
import { ACTIVE_CHILD_COOKIE } from './activeChildCookie'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// childId → owning familyId, cached 10 min per instance (children never change family).
const owners = new Map<string, { familyId: string | null; at: number }>()
const OWNER_TTL = 10 * 60_000

async function ownerOf(childId: string): Promise<string | null> {
  const hit = owners.get(childId)
  if (hit && Date.now() - hit.at < OWNER_TTL) return hit.familyId
  const { data } = await supabase.from('children').select('family_id').eq('id', childId).maybeSingle()
  const familyId = (data?.family_id as string | undefined) ?? null
  owners.set(childId, { familyId, at: Date.now() })
  return familyId
}

/** Usage bucket for this request: `family:child` when the cookie names one of the family's children. */
export async function quotaSubject(req: NextRequest, familyId: string): Promise<string> {
  const childId = req.cookies.get(ACTIVE_CHILD_COOKIE)?.value
  if (!childId || !UUID.test(childId)) return familyId
  return (await ownerOf(childId)) === familyId ? `${familyId}:${childId}` : familyId
}

/**
 * Counts one AI call against today's quota and says whether it may run.
 * `limit` comes from getAISpeakLimit/getAITextLimit: null ("không giới hạn") still stops at AI_FAIR_USE_CAP.
 */
export async function consumeAIQuota(kind: 'speak' | 'text', req: NextRequest, familyId: string, limit: number | null): Promise<boolean> {
  if (limit === 0) return false
  const subject = await quotaSubject(req, familyId)
  const cap = limit ?? AI_FAIR_USE_CAP
  return kind === 'speak' ? checkAndIncrementAISpeakUsage(subject, cap) : checkAndIncrementAITextUsage(subject, cap)
}
