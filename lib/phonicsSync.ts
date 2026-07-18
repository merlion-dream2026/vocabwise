// Standalone Phonics module sync.
// Stored in vocab_sync with level = 'phonics'.
// Mastery = flashcard:true + all 3 game keys at ≥70%.

const MASTERY_GAMES = ['minimal-pairs', 'listen-pick', 'speak'] as const
export type GameKey = typeof MASTERY_GAMES[number]

type PairMastery  = { flashcard: boolean; games: string[] }
type PhonicsStreak = { current: number; best: number; lastActive: string; freezeUsedWeek?: string }
export type SoundAccuracy = { attempts: number; correct: number }
export type PhonicsHistoryEntry = { topicIds: string[] }

let _childId  = ''
let _mastery: Record<string, PairMastery>   = {}
let _streak:  PhonicsStreak                  = { current: 0, best: 0, lastActive: '' }
let _soundAcc: Record<string, SoundAccuracy> = {}
// ISO date of last review per lesson (for decay scoring)
let _lastReviewed: Record<string, string> = {}
// Badge IDs earned (e.g. lesson IDs that were mastered)
let _badges: string[] = []
// Lesson IDs touched per day, for the "Lịch sử 30 ngày" panel
let _history: Record<string, PhonicsHistoryEntry> = {}

export function initPhonicsSync(childId: string, data: {
  mastery?: Record<string, PairMastery>
  streak?: Partial<PhonicsStreak>
  soundAcc?: Record<string, SoundAccuracy>
  lastReviewed?: Record<string, string>
  badges?: string[]
  history?: Record<string, PhonicsHistoryEntry>
} | null) {
  _childId      = childId
  _mastery      = data?.mastery      ?? {}
  _soundAcc     = data?.soundAcc     ?? {}
  _lastReviewed = data?.lastReviewed ?? {}
  _badges       = data?.badges       ?? []
  _history      = data?.history      ?? {}
  _streak = {
    current:        data?.streak?.current        ?? 0,
    best:           data?.streak?.best           ?? 0,
    lastActive:     data?.streak?.lastActive     ?? '',
    freezeUsedWeek: data?.streak?.freezeUsedWeek ?? undefined,
  }
}

/** Add lessonId to today's history entry (dedup — no-op if already recorded today). */
function bumpPhonicsHistory(lessonId: string) {
  const today = todayStr()
  const prev = _history[today] ?? { topicIds: [] }
  if (!prev.topicIds.includes(lessonId)) {
    _history = { ..._history, [today]: { topicIds: [...prev.topicIds, lessonId] } }
  }
}

// ── Decay ─────────────────────────────────────────────────────────────────────

function todayStr() { return new Date().toISOString().split('T')[0] }

/** Mark lesson as reviewed today (called after any game completion). */
export function markReviewed(lessonId: string) {
  _lastReviewed = { ..._lastReviewed, [lessonId]: todayStr() }
}

/**
 * Decay score 0–100. Mastered lesson starts at 100 and loses 5/day after 2
 * grace days, flooring at 40. Returns 100 if never mastered.
 */
export function getDecayScore(lessonId: string, masteryGames: string[]): number {
  if (!isLessonMastered(lessonId, masteryGames)) return 100 // not yet mastered — no decay shown
  const reviewed = _lastReviewed[lessonId]
  if (!reviewed) return 60 // mastered but never tracked review → show as fading
  const days = Math.floor((Date.now() - new Date(reviewed).getTime()) / 86_400_000)
  if (days <= 2) return 100
  return Math.max(40, 100 - (days - 2) * 5)
}

/** Returns lesson IDs with decay score below threshold, sorted worst first. */
export function getDecayedLessons(
  allLessons: { id: string; masteryGames: string[] }[],
  threshold = 65
): string[] {
  return allLessons
    .filter(l => isLessonMastered(l.id, l.masteryGames) && getDecayScore(l.id, l.masteryGames) < threshold)
    .sort((a, b) => getDecayScore(a.id, a.masteryGames) - getDecayScore(b.id, b.masteryGames))
    .map(l => l.id)
}

// ── Streak freeze ─────────────────────────────────────────────────────────────

/** ISO week string, e.g. "2026-W26". */
function isoWeek(date = new Date()): string {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 4 - (d.getDay() || 7))
  const yearStart = new Date(d.getFullYear(), 0, 1)
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7)
  return `${d.getFullYear()}-W${String(weekNo).padStart(2, '0')}`
}

export function canUseStreakFreeze(): boolean {
  if (_streak.current < 7) return false
  return _streak.freezeUsedWeek !== isoWeek()
}

