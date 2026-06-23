/**
 * Persistent offline topic data storage using localStorage.
 * More reliable than Cache Storage on iOS (which gets evicted aggressively).
 */

const PREFIX = 'vw_dl_'

export type DailyOfflineBundle = {
  topic: {
    id: string
    name: string
    emoji: string
    color: string
    words: { word: string; meaning: string; emoji: string; example: string }[]
  }
  story: { emojis: string[]; en: string; vi: string } | null
  topicList: { id: string; name: string }[]
}

export function saveDailyTopicOffline(level: string, topicId: string, data: DailyOfflineBundle): void {
  try {
    localStorage.setItem(`${PREFIX}daily_${level}_${topicId}`, JSON.stringify(data))
  } catch {
    // Quota exceeded — silent fail
  }
}

export function loadDailyTopicOffline(level: string, topicId: string): DailyOfflineBundle | null {
  try {
    const raw = localStorage.getItem(`${PREFIX}daily_${level}_${topicId}`)
    return raw ? (JSON.parse(raw) as DailyOfflineBundle) : null
  } catch {
    return null
  }
}

export function deleteDailyTopicOffline(level: string, topicId: string): void {
  localStorage.removeItem(`${PREFIX}daily_${level}_${topicId}`)
}

export function clearAllOfflineData(): void {
  const toDelete: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k?.startsWith(PREFIX)) toDelete.push(k)
  }
  toDelete.forEach(k => localStorage.removeItem(k))
}
