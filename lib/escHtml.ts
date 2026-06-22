/** Escape user-controlled strings before interpolating into HTML email templates. */
export function esc(s: string | null | undefined): string {
  return (s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Admin alert recipient — env-driven, falls back to the configured Gmail sender. */
export const ADMIN_ALERT_EMAIL = process.env.ADMIN_ALERT_EMAIL ?? process.env.GMAIL_USER ?? ''
