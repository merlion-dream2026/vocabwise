import { supabase } from './supabaseServer'
import type { SessionPayload } from './session'

// A JWT alone can't be revoked: it stays valid for 30 days even after the family is disabled
// or changes its password. proxy.ts calls isSessionLive() on every authenticated request so
// both take effect right away.
//
// Positive results are cached per instance for CACHE_MS, so a revoked token may keep working
// on a warm instance for up to that long — the price of not adding a DB round-trip to every
// request. A negative cached result is always re-checked against the DB, so a freshly issued
// token (new session_version) is never rejected because of a stale cache entry.
const CACHE_MS = 30_000
const cache = new Map<string, { disabled: boolean; sv: number; at: number }>()

// 'error' = DB unreachable/misconfigured (e.g. migration not applied yet) — fail open rather than log
// everyone out; 'missing' = family row deleted — fail closed.
async function fetchState(familyId: string) {
  const { data, error } = await supabase
    .from('families')
    .select('disabled, session_version')
    .eq('id', familyId)
    .maybeSingle()
  if (error) {
    console.error('[sessionGuard] family lookup failed:', error.message)
    return 'error' as const
  }
  if (!data) return 'missing' as const
  const state = { disabled: !!data.disabled, sv: data.session_version ?? 0, at: Date.now() }
  cache.set(familyId, state)
  return state
}

function ok(state: { disabled: boolean; sv: number }, session: SessionPayload) {
  return !state.disabled && (session.sv ?? 0) === state.sv
}

export async function isSessionLive(session: SessionPayload): Promise<boolean> {
  const cached = cache.get(session.familyId)
  if (cached && Date.now() - cached.at < CACHE_MS && ok(cached, session)) return true
  const fresh = await fetchState(session.familyId)
  if (fresh === 'error') return true
  if (fresh === 'missing') {
    cache.delete(session.familyId)
    return false
  }
  return ok(fresh, session)
}

/** Revokes every session of a family. Returns the new version, to embed in a token re-issued for the current device. */
export async function bumpSessionVersion(familyId: string): Promise<number> {
  const { data } = await supabase.from('families').select('session_version').eq('id', familyId).single()
  const next = (data?.session_version ?? 0) + 1
  await supabase.from('families').update({ session_version: next }).eq('id', familyId)
  cache.delete(familyId)
  return next
}
