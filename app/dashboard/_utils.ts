import type { WeakVal, HistEntry } from './_types'

export const LEVEL_INFO_MAP: Record<string, { label: string; desc: string; cefr: string }> = {
  seeker:   { label: 'Seeker',   desc: 'Từ vựng nền tảng',  cefr: 'Pre-A1' },
  starter:  { label: 'Starter',  desc: 'Từ vựng cơ bản',    cefr: 'A1'     },
  ranger:   { label: 'Ranger',   desc: 'Từ vựng mở rộng',   cefr: 'A2'     },
  explorer: { label: 'Explorer', desc: 'Từ vựng nâng cao',  cefr: 'B1'     },
  scholar:  { label: 'Scholar',  desc: 'Từ vựng học thuật', cefr: 'B2'     },
  master:   { label: 'Master',   desc: 'Từ vựng chuyên sâu',cefr: 'C1-C2'  },
}

export const THEME_COLORS: Record<string, { grad: string; bar: string; header: string; text: string; ring: string }> = {
  pink:   { grad: 'from-pink-400 to-rose-400',    bar: 'bg-pink-400',   header: 'from-pink-400 to-rose-500',    text: 'text-pink-600',   ring: 'border-pink-400 bg-pink-50'   },
  blue:   { grad: 'from-blue-500 to-cyan-400',    bar: 'bg-blue-400',   header: 'from-blue-500 to-cyan-500',    text: 'text-blue-600',   ring: 'border-blue-400 bg-blue-50'   },
  green:  { grad: 'from-green-400 to-emerald-400', bar: 'bg-green-400', header: 'from-green-400 to-emerald-500', text: 'text-green-600', ring: 'border-green-400 bg-green-50' },
  orange: { grad: 'from-orange-400 to-amber-400', bar: 'bg-orange-400', header: 'from-orange-400 to-amber-500', text: 'text-orange-600', ring: 'border-orange-400 bg-orange-50' },
}
export const DEFAULT_COLOR = { grad: 'from-purple-400 to-indigo-400', bar: 'bg-purple-400', header: 'from-purple-500 to-indigo-500', text: 'text-purple-600', ring: 'border-purple-400 bg-purple-50' }

export const VN_DAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

export function weakCount(v: WeakVal): number { return typeof v === 'number' ? v : v.wrong }

export function getLast7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return { key: d.toISOString().split('T')[0], day: VN_DAYS[d.getDay()], date: `${d.getDate()}/${d.getMonth() + 1}` }
  })
}

export function histDotColor(entry: HistEntry | undefined, theme: string): string {
  if (!entry || entry.words + entry.games + entry.xp === 0) return 'bg-gray-200'
  const act = entry.words + entry.games
  const tiers: Record<string, [string, string, string]> = {
    blue:   ['bg-blue-500',   'bg-blue-300',   'bg-blue-200'],
    green:  ['bg-green-500',  'bg-green-300',  'bg-green-200'],
    orange: ['bg-orange-500', 'bg-orange-300', 'bg-orange-200'],
    pink:   ['bg-pink-500',   'bg-pink-300',   'bg-pink-200'],
  }
  const [high, mid, low] = tiers[theme] ?? tiers.pink
  return act >= 8 ? high : act >= 3 ? mid : low
}

export function fmtHistEntry(e: HistEntry): string {
  const parts: string[] = []
  if (e.words > 0) parts.push(`${e.words} từ`)
  if (e.games > 0) parts.push(`${e.games} game`)
  if (e.xp > 0) parts.push(`+${e.xp} XP`)
  return parts.join(' · ')
}

export const PLAN_BADGE: Record<string, { label: string; cls: string }> = {
  free:     { label: 'FREE',     cls: 'bg-white/20 text-white' },
  '2weeks': { label: '🎁 GIFT2W', cls: 'bg-pink-400 text-white' },
  '1month': { label: 'PRO1',     cls: 'bg-white/30 text-white' },
  '3months':{ label: 'PRO3',     cls: 'bg-white/30 text-white' },
  '6months':{ label: 'PRO6',     cls: 'bg-yellow-300 text-yellow-900' },
}

export function getPlanBadge(plan: string, planEndDate?: string | null) {
  const isPremiumExpired = plan !== 'free' && planEndDate && new Date(planEndDate) < new Date()
  if (isPremiumExpired) return { label: 'EXPIRED', cls: 'bg-red-400 text-white' }
  return PLAN_BADGE[plan] ?? PLAN_BADGE.free
}

export function fmtDateTime(d: Date | string): string {
  const dt = typeof d === 'string' ? new Date(d) : d
  const date = dt.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const time = dt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })
  return `${date} lúc ${time}`
}

export function formatLastActive(dateStr?: string): string {
  if (!dateStr) return ''
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
  if (diff === 0) return 'Hôm nay'
  if (diff === 1) return 'Hôm qua'
  if (diff < 7) return `${diff}d trước`
  const d = new Date(dateStr)
  return `${d.getDate()}/${d.getMonth() + 1}`
}

export function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray.buffer as ArrayBuffer
}

export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://vocabwise.id.vn'
