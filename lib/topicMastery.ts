import { schedulePush } from './cloudSync'

export type MasteryData = {
  flashcard: boolean   // completed all flashcards
  games: string[]      // game keys with perfect score (need >= 3)
}

const masteryKey = (level: string) => `topicMastery_${level}`

function load(level: string): Record<string, MasteryData> {
  if (typeof window === 'undefined') return {}
  try { return JSON.parse(localStorage.getItem(masteryKey(level)) ?? '{}') }
  catch { return {} }
}

export function recordFlashcardDone(level: string, topicId: string) {
  const data = load(level)
  const entry = data[topicId] ?? { flashcard: false, games: [] }
  if (entry.flashcard) return
  data[topicId] = { ...entry, flashcard: true }
  localStorage.setItem(masteryKey(level), JSON.stringify(data))
  schedulePush(level)
}

export function recordPerfectGame(level: string, topicId: string, gameKey: string) {
  const data = load(level)
  const entry = data[topicId] ?? { flashcard: false, games: [] }
  if (entry.games.includes(gameKey)) return
  data[topicId] = { ...entry, games: [...entry.games, gameKey] }
  localStorage.setItem(masteryKey(level), JSON.stringify(data))
  schedulePush(level)
}

export function getTopicMastery(level: string, topicId: string): MasteryData {
  return load(level)[topicId] ?? { flashcard: false, games: [] }
}

export function isTopicDone(level: string, topicId: string): boolean {
  const m = getTopicMastery(level, topicId)
  return m.flashcard && m.games.length >= 3
}

export function clearMastery(level: string) {
  if (typeof window === 'undefined') return
  localStorage.removeItem(masteryKey(level))
}

export function mergeMastery(
  local: Record<string, MasteryData>,
  remote: Record<string, MasteryData>
): Record<string, MasteryData> {
  const result: Record<string, MasteryData> = { ...local }
  for (const [id, rm] of Object.entries(remote)) {
    const lm = result[id]
    if (!lm) { result[id] = rm; continue }
    result[id] = {
      flashcard: lm.flashcard || rm.flashcard,
      games: Array.from(new Set([...lm.games, ...rm.games])),
    }
  }
  return result
}
