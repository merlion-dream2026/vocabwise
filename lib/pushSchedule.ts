// Push reminder schedule — shared by the Settings UI and the scheduled-push cron.
// Shape: { "<day>": "HH:MM" } where day = JS getDay() in Vietnam time (0 = Sunday … 6 = Saturday).
// A missing day = no reminder that day. Times are on a 15-minute grid, matching the
// pg_cron trigger (every 15 min) that calls /api/cron/push-scheduled.

export type PushSchedule = Partial<Record<'0' | '1' | '2' | '3' | '4' | '5' | '6', string>>

export const SLOT_MINUTES = 15

/** Families that never saved a schedule keep the original behaviour: every day at 08:00. */
export const DEFAULT_PUSH_SCHEDULE: PushSchedule = {
  '0': '08:00', '1': '08:00', '2': '08:00', '3': '08:00', '4': '08:00', '5': '08:00', '6': '08:00',
}

/** Display order Mon → Sun, Vietnamese labels. */
export const WEEK_DAYS: { key: keyof PushSchedule; label: string }[] = [
  { key: '1', label: 'Thứ 2' }, { key: '2', label: 'Thứ 3' }, { key: '3', label: 'Thứ 4' },
  { key: '4', label: 'Thứ 5' }, { key: '5', label: 'Thứ 6' }, { key: '6', label: 'Thứ 7' },
  { key: '0', label: 'Chủ nhật' },
]

/** Selectable times 05:00 → 22:45 in 15-minute steps. */
export const TIME_OPTIONS: string[] = Array.from({ length: (23 - 5) * (60 / SLOT_MINUTES) }, (_, i) => {
  const m = 5 * 60 + i * SLOT_MINUTES
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
})

const TIME_SET = new Set(TIME_OPTIONS)

/** Returns a clean schedule, or null if the input isn't a valid one. */
export function parsePushSchedule(input: unknown): PushSchedule | null {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null
  const out: PushSchedule = {}
  for (const [day, time] of Object.entries(input as Record<string, unknown>)) {
    if (!/^[0-6]$/.test(day) || typeof time !== 'string' || !TIME_SET.has(time)) return null
    out[day as keyof PushSchedule] = time
  }
  return out
}

/** The current 15-minute slot in Vietnam time (UTC+7, no DST), e.g. { day: '1', time: '07:30' }. */
export function currentVNSlot(now = Date.now()): { day: keyof PushSchedule; time: string } {
  const vn = new Date(now + 7 * 3600_000)
  const mins = Math.floor(vn.getUTCMinutes() / SLOT_MINUTES) * SLOT_MINUTES
  return {
    day: String(vn.getUTCDay()) as keyof PushSchedule,
    time: `${String(vn.getUTCHours()).padStart(2, '0')}:${String(mins).padStart(2, '0')}`,
  }
}