/** Apply freeze: protect streak for one missed day. Returns true if applied. */
export function applyStreakFreeze(): boolean {
  if (!canUseStreakFreeze()) return false
  const today = todayStr()
  _streak = { ..._streak, freezeUsedWeek: isoWeek(), lastActive: today }
  return true
}

// ── Badges ────────────────────────────────────────────────────────────────────

/** Award a badge by ID if not already earned. Returns true if newly earned. */
export function awardBadge(badgeId: string): boolean {
  if (_badges.includes(badgeId)) return false
  _badges = [..._badges, badgeId]
  return true
}

export function getBadges(): string[] { return [..._badges] }

// ─────────────────────────────────────────────────────────────────────────────

export function markPairSeen(pairId: string) {
  const entry = _mastery[pairId] ?? { flashcard: false, games: [] }
  if (!entry.flashcard) {
    _mastery = { ..._mastery, [pairId]: { ...entry, flashcard: true } }
    recordPhonicsActivity()
  }
  bumpPhonicsHistory(pairId)
}

/** Only call when user passes ≥70% — the game component enforces the threshold. */
export function recordPairGame(pairId: string, gameKey: string, masteryGames?: string[]) {
  const entry = _mastery[pairId] ?? { flashcard: false, games: [] }
  if (!entry.games.includes(gameKey)) {
    _mastery = { ..._mastery, [pairId]: { ...entry, games: [...entry.games, gameKey] } }
  }
  markReviewed(pairId)
  recordPhonicsActivity()
  bumpPhonicsHistory(pairId)
  // Award mastery badge when all required games completed
  if (masteryGames && isLessonMastered(pairId, masteryGames)) {
    awardBadge(`mastered:${pairId}`)
  }
}

export function recordPhonicsActivity() {
  const today = todayStr()
  if (_streak.lastActive === today) return
  const yest = new Date(); yest.setDate(yest.getDate() - 1)
  const yesterdayStr = yest.toISOString().split('T')[0]
  const isConsecutive = _streak.lastActive === yesterdayStr
  const newCurrent = isConsecutive ? _streak.current + 1 : 1
  _streak = { ..._streak, current: newCurrent, best: Math.max(_streak.best, newCurrent), lastActive: today }
}

export function getPhonicsStreak(): PhonicsStreak { return { ..._streak } }

/** Record a Speak game attempt for a specific sound symbol. */
export function recordSoundResult(symbol: string, correct: boolean) {
  const prev = _soundAcc[symbol] ?? { attempts: 0, correct: 0 }
  _soundAcc = { ..._soundAcc, [symbol]: { attempts: prev.attempts + 1, correct: prev.correct + (correct ? 1 : 0) } }
}

export function getSoundAccuracy(): Record<string, SoundAccuracy> { return { ..._soundAcc } }

/** Returns sound symbols with < threshold accuracy, minimum minAttempts attempts, sorted worst first. */
export function getWeakSounds(minAttempts = 3, threshold = 0.6): string[] {
  return Object.entries(_soundAcc)
    .filter(([, a]) => a.attempts >= minAttempts && a.correct / a.attempts < threshold)
    .sort(([, a], [, b]) => (a.correct / a.attempts) - (b.correct / b.attempts))
    .map(([symbol]) => symbol)
}

export function isPairSeen(pairId: string): boolean {
  return !!_mastery[pairId]?.flashcard
}

export function getPairGames(pairId: string): string[] {
  return _mastery[pairId]?.games ?? []
}

export function isPairMastered(pairId: string): boolean {
  const m = _mastery[pairId]
  if (!m?.flashcard) return false
  return MASTERY_GAMES.every(g => m.games.includes(g))
}

export function isRuleLessonMastered(lessonId: string, requiredGames: string[]): boolean {
  const m = _mastery[lessonId]
  if (!m?.flashcard) return false
  return requiredGames.every(g => m.games.includes(g))
}

export function isLessonMastered(lessonId: string, masteryGames: string[]): boolean {
  const m = _mastery[lessonId]
  if (!m?.flashcard) return false
  return masteryGames.every(g => m.games.includes(g))
}

export function getMastery(): Record<string, PairMastery> {
  return { ..._mastery }
}

export function seenCountInGroup(pairIds: string[]): number {
  return pairIds.filter(id => isPairSeen(id)).length
}

export function masteredCountInGroup(pairIds: string[]): number {
  return pairIds.filter(id => isPairMastered(id)).length
}

export async function flushPhonics() {
  if (!_childId) return
  await fetch(`/api/sync/${_childId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      level: 'phonics',
      mastery: _mastery,
      streak: _streak,
      soundAcc: _soundAcc,
      lastReviewed: _lastReviewed,
      badges: _badges,
      history: _history,
      seen: [], weak_words: {}, battle: {}, srs: {},
    }),
  }).catch(() => {})
}
