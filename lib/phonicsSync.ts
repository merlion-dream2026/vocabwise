// Standalone Phonics module sync.
// Stored in vocab_sync with level = 'phonics'.
// Mastery = flashcard:true + all 3 game keys at ≥70%.

const MASTERY_GAMES = ['minimal-pairs', 'listen-pick', 'speak'] as const
export type GameKey = typeof MASTERY_GAMES[number]

type PairMastery  = { flashcard: boolean; games: string[] }
type PhonicsStreak = { current: number; best: number; lastActive: string }
export type SoundAccuracy = { attempts: number; correct: number }

let _childId  = ''
let _mastery: Record<string, PairMastery>   = {}
let _streak:  PhonicsStreak                  = { current: 0, best: 0, lastActive: '' }
let _soundAcc: Record<string, SoundAccuracy> = {}

export function initPhonicsSync(childId: string, data: { mastery?: Record<string, PairMastery>; streak?: Partial<PhonicsStreak>; soundAcc?: Record<string, SoundAccuracy> } | null) {
  _childId  = childId
  _mastery  = data?.mastery  ?? {}
  _soundAcc = data?.soundAcc ?? {}
  _streak   = {
    current:    data?.streak?.current    ?? 0,
    best:       data?.streak?.best       ?? 0,
    lastActive: data?.streak?.lastActive ?? '',
  }
}

export function markPairSeen(pairId: string) {
  const entry = _mastery[pairId] ?? { flashcard: false, games: [] }
  if (!entry.flashcard) {
    _mastery = { ..._mastery, [pairId]: { ...entry, flashcard: true } }
    recordPhonicsActivity()
  }
}

/** Only call when user passes ≥70% — the game component enforces the threshold. */
export function recordPairGame(pairId: string, gameKey: string) {
  const entry = _mastery[pairId] ?? { flashcard: false, games: [] }
  if (!entry.games.includes(gameKey)) {
    _mastery = { ..._mastery, [pairId]: { ...entry, games: [...entry.games, gameKey] } }
    recordPhonicsActivity()
  }
}

export function recordPhonicsActivity() {
  const today = new Date().toISOString().split('T')[0]
  if (_streak.lastActive === today) return
  const yest = new Date()
  yest.setDate(yest.getDate() - 1)
  const yesterdayStr = yest.toISOString().split('T')[0]
  const newCurrent = _streak.lastActive === yesterdayStr ? _streak.current + 1 : 1
  _streak = { current: newCurrent, best: Math.max(_streak.best, newCurrent), lastActive: today }
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
      seen: [], weak_words: {}, battle: {}, history: {}, srs: {},
    }),
  }).catch(() => {})
}
