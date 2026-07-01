/**
 * Persistent offline topic data storage using localStorage.
 * More reliable than Cache Storage on iOS (which gets evicted aggressively).
 */

const PREFIX      = 'vw_dl_'
const SYNC_PREFIX = 'vw_last_sync_'
const PROG_PREFIX = 'vw_offline_prog_'

export type DailyOfflineBundle = {
  topic: {
    id: string
    name: string
    emoji: string
    color: string
    words: { word: string; meaning: string; emoji: string; example: string }[]
  }
  story: { emojis: string[]; en: string; vi: string } | null
  topicList: { id: string; name: string; emoji: string }[]
  audioSize: number  // bytes — pre-measured from audio file
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
    if (k?.startsWith(PREFIX) || k?.startsWith(SYNC_PREFIX) || k?.startsWith(PROG_PREFIX)) {
      toDelete.push(k)
    }
  }
  toDelete.forEach(k => localStorage.removeItem(k))
}

// ─── Last-known sync cache ────────────────────────────────────────────────────
// Saves server sync data locally so offline games start with correct mastery/streak.

export function saveLastSync(childId: string, level: string, data: unknown): void {
  try { localStorage.setItem(`${SYNC_PREFIX}${childId}_${level}`, JSON.stringify(data)) } catch {}
}

export function loadLastSync(childId: string, level: string): unknown | null {
  try {
    const raw = localStorage.getItem(`${SYNC_PREFIX}${childId}_${level}`)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

// ─── Offline pending progress ─────────────────────────────────────────────────
// When games complete offline, progress is queued here and synced on reconnect.

export type OfflinePendingProgress = {
  topicName: string
  level: string
  seen: string[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  weak_words: Record<string, any>
  streak: { current: number; best: number; lastActive: string }
  battle: { totalAllTime: number }
  mastery: Record<string, { flashcard: boolean; games: string[] }>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  history: Record<string, any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  srs: Record<string, any>
}

export function saveOfflineProgress(
  childId: string, level: string, topicId: string, data: OfflinePendingProgress
): void {
  try { localStorage.setItem(`${PROG_PREFIX}${childId}_${level}_${topicId}`, JSON.stringify(data)) } catch {}
}

export function loadOfflineProgress(
  childId: string, level: string, topicId: string
): OfflinePendingProgress | null {
  try {
    const raw = localStorage.getItem(`${PROG_PREFIX}${childId}_${level}_${topicId}`)
    return raw ? (JSON.parse(raw) as OfflinePendingProgress) : null
  } catch { return null }
}

export function clearOfflineProgress(childId: string, level: string, topicId: string): void {
  localStorage.removeItem(`${PROG_PREFIX}${childId}_${level}_${topicId}`)
}
