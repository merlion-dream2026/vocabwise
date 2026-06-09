import { schedulePush } from './cloudSync'

// Weekly score: resets each Monday
export type BattleData = {
  weekScore: number
  weekKey: string // YYYY-Www (ISO week)
  totalAllTime: number
}

const storeKey = (level: string) => `battle_${level}`

function isoWeekKey(date: Date): string {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7))
  const week1 = new Date(d.getFullYear(), 0, 4)
  const weekNum = 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7)
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`
}

function load(level: string): BattleData {
  if (typeof window === 'undefined') return { weekScore: 0, weekKey: '', totalAllTime: 0 }
  try {
    return (
      JSON.parse(localStorage.getItem(storeKey(level)) ?? 'null') ?? {
        weekScore: 0,
        weekKey: '',
        totalAllTime: 0,
      }
    )
  } catch {
    return { weekScore: 0, weekKey: '', totalAllTime: 0 }
  }
}

// Add points when a game session ends. points = score (correct answers in session)
export function addScore(level: string, points: number): BattleData {
  if (typeof window === 'undefined' || points <= 0)
    return { weekScore: 0, weekKey: '', totalAllTime: 0 }

  const data = load(level)
  const currentWeek = isoWeekKey(new Date())

  const weekScore = data.weekKey === currentWeek ? data.weekScore + points : points
  const updated: BattleData = {
    weekScore,
    weekKey: currentWeek,
    totalAllTime: data.totalAllTime + points,
  }
  localStorage.setItem(storeKey(level), JSON.stringify(updated))
  schedulePush(level)
  return updated
}

export function getBattleData(level: string): BattleData {
  const data = load(level)
  const currentWeek = isoWeekKey(new Date())
  if (data.weekKey !== currentWeek) {
    return { ...data, weekScore: 0, weekKey: currentWeek }
  }
  return data
}
