import { redirect } from 'next/navigation'

// Expired accounts are read-only since 2026-10-12 (progress stays visible, renew from the dashboard),
// so this old dead-end page just forwards old links and open tabs.
export default function ExpiredPage() {
  redirect('/dashboard')
}
