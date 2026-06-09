import { schedulePush } from './cloudSync'

export type StreakData = {
  current: number
  best: number
  lastActive: string // YYYY-MM-DD
}

const storeKey = (level: string) => `streak_${level}`

function today(): string {
  return new Date().toISOString().split('T')[0]
}

function load(level: string): StreakData {
  if (typeof window === 'undefined') return { current: 0, best: 0, lastActive: '' }
  try {
    return JSON.parse(localStorage.getItem(storeKey(level)) ?? 'null') ?? {
      current: 0,
      best: 0,
      lastActive: '',
    }
  } catch {
    return { current: 0, best: 0, lastActive: '' }
  }
}

// Call this whenever a game session completes (at least 1 word answered)
export function recordActivity(level: string): StreakData {
  if (typeof window === 'undefined') return { current: 0, best: 0, lastActive: '' }
  const data = load(level)
  const todayStr = today()

  if (data.lastActive === todayStr) return data // already recorded today

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]

  const newCurrent = data.lastActive === yesterdayStr ? data.current + 1 : 1
  const updated: StreakData = {
    current: newCurrent,
    best: Math.max(data.best, newCurrent),
    lastActive: todayStr,
  }
  localStorage.setItem(storeKey(level), JSON.stringify(updated))
  schedulePush(level)
  return updated
}

export function getStreak(level: string): StreakData {
  return load(level)
}
