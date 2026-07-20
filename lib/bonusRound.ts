import type { BonusQuestion } from '@/components/BonusSentenceRound'

export const BONUS_COUNT = 3

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Shared by every "Bonus — Viết câu" round (Level Test, Daily/Academic revision
// test) — picks BONUS_COUNT random candidates that actually have a Vietnamese
// example sentence to translate; returns [] if there aren't enough, so callers
// can skip rendering the round entirely rather than showing a broken one.
export function pickBonusQuestions(candidates: BonusQuestion[]): BonusQuestion[] {
  const usable = candidates.filter(q => q.exampleVi.trim())
  if (usable.length < BONUS_COUNT) return []
  return shuffle(usable).slice(0, BONUS_COUNT)
}
