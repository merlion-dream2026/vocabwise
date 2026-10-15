import { buildChoiceQuestions, clockScorePct, type ArcadeWord } from './shared'

// ─── 🏎️ Race ───────────────────────────────────────────────────────────────────────────────────
// Rocky's car against Bubi's. Same 4-choice questions as the rocket; each right answer pushes Rocky
// a tenth of the track, a wrong one spins him out and the word comes back later. Bubi drives at a
// steady pace and crosses the line after the level's race time — beat him there. Scored like the
// rocket: accuracy + how far ahead Rocky finished (a lost race earns under 50%).

export const RACE_QUESTIONS = 10
export const RACE_SECONDS: Record<string, number> = {
  seeker: 110, starter: 95, ranger: 85, explorer: 80, scholar: 70, master: 60,
}
export const raceSeconds = (level: string) => RACE_SECONDS[level] ?? 90
export const buildRaceQuestions = (words: ArcadeWord[]) => buildChoiceQuestions(words, RACE_QUESTIONS)
export const raceScorePct = (correct: number, wrong: number, secondsLeft: number, totalSeconds: number) =>
  clockScorePct(correct, RACE_QUESTIONS, wrong, secondsLeft, totalSeconds)
