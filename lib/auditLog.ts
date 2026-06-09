import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export type AuditAction = 'create_family' | 'update_family' | 'delete_family'

export async function logAudit(
  action: AuditAction,
  targetId: string,
  targetUsername: string,
  details?: Record<string, unknown>
) {
  try {
    await supabase.from('admin_audit_log').insert({
      action,
      target_id: targetId,
      target_username: targetUsername,
      details: details ?? {},
    })
  } catch {
    // Graceful degradation — silently skip if table doesn't exist yet
  }
}
