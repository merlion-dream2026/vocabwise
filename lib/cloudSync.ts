import { WeakEntry } from './weakWords'
import { StreakData } from './streak'
import { BattleData } from './battle'
import { MasteryData, mergeMastery } from './topicMastery'

// ── Sync state listeners ──────────────────────────────────────────────────────

export type SyncState = { syncing: boolean; lastSync: string | null }
type SyncListener = (s: SyncState) => void
let listeners: SyncListener[] = []

export function onSyncStateChange(cb: SyncListener): () => void {
  listeners.push(cb)
  return () => { listeners = listeners.filter(l => l !== cb) }
}

function notify(s: SyncState) { listeners.forEach(l => l(s)) }

// ── localStorage key helpers ──────────────────────────────────────────────────

function seenKey(level: string) { return `progress_${level}` }
function weakKey(level: string) { return `weakWords_${level}` }
function streakKey(level: string) { return `streak_${level}` }
function battleKey(level: string) { return `battle_${level}` }
function masteryKey(level: string) { return `topicMastery_${level}` }
function lastResetAtKey(level: string) { return `lastResetAt_${level}` }

function readLocal<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try { return JSON.parse(localStorage.getItem(key) ?? 'null') ?? fallback }
  catch { return fallback }
}

// ── Merge helpers ─────────────────────────────────────────────────────────────

function mergeSeen(local: string[], remote: string[]): string[] {
  return Array.from(new Set([...local, ...remote]))
}

function mergeWeak(
  local: Record<string, WeakEntry>,
  remote: Record<string, WeakEntry>
): Record<string, WeakEntry> {
  const result: Record<string, WeakEntry> = { ...local }
  for (const [id, re] of Object.entries(remote)) {
    const le = result[id]
    if (!le) { result[id] = re; continue }
    result[id] = {
      ...le,
      wrong: Math.max(le.wrong, re.wrong),
      correctStreak: le.lastWrong > re.lastWrong ? le.correctStreak : re.correctStreak,
      lastWrong: le.lastWrong > re.lastWrong ? le.lastWrong : re.lastWrong,
    }
  }
  return result
}

function mergeStreak(local: StreakData, remote: StreakData): StreakData {
  if (local.lastActive > remote.lastActive) return local
  if (remote.lastActive > local.lastActive) return remote
  return { ...local, current: Math.max(local.current, remote.current), best: Math.max(local.best, remote.best) }
}

function mergeBattle(local: BattleData, remote: BattleData): BattleData {
  const weekScore = local.weekKey === remote.weekKey
    ? Math.max(local.weekScore, remote.weekScore)
    : (local.weekKey > remote.weekKey ? local.weekScore : remote.weekScore)
  const weekKey = local.weekKey >= remote.weekKey ? local.weekKey : remote.weekKey
  return { weekKey, weekScore, totalAllTime: Math.max(local.totalAllTime, remote.totalAllTime) }
}

// ── Push (debounced) ──────────────────────────────────────────────────────────

const pushTimers: Record<string, ReturnType<typeof setTimeout>> = {}

export function schedulePush(level: string) {
  clearTimeout(pushTimers[level])
  pushTimers[level] = setTimeout(() => pushToCloud(level), 3000)
}

async function pushToCloud(level: string) {
  notify({ syncing: true, lastSync: null })
  try {
    const payload = {
      seen: readLocal<string[]>(seenKey(level), []),
      weak_words: readLocal<Record<string, WeakEntry>>(weakKey(level), {}),
      streak: readLocal<StreakData>(streakKey(level), { current: 0, best: 0, lastActive: '' }),
      battle: readLocal<BattleData>(battleKey(level), { weekScore: 0, weekKey: '', totalAllTime: 0 }),
      mastery: readLocal<Record<string, MasteryData>>(masteryKey(level), {}),
    }
    await fetch(`/api/sync/${level}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const time = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    notify({ syncing: false, lastSync: time })
  } catch {
    notify({ syncing: false, lastSync: null })
  }
}

// ── Pull & merge on app open ──────────────────────────────────────────────────

export async function pullFromCloud(level: string): Promise<void> {
  try {
    const res = await fetch(`/api/sync/${level}`)
    if (!res.ok) return
    const remote = await res.json()
    if (!remote) return

    // Reset check — if admin reset_at is newer than local, wipe all data for this level
    const serverResetAt: string = remote.reset_at ?? ''
    const localResetAt = localStorage.getItem(lastResetAtKey(level)) ?? ''
    if (serverResetAt && serverResetAt > localResetAt) {
      localStorage.removeItem(seenKey(level))
      localStorage.removeItem(weakKey(level))
      localStorage.removeItem(streakKey(level))
      localStorage.removeItem(battleKey(level))
      localStorage.removeItem(masteryKey(level))
      localStorage.setItem(lastResetAtKey(level), serverResetAt)
      await pushToCloud(level)
      return
    }

    // seen
    const localSeen = readLocal<string[]>(seenKey(level), [])
    const mergedSeen = mergeSeen(localSeen, remote.seen ?? [])
    localStorage.setItem(seenKey(level), JSON.stringify(mergedSeen))

    // weak words
    const localWeak = readLocal<Record<string, WeakEntry>>(weakKey(level), {})
    const mergedWeak = mergeWeak(localWeak, remote.weak_words ?? {})
    localStorage.setItem(weakKey(level), JSON.stringify(mergedWeak))

    // streak
    const emptyStreak: StreakData = { current: 0, best: 0, lastActive: '' }
    const localStreak = readLocal<StreakData>(streakKey(level), emptyStreak)
    const mergedStreak = mergeStreak(localStreak, remote.streak ?? emptyStreak)
    localStorage.setItem(streakKey(level), JSON.stringify(mergedStreak))

    // battle
    const emptyBattle: BattleData = { weekScore: 0, weekKey: '', totalAllTime: 0 }
    const localBattle = readLocal<BattleData>(battleKey(level), emptyBattle)
    const mergedBattle = mergeBattle(localBattle, remote.battle ?? emptyBattle)
    localStorage.setItem(battleKey(level), JSON.stringify(mergedBattle))

    // mastery
    const localMastery = readLocal<Record<string, MasteryData>>(masteryKey(level), {})
    const mergedMastery = mergeMastery(localMastery, remote.mastery ?? {})
    localStorage.setItem(masteryKey(level), JSON.stringify(mergedMastery))

    // push the merged result back so cloud stays authoritative
    await pushToCloud(level)
  } catch { /* silent */ }
}
