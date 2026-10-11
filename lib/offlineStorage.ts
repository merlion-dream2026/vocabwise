/**
 * Offline progress queue (localStorage): when a game finishes while the network is down, its
 * progress is queued here and synced on reconnect. (Topic downloads for offline study were
 * removed in Oct 2026; LEGACY_* keys/caches are only still listed so logout can clean them up.)
 */

const PROG_PREFIX   = 'vw_offline_prog_'
const LEGACY_PREFIXES = ['vw_dl_', 'vw_last_sync_']          // old offline-download data
const LEGACY_CACHE  = 'vocabwise-downloads-v1'

/** Logout: drop queued progress and any leftover offline-download data on this device. */
export async function clearLocalLearningData(): Promise<void> {
  const toDelete: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k && (k.startsWith(PROG_PREFIX) || LEGACY_PREFIXES.some(p => k.startsWith(p)))) toDelete.push(k)
  }
  toDelete.forEach(k => localStorage.removeItem(k))
  if ('caches' in window) await caches.delete(LEGACY_CACHE).catch(() => {})
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  srs_log?: any[]
  mastered_words?: string[]
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
