import { schedulePush } from './cloudSync'

const seenKey = (level: string) => `progress_${level}`

export function markSeen(level: string, topicId: string, word: string) {
  if (typeof window === 'undefined') return
  const key = seenKey(level)
  const seen: string[] = JSON.parse(localStorage.getItem(key) ?? '[]')
  const id = `${topicId}__${word}`
  if (!seen.includes(id)) {
    seen.push(id)
    localStorage.setItem(key, JSON.stringify(seen))
    schedulePush(level)
  }
}

export function getTopicSeenCount(level: string, topicId: string): number {
  if (typeof window === 'undefined') return 0
  const seen: string[] = JSON.parse(localStorage.getItem(seenKey(level)) ?? '[]')
  return seen.filter((id) => id.startsWith(`${topicId}__`)).length
}

export function getTotalSeenCount(level: string): number {
  if (typeof window === 'undefined') return 0
  return (JSON.parse(localStorage.getItem(seenKey(level)) ?? '[]') as string[]).length
}
