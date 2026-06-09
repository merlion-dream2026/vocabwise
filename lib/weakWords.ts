import { markSeen } from './progress'
import { schedulePush } from './cloudSync'

export type WeakEntry = {
  topicId: string
  word: string
  meaning: string
  emoji: string
  wrong: number
  correctStreak: number
  lastWrong: string // YYYY-MM-DD
}

const storeKey = (level: string) => `weakWords_${level}`

function load(level: string): Record<string, WeakEntry> {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(localStorage.getItem(storeKey(level)) ?? '{}')
  } catch {
    return {}
  }
}

function save(level: string, store: Record<string, WeakEntry>) {
  localStorage.setItem(storeKey(level), JSON.stringify(store))
}

// Returns true if the word was just mastered (removed from weak list)
export function recordAnswer(
  level: string,
  topicId: string,
  w: { word: string; meaning: string; emoji: string },
  isCorrect: boolean
): boolean {
  if (typeof window === 'undefined') return false
  markSeen(level, topicId, w.word)
  const store = load(level)
  const id = `${topicId}__${w.word}`

  if (isCorrect) {
    const entry = store[id]
    if (!entry) return false
    entry.correctStreak += 1
    if (entry.correctStreak >= 3) {
      delete store[id]
      save(level, store)
      schedulePush(level)
      return true
    }
    store[id] = entry
    save(level, store)
    schedulePush(level)
    return false
  } else {
    const entry: WeakEntry = store[id] ?? {
      topicId,
      word: w.word,
      meaning: w.meaning,
      emoji: w.emoji,
      wrong: 0,
      correctStreak: 0,
      lastWrong: '',
    }
    entry.wrong += 1
    entry.correctStreak = 0
    entry.lastWrong = new Date().toISOString().split('T')[0]
    store[id] = entry
    save(level, store)
    schedulePush(level)
    return false
  }
}

export function getReviewEntries(level: string): WeakEntry[] {
  const store = load(level)
  return Object.values(store)
    .sort((a, b) => b.wrong - a.wrong)
    .slice(0, 10)
}

export function getAllEntries(level: string): WeakEntry[] {
  return Object.values(load(level))
}
