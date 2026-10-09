import { describe, it, expect } from 'vitest'
import { currentVNSlot, parsePushSchedule, TIME_OPTIONS } from '@/lib/pushSchedule'

describe('currentVNSlot', () => {
  it('converts UTC to Vietnam time and floors to the 15-min slot', () => {
    // 2026-10-12 00:37 UTC = Monday 07:37 VN → slot Mon 07:30
    expect(currentVNSlot(Date.UTC(2026, 9, 12, 0, 37))).toEqual({ day: '1', time: '07:30' })
  })
  it('rolls the weekday over at VN midnight, not UTC midnight', () => {
    // Sunday 17:05 UTC = Monday 00:05 VN
    expect(currentVNSlot(Date.UTC(2026, 9, 11, 17, 5))).toEqual({ day: '1', time: '00:00' })
  })
  it('matches a pg_cron run that fires a few seconds late', () => {
    expect(currentVNSlot(Date.UTC(2026, 9, 12, 13, 45, 4)).time).toBe('20:45')
  })
})

describe('parsePushSchedule', () => {
  it('accepts valid days and grid times', () => {
    expect(parsePushSchedule({ '1': '07:30', '0': '20:00' })).toEqual({ '1': '07:30', '0': '20:00' })
    expect(parsePushSchedule({})).toEqual({})
  })
  it('rejects bad day keys, off-grid times and non-objects', () => {
    expect(parsePushSchedule({ '7': '08:00' })).toBeNull()
    expect(parsePushSchedule({ '1': '08:10' })).toBeNull()
    expect(parsePushSchedule({ '1': '23:00' })).toBeNull()
    expect(parsePushSchedule(null)).toBeNull()
    expect(parsePushSchedule(['08:00'])).toBeNull()
  })
  it('offers 05:00 → 22:45 in 15-min steps', () => {
    expect(TIME_OPTIONS[0]).toBe('05:00')
    expect(TIME_OPTIONS.at(-1)).toBe('22:45')
    expect(TIME_OPTIONS).toHaveLength(72)
  })
})
