import { shuffle, type ArcadeWord } from './shared'

// ─── 🦘 Jump ───────────────────────────────────────────────────────────────────────────────────
// Speaking: Rocky runs a meadow and stops at 8 obstacles. Each carries a sign (picture + meaning);
// tap 🎤 and say the English word — the browser's own speech recognition (free, no AI quota) hears
// it and Rocky jumps. 3 tries per word ("🔊 Nghe mẫu" plays it any time); a word is worth 1 on the
// first try, 0.7 on the second, 0.4 on the third, 0 if skipped. Matching is lenient on purpose:
// recognisers mishear young voices, and a fail here should mean "not said", not "accent".

export const JUMP_QUESTIONS = 8
export const JUMP_TRIES = 3
const JUMP_TRY_PTS = [1, 0.7, 0.4]

export function buildJumpQuestions(words: ArcadeWord[]): ArcadeWord[] {
  return shuffle(words.filter((w) => /[a-z]/i.test(w.word))).slice(0, JUMP_QUESTIONS)
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim()

/** Edit distance (Levenshtein). */
export function editDistance(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, j) => j)
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0]
    row[0] = i
    for (let j = 1; j <= b.length; j++) {
      const tmp = row[j]
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1))
      prev = tmp
    }
  }
  return row[b.length]
}

/**
 * Did any recogniser alternative say `target`? Yes if an alternative contains the word (or its
 * words, for phrases), or a same-length stretch of it is within 1 edit (2 for words of 7+ letters)
 * — "mum" heard as "mom", "kitchen" as "kitchens" still count; words of 4 letters or fewer must
 * also start with the right letter.
 */
export function speechMatches(alternatives: string[], target: string): boolean {
  const t = norm(target)
  if (!t) return false
  const slack = t.replace(/ /g, '').length >= 7 ? 2 : 1
  return alternatives.some((alt) => {
    const a = norm(alt)
    if (!a) return false
    if (` ${a} `.includes(` ${t} `) || a.replace(/ /g, '') === t.replace(/ /g, '')) return true
    const words = a.split(' ')
    const n = t.split(' ').length
    for (let i = 0; i + n <= words.length; i++) {
      const heard = words.slice(i, i + n).join(' ')
      // Short words must also start right, so "bad" doesn't pass for "dad" (but "mom" does for "mum").
      if (t.length <= 4 && heard[0] !== t[0]) continue
      if (editDistance(heard, t) <= slack) return true
    }
    return false
  })
}

/** Average word worth by tries used (1–3 = solved on that try, 0 = skipped) as a percentage. */
export function jumpScorePct(triesPerWord: number[], total = JUMP_QUESTIONS): number {
  if (!(total > 0)) return 0
  return Math.round((100 * triesPerWord.reduce((s, n) => s + (JUMP_TRY_PTS[n - 1] ?? 0), 0)) / total)
}
