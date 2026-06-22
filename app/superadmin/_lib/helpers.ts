import type { Family } from '../_types'

export function exportCSV(families: Family[]) {
  const headers = ['Username', 'Tên', 'Email', 'SĐT', 'Gói', 'Hết hạn', 'Ngày ĐK', 'Trạng thái']
  const rows = families.map(f => [
    f.username,
    f.name || '',
    f.email || '',
    f.phone || '',
    f.plan,
    (f.plan !== 'free' ? f.plan_end_date : f.free_trial_expires_at)?.split('T')[0] || '',
    f.created_at.split('T')[0],
    f.disabled ? 'Bị khóa' : 'Hoạt động',
  ])
  const csv = [headers, ...rows]
    .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `vocabwise-users-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

export function today(): string {
  return new Date().toISOString().split('T')[0]
}

export function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000)
}

export function planBadge(f: Family): { label: string; color: string } {
  if (f.plan === 'free') {
    const d = daysUntil(f.free_trial_expires_at)
    if (d === null || d < 0) return { label: 'FREE ✗', color: 'bg-red-700 text-red-200' }
    return { label: `FREE (${d}d)`, color: 'bg-slate-100 text-slate-700' }
  }
  const PLAN_SHORT: Record<string, string> = { '2weeks': 'GIFT', '1month': 'PRO1', '3months': 'PRO3', '6months': 'PRO6' }
  const planShort = PLAN_SHORT[f.plan] ?? f.plan.toUpperCase()
  const d = daysUntil(f.plan_end_date)
  if (d === null || d < 0) return { label: `${planShort} ✗`, color: 'bg-red-700 text-red-200' }
  if (d <= 7) return { label: `${planShort} (${d}d ⚠)`, color: 'bg-yellow-600 text-yellow-100' }
  const PLAN_COLOR: Record<string, string> = {
    '2weeks':  'bg-pink-500 text-white',
    '1month':  'bg-sky-500 text-white',
    '3months': 'bg-violet-600 text-white',
    '6months': 'bg-indigo-700 text-white',
  }
  return { label: `${planShort} (${d}d)`, color: PLAN_COLOR[f.plan] ?? 'bg-indigo-700 text-white' }
}
